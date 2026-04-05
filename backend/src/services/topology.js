function pickScan(scans, { scanId, target } = {}) {
  if (!Array.isArray(scans) || scans.length === 0) return null;

  if (scanId) {
    const byId = scans.find((s) => s.id === scanId);
    if (byId) return byId;
  }

  if (target) {
    const byTarget = scans.find((s) => String(s.target) === String(target));
    if (byTarget) return byTarget;
  }

  return scans[0];
}

function buildTopology(scans, options = {}) {
  const selectedScan = pickScan(scans, options);
  if (!selectedScan) {
    return { nodes: [], links: [] };
  }

  const scannerNode = { id: "scanner", label: "Scanner", type: "scanner", vulnerable: false };
  const hosts = Array.isArray(selectedScan.hosts) ? selectedScan.hosts : [];
  const nodes = [scannerNode, ...hosts.map((h) => ({ id: h.id, label: h.ip, type: "host", vulnerable: h.vulnerable }))];
  const links = hosts.map((h) => ({ source: "scanner", target: h.id, weight: h.ports.length || 1 }));

  return {
    nodes,
    links,
    scanId: selectedScan.id,
    target: selectedScan.target,
    availableScans: scans.slice(0, 25).map((s) => ({
      id: s.id,
      target: s.target,
      createdAt: s.createdAt,
      status: s.status,
      hosts: Array.isArray(s.hosts) ? s.hosts.length : 0,
    })),
  };
}

module.exports = { buildTopology };
