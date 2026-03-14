const express = require("express");
const router = express.Router();
const db = require("../db/connection");
const { protect } = require("../middleware/auth");
const { validateFields } = require("../middleware/validate");

// Create stock movement
router.post("/", protect, (req, res) => {
  try {
    const error = validateFields(["product_id", "quantity", "operation_type"], req.body);
    if (error) return res.status(400).json({ message: error });

    const { product_id, from_location, to_location, quantity, operation_type, reference, supplier_id, customer_id } = req.body;

    // Define locationId early so it's available everywhere below
    const locationId = to_location || from_location;

    const validTypes = ["receipt", "delivery", "transfer", "adjustment"];
    if (!validTypes.includes(operation_type)) {
      return res.status(400).json({ message: `Invalid operation type. Use: ${validTypes.join(", ")}` });
    }

    if (quantity <= 0) {
      return res.status(400).json({ message: "Quantity must be greater than 0." });
    }

    if (!locationId) {
      return res.status(400).json({ message: "Either from_location or to_location is required." });
    }

    // Validate product exists
    const product = db.prepare("SELECT * FROM products WHERE id = ?").get(product_id);
    if (!product) return res.status(404).json({ message: "Product not found." });

    // Validate location exists
    const location = db.prepare("SELECT * FROM locations WHERE id = ?").get(locationId);
    if (!location) return res.status(404).json({ message: "Location not found." });

    // For delivery/transfer — check stock availability
    if ((operation_type === "delivery" || operation_type === "transfer") && from_location) {
      const stock = db.prepare(
        "SELECT quantity FROM stock WHERE product_id = ? AND location_id = ?"
      ).get(product_id, from_location);

      if (!stock || stock.quantity < quantity) {
        return res.status(400).json({
          message: `Insufficient stock. Available: ${stock ? stock.quantity : 0}, Requested: ${quantity}`
        });
      }
    }

    // Create operation record
    const operation = db.prepare(`
      INSERT INTO operations (operation_type, reference, supplier_id, customer_id, status)
      VALUES (?, ?, ?, ?, 'done')
    `).run(
      operation_type,
      reference || `${operation_type.toUpperCase()}-${Date.now()}`,
      supplier_id || null,
      customer_id || null
    );

    // Insert stock move — DB triggers handle stock updates automatically
    db.prepare(`
      INSERT INTO stock_moves (operation_id, product_id, from_location, to_location, quantity)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      operation.lastInsertRowid,
      product_id,
      from_location || null,
      to_location || null,
      quantity
    );

    // Get updated stock after trigger ran
    const updatedStock = db.prepare(`
      SELECT s.quantity, l.name as location_name, w.name as warehouse_name
      FROM stock s
      JOIN locations l ON s.location_id = l.id
      JOIN warehouses w ON l.warehouse_id = w.id
      WHERE s.product_id = ? AND s.location_id = ?
    `).get(product_id, locationId);

    // Write to stock ledger
    db.prepare(`
      INSERT INTO stock_ledger 
      (product_id, location_id, change_qty, balance_after, operation_type, reference_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      product_id,
      locationId,
      operation_type === "delivery" ? -quantity : quantity,
      updatedStock ? updatedStock.quantity : 0,
      operation_type,
      operation.lastInsertRowid
    );

    const lowStock = updatedStock && updatedStock.quantity <= product.reorder_level;

    res.status(201).json({
      message: "Stock movement recorded ✅",
      operation_id: operation.lastInsertRowid,
      product: product.name,
      operation_type,
      quantity,
      updatedStock,
      alert: lowStock
        ? `⚠️ Low stock: ${product.name} only has ${updatedStock.quantity} ${product.unit_of_measure} left (reorder at ${product.reorder_level})`
        : null
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to record stock movement.", detail: error.message });
  }
});

// Get all movements
router.get("/", protect, (req, res) => {
  try {
    const { product_id, operation_type, limit } = req.query;
    let query = `
      SELECT sm.*, p.name as product_name, p.sku,
             fl.name as from_location_name,
             tl.name as to_location_name,
             o.operation_type, o.reference, o.status,
             o.created_at as operation_date
      FROM stock_moves sm
      JOIN products p ON sm.product_id = p.id
      JOIN operations o ON sm.operation_id = o.id
      LEFT JOIN locations fl ON sm.from_location = fl.id
      LEFT JOIN locations tl ON sm.to_location = tl.id
      WHERE 1=1
    `;
    const params = [];

    if (product_id) { query += " AND sm.product_id = ?"; params.push(product_id); }
    if (operation_type) { query += " AND o.operation_type = ?"; params.push(operation_type); }

    query += " ORDER BY sm.id DESC";
    if (limit) { query += " LIMIT ?"; params.push(parseInt(limit)); }

    const movements = db.prepare(query).all(...params);
    res.json({ count: movements.length, movements });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch movements.", detail: error.message });
  }
});

// Get stock ledger
router.get("/ledger", protect, (req, res) => {
  try {
    const { product_id } = req.query;
    let query = `
      SELECT sl.*, p.name as product_name, p.sku,
             l.name as location_name, w.name as warehouse_name
      FROM stock_ledger sl
      JOIN products p ON sl.product_id = p.id
      JOIN locations l ON sl.location_id = l.id
      JOIN warehouses w ON l.warehouse_id = w.id
      WHERE 1=1
    `;
    const params = [];
    if (product_id) { query += " AND sl.product_id = ?"; params.push(product_id); }
    query += " ORDER BY sl.created_at DESC";

    const ledger = db.prepare(query).all(...params);
    res.json({ count: ledger.length, ledger });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch ledger.", detail: error.message });
  }
});

module.exports = router;