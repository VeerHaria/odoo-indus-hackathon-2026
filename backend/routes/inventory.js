const express = require("express");
const router = express.Router();
const db = require("../db/connection");

// Get all stock levels
router.get("/", (req, res) => {
  try {
    const stock = db.prepare(`
      SELECT s.*, p.name as product_name, p.sku, p.reorder_level,
             l.name as location_name, w.name as warehouse_name
      FROM stock s
      JOIN products p ON s.product_id = p.id
      JOIN locations l ON s.location_id = l.id
      JOIN warehouses w ON l.warehouse_id = w.id
    `).all();

    // Flag low stock items
    const result = stock.map(item => ({
      ...item,
      low_stock: item.quantity <= item.reorder_level
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get stock by warehouse
router.get("/warehouse/:warehouseId", (req, res) => {
  try {
    const stock = db.prepare(`
      SELECT s.*, p.name as product_name, p.sku, p.reorder_level,
             l.name as location_name
      FROM stock s
      JOIN products p ON s.product_id = p.id
      JOIN locations l ON s.location_id = l.id
      WHERE l.warehouse_id = ?
    `).all(req.params.warehouseId);
    res.json(stock);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;