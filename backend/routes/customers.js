const express = require("express");
const router = express.Router();
const db = require("../db/connection");
const { protect } = require("../middleware/auth");
const { validateFields } = require("../middleware/validate");

router.get("/", protect, function(req, res) {
  try {
    const customers = db.prepare("SELECT * FROM customers ORDER BY name").all();
    res.json({ count: customers.length, customers });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch customers.", detail: error.message });
  }
});

router.post("/", protect, function(req, res) {
  try {
    const err = validateFields(["name"], req.body);
    if (err) return res.status(400).json({ message: err });
    const { name, contact, email } = req.body;
    const result = db.prepare(
      "INSERT INTO customers (name, contact, email) VALUES (?, ?, ?)"
    ).run(name, contact || null, email || null);
    res.status(201).json({
      message: "Customer created",
      customer: { id: result.lastInsertRowid, name, contact, email }
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to create customer.", detail: error.message });
  }
});

router.delete("/:id", protect, function(req, res) {
  try {
    const customer = db.prepare("SELECT id FROM customers WHERE id = ?").get(req.params.id);
    if (!customer) return res.status(404).json({ message: "Customer not found." });
    db.prepare("DELETE FROM customers WHERE id = ?").run(req.params.id);
    res.json({ message: "Customer deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete customer.", detail: error.message });
  }
});

module.exports = router;