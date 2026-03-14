const mongoose = require("mongoose");

const StockMovementSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
    },
    type: {
      type: String,
      enum: ["RECEIPT", "DELIVERY", "TRANSFER_IN", "TRANSFER_OUT", "ADJUSTMENT"],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    note: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("StockMovement", StockMovementSchema);