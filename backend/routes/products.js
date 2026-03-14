const express = require("express");
const router = express.Router();
const db = require("../db/connection");
const { protect } = require("../middleware/auth");
const { validateFields } = require("../middleware/validate");

// Get all products
router.get("/", protect, (req, res) => {
  try {
    const { category_id, search } = req.query;
    let query = `
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (category_id) {
      query += " AND p.category_id = ?";
      params.push(category_id);
    }
    if (search) {
      query += " AND (p.name LIKE ? OR p.sku LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    query += " ORDER BY p.name ASC";
    const products = db.prepare(query).all(...params);
    res.json({ count: products.length, products });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch products.", detail: error.message });
  }
});

// Get single product with stock info
router.get("/:id", protect, (req, res) => {
  try {
    const product = db.prepare(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `).get(req.params.id);

    if (!product) return res.status(404).json({ message: "Product not found." });

    const stock = db.prepare(`
      SELECT s.quantity, l.name as location_name, w.name as warehouse_name
      FROM stock s
      JOIN locations l ON s.location_id = l.id
      JOIN warehouses w ON l.warehouse_id = w.id
      WHERE s.product_id = ?
    `).all(req.params.id);

    res.json({ ...product, stock });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch product.", detail: error.message });
  }
});

// Create product
router.post("/", protect, (req, res) => {
  try {
    const error = validateFields(["name", "sku"], req.body);
    if (error) return res.status(400).json({ message: error });

    const { name, sku, category_id, unit_of_measure, reorder_level } = req.body;

    const existing = db.prepare("SELECT id FROM products WHERE sku = ?").get(sku);
    if (existing) return res.status(400).json({ message: "SKU already exists." });

    const result = db.prepare(`
      INSERT INTO products (name, sku, category_id, unit_of_measure, reorder_level)
      VALUES (?, ?, ?, ?, ?)
    `).run(name, sku.toUpperCase().trim(), category_id || null, unit_of_measure || "units", reorder_level || 10);

    res.status(201).json({
      message: "Product created ✅",
      product: { id: result.lastInsertRowid, name, sku, unit_of_measure, reorder_level }
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to create product.", detail: error.message });
  }
});

// Update product
router.put("/:id", protect, (req, res) => {
  try {
    const product = db.prepare("SELECT id FROM products WHERE id = ?").get(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found." });

    const { name, sku, category_id, unit_of_measure, reorder_level } = req.body;

    db.prepare(`
      UPDATE products SET name=?, sku=?, category_id=?, unit_of_measure=?, reorder_level=?
      WHERE id=?
    `).run(name, sku, category_id, unit_of_measure, reorder_level, req.params.id);

    res.json({ message: "Product updated ✅" });
  } catch (error) {
    res.status(500).json({ message: "Failed to update product.", detail: error.message });
  }
});

// Delete product
router.delete("/:id", protect, (req, res) => {
  try {
    const product = db.prepare("SELECT id FROM products WHERE id = ?").get(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found." });

    db.prepare("DELETE FROM products WHERE id = ?").run(req.params.id);
    res.json({ message: "Product deleted ✅" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete product.", detail: error.message });
  }
});

// Get all categories
router.get("/meta/categories", protect, (req, res) => {
  try {
    const categories = db.prepare("SELECT * FROM categories ORDER BY name").all();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch categories.", detail: error.message });
  }
});

module.exports = router;