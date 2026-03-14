require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const productRoutes = require("./routes/products");
const warehouseRoutes = require("./routes/warehouses");
const inventoryRoutes = require("./routes/inventory");
const stockMovementRoutes = require("./routes/stockMovement");

const app = express();

app.use(cors());
app.use(express.json());

// DB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Error:", err));

// Health check
app.get("/", (req, res) => {
  res.json({ message: "CoreInventory API running ✅" });
});

// Routes
app.use("/products", productRoutes);
app.use("/warehouses", warehouseRoutes);
app.use("/inventory", inventoryRoutes);
app.use("/stock-movements", stockMovementRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});