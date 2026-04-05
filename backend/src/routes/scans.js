const express = require("express");
const rateLimit = require("express-rate-limit");
const { validate, schemas } = require("../middleware/validate");
const { requireAuth, allowRoles } = require("../middleware/auth");
const { inMemory } = require("../services/store");
const { startNmapScan, getScanById, stopScan } = require("../services/nmapEngine");
const {
  logScanInitiated,
  logScanCompleted,
  logProductionAccess,
  logAuthorizationFailure,
  logValidationFailure,
} = require("../services/auditLogger");
const { broadcast } = require("../sockets");

const router = express.Router();

const scanLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many scan requests, slow down" },
});

router.get("/", requireAuth, (req, res) => {
  // Students see only their own scans
  // Analysts and Admins see all scans
  let scans = inMemory.scans;
  if (req.user.role === "Student") {
    scans = scans.filter((s) => s.userId === req.user.id);
  }
  return res.json(scans);
});

router.get("/:scanId", requireAuth, (req, res) => {
  const scan = getScanById(req.params.scanId);
  if (!scan) {
    return res.status(404).json({ message: "Scan not found" });
  }

  // Students can only view their own scans
  if (req.user.role === "Student" && scan.userId !== req.user.id) {
    logAuthorizationFailure({
      userId: req.user.id,
      userRole: req.user.role,
      action: "VIEW_SCAN",
      reason: "Unauthorized scan access attempt",
    });
    return res.status(403).json({ message: "Unauthorized" });
  }

  return res.json(scan);
});

router.post("/start", requireAuth, allowRoles("Admin", "Analyst", "Student"), scanLimiter, validate(schemas.startScan), (req, res) => {
  const { target, scanType, consent = false } = req.validated.body;

  try {
    // Start real Nmap scan with audit logging
    const scan = startNmapScan(
      {
        target,
        scanType,
        userId: req.user.id,
        role: req.user.role,
        consent,
      },
      (event, payload) => {
        // Forward real-time updates via WebSocket
        broadcast(event, {
          ...payload,
          userId: req.user.id,
        });
      }
    );

    // Log scan initiation
    logScanInitiated({
      scanId: scan.id,
      userId: req.user.id,
      userRole: req.user.role,
      target: scan.target,
      scanType,
      isProduction: scan.isProduction,
      consentProvided: consent && scan.isProduction,
    });

    // Log production access if applicable
    if (scan.isProduction) {
      logProductionAccess({
        userId: req.user.id,
        userRole: req.user.role,
        target: scan.target,
        action: "INITIATE_PRODUCTION_SCAN",
        allowed: true,
        reason: consent ? "Explicit consent provided" : "Production safe mode",
      });
    }

    return res.status(202).json(scan);
  } catch (err) {
    // Log validation/authorization failures
    logValidationFailure({
      userId: req.user.id,
      target: req.validated.body.target,
      error: err.message,
      reason: "Scan validation failed",
    });

    return res.status(400).json({ message: err.message });
  }
});

router.post("/:scanId/stop", requireAuth, (req, res) => {
  const scan = getScanById(req.params.scanId);
  if (!scan) {
    return res.status(404).json({ message: "Scan not found" });
  }

  // Only creator or admin can stop
  if (scan.userId !== req.user.id && req.user.role !== "Admin") {
    return res.status(403).json({ message: "Unauthorized" });
  }

  const stopped = stopScan(req.params.scanId);
  if (!stopped) {
    return res.status(400).json({ message: "Unable to stop scan (already completed)" });
  }

  // Log audit
  const auditLogger = require("../services/auditLogger");
  auditLogger.logEvent("SCAN_STOPPED", {
    scanId: scan.id,
    userId: req.user.id,
    reason: "User initiated stop",
  });

  return res.json({ message: "Scan stopped", scanId: req.params.scanId });
});

module.exports = router;
