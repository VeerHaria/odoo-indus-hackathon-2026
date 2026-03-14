const express = require("express");
const router = express.Router();
const db = require("../db/connection");

// Create product
router.post("/", (req, res) => {
  try {
    const { name, sku, category_id, unit_of_measure, reorder_level } = req.body;
    const stmt = db.prepare(
      `INSERT INTO products (name, sku, category_id, unit_of_measure, reorder_level)
       VALUES (?, ?, ?, ?, ?)`
    );
    const result = stmt.run(name, sku, category_id, unit_of_measure, reorder_level || 10);
    res.status(201).json({ id: result.lastInsertRowid, name, sku });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all products
router.get("/", (req, res) => {
  try {
    const products = db.prepare(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
    `).all();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single product
router.get("/:id", (req, res) => {
  try {
    const product = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update product
router.put("/:id", (req, res) => {
  try {
    const { name, sku, category_id, unit_of_measure, reorder_level } = req.body;
    db.prepare(
      `UPDATE products SET name=?, sku=?, category_id=?, unit_of_measure=?, reorder_level=?
       WHERE id=?`
    ).run(name, sku, category_id, unit_of_measure, reorder_level, req.params.id);
    res.json({ message: "Product updated ✅" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete product
router.delete("/:id", (req, res) => {
  try {
    db.prepare("DELETE FROM products WHERE id = ?").run(req.params.id);
    res.json({ message: "Product deleted ✅" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;