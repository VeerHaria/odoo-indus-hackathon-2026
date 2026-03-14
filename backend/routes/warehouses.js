const express = require("express");
const router = express.Router();
const db = require("../db/connection");

// Create warehouse
router.post("/", (req, res) => {
  try {
    const { name, address } = req.body;
    const result = db.prepare(
      "INSERT INTO warehouses (name, address) VALUES (?, ?)"
    ).run(name, address);
    res.status(201).json({ id: result.lastInsertRowid, name, address });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all warehouses
router.get("/", (req, res) => {
  try {
    const warehouses = db.prepare("SELECT * FROM warehouses").all();
    res.json(warehouses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single warehouse with its locations
router.get("/:id", (req, res) => {
  try {
    const warehouse = db.prepare("SELECT * FROM warehouses WHERE id = ?").get(req.params.id);
    if (!warehouse) return res.status(404).json({ message: "Warehouse not found" });
    const locations = db.prepare("SELECT * FROM locations WHERE warehouse_id = ?").all(req.params.id);
    res.json({ ...warehouse, locations });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;