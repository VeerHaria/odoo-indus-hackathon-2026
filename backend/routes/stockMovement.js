const express = require("express");
const router = express.Router();
const Inventory = require("../models/Inventory");
const StockMovement = require("../models/StockMovement");
const Product = require("../models/Product");

// Create stock movement
router.post("/", async (req, res) => {
  try {
    const { productId, warehouseId, type, quantity, note } = req.body;

    // Find or create inventory record
    let inventory = await Inventory.findOne({ productId, warehouseId });
    if (!inventory) {
      inventory = new Inventory({ productId, warehouseId, quantity: 0 });
    }

    // Apply stock change based on movement type
    if (["RECEIPT", "TRANSFER_IN", "ADJUSTMENT"].includes(type)) {
      inventory.quantity += quantity;
    } else if (["DELIVERY", "TRANSFER_OUT"].includes(type)) {
      if (inventory.quantity < quantity) {
        return res.status(400).json({
          message: `Not enough stock. Available: ${inventory.quantity}, Requested: ${quantity}`,
        });
      }
      inventory.quantity -= quantity;
    } else {
      return res.status(400).json({ message: "Invalid movement type" });
    }

    await inventory.save();

    // Save the movement record
    const movement = new StockMovement({
      productId,
      warehouseId,
      type,
      quantity,
      note,
    });
    await movement.save();

    // Check low stock after movement
    const product = await Product.findById(productId);
    const lowStock = product && inventory.quantity <= product.reorderLevel;

    res.status(201).json({
      message: "Stock movement recorded ✅",
      movement,
      updatedInventory: inventory,
      alert: lowStock
        ? `⚠️ Low stock alert: ${product.name} has only ${inventory.quantity} units left`
        : null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all movements (newest first)
router.get("/", async (req, res) => {
  try {
    const movements = await StockMovement.find()
      .populate("productId")
      .populate("warehouseId")
      .sort({ createdAt: -1 });
    res.json(movements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get movements by product
router.get("/product/:productId", async (req, res) => {
  try {
    const movements = await StockMovement.find({
      productId: req.params.productId,
    })
      .populate("productId")
      .populate("warehouseId")
      .sort({ createdAt: -1 });
    res.json(movements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;