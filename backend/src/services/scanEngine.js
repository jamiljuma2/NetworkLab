/**
 * Legacy scan engine compatibility wrapper.
 * Real scanning is handled by nmapEngine.js.
 */

const { inMemory } = require("./store");
const { stopAllScans: stopNmapScans } = require("./nmapEngine");

function getScanById(scanId) {
  return inMemory.scans.find((scan) => scan.id === scanId);
}

function startScan() {
  throw new Error("Legacy startScan deprecated. Use startNmapScan from nmapEngine instead.");
}

function stopAllScans() {
  stopNmapScans();
}

module.exports = { startScan, getScanById, stopAllScans };
