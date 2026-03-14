const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  name: String,
  sku: String,
  category: String,
  reorderLevel: Number,
});

module.exports = mongoose.model("Product", ProductSchema);