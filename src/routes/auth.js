import express from "express";
import pool from "../db/pool.js";
import { queries } from "../db/queries.js";
import { successResponse, errorResponse, dbErrorHandler } from "../utils/authResponse.js";
import { normalizeMsisdn, detectCarrier } from "../utils/msisdn.js";
import { checkAndExpire, createSession, destroySession } from "../utils/subscription.js";

const router = express.Router();

// 1. LOGIN
router.post("/login", async (req, res) => {
  try {
    let { msisdn } = req.body;
    if (!msisdn) return errorResponse(res, "MSISDN required", 400);

    msisdn = normalizeMsisdn(msisdn);
    const carrier = detectCarrier(msisdn);
    if (!carrier) return errorResponse(res, "Unknown carrier", 400);

    const [existing] = await pool.query(queries.getSubscriberByMsisdn, [msisdn]);

    if (existing.length > 0) {
      const subscriber = existing[0];
      const currentStatus = await checkAndExpire(subscriber);

      if (currentStatus === "active") {
        const token = await createSession(subscriber.id, subscriber.end_time);
        const remainingSeconds = Math.max(0, Math.floor((new Date(subscriber.end_time) - new Date()) / 1000));

        return successResponse(res, {
          status: currentStatus,
          msisdn: subscriber.msisdn,
          start_time: subscriber.start_time,
          end_time: subscriber.end_time,
          session_token: token,
          session_expires_at: subscriber.end_time, // align with subscription for now
          is_first_time: false,
          remaining_seconds: remainingSeconds,
        }, "Access granted");
      } else {
        const [linkRows] = await pool.query(queries.getSubscriptionLinkByCarrier, [carrier]);
        return successResponse(res, {
          status: currentStatus,
          carrier,
          subscription_link: linkRows.length > 0 ? linkRows[0].link : null,
          msisdn,
          is_first_time: false,
          remaining_seconds: 0,
        }, "Subscription required");
      }
    } else {
      const [linkRows] = await pool.query(queries.getSubscriptionLinkByCarrier, [carrier]);
      return successResponse(res, {
        status: "pending",
        carrier,
        subscription_link: linkRows.length > 0 ? linkRows[0].link : null,
        msisdn,
        is_first_time: true,
        remaining_seconds: 0,
      }, "Subscription required");
    }
  } catch (err) {
    console.error("Login error:", err);
    return dbErrorHandler(res, err, "login");
  }
});

// 2. CALLBACK
router.get("/callback", async (req, res) => {
  try {
    let { msisdn, carrier } = req.query;
    if (!msisdn || !carrier) return errorResponse(res, "Missing msisdn or carrier", 400);

    msisdn = normalizeMsisdn(msisdn);
    const [existing] = await pool.query(queries.getSubscriberByMsisdn, [msisdn]);

    if (existing.length > 0) {
      await pool.query(queries.updateSubscriber, [100.0, msisdn]);
    } else {
      await pool.query(queries.insertSubscriber, [msisdn, 100.0]);
    }

    const [subRows] = await pool.query(queries.getSubscriberByMsisdn, [msisdn]);
    const subscriber = subRows[0];
    const currentStatus = await checkAndExpire(subscriber);
    const token = await createSession(subscriber.id, subscriber.end_time);

    const remainingSeconds = currentStatus === "active"
      ? Math.max(0, Math.floor((new Date(subscriber.end_time) - new Date()) / 1000))
      : 0;

    return successResponse(res, {
      status: currentStatus,
      msisdn: subscriber.msisdn,
      start_time: subscriber.start_time,
      end_time: subscriber.end_time,
      session_token: token,
      session_expires_at: subscriber.end_time,
      is_first_time: existing.length === 0,
      remaining_seconds: remainingSeconds,
    }, "Subscription verified");
  } catch (err) {
    console.error("Callback error:", err);
    return dbErrorHandler(res, err, "callback");
  }
});

// 3. STATUS
router.get("/status", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse(res, "Missing or invalid token", 401);
    }

    const token = authHeader.split(" ")[1];
    const [rows] = await pool.query(queries.getSessionWithSubscriber, [token]);

    if (rows.length === 0) {
      return errorResponse(res, "Session expired or invalid", 401);
    }

    const record = rows[0];

    // 🔒 check session expiry
    if (new Date(record.expires_at) <= new Date()) {
      await destroySession(token);
      return errorResponse(res, "Session expired", 401);
    }

    // ✅ check subscription expiry
    const currentStatus = await checkAndExpire(record);

    const remainingSeconds = currentStatus === "active"
      ? Math.max(0, Math.floor((new Date(record.end_time) - new Date()) / 1000))
      : 0;

    return successResponse(res, {
      status: currentStatus,
      msisdn: record.msisdn,
      start_time: record.start_time,
      end_time: record.end_time,
      session_token: token,
      session_expires_at: record.expires_at,
      is_first_time: false,
      remaining_seconds: remainingSeconds,
    }, currentStatus === "active" ? "Session valid" : "Subscription expired");
  } catch (err) {
    console.error("Status error:", err);
    return dbErrorHandler(res, err, "status check");
  }
});

// 4. WEBHOOK
router.post("/webhook", async (req, res) => {
  try {
    let { msisdn, status } = req.body;
    if (!msisdn || !status) return errorResponse(res, "Missing fields", 400);

    msisdn = normalizeMsisdn(msisdn);
    let updateStatus = status.toLowerCase();
    if (!["active", "expired", "pending", "cancelled"].includes(updateStatus)) {
      return errorResponse(res, "Invalid status", 400);
    }

    if (updateStatus === "active") {
      await pool.query(queries.updateSubscriber, [100.0, msisdn]);
    } else {
      await pool.query(
        `UPDATE subscribers SET status=?, updated_at=NOW() WHERE msisdn=?`,
        [updateStatus, msisdn]
      );
    }

    const [subRows] = await pool.query(queries.getSubscriberByMsisdn, [msisdn]);
    const subscriber = subRows[0];
    const currentStatus = await checkAndExpire(subscriber);

    const remainingSeconds = currentStatus === "active"
      ? Math.max(0, Math.floor((new Date(subscriber.end_time) - new Date()) / 1000))
      : 0;

    return successResponse(res, {
      status: currentStatus,
      msisdn,
      end_time: subscriber.end_time,
      remaining_seconds: remainingSeconds,
    }, "Subscriber updated via webhook");
  } catch (err) {
    console.error("Webhook error:", err);
    return dbErrorHandler(res, err, "webhook update");
  }
});

// 5. LOGOUT
router.post("/logout", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse(res, "Missing or invalid token", 401);
    }

    const token = authHeader.split(" ")[1];
    await destroySession(token);

    return successResponse(res, {}, "Logged out successfully");
  } catch (err) {
    console.error("Logout error:", err);
    return dbErrorHandler(res, err, "logout");
  }
});

export default router;
