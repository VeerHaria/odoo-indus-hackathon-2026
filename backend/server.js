require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const db = require("./db/connection");

const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const warehouseRoutes = require("./routes/warehouses");
const inventoryRoutes = require("./routes/inventory");
const stockMovementRoutes = require("./routes/stockMovement");
const dashboardRoutes = require("./routes/dashboard");

const app = express();

// Security + middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({
    message: "CoreInventory API running ✅",
    version: "1.0.0",
    endpoints: ["/auth", "/products", "/warehouses", "/inventory", "/stock-movements", "/dashboard"]
  });
});

// Routes
app.use("/auth", authRoutes);
app.use("/products", productRoutes);
app.use("/warehouses", warehouseRoutes);
app.use("/inventory", inventoryRoutes);
app.use("/stock-movements", stockMovementRoutes);
app.use("/dashboard", dashboardRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.url} not found.` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message);
  res.status(500).json({ message: "Internal server error.", detail: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});