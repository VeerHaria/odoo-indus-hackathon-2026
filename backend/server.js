require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./db/connection");

const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const warehouseRoutes = require("./routes/warehouses");
const inventoryRoutes = require("./routes/inventory");
const stockMovementRoutes = require("./routes/stockMovement");
const dashboardRoutes = require("./routes/dashboard");

const app = express();

// MIDDLEWARE MUST COME FIRST
app.use(cors());
app.use(express.json());

// ROUTES COME AFTER
app.get("/", (req, res) => {
  res.json({ message: "CoreInventory API running ✅" });
});

app.use("/auth", authRoutes);
app.use("/products", productRoutes);
app.use("/warehouses", warehouseRoutes);
app.use("/inventory", inventoryRoutes);
app.use("/stock-movements", stockMovementRoutes);
app.use("/dashboard", dashboardRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});