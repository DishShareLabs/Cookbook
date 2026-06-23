const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const requireAuth = require("../middleware/auth");

const router = express.Router();
const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 1000 * 60 * 60 * 24 * 7
};

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status
  };
}

function setAuthCookie(res, user) {
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d"
  });

  res.cookie("token", token, cookieOptions);
}

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters." });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({ message: "That email is already registered." });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const userCount = await User.estimatedDocumentCount();
    const user = await User.create({
      name,
      email,
      passwordHash,
      role: userCount === 0 ? "admin" : "member"
    });

    setAuthCookie(res, user);
    res.status(201).json({ user: publicUser(user) });
  } catch (error) {
    res.status(500).json({ message: "Could not create your account." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase().trim() });

    if (!user || user.status !== "active") {
      return res.status(401).json({ message: "Email or password is incorrect." });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ message: "Email or password is incorrect." });
    }

    setAuthCookie(res, user);
    res.json({ user: publicUser(user) });
  } catch (error) {
    res.status(500).json({ message: "Could not log you in." });
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("token", cookieOptions);
  res.json({ ok: true });
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

module.exports = router;
