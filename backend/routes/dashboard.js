const express = require("express");
const router = express.Router();
const db = require("../db/connection");

router.get("/", (req, res) => {
  try {
    const totalProducts = db.prepare("SELECT COUNT(*) as count FROM products").get().count;
    const totalWarehouses = db.prepare("SELECT COUNT(*) as count FROM warehouses").get().count;
    const totalMovements = db.prepare("SELECT COUNT(*) as count FROM stock_moves").get().count;
    const totalSuppliers = db.prepare("SELECT COUNT(*) as count FROM suppliers").get().count;
    const totalCustomers = db.prepare("SELECT COUNT(*) as count FROM customers").get().count;

    const lowStockItems = db.prepare(`
      SELECT p.name, p.sku, p.reorder_level, s.quantity, l.name as location_name
      FROM stock s
      JOIN products p ON s.product_id = p.id
      JOIN locations l ON s.location_id = l.id
      WHERE s.quantity <= p.reorder_level AND s.quantity > 0
    `).all();

    const outOfStock = db.prepare(`
      SELECT DISTINCT p.name, p.sku
      FROM stock s
      JOIN products p ON s.product_id = p.id
      WHERE s.quantity = 0
    `).all();

    const recentMovements = db.prepare(`
      SELECT sm.*, p.name as product_name, o.operation_type, o.reference
      FROM stock_moves sm
      JOIN products p ON sm.product_id = p.id
      JOIN operations o ON sm.operation_id = o.id
      ORDER BY sm.id DESC LIMIT 5
    `).all();

    res.json({
      totalProducts,
      totalWarehouses,
      totalMovements,
      totalSuppliers,
      totalCustomers,
      lowStockCount: lowStockItems.length,
      outOfStockCount: outOfStock.length,
      lowStockItems,
      outOfStock,
      recentMovements
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch dashboard.", detail: error.message });
  }
});

module.exports = router;