require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const db = require("./db/connection");

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
    endpoints: ["/auth", "/products", "/warehouses", "/inventory", "/stock-movements", "/dashboard", "/adjustments", "/suppliers", "/customers"]
  });
});

// Routes
app.use("/auth", require("./routes/auth"));
app.use("/products", require("./routes/products"));
app.use("/warehouses", require("./routes/warehouses"));
app.use("/inventory", require("./routes/inventory"));
app.use("/stock-movements", require("./routes/stockMovement"));
app.use("/dashboard", require("./routes/dashboard"));
app.use("/adjustments", require("./routes/adjustments"));
app.use("/suppliers", require("./routes/suppliers"));
app.use("/customers", require("./routes/customers"));

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