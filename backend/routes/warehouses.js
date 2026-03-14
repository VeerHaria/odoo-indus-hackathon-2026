const express = require("express");
const router = express.Router();
const db = require("../db/connection");
const { validateFields } = require("../middleware/validate");

router.get("/", (req, res) => {
  try {
    const warehouses = db.prepare("SELECT * FROM warehouses").all();
    res.json({ count: warehouses.length, warehouses });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch warehouses.", detail: error.message });
  }
});

router.get("/:id", (req, res) => {
  try {
    const warehouse = db.prepare("SELECT * FROM warehouses WHERE id = ?").get(req.params.id);
    if (!warehouse) return res.status(404).json({ message: "Warehouse not found." });
    const locations = db.prepare("SELECT * FROM locations WHERE warehouse_id = ?").all(req.params.id);
    res.json({ ...warehouse, locations });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch warehouse.", detail: error.message });
  }
});

router.post("/", (req, res) => {
  try {
    const error = validateFields(["name"], req.body);
    if (error) return res.status(400).json({ message: error });

    const { name, address } = req.body;
    const result = db.prepare(
      "INSERT INTO warehouses (name, address) VALUES (?, ?)"
    ).run(name, address || null);

    res.status(201).json({
      message: "Warehouse created ✅",
      warehouse: { id: result.lastInsertRowid, name, address }
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to create warehouse.", detail: error.message });
  }
});

router.post("/:id/locations", (req, res) => {
  try {
    const error = validateFields(["name"], req.body);
    if (error) return res.status(400).json({ message: error });

    const warehouse = db.prepare("SELECT id FROM warehouses WHERE id = ?").get(req.params.id);
    if (!warehouse) return res.status(404).json({ message: "Warehouse not found." });

    const result = db.prepare(
      "INSERT INTO locations (warehouse_id, name) VALUES (?, ?)"
    ).run(req.params.id, req.body.name);

    res.status(201).json({
      message: "Location added ✅",
      location: { id: result.lastInsertRowid, warehouse_id: req.params.id, name: req.body.name }
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to add location.", detail: error.message });
  }
});

module.exports = router;