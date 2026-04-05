/**
 * Legacy scan engine stub
 * All real scanning now handled by nmapEngine.js
 * This file maintained for backward compatibility only
 */

const { inMemory, generateId } = require("./store");

function getScanById(scanId) {
  return inMemory.scans.find((s) => s.id === scanId);
}

// DEPRECATED: Use nmapEngine.startNmapScan instead
function startScan({ target, scanType, actor }, onProgress) {
  throw new Error("Legacy startScan deprecated. Use startNmapScan from nmapEngine instead.");
}

module.exports = {
  startScan,
  getScanById,
};

function getPlannedHostCount(scanType, rangeCapacity) {
  const profileMax = scanType === "full" ? 10 : 6;
  const sampleRatio = scanType === "full" ? 0.6 : 0.35;
  const proportional = Math.ceil(rangeCapacity * sampleRatio);

  return Math.max(1, Math.min(profileMax, rangeCapacity, proportional));
}

function startScan({ target, scanType, actor }, notify) {
  const scanId = generateId("scan");
  const targetRange = resolveTargetRange(target);
  const rangeCapacity = getRangeCapacity(targetRange);
  const totalSteps = getPlannedHostCount(scanType, rangeCapacity);
  const usedIpInts = new Set();

  const scan = {
    id: scanId,
    target,
    scanType,
    status: "running",
    progress: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    actor,
    logs: [
      `Initializing scan engine... target capacity=${rangeCapacity}, planned host probes=${totalSteps}`,
    ],
    hosts: [],
  };

  inMemory.scans.unshift(scan);
  addActivity("scan", `Scan ${scanId} started on ${target}`, actor || "system");
  notify("scan:started", scan);

  let step = 0;
  const timer = setInterval(() => {
    step += 1;
    scan.progress = Math.min(100, Math.round((step / totalSteps) * 100));
    scan.updatedAt = new Date().toISOString();

    const host = generateHost(step, targetRange, usedIpInts);
    scan.hosts.push(host);

    const line = `[${new Date().toISOString()}] Host ${host.ip} up | open: ${host.ports
      .map((p) => p.port)
      .join(", ") || "none"}`;
    scan.logs.push(line);

    notify("scan:progress", {
      scanId,
      progress: scan.progress,
      status: scan.status,
      latestLog: line,
      host,
    });

    if (step >= totalSteps) {
      clearInterval(timer);
      activeTimers.delete(timer);
      scan.status = "completed";
      scan.progress = 100;
      scan.logs.push("Scan complete. Risk profiling generated.");
      addActivity("scan", `Scan ${scanId} completed`, actor || "system");
      notify("scan:completed", scan);
    }
  }, scanType === "full" ? 1100 : 750);

  if (typeof timer.unref === "function") {
    timer.unref();
  }
  activeTimers.add(timer);

  return scan;
}

function getScanById(scanId) {
  return inMemory.scans.find((s) => s.id === scanId);
}

function stopAllScans() {
  for (const timer of activeTimers) {
    clearInterval(timer);
  }
  activeTimers.clear();
}

module.exports = { startScan, getScanById, stopAllScans };
