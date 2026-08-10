import mysql, { Pool, PoolOptions } from "mysql2/promise";

const poolConfig: PoolOptions = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "clay_photobooth",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
};

declare global {
  // eslint-disable-next-line no-var
  var _clayPhotoboothPool: Pool | undefined;
}

/**
 * Reuse a single connection pool across hot reloads in dev
 * and across serverless invocations where the module is cached.
 */
export const pool: Pool =
  global._clayPhotoboothPool ?? mysql.createPool(poolConfig);

if (process.env.NODE_ENV !== "production") {
  global._clayPhotoboothPool = pool;
}

export async function query<T>(sql: string, params: unknown[] = []): Promise<T> {
  const [rows] = await pool.query(sql, params);
  return rows as T;
}
