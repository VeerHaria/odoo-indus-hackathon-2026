console.log("Step 1: server file started");

const express = require("express");
console.log("Step 2: express loaded");

const mongoose = require("mongoose");
console.log("Step 3: mongoose loaded");

const cors = require("cors");
console.log("Step 4: cors loaded");

const productRoutes = require("./routes/products");
console.log("Step 5: product routes loaded");

const app = express();

app.use(cors());
app.use(express.json());

mongoose
  .connect("mongodb://127.0.0.1:27017/inventoryDB")
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("MongoDB Error:", err));

app.get("/", (req, res) => {
  res.send("CoreInventory API Running");
});

app.use("/products", productRoutes);

app.listen(5000, () => {
  console.log("Server running on port 5000");
});