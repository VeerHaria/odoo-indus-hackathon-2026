const express = require("express");
const router = express.Router();
const db = require("../db/connection");

// Create stock movement (receipt, delivery, transfer)
router.post("/", (req, res) => {
  try {
    const { product_id, from_location, to_location, quantity, operation_type, reference, supplier_id, customer_id } = req.body;

    // Create the operation
    const operation = db.prepare(`
      INSERT INTO operations (operation_type, reference, supplier_id, customer_id, status)
      VALUES (?, ?, ?, ?, 'done')
    `).run(operation_type, reference || `OP-${Date.now()}`, supplier_id || null, customer_id || null);

    const operation_id = operation.lastInsertRowid;

    // Create the stock move — triggers handle stock updates automatically
    db.prepare(`
      INSERT INTO stock_moves (operation_id, product_id, from_location, to_location, quantity)
      VALUES (?, ?, ?, ?, ?)
    `).run(operation_id, product_id, from_location || null, to_location || null, quantity);

    // Get updated stock
    const updatedStock = db.prepare(`
      SELECT s.quantity, p.name as product_name, p.reorder_level
      FROM stock s
      JOIN products p ON s.product_id = p.id
      WHERE s.product_id = ?
      LIMIT 1
    `).get(product_id);

    const lowStock = updatedStock && updatedStock.quantity <= updatedStock.reorder_level;

    res.status(201).json({
      message: "Stock movement recorded ✅",
      operation_id,
      updatedStock,
      alert: lowStock
        ? `⚠️ Low stock: ${updatedStock.product_name} has only ${updatedStock.quantity} units left`
        : null
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all movements
router.get("/", (req, res) => {
  try {
    const movements = db.prepare(`
      SELECT sm.*, p.name as product_name, p.sku,
             fl.name as from_location_name,
             tl.name as to_location_name,
             o.operation_type, o.reference, o.status
      FROM stock_moves sm
      JOIN products p ON sm.product_id = p.id
      JOIN operations o ON sm.operation_id = o.id
      LEFT JOIN locations fl ON sm.from_location = fl.id
      LEFT JOIN locations tl ON sm.to_location = tl.id
      ORDER BY sm.id DESC
    `).all();
    res.json(movements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;