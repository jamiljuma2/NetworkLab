const express = require("express");
const { requireAuth, allowRoles } = require("../middleware/auth");
const { inMemory, generateId, addActivity } = require("../services/store");
const { hashPassword } = require("../utils/security");
const { getAuditLogs, generateAuditReport } = require("../services/auditLogger");

const router = express.Router();

router.use(requireAuth, allowRoles("Admin"));

router.get("/logs", (req, res) => {
  return res.json(inMemory.activities);
});

/**
 * GET /api/admin/audit-logs
 * Retrieve comprehensive security audit logs with optional filtering
 */
router.get("/audit-logs", (req, res) => {
  const { eventType, userId, startDate, endDate, limit = 100 } = req.query;

  const logs = getAuditLogs({
    eventType,
    userId,
    startDate,
    endDate,
    limit: Math.min(Number(limit) || 100, 1000),
  });

  return res.json(logs);
});

/**
 * POST /api/admin/audit-report
 * Generate comprehensive audit report
 */
router.post("/audit-report", (req, res) => {
  const { startDate, endDate } = req.body;

  const report = generateAuditReport({
    startDate,
    endDate,
  });

  return res.json(report);
});

router.get("/scan-rules", (req, res) => {
  return res.json(inMemory.scanRules);
});

router.put("/scan-rules", (req, res) => {
  inMemory.scanRules = { ...inMemory.scanRules, ...req.body };
  addActivity("admin", "Updated scan rule configuration", req.user.email);
  return res.json(inMemory.scanRules);
});

router.post("/users", async (req, res) => {
  const { name, email, role = "Student", password = "ChangeMe123!" } = req.body;
  if (!name || !email) {
    return res.status(400).json({ message: "name and email required" });
  }
  if (inMemory.users.some((u) => u.email === String(email).toLowerCase())) {
    return res.status(409).json({ message: "User already exists" });
  }

  const user = {
    id: generateId("usr"),
    name,
    email: String(email).toLowerCase(),
    role,
    passwordHash: await hashPassword(password),
    createdAt: new Date().toISOString(),
  };

  inMemory.users.push(user);
  addActivity("admin", `Created user ${user.email}`, req.user.email);
  return res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

router.put("/users/:id", (req, res) => {
  const user = inMemory.users.find((u) => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  const { name, role } = req.body;
  if (name) user.name = name;
  if (role) user.role = role;
  addActivity("admin", `Updated user ${user.email}`, req.user.email);
  return res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

router.delete("/users/:id", (req, res) => {
  const before = inMemory.users.length;
  inMemory.users = inMemory.users.filter((u) => u.id !== req.params.id);
  if (inMemory.users.length === before) {
    return res.status(404).json({ message: "User not found" });
  }
  addActivity("admin", `Deleted user ${req.params.id}`, req.user.email);
  return res.status(204).send();
});

module.exports = router;
