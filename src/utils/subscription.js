import { safeQuery } from "../db/pool.js"; // ⚡ replaced pool with safeQuery
import { queries } from "../db/queries.js";
import { v4 as uuidv4 } from "uuid";

/**
 * Check subscription expiry on demand.
 * If expired → mark subscriber as "expired".
 */
export const checkAndExpire = async (subscriber) => {
  if (subscriber.status === "active" && new Date(subscriber.end_time) <= new Date()) {
    await safeQuery(
      `UPDATE subscribers SET status='expired', updated_at=NOW() WHERE msisdn=?`,
      [subscriber.msisdn]
    ); // ⚡ change made
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

  await safeQuery(queries.createSession, [subscriberId, token, expiresAt]); // ⚡ change made
  return token;
};

/**
 * Destroy a session token
 */
export const destroySession = async (token) => {
  await safeQuery(`DELETE FROM sessions WHERE token=?`, [token]); // ⚡ change made
};

export function mapTelcoStatus(raw) {
  if (!raw) return null;
  switch (raw.toLowerCase()) {
    case "active":
      return "active";
    case "inactive":
    case "terminated":
    case "expired":
      return "expired";
    case "grace":
    case "pending":
      return "pending";
    case "cancelled":
    case "unsubscribed":
      return "cancelled";
    default:
      return null; // unknown status, just log & skip update
  }
}
