const express = require("express");
const { validate, schemas } = require("../middleware/validate");
const { inMemory, generateId, addActivity } = require("../services/store");
const { signToken, hashPassword, comparePassword } = require("../utils/security");
const { requireAuth, allowRoles } = require("../middleware/auth");

const router = express.Router();

router.post("/signup", validate(schemas.signup), async (req, res) => {
  const { email, password, name } = req.validated.body;
  const exists = inMemory.users.some((u) => u.email.toLowerCase() === email.toLowerCase());

  if (exists) {
    return res.status(409).json({ message: "User already exists" });
  }

  const user = {
    id: generateId("usr"),
    email: email.toLowerCase(),
    name,
    role: "Student",
    passwordHash: await hashPassword(password),
    createdAt: new Date().toISOString(),
  };

  inMemory.users.push(user);
  addActivity("auth", `Signup: ${user.email}`, user.email);

  return res.status(201).json({
    token: signToken(user),
    user: { id: user.id, email: user.email, role: user.role, name: user.name },
  });
});

router.post("/login", validate(schemas.login), async (req, res) => {
  const { email, password } = req.validated.body;
  const user = inMemory.users.find((u) => u.email === email.toLowerCase());

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const ok = await comparePassword(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  addActivity("auth", `Login success: ${user.email}`, user.email);

  return res.json({
    token: signToken(user),
    user: { id: user.id, email: user.email, role: user.role, name: user.name },
  });
});

router.get("/me", requireAuth, (req, res) => {
  const user = inMemory.users.find((u) => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  return res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
});

router.get("/users", requireAuth, allowRoles("Admin"), (req, res) => {
  return res.json(inMemory.users.map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt })));
});

module.exports = router;
