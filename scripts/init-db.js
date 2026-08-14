/**
 * Run once to create tables and seed default admin account.
 * Usage: npm run db:init
 */
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    multipleStatements: true,
  });

  const schema = fs.readFileSync(
    path.join(__dirname, "..", "database", "schema.sql"),
    "utf8"
  );

  console.log("Creating database & tables...");
  await connection.query(schema);

  const dbName = process.env.DB_NAME || "clay_photobooth";
  await connection.changeUser({ database: dbName });

  const [rows] = await connection.query(
    "SELECT COUNT(*) as count FROM admins"
  );
  if (rows[0].count === 0) {
    const username = process.env.ADMIN_USERNAME || "admin";
    const password = process.env.ADMIN_PASSWORD || "admin123";
    const hashed = await bcrypt.hash(password, 10);
    await connection.query(
      "INSERT INTO admins (id, username, password) VALUES (?, ?, ?)",
      [uuidv4(), username, hashed]
    );
    console.log(`Admin created -> username: ${username}, password: ${password}`);
  } else {
    console.log("Admin already exists, skipping seed.");
  }

  console.log("Done. Database is ready.");
  await connection.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
