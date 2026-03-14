const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const dbPath = path.join(__dirname, "coreinventory.db");
const schemaPath = path.join(__dirname, "schema.sql");

const db = new Database(dbPath);

// Run schema if database is new
const schema = fs.readFileSync(schemaPath, "utf8");
db.exec(schema);

console.log("✅ SQLite database connected");

module.exports = db;