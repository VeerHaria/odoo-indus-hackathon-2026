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

    const validTypes = ["receipt", "delivery", "transfer", "adjustment"];
    if (!validTypes.includes(operation_type)) {
      return res.status(400).json({ message: `Invalid operation type. Use: ${validTypes.join(", ")}` });
    }

    if (quantity <= 0) {
      return res.status(400).json({ message: "Quantity must be greater than 0." });
    }

    // Validate product exists
    const product = db.prepare("SELECT * FROM products WHERE id = ?").get(product_id);
    if (!product) return res.status(404).json({ message: "Product not found." });

    // For delivery/transfer out — check stock availability
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

    // Create operation
    const operation = db.prepare(`
      INSERT INTO operations (operation_type, reference, supplier_id, customer_id, status)
      VALUES (?, ?, ?, ?, 'done')
    `).run(
      operation_type,
      reference || `${operation_type.toUpperCase()}-${Date.now()}`,
      supplier_id || null,
      customer_id || null
    );

    // Insert stock move — triggers handle stock updates automatically
    db.prepare(`
      INSERT INTO stock_moves (operation_id, product_id, from_location, to_location, quantity)
      VALUES (?, ?, ?, ?, ?)
    `).run(operation.lastInsertRowid, product_id, from_location || null, to_location || null, quantity);

    // Get updated stock
    const locationId = to_location || from_location;
    const updatedStock = db.prepare(`
      SELECT s.quantity, l.name as location_name, w.name as warehouse_name
      FROM stock s
      JOIN locations l ON s.location_id = l.id
      JOIN warehouses w ON l.warehouse_id = w.id
      WHERE s.product_id = ? AND s.location_id = ?
    `).get(product_id, locationId);

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

module.exports = router;