const express = require("express");
const { inMemory } = require("../services/store");

const router = express.Router();

const cvePortMap = {
  "CVE-2021-44228": [8080, 8443],
  "CVE-2017-0144": [139, 445],
  "CVE-2022-1388": [443],
  "CVE-2021-34527": [135, 445],
  "CVE-2019-19781": [443],
  "CVE-2020-1472": [135],
  "CVE-2021-26855": [443, 587],
  "CVE-2023-23397": [587, 993],
  "CVE-2018-11776": [8080, 8443],
  "CVE-2022-30190": [],
};

function extractPortsFromService(affectedService) {
  const text = String(affectedService || "");
  const match = text.match(/\(ports?\s+([0-9,\s]+)\)/i);
  if (!match) return [];
  return match[1]
    .split(",")
    .map((p) => Number(String(p).trim()))
    .filter((p) => Number.isInteger(p) && p > 0);
}

function getCandidatePorts(cve) {
  const fromMap = cvePortMap[cve.id] || [];
  if (fromMap.length > 0) return fromMap;
  return extractPortsFromService(cve.affectedService);
}

function hasRealFinding(cve, scans) {
  const candidatePorts = getCandidatePorts(cve);
  if (candidatePorts.length === 0) return false;

  for (const scan of scans) {
    for (const host of scan.hosts || []) {
      for (const open of host.ports || []) {
        if (candidatePorts.includes(open.port)) return true;
      }
    }
  }
  return false;
}

router.get("/overview", (req, res) => {
  const totalScans = inMemory.scans.length;
  const activeScans = inMemory.scans.filter((s) => s.status === "running").length;
  const completedScans = inMemory.scans.filter((s) => s.status === "completed");

  const vulnCounts = inMemory.cves.reduce(
    (acc, cve) => {
      if (!hasRealFinding(cve, completedScans)) return acc;
      acc[cve.severity] = (acc[cve.severity] || 0) + 1;
      return acc;
    },
    { Critical: 0, High: 0, Medium: 0, Low: 0 }
  );

  const trend = inMemory.scans.slice(0, 12).map((scan, index) => ({
    slot: index + 1,
    vulnerabilities: scan.hosts.filter((h) => h.vulnerable).length,
    hosts: scan.hosts.length,
  }));

  return res.json({
    totalScans,
    activeScans,
    vulnerabilitiesBySeverity: vulnCounts,
    trend: trend.reverse(),
    feed: inMemory.activities.slice(0, 25),
  });
});

module.exports = router;
