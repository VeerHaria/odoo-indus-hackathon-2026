const express = require("express");
const router = express.Router();
const Product = require("../models/Product");

// Create product
router.post("/", async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all products
router.get("/", async (req, res) => {
  try {
    const { category, search } = req.query;
    let filter = { isArchived: false };

    if (category) filter.category = category;
    if (search) filter.name = { $regex: search, $options: "i" };

    const products = await Product.find(filter);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single product
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update product
router.put("/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Archive product (soft delete)
router.delete("/:id", async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { isArchived: true });
    res.json({ message: "Product archived successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;