const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const dbPath = path.join(__dirname, "coreinventory.db");
const schemaPath = path.join(__dirname, "schema.sql");

const db = new Database(dbPath);

// Only run schema if tables don't exist yet
const tableExists = db.prepare(
  `SELECT name FROM sqlite_master WHERE type='table' AND name='users'`
).get();

if (!tableExists) {
  const schema = fs.readFileSync(schemaPath, "utf8");
  db.exec(schema);
  console.log("✅ Database tables created");
}

console.log("✅ SQLite database connected");

module.exports = db;
