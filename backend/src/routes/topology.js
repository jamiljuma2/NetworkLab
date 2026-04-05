const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { inMemory } = require("../services/store");
const { buildTopology } = require("../services/topology");

const router = express.Router();

router.get("/", requireAuth, (req, res) => {
  const { scanId, target } = req.query;
  return res.json(buildTopology(inMemory.scans, { scanId, target }));
});

module.exports = router;
