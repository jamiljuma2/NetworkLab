const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { inMemory } = require("../services/store");
const { isSuspicious } = require("../data/packets");
const {
  startPacketCapture,
  stopPacketCapture,
  getLivePackets,
  getCaptureStatus,
  exportLiveCapture,
} = require("../services/packetCaptureEngine");
const { broadcast } = require("../sockets");

const router = express.Router();

// Get static packets or live captured packets
router.get("/", requireAuth, (req, res) => {
  const { protocol = "all", q = "", source = "static" } = req.query;
  const filterProtocol = String(protocol).toUpperCase();
  const search = String(q).toLowerCase();

  // Use live capture if available, otherwise fall back to static
  const rows =
    source === "live"
      ? getLivePackets({ protocol, search })
      : inMemory.packets
          .filter((p) => (filterProtocol === "ALL" ? true : p.protocol === filterProtocol))
          .filter((p) => `${p.src} ${p.dst} ${p.info}`.toLowerCase().includes(search))
          .map((p) => ({ ...p, suspicious: isSuspicious(p) }));

  return res.json(rows);
});

// Get capture status
router.get("/status", requireAuth, (req, res) => {
  const status = getCaptureStatus();
  return res.json(status);
});

// Start live packet capture
router.post("/capture/start", requireAuth, (req, res) => {
  const result = startPacketCapture((event, payload) => {
    broadcast(event, payload);
  });
  return res.status(result.status === "error" ? 400 : 200).json(result);
});

// Stop packet capture
router.post("/capture/stop", requireAuth, (req, res) => {
  const result = stopPacketCapture();
  return res.json(result);
});

// Export live capture
router.get("/export", requireAuth, (req, res) => {
  const exported = exportLiveCapture();
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", 'attachment; filename="packets-export.json"');
  return res.json(exported);
});

module.exports = router;
