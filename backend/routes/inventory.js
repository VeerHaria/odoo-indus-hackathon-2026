const express = require("express");
const router = express.Router();
const Inventory = require("../models/Inventory");
const Product = require("../models/Product");

// Add or update inventory
router.post("/", async (req, res) => {
  try {
    const { productId, warehouseId, quantity } = req.body;

    let inventory = await Inventory.findOne({ productId, warehouseId });

    if (inventory) {
      inventory.quantity += quantity;
      await inventory.save();
    } else {
      inventory = new Inventory({ productId, warehouseId, quantity });
      await inventory.save();
    }

    // Check low stock
    const product = await Product.findById(productId);
    const lowStock = product && inventory.quantity <= product.reorderLevel;

    res.status(201).json({
      inventory,
      alert: lowStock
        ? `⚠️ Low stock alert: ${product.name} has only ${inventory.quantity} units left`
        : null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all inventory
router.get("/", async (req, res) => {
  try {
    const inventory = await Inventory.find()
      .populate("productId")
      .populate("warehouseId");
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get inventory by warehouse
router.get("/warehouse/:warehouseId", async (req, res) => {
  try {
    const inventory = await Inventory.find({
      warehouseId: req.params.warehouseId,
    })
      .populate("productId")
      .populate("warehouseId");
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;