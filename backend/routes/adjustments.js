const express = require("express");
const router = express.Router();
const db = require("../db/connection");
const { protect } = require("../middleware/auth");
const { validateFields } = require("../middleware/validate");

// Create adjustment
router.post("/", protect, (req, res) => {
  try {
    const error = validateFields(["product_id", "location_id", "counted_qty"], req.body);
    if (error) return res.status(400).json({ message: error });

    const { product_id, location_id, counted_qty, reason } = req.body;

    if (counted_qty < 0) {
      return res.status(400).json({ message: "Counted quantity cannot be negative." });
    }

    const product = db.prepare("SELECT * FROM products WHERE id = ?").get(product_id);
    if (!product) return res.status(404).json({ message: "Product not found." });

    const location = db.prepare("SELECT * FROM locations WHERE id = ?").get(location_id);
    if (!location) return res.status(404).json({ message: "Location not found." });

    let stock = db.prepare(
      "SELECT * FROM stock WHERE product_id = ? AND location_id = ?"
    ).get(product_id, location_id);

    const recorded_qty = stock ? stock.quantity : 0;
    const difference = counted_qty - recorded_qty;

    const result = db.prepare(`
      INSERT INTO adjustments (product_id, location_id, recorded_qty, counted_qty, difference, reason)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(product_id, location_id, recorded_qty, counted_qty, difference, reason || "Manual count");

    if (stock) {
      db.prepare("UPDATE stock SET quantity = ? WHERE product_id = ? AND location_id = ?")
        .run(counted_qty, product_id, location_id);
    } else {
      db.prepare("INSERT INTO stock (product_id, location_id, quantity) VALUES (?, ?, ?)")
        .run(product_id, location_id, counted_qty);
    }

    db.prepare(`
      INSERT INTO stock_ledger (product_id, location_id, change_qty, balance_after, operation_type, reference_id)
      VALUES (?, ?, ?, ?, 'adjustment', ?)
    `).run(product_id, location_id, difference, counted_qty, result.lastInsertRowid);

    const lowStock = counted_qty <= product.reorder_level;

    res.status(201).json({
      message: "Stock adjustment recorded ✅",
      adjustment: {
        id: result.lastInsertRowid,
        product: product.name,
        location: location.name,
        recorded_qty,
        counted_qty,
        difference: difference > 0 ? `+${difference}` : `${difference}`,
        reason: reason || "Manual count"
      },
      alert: lowStock ? `⚠️ Low stock: ${product.name} has only ${counted_qty} units left` : null
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to record adjustment.", detail: error.message });
  }
});

// Get all adjustments
router.get("/", protect, (req, res) => {
  try {
    const adjustments = db.prepare(`
      SELECT a.*, p.name as product_name, p.sku,
             l.name as location_name, w.name as warehouse_name
      FROM adjustments a
      JOIN products p ON a.product_id = p.id
      JOIN locations l ON a.location_id = l.id
      JOIN warehouses w ON l.warehouse_id = w.id
      ORDER BY a.created_at DESC
    `).all();
    res.json({ count: adjustments.length, adjustments });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch adjustments.", detail: error.message });
  }
});

module.exports = router;