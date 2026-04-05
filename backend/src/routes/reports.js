const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { inMemory } = require("../services/store");

const router = express.Router();

function summarizeRisk() {
  const avg =
    inMemory.cves.reduce((sum, cve) => sum + cve.cvss, 0) / Math.max(inMemory.cves.length, 1);
  if (avg >= 8) return "Critical";
  if (avg >= 6) return "High";
  if (avg >= 4) return "Medium";
  return "Low";
}

router.get("/executive", requireAuth, (req, res) => {
  const latest = inMemory.scans[0];
  const recommendations = [
    "Patch critical CVEs in internet-facing services first.",
    "Enforce MFA for privileged accounts.",
    "Apply network segmentation and block SMB lateral movement.",
    "Establish continuous vulnerability scanning cadence.",
  ];

  return res.json({
    generatedAt: new Date().toISOString(),
    scanOverview: latest
      ? {
          scanId: latest.id,
          target: latest.target,
          hostsDiscovered: latest.hosts.length,
          vulnerableHosts: latest.hosts.filter((h) => h.vulnerable).length,
        }
      : null,
    vulnerabilities: inMemory.cves,
    riskLevel: summarizeRisk(),
    recommendations,
  });
});

router.get("/export/:format", requireAuth, (req, res) => {
  const format = String(req.params.format).toLowerCase();
  const payload = {
    scans: inMemory.scans,
    vulnerabilities: inMemory.cves,
    packets: inMemory.packets,
    generatedAt: new Date().toISOString(),
  };

  if (format === "json") {
    res.setHeader("Content-Disposition", "attachment; filename=networklab-report.json");
    return res.json(payload);
  }

  if (format === "csv") {
    const header = "cve_id,cvss,severity,title";
    const rows = inMemory.cves.map((c) => `${c.id},${c.cvss},${c.severity},\"${c.title.replace(/\"/g, "") }\"`);
    const csv = [header, ...rows].join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=networklab-report.csv");
    return res.send(csv);
  }

  return res.status(400).json({ message: "Unsupported export format" });
});

module.exports = router;
