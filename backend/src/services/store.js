const { cveDataset } = require("../data/cves");
const { packetDataset } = require("../data/packets");
const { labs } = require("../data/labs");

const now = () => new Date().toISOString();

const inMemory = {
  users: [],
  scans: [],
  labExecutions: [],
  activities: [],
  scanRules: {
    quickPorts: [22, 80, 443, 445, 3389],
    fullPortRange: "1-1024",
    enableTopology: true,
    enablePacketSim: true,
  },
  cves: cveDataset,
  packets: packetDataset,
  labs,
};

function generateId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function addActivity(type, message, actor = "system") {
  const event = { id: generateId("act"), type, message, actor, createdAt: now() };
  inMemory.activities.unshift(event);
  inMemory.activities = inMemory.activities.slice(0, 300);
  return event;
}

function seedAdmin({ name, email, passwordHash }) {
  const normalizedEmail = String(email).toLowerCase();
  if (!inMemory.users.find((u) => u.email === normalizedEmail)) {
    inMemory.users.push({
      id: generateId("usr"),
      name,
      email: normalizedEmail,
      passwordHash,
      role: "Admin",
      createdAt: now(),
    });
  }
}

module.exports = {
  inMemory,
  generateId,
  addActivity,
  seedAdmin,
};
