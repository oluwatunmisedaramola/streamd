import express from "express";
import { safeQuery } from "../db/pool.js"; // ⚡ CHANGED
import { queries } from "../db/queries.js";
import { successResponse, errorResponse, dbErrorHandler } from "../utils/authResponse.js";
import { normalizeMsisdn, detectCarrier } from "../utils/msisdn.js";
import { checkAndExpire, createSession, destroySession, mapTelcoStatus } from "../utils/subscription.js";

const router = express.Router();

// 1. LOGIN
router.post("/login", async (req, res) => {
  try {
    let { msisdn } = req.body;
    if (!msisdn) return errorResponse(res, "MSISDN required", 400);

    msisdn = normalizeMsisdn(msisdn);
    const carrier = detectCarrier(msisdn);
    if (!carrier) return errorResponse(res, "Unknown carrier", 400);

    const [existing] = await safeQuery(queries.getSubscriberByMsisdn, [msisdn]); // ⚡ CHANGED

    if (existing.length > 0) {
      const subscriber = existing[0];
      const currentStatus = await checkAndExpire(subscriber);

      if (currentStatus === "active") {
        // ⚡ SAME: if already active, mint token immediately
        const token = await createSession(subscriber.id, subscriber.end_time);
        const remainingSeconds = Math.max(0, Math.floor((new Date(subscriber.end_time) - new Date()) / 1000));

        return successResponse(res, {
          status: currentStatus,
          msisdn: subscriber.msisdn,
          start_time: subscriber.start_time,
          end_time: subscriber.end_time,
          session_token: token,
          session_expires_at: subscriber.end_time,
          is_first_time: false,
          remaining_seconds: remainingSeconds,
        }, "Access granted");
      } else {
        // ⚡ UPDATED: no token here, rely on /status polling later
        const [linkRows] = await safeQuery(queries.getSubscriptionLinkByCarrier, [carrier]);
        return successResponse(res, {
          status: currentStatus,
          carrier,
          subscription_link: linkRows.length > 0 ? linkRows[0].link : null,
          msisdn,
          is_first_time: false,
          session_token: null,   // ⚡ NEW: explicitly null
          session_expires_at: null, // ⚡ NEW
          remaining_seconds: 0,
        }, "Subscription required");
      }
    } else {
      // ⚡ UPDATED: pending state — no token yet, wait for webhook + /status
      const [linkRows] = await safeQuery(queries.getSubscriptionLinkByCarrier, [carrier]);
      return successResponse(res, {
        status: "pending",
        carrier,
        subscription_link: linkRows.length > 0 ? linkRows[0].link : null,
        msisdn,
        is_first_time: true,
        session_token: null,   // ⚡ NEW
        session_expires_at: null, // ⚡ NEW
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
    const [existing] = await safeQuery(queries.getSubscriberByMsisdn, [msisdn]); // ⚡ CHANGED

    if (existing.length > 0) {
      await safeQuery(queries.updateSubscriber, [100.0, msisdn]); // ⚡ CHANGED
    } else {
      await safeQuery(queries.insertSubscriber, [msisdn, 100.0]); // ⚡ CHANGED
    }

    const [subRows] = await safeQuery(queries.getSubscriberByMsisdn, [msisdn]); // ⚡ CHANGED
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


// 3. STATUS (dual mode: token or msisdn polling)
router.get("/status", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    let subscriber;
    let token;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      // ✅ Existing token-based flow
      token = authHeader.split(" ")[1];
      const [rows] = await safeQuery(queries.getSessionWithSubscriber, [token]);
      if (rows.length === 0) {
        return errorResponse(res, "Session expired or invalid", 401);
      }

      const record = rows[0];
      if (new Date(record.expires_at) <= new Date()) {
        await destroySession(token);
        return errorResponse(res, "Session expired", 401);
      }

      subscriber = record; // contains msisdn, start_time, end_time, etc.

    } else {
      // ✅ Polling mode (before user has a token)
      let { msisdn } = req.query;
      if (!msisdn) return errorResponse(res, "Missing msisdn", 400);

      msisdn = normalizeMsisdn(msisdn);
      const [subRows] = await safeQuery(queries.getSubscriberByMsisdn, [msisdn]);
      if (subRows.length === 0) {
        return errorResponse(res, "Subscriber not found", 404);
      }

      subscriber = subRows[0];

      // If active, mint a session token on the fly
      if (subscriber.status === "active") {
        token = await createSession(subscriber.id, subscriber.end_time);
      }
    }

    // Common: check expiry + compute status
    const currentStatus = await checkAndExpire(subscriber);
    const remainingSeconds =
      currentStatus === "active"
        ? Math.max(0, Math.floor((new Date(subscriber.end_time) - new Date()) / 1000))
        : 0;

    return successResponse(res, {
      status: currentStatus,
      msisdn: subscriber.msisdn,
      start_time: subscriber.start_time,
      end_time: subscriber.end_time,
      session_token: token || null,
      session_expires_at: subscriber.end_time,
      is_first_time: false,
      remaining_seconds: remainingSeconds,
    }, currentStatus === "active" ? "Session valid" : "Subscription expired");
  } catch (err) {
    console.error("Status error:", err);
    return dbErrorHandler(res, err, "status check");
  }
});



// 4. WEBHOOK (minimal response, full internal logging)
router.post("/webhook", async (req, res) => {
  try {
    let { msisdn, status } = req.body;
    if (!msisdn || !status) {
      await safeQuery(
        `INSERT INTO webhook_events (msisdn, raw_status, normalized_status, raw_payload) 
         VALUES (?, ?, ?, ?)`,
        [msisdn || null, status || null, null, JSON.stringify(req.body)]
      );
      return res.sendStatus(200);
    }

    msisdn = normalizeMsisdn(msisdn);
    const rawStatus = status;
    const updateStatus = mapTelcoStatus(rawStatus); // ⚡ CHANGED

    await safeQuery(
      `INSERT INTO webhook_events (msisdn, raw_status, normalized_status, raw_payload) 
       VALUES (?, ?, ?, ?)`,
      [msisdn, rawStatus, updateStatus, JSON.stringify(req.body)]
    );

    if (!updateStatus) {
      return res.sendStatus(200); // unknown → log only
    }

    if (updateStatus === "active") {
      await safeQuery(queries.updateSubscriber, [100.0, msisdn]);
    } else {
      await safeQuery(
        `UPDATE subscribers SET status=?, updated_at=NOW() WHERE msisdn=?`,
        [updateStatus, msisdn]
      );
    }

    return res.sendStatus(200);
  } catch (err) {
    console.error("Webhook error:", err);
    try {
      await safeQuery(
        `INSERT INTO webhook_events (msisdn, raw_status, normalized_status, raw_payload) 
         VALUES (?, ?, ?, ?)`,
        [null, "error", null, JSON.stringify({ error: err.message })]
      );
    } catch (logErr) {
      console.error("Failed to log webhook error:", logErr);
    }
    return res.sendStatus(200);
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
