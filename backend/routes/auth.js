const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db/connection");
const { validateFields } = require("../middleware/validate");

// Register
router.post("/register", async (req, res) => {
  try {
    const error = validateFields(["name", "email", "password"], req.body);
    if (error) return res.status(400).json({ message: error });

    const { name, email, password, role } = req.body;

    const validRoles = ["admin", "manager", "staff"];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role. Use admin, manager, or staff." });
    }

    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (existing) {
      return res.status(400).json({ message: "Email already registered." });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const result = db.prepare(
      `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`
    ).run(name, email.toLowerCase().trim(), password_hash, role || "staff");

    res.status(201).json({
      message: "User registered successfully ✅",
      user: { id: result.lastInsertRowid, name, email, role: role || "staff" }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error during registration.", detail: error.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const error = validateFields(["email", "password"], req.body);
    if (error) return res.status(400).json({ message: error });

    const { email, password } = req.body;

    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase().trim());
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "coreinventory_secret",
      { expiresIn: "24h" }
    );

    res.json({
      message: "Login successful ✅",
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error during login.", detail: error.message });
  }
});

// Get current user profile
router.get("/me", (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided." });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "coreinventory_secret");
    const user = db.prepare("SELECT id, name, email, role, created_at FROM users WHERE id = ?").get(decoded.id);
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json(user);
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token." });
  }
});

module.exports = router;