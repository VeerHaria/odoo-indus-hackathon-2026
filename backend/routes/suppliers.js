const express = require("express");
const router = express.Router();
const db = require("../db/connection");
const { protect } = require("../middleware/auth");
const { validateFields } = require("../middleware/validate");

router.get("/", protect, (req, res) => {
  try {
    const suppliers = db.prepare("SELECT * FROM suppliers ORDER BY name").all();
    res.json({ count: suppliers.length, suppliers });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch suppliers.", detail: error.message });
  }
});

router.post("/", protect, (req, res) => {
  try {
    const error = validateFields(["name"], req.body);
    if (error) return res.status(400).json({ message: error });

    const { name, contact, email } = req.body;
    const result = db.prepare(
      "INSERT INTO suppliers (name, contact, email) VALUES (?, ?, ?)"
    ).run(name, contact || null, email || null);

    res.status(201).json({
      message: "Supplier created ✅",
      supplier: { id: result.lastInsertRowid, name, contact, email }
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to create supplier.", detail: error.message });
  }
});

router.delete("/:id", protect, (req, res) => {
  try {
    const supplier = db.prepare("SELECT id FROM suppliers WHERE id = ?").get(req.params.id);
    if (!supplier) return res.status(404).json({ message: "Supplier not found." });
    db.prepare("DELETE FROM suppliers WHERE id = ?").run(req.params.id);
    res.json({ message: "Supplier deleted ✅" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete supplier.", detail: error.message });
  }
});

module.exports = router;