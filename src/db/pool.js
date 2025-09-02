import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000, // send keepalive packets after 10s
});


// ⚡ Safe query with retry
async function safeQuery(sql, params = [], retry = true) {
  try {
    return await pool.query(sql, params);
  } catch (err) {
    // Retry for transient connection errors
    if (retry && (err.code === "ECONNRESET" || err.code === "PROTOCOL_CONNECTION_LOST")) {
      console.warn("Transient DB error detected. Retrying query...", { code: err.code, sql });
      return safeQuery(sql, params, false); // retry once
    }
    throw err; // rethrow if not retryable or retry already attempted
  }
}

export { pool, safeQuery };
