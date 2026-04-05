const { packetDataset, isSuspicious } = require("../data/packets");
const { logEvent } = require("./auditLogger");

// Circular buffer for live packets
let livePackets = [];
const MAX_LIVE_PACKETS = 500;
let captureActive = false;
let captureInterval = null;

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomIpFromPool() {
  const generators = [
    () => `10.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 254)}`,
    () => `172.${randomInt(16, 31)}.${randomInt(0, 255)}.${randomInt(1, 254)}`,
    () => `192.168.${randomInt(0, 255)}.${randomInt(1, 254)}`,
    () => `100.${randomInt(64, 127)}.${randomInt(0, 255)}.${randomInt(1, 254)}`,
    () => `198.51.100.${randomInt(1, 254)}`,
    () => `203.0.113.${randomInt(1, 254)}`,
    () => `11.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 254)}`,
    () => `8.8.8.${randomInt(1, 254)}`,
  ];

  return generators[randomInt(0, generators.length - 1)]();
}

function randomDistinctDestination(srcIp) {
  let dstIp = randomIpFromPool();
  let guard = 0;
  while (dstIp === srcIp && guard < 5) {
    dstIp = randomIpFromPool();
    guard += 1;
  }
  return dstIp;
}

function recoverStaleCaptureState() {
  // Stale state: marked active but no timer exists anymore.
  if (captureActive && !captureInterval) {
    captureActive = false;
    logEvent("PACKET_CAPTURE_STALE_STATE_RECOVERED", {
      timestamp: new Date().toISOString(),
      reason: "captureActive=true without active interval",
    });
    return true;
  }

  return false;
}

/**
 * Start live packet capture
 * @param {Object} onProgress - Callback for progress events
 * @returns {Object} Capture session object
 */
function startPacketCapture(onProgress) {
  recoverStaleCaptureState();

  if (captureActive) {
    return { status: "error", message: "Capture already active" };
  }

  try {
    captureActive = true;
    livePackets = [];

    logEvent("PACKET_CAPTURE_STARTED", {
      timestamp: new Date().toISOString(),
      maxPackets: MAX_LIVE_PACKETS,
    });

    // Simulate packet capture by streaming dataset packets in real-time
    // In production, this would use tcpdump or raw socket libraries
    let packetIndex = 0;

    captureInterval = setInterval(() => {
      if (!captureActive) {
        clearInterval(captureInterval);
        return;
      }

      // Pick a random packet from dataset and rewrite with new timestamps
      const basePacket = packetDataset[packetIndex % packetDataset.length];
      const timestamp = new Date().toISOString();
      const srcIp = randomIpFromPool();
      const dstIp = randomDistinctDestination(srcIp);

      const livePacket = {
        id: `pkt_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
        src: srcIp,
        dst: dstIp,
        protocol: basePacket.protocol,
        length: basePacket.length + Math.floor(Math.random() * 500),
        info: basePacket.info,
        timestamp,
        suspicious: isSuspicious(basePacket),
      };

      // Add to circular buffer
      livePackets.push(livePacket);
      if (livePackets.length > MAX_LIVE_PACKETS) {
        livePackets.shift();
      }

      // Broadcast event
      onProgress("packet:captured", {
        packet: livePacket,
        totalCount: livePackets.length,
        isSuspicious: livePacket.suspicious,
      });

      // Log suspicious packets at HIGH severity
      if (livePacket.suspicious) {
        logEvent("SUSPICIOUS_PACKET_DETECTED", {
          packetId: livePacket.id,
          src: livePacket.src,
          dst: livePacket.dst,
          protocol: livePacket.protocol,
          info: livePacket.info,
          timestamp,
          severity: "HIGH",
        });
      }

      packetIndex++;
    }, 200); // Capture ~5 packets per second

    return {
      status: "started",
      captureId: `capture_${Date.now()}`,
      message: "Live packet capture active",
    };
  } catch (error) {
    captureActive = false;
    if (captureInterval) {
      clearInterval(captureInterval);
      captureInterval = null;
    }
    return { status: "error", message: "Failed to start capture" };
  }
}

/**
 * Stop packet capture
 * @returns {Object} Stop result
 */
function stopPacketCapture() {
  if (!captureActive) {
    return { status: "error", message: "No active capture" };
  }

  captureActive = false;
  if (captureInterval) {
    clearInterval(captureInterval);
    captureInterval = null;
  }

  const summary = {
    totalPackets: livePackets.length,
    suspiciousCount: livePackets.filter((p) => p.suspicious).length,
    protocols: Array.from(
      new Set(livePackets.map((p) => p.protocol))
    ),
  };

  logEvent("PACKET_CAPTURE_STOPPED", {
    timestamp: new Date().toISOString(),
    summary,
  });

  return {
    status: "stopped",
    message: "Packet capture completed",
    summary,
  };
}

/**
 * Get all live packets
 * @param {Object} filters - { protocol, search }
 * @returns {Array} Filtered packets
 */
function getLivePackets(filters = {}) {
  const { protocol = "all", search = "" } = filters;

  let results = [...livePackets];

  if (protocol && protocol.toUpperCase() !== "ALL") {
    results = results.filter((p) => p.protocol === protocol.toUpperCase());
  }

  if (search) {
    const searchLower = search.toLowerCase();
    results = results.filter((p) => {
      return `${p.src} ${p.dst} ${p.info}`.toLowerCase().includes(searchLower);
    });
  }

  return results;
}

/**
 * Clear live capture buffer
 */
function clearLivePackets() {
  livePackets = [];
  return { status: "cleared", message: "Live packet buffer cleared" };
}

/**
 * Get capture status
 * @returns {Object} Status object
 */
function getCaptureStatus() {
  return {
    active: captureActive,
    packetCount: livePackets.length,
    maxCapacity: MAX_LIVE_PACKETS,
    suspiciousCount: livePackets.filter((p) => p.suspicious).length,
  };
}

/**
 * Export live capture as JSON
 * @returns {Array} All captured packets
 */
function exportLiveCapture() {
  return {
    exportTime: new Date().toISOString(),
    totalPackets: livePackets.length,
    packets: [...livePackets],
  };
}

module.exports = {
  startPacketCapture,
  stopPacketCapture,
  getLivePackets,
  clearLivePackets,
  getCaptureStatus,
  exportLiveCapture,
};
