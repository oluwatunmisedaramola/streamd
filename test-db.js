import mariadb from "mariadb";

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  connectTimeout: 20000,
  ssl: { rejectUnauthorized: false } // 🔑 try disabling cert checks for testing
});

try {
  const conn = await pool.getConnection();
  console.log("✅ Connected to DB!");

  const rows = await conn.query("SELECT NOW() AS now");
  console.log("DB Time:", rows[0].now);

  conn.release();
  await pool.end();
  process.exit(0); // success
} catch (err) {
  console.error("❌ DB Connection failed:", err);
  process.exit(1); // failure → Render will fail deploy
}
