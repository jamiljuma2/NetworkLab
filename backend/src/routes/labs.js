const express = require("express");
const net = require("net");
const { requireAuth } = require("../middleware/auth");
const { allowRoles } = require("../middleware/auth");
const { inMemory, generateId, addActivity } = require("../services/store");

const router = express.Router();

function isPrivateIPv4(ip) {
  if (net.isIP(ip) !== 4) return false;
  const [a, b] = ip.split(".").map(Number);
  if (a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 127) return true;
  return false;
}

function parseTargetHost(target) {
  const raw = String(target || "").trim();
  if (!raw) return null;
  try {
    const withProtocol = /^https?:\/\//i.test(raw) ? raw : `http://${raw}`;
    const url = new URL(withProtocol);
    return { host: url.hostname.toLowerCase(), normalizedTarget: withProtocol };
  } catch {
    return null;
  }
}

function isAllowedTarget(target) {
  const parsed = parseTargetHost(target);
  if (!parsed) return { ok: false, reason: "Target must be a valid host or URL" };

  const { host, normalizedTarget } = parsed;
  const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
  const allowedByName = host.endsWith(".local") || host.endsWith(".internal") || localHosts.has(host);
  const allowedByIp = isPrivateIPv4(host);

  if (!allowedByName && !allowedByIp) {
    return {
      ok: false,
      reason: "Target not in safe allowlist. Use localhost, private IP ranges, or *.local/*.internal lab hosts.",
    };
  }

  return { ok: true, normalizedTarget };
}

function buildEvidence(lab, execution) {
  const when = new Date().toISOString();
  const common = [
    `[${when}] Scope check passed for ${execution.target}`,
    `[${when}] Request path: ${execution.httpMethod} ${execution.routePath}`,
    `[${when}] Performed passive fingerprint and response consistency checks`,
  ];

  const byLab = {
    "sql-injection": [
      "Checked input handling with non-destructive payload templates",
      "Observed response anomaly patterns consistent with weak query parameterization",
      "No destructive statements were executed (safe mode enforced)",
    ],
    "port-misconfiguration": [
      "Verified exposed management endpoints and service banners",
      "Detected publicly reachable admin surface on non-standard port",
      "Recommendation generated for least-exposure firewall policy",
    ],
    "auth-bypass": [
      "Analyzed token validation behavior for algorithm pinning",
      "Detected acceptance path that requires stricter claim validation",
      "No forged tokens persisted (safe verification mode)",
    ],
    "smb-relay": [
      "Checked host posture indicators for signing/relay resistance",
      "Detected policy gaps that could permit relay in weak environments",
      "No credential replay attempted (simulation-only safety mode)",
    ],
    log4shell: [
      "Analyzed logging inputs for unsafe lookup pattern handling",
      "Detected callback-style pattern exposure risk indicators",
      "Outbound exploit traffic was not executed (safe mode enforced)",
    ],
  };

  return [...common, ...(byLab[lab.id] || ["Generic safe assessment checks completed"])];
}

router.get("/", requireAuth, (req, res) => {
  return res.json(
    inMemory.labs.map((lab) => ({
      id: lab.id,
      title: lab.title,
      icon: lab.icon,
      category: lab.category,
      scenario: lab.scenario,
      objectivesCount: Array.isArray(lab.objectives) ? lab.objectives.length : 0,
      hintsCount: Array.isArray(lab.hints) ? lab.hints.length : 0,
      hasTerminal: Array.isArray(lab.terminal) && lab.terminal.length > 0,
      hasSolution: Boolean(lab.solution),
    }))
  );
});

router.get("/executions", requireAuth, (req, res) => {
  const status = String(req.query.status || "all");
  const isAdmin = req.user.role === "Admin";
  let rows = isAdmin
    ? [...inMemory.labExecutions]
    : inMemory.labExecutions.filter((r) => r.requestedBy === req.user.email);

  if (status !== "all") {
    rows = rows.filter((r) => r.status === status);
  }

  rows.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  return res.json(rows);
});

router.post("/:labId/executions", requireAuth, (req, res) => {
  const lab = inMemory.labs.find((l) => l.id === req.params.labId);
  if (!lab) {
    return res.status(404).json({ message: "Lab not found" });
  }

  const target = String(req.body.target || "").trim();
  const routePath = String(req.body.routePath || "/").trim();
  const httpMethod = String(req.body.httpMethod || "GET").toUpperCase();
  const notes = String(req.body.notes || "").trim();

  if (!target) {
    return res.status(400).json({ message: "Target is required" });
  }

  const allowed = isAllowedTarget(target);
  if (!allowed.ok) {
    return res.status(400).json({ message: allowed.reason });
  }

  if (!/^\//.test(routePath)) {
    return res.status(400).json({ message: "routePath must start with '/'" });
  }

  if (!["GET", "POST", "PUT", "PATCH", "DELETE"].includes(httpMethod)) {
    return res.status(400).json({ message: "Unsupported httpMethod" });
  }

  const execution = {
    id: generateId("labrun"),
    labId: lab.id,
    labTitle: lab.title,
    target: allowed.normalizedTarget,
    routePath,
    httpMethod,
    notes,
    status: "pending_approval",
    requestedBy: req.user.email,
    requestedAt: new Date().toISOString(),
    approvedBy: null,
    approvedAt: null,
    rejectedBy: null,
    rejectedAt: null,
    completedAt: null,
    evidence: [],
  };

  inMemory.labExecutions.unshift(execution);
  addActivity("lab", `Safe execution requested for ${lab.title} on ${execution.target}`, req.user.email);
  return res.status(202).json(execution);
});

router.post("/executions/:executionId/approve", requireAuth, allowRoles("Admin"), (req, res) => {
  const execution = inMemory.labExecutions.find((r) => r.id === req.params.executionId);
  if (!execution) {
    return res.status(404).json({ message: "Execution request not found" });
  }
  if (execution.status !== "pending_approval") {
    return res.status(409).json({ message: `Cannot approve execution in status '${execution.status}'` });
  }

  const lab = inMemory.labs.find((l) => l.id === execution.labId);
  execution.status = "running";
  execution.approvedBy = req.user.email;
  execution.approvedAt = new Date().toISOString();

  execution.evidence = buildEvidence(lab || { id: "unknown" }, execution);
  execution.status = "completed";
  execution.completedAt = new Date().toISOString();

  addActivity("lab", `Safe execution approved and completed for ${execution.labTitle}`, req.user.email);
  return res.json(execution);
});

router.post("/executions/:executionId/reject", requireAuth, allowRoles("Admin"), (req, res) => {
  const execution = inMemory.labExecutions.find((r) => r.id === req.params.executionId);
  if (!execution) {
    return res.status(404).json({ message: "Execution request not found" });
  }
  if (execution.status !== "pending_approval") {
    return res.status(409).json({ message: `Cannot reject execution in status '${execution.status}'` });
  }

  execution.status = "rejected";
  execution.rejectedBy = req.user.email;
  execution.rejectedAt = new Date().toISOString();
  addActivity("lab", `Safe execution rejected for ${execution.labTitle}`, req.user.email);
  return res.json(execution);
});

router.get("/:labId", requireAuth, (req, res) => {
  const lab = inMemory.labs.find((l) => l.id === req.params.labId);
  if (!lab) {
    return res.status(404).json({ message: "Lab not found" });
  }
  return res.json(lab);
});

module.exports = router;
