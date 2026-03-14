const express = require("express");
const router = express.Router();
const Warehouse = require("../models/Warehouse");

// Create warehouse
router.post("/", async (req, res) => {
  try {
    const warehouse = new Warehouse(req.body);
    await warehouse.save();
    res.status(201).json(warehouse);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all warehouses
router.get("/", async (req, res) => {
  try {
    const warehouses = await Warehouse.find();
    res.json(warehouses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single warehouse
router.get("/:id", async (req, res) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id);
    if (!warehouse) return res.status(404).json({ message: "Warehouse not found" });
    res.json(warehouse);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update warehouse
router.put("/:id", async (req, res) => {
  try {
    const warehouse = await Warehouse.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!warehouse) return res.status(404).json({ message: "Warehouse not found" });
    res.json(warehouse);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;