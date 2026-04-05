const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { inMemory } = require("../services/store");

const router = express.Router();

function classify(score) {
  if (score >= 9) return "Critical";
  if (score >= 7) return "High";
  if (score >= 4) return "Medium";
  return "Low";
}

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

function getFindingsForCve(cve) {
  const candidatePorts = getCandidatePorts(cve);
  if (candidatePorts.length === 0) return [];

  const findings = [];
  const seen = new Set();

  for (const scan of inMemory.scans) {
    for (const host of scan.hosts || []) {
      for (const open of host.ports || []) {
        if (!candidatePorts.includes(open.port)) continue;
        const key = `${host.ip}:${open.port}`;
        if (seen.has(key)) continue;
        seen.add(key);
        findings.push({
          scanId: scan.id,
          target: scan.target,
          host: host.ip,
          port: open.port,
          service: String(open.name || "unknown").toUpperCase(),
        });
      }
    }
  }

  return findings;
}

router.get("/", requireAuth, (req, res) => {
  const { q = "", severity = "all" } = req.query;
  const search = String(q).toLowerCase();
  const sev = String(severity);

  const rows = inMemory.cves
    .filter((cve) => (sev === "all" ? true : cve.severity.toLowerCase() === sev.toLowerCase()))
    .filter((cve) => `${cve.id} ${cve.title} ${cve.description}`.toLowerCase().includes(search))
    .map((cve) => {
      const findings = getFindingsForCve(cve);
      const primary = findings[0] || null;

      return {
        ...cve,
        host: primary ? primary.host : null,
        port: primary ? primary.port : null,
        service: primary ? primary.service : null,
        findingCount: findings.length,
        findings,
        derivedSeverity: classify(cve.cvss),
      };
    });

  return res.json(rows);
});

module.exports = router;
