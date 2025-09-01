import pool from "../db/pool.js";
import { queries } from "../db/queries.js";
import { v4 as uuidv4 } from "uuid";

/**
 * Check subscription expiry on demand.
 * If expired → mark subscriber as "expired".
 */
export const checkAndExpire = async (subscriber) => {
  if (subscriber.status === "active" && new Date(subscriber.end_time) <= new Date()) {
    await pool.query(
      `UPDATE subscribers SET status='expired', updated_at=NOW() WHERE msisdn=?`,
      [subscriber.msisdn]
    );
    return "expired";
  }
  return subscriber.status;
};

/**
 * Create a new session tied to a subscriber
 */
export const createSession = async (subscriberId, endTime) => {
  const token = uuidv4();
  // For now, align session expiry with subscription expiry
  const expiresAt = new Date(endTime);

  await pool.query(queries.createSession, [subscriberId, token, expiresAt]);
  return token;
};

/**
 * Destroy a session token
 */
export const destroySession = async (token) => {
  await pool.query(`DELETE FROM sessions WHERE token=?`, [token]);
};
