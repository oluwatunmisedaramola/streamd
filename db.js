import mariadb from "mariadb";

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  connectionLimit: 10,          // allow up to 10 concurrent connections
  acquireTimeout: 20000,        // wait up to 20s for a free connection from pool
  connectTimeout: 10000,        // wait up to 10s to establish initial connection
  idleTimeout: 30000,           // close idle connections after 30s
  ssl: {
    rejectUnauthorized: false,  // needed for Render’s managed DBs
  },
});

export default pool;
