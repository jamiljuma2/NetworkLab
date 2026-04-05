const { spawn, spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { env } = require("../config/env");
const { inMemory, generateId } = require("./store");
const { addActivity } = require("./store");

/**
 * Real Nmap scan engine with safe production modes
 * Handles real process spawning, output streaming, and result parsing
 */

const activeScanProcesses = new Map();

function isUsableNmapExecutable(candidate) {
  if (!candidate) return false;

  const normalizedCandidate = candidate.trim();
  if (!normalizedCandidate) return false;

  if (path.isAbsolute(normalizedCandidate) || normalizedCandidate.includes(path.sep)) {
    if (!fs.existsSync(normalizedCandidate)) return false;
  }

  const probe = spawnSync(normalizedCandidate, ["-V"], {
    windowsHide: true,
    stdio: "ignore",
    timeout: 5000,
  });

  return !probe.error && probe.status === 0;
}

function resolveNmapExecutable() {
  const configuredPath = env.nmapPath;
  const candidates = [];

  if (configuredPath) {
    candidates.push(configuredPath);
  }

  candidates.push("nmap");

  if (process.platform === "win32") {
    candidates.push(
      "C:\\Program Files\\Nmap\\nmap.exe",
      "C:\\Program Files (x86)\\Nmap\\nmap.exe",
      "C:\\Nmap\\nmap.exe"
    );
  }

  for (const candidate of candidates) {
    if (isUsableNmapExecutable(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    "Nmap executable not found. Install Nmap or set NMAP_PATH to the full path of nmap.exe (for example, C:\\Program Files\\Nmap\\nmap.exe)."
  );
}

// ===== IP VALIDATION & ALLOWLISTING =====

function isPrivateIPv4(ip) {
  const parts = String(ip).split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) return false;

  const [a, b, c] = parts;

  // 127.x.x.x (localhost)
  if (a === 127) return true;
  // 10.x.x.x
  if (a === 10) return true;
  // 172.16-31.x.x
  if (a === 172 && b >= 16 && b <= 31) return true;
  // 192.168.x.x
  if (a === 192 && b === 168) return true;
  // 169.254.x.x (link-local)
  if (a === 169 && b === 254) return true;

  return false;
}

function isLocalhost(ip) {
  return ip === "localhost" || ip === "127.0.0.1" || ip === "::1";
}

function isDnsAllowlisted(hostname) {
  // Allow *.local and *.internal domains
  const allowedSuffixes = [".local", ".internal", ".localhost", ".dev"];
  return allowedSuffixes.some((suffix) => hostname.toLowerCase().endsWith(suffix));
}

function validateTarget(target) {
  const trimmed = String(target).trim();

  // Single IP
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(trimmed)) {
    const parts = trimmed.split(".").map(Number);
    if (parts.every((p) => p >= 0 && p <= 255)) {
      const isPrivate = isPrivateIPv4(trimmed);
      return {
        valid: true,
        normalized: trimmed,
        type: "ipv4",
        isPrivate,
        reasonIfPublic: isPrivate ? null : "Target is a public IP - safe mode enforced",
      };
    }
    throw new Error("Invalid IPv4 address");
  }

  // CIDR notation
  const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
  if (cidrRegex.test(trimmed)) {
    const [ip, prefix] = trimmed.split("/");
    const prefixNum = Number(prefix);

    // Validate IP
    const parts = ip.split(".").map(Number);
    if (!parts.every((p) => p >= 0 && p <= 255)) {
      throw new Error("Invalid IPv4 address in CIDR");
    }

    // Validate prefix
    if (prefixNum < 0 || prefixNum > 32) {
      throw new Error("CIDR prefix must be 0-32");
    }

    // Block large public ranges
    if (prefixNum < 16) {
      throw new Error("Cannot scan /16 or larger public ranges (too broad)");
    }

    const isPrivate = isPrivateIPv4(ip);
    return {
      valid: true,
      normalized: trimmed,
      type: "cidr",
      prefixLength: prefixNum,
      isPrivate,
      reasonIfPublic: isPrivate ? null : "Target is a public CIDR - safe mode enforced",
    };
  }

  // Hostname/domain
  if (/^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?([\\.][a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?)*$/.test(trimmed)) {
    const isAllowlisted = isDnsAllowlisted(trimmed);
    if (!isAllowlisted && !isLocalhost(trimmed)) {
      return {
        valid: true,
        normalized: trimmed,
        type: "hostname",
        isPrivate: false,
        reasonIfPublic: "Target is a public domain - safe mode enforced",
      };
    }
    return {
      valid: true,
      normalized: trimmed,
      type: "hostname",
      isPrivate: isAllowlisted || isLocalhost(trimmed),
    };
  }

  throw new Error(`Invalid target format: "${trimmed}". Use IPv4, CIDR, or hostname`);
}

// ===== SCAN COMMAND BUILDING =====

function buildNmapCommand(target, scanType, isProduction = false) {
  const baseCmd = [resolveNmapExecutable()];

  if (isProduction) {
    // Safe mode for production targets
    baseCmd.push("-sT"); // TCP connect scan (not SYN)
    baseCmd.push("--top-ports", "100"); // Limit scope
    baseCmd.push("-T2"); // Slower timing template to avoid detection
    baseCmd.push("-v"); // Verbose
    // Do NOT add -O (OS detection) or -A (aggressive) for public targets by default
  } else {
    // Internal network scans can be more aggressive
    if (scanType === "quick") {
      baseCmd.push("-sn"); // Host discovery only
    } else if (scanType === "full") {
      baseCmd.push("-sS"); // SYN scan
      baseCmd.push("-sV"); // Service detection
      baseCmd.push("-O"); // OS detection (safe for internal)
      baseCmd.push("-T4"); // Faster timing for internal networks
    }
  }

  // Always add output format for parsing
  baseCmd.push("-oG", "-"); // Greppable output to stdout
  baseCmd.push(target);

  return baseCmd;
}

// ===== OUTPUT PARSING =====

function parseNmapOutput(line) {
  // Nmap greppable format parsing
  if (line.startsWith("#")) return null; // Comments

  // Parse host status line: Host: <ip> (<hostname>) Status: <status> Ignored State: <state>
  const hostMatch = line.match(/^Host: ([\d.]+)\s+\(([^)]*)\)\s+Status: (\w+)/);
  if (hostMatch) {
    return {
      type: "host_status",
      ip: hostMatch[1],
      hostname: hostMatch[2] || null,
      status: hostMatch[3],
    };
  }

  // Parse port line: Host: <ip> Ports: <port>/open/tcp/service/, ...
  const portMatch = line.match(/Host: ([\d.]+)\s+Ports: (.+)/);
  if (portMatch) {
    const ip = portMatch[1];
    const portsStr = portMatch[2];
    const ports = [];

    // Parse individual ports: "22/open/tcp/ssh/, 80/open/tcp/http/"
    const portRegex = /(\d+)\/(\w+)\/tcp\/([^/]+)/g;
    let match;
    while ((match = portRegex.exec(portsStr)) !== null) {
      ports.push({
        port: Number(match[1]),
        state: match[2],
        service: match[3],
      });
    }

    return {
      type: "host_ports",
      ip,
      ports,
    };
  }

  // Parse OS line: Host: <ip> OS details: <os>
  const osMatch = line.match(/Host: ([\d.]+)\s+OS details: (.+)/);
  if (osMatch) {
    return {
      type: "host_os",
      ip: osMatch[1],
      osDetails: osMatch[2],
    };
  }

  // If no specific match, return as generic output
  return {
    type: "output",
    raw: line,
  };
}

function determinePrefixForLine(line) {
  if (line.includes("open") || line.includes("found")) return "[+]";
  if (line.includes("VULNERABLE") || line.includes("ERROR")) return "[!]";
  if (line.includes("Warning") || line.includes("potential")) return "[~]";
  return "[*]";
}

// ===== SCAN STATE MANAGEMENT =====

function createScanRecord(scanId, target, scanType, userId, validationResult) {
  return {
    id: scanId,
    target,
    scanType,
    userId,
    status: "running",
    progress: 0,
    logs: [],
    hosts: [],
    startedAt: new Date().toISOString(),
    completedAt: null,
    isProduction: !validationResult.isPrivate,
    scanMode: !validationResult.isPrivate ? "safe" : scanType,
    consentProvided: false,
  };
}

// ===== RATE LIMITING =====

const scanFrequencyMap = new Map(); // userId -> { lastScan: timestamp, count: number }

function checkScanFrequency(userId, role) {
  const now = Date.now();
  const record = scanFrequencyMap.get(userId) || { lastScan: 0, count: 0 };

  // Admin: 10 scans/minute
  // Analyst: 5 scans/minute
  // Student: 2 scans/minute
  const limitsPerMinute = {
    Admin: 10,
    Analyst: 5,
    Student: 2,
  };

  const limit = limitsPerMinute[role] || 2;
  const windowMs = 60 * 1000;

  if (now - record.lastScan > windowMs) {
    // Reset counter after window expires
    scanFrequencyMap.set(userId, { lastScan: now, count: 1 });
    return { allowed: true };
  }

  if (record.count >= limit) {
    const resetTime = new Date(record.lastScan + windowMs);
    return {
      allowed: false,
      message: `Rate limit exceeded (${limit}/${role}). Try again at ${resetTime.toLocaleTimeString()}`,
    };
  }

  // Increment count
  record.count += 1;
  scanFrequencyMap.set(userId, record);
  return { allowed: true };
}

// ===== MAIN SCAN ENGINE =====

function startNmapScan({ target, scanType, userId, role, consent = false }, onProgress) {
  const scanId = generateId("scan");

  try {
    // 1. Validate target
    const validation = validateTarget(target);
    if (!validation.valid) {
      throw new Error("Invalid target");
    }

    // 2. Check rate limiting
    const rateCheck = checkScanFrequency(userId, role);
    if (!rateCheck.allowed) {
      throw new Error(rateCheck.message);
    }

    // 3. Check production target consent
    if (!validation.isPrivate && !consent) {
      throw new Error(
        "Production target requires explicit consent. Please confirm you own/have permission to scan this system."
      );
    }

    // 4. Build nmap command
    const isProduction = !validation.isPrivate;
    const nmapArgs = buildNmapCommand(validation.normalized, scanType, isProduction);

    // 5. Create scan record
    const scan = createScanRecord(scanId, validation.normalized, scanType, userId, validation);
    inMemory.scans.unshift(scan);

    // 6. Log audit event
    const auditMsg = `${role} initiated scan on ${validation.normalized} (${scanType}${isProduction ? " - SAFE MODE" : ""})`;
    addActivity("scan", auditMsg, userId);

    // 7. Emit started event
    onProgress("scan:started", {
      scanId,
      target: validation.normalized,
      scanType,
      isProduction,
      scanMode: isProduction ? "safe" : scanType,
    });

    let outputBuffer = "";
    let progressSimulation = 0;

    // 8. Spawn Nmap process
    const nmapProcess = spawn(nmapArgs[0], nmapArgs.slice(1), {
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 300000, // 5 minutes max
    });

    activeScanProcesses.set(scanId, nmapProcess);

    // Handle stdout
    nmapProcess.stdout.on("data", (data) => {
      const chunk = String(data);
      outputBuffer += chunk;

      // Process complete lines
      const lines = outputBuffer.split("\n");
      outputBuffer = lines.pop(); // Keep incomplete line

      lines.forEach((line) => {
        if (line.trim()) {
          const parsed = parseNmapOutput(line);

          // Format output line
          const prefix = determinePrefixForLine(line);
          const formattedLine = `${prefix} ${line.slice(0, 120)}`; // Truncate for display

          scan.logs.push(formattedLine);

          // Emit progress event
          onProgress("scan:progress", {
            scanId,
            latestLog: formattedLine,
            progress: Math.min(95, (progressSimulation += 8)),
            host: null, // We'll enhance this with parsed host data
          });

          // Extract host info if available
          if (parsed.type === "host_status") {
            const existingHost = scan.hosts.find((h) => h.ip === parsed.ip);
            if (!existingHost) {
              scan.hosts.push({
                id: generateId("host"),
                ip: parsed.ip,
                hostname: parsed.hostname,
                os: null,
                ports: [],
                vulnerable: false,
              });
            }
          } else if (parsed.type === "host_ports") {
            let host = scan.hosts.find((h) => h.ip === parsed.ip);
            if (!host) {
              host = {
                id: generateId("host"),
                ip: parsed.ip,
                hostname: null,
                os: null,
                ports: [],
                vulnerable: false,
              };
              scan.hosts.push(host);
            }
            host.ports = parsed.ports;
            // Check for vulnerable ports
            host.vulnerable = parsed.ports.some((p) => [445, 3389, 8080].includes(p.port));
          } else if (parsed.type === "host_os") {
            const host = scan.hosts.find((h) => h.ip === parsed.ip);
            if (host) {
              host.os = parsed.osDetails;
            }
          }
        }
      });
    });

    // Handle stderr
    nmapProcess.stderr.on("data", (data) => {
      const line = String(data).trim();
      if (line) {
        const formattedLine = "[!] " + line.slice(0, 120);
        scan.logs.push(formattedLine);
        onProgress("scan:progress", {
          scanId,
          latestLog: formattedLine,
          progress: progressSimulation,
        });
      }
    });

    // Handle process end
    nmapProcess.on("close", (code) => {
      activeScanProcesses.delete(scanId);

      // Process final buffer
      if (outputBuffer.trim()) {
        outputBuffer.split("\n").forEach((line) => {
          if (line.trim()) {
            const prefix = determinePrefixForLine(line);
            scan.logs.push(`${prefix} ${line.slice(0, 120)}`);
          }
        });
      }

      scan.status = code === 0 ? "completed" : "failed";
      scan.progress = 100;
      scan.completedAt = new Date().toISOString();

      const summary = `Scan completed: ${scan.hosts.length} hosts discovered, ${scan.logs.length} log entries`;
      scan.logs.push(`[+] ${summary}`);

      onProgress("scan:completed", {
        scanId,
        status: scan.status,
        hosts: scan.hosts,
        logs: scan.logs,
        progress: 100,
      });

      addActivity("scan", `Scan completed on ${scan.target}: ${summary}`, userId);
    });

    // Handle errors
    nmapProcess.on("error", (err) => {
      activeScanProcesses.delete(scanId);
      scan.status = "failed";
      scan.completedAt = new Date().toISOString();

      const errorMsg = `[!] Scan failed: ${err.message}`;
      scan.logs.push(errorMsg);

      onProgress("scan:error", {
        scanId,
        error: err.message,
      });

      addActivity("scan", `Scan failed on ${scan.target}: ${err.message}`, userId);
    });

    return scan;
  } catch (err) {
    // Validation/authorization error - don't create process
    addActivity("scan", `Scan rejected: ${err.message}`, userId);
    throw err;
  }
}

function stopScan(scanId) {
  const process = activeScanProcesses.get(scanId);
  if (!process) return false;

  try {
    // Kill process tree (nmap + child processes)
    const pid = process.pid;
    if (process.kill("SIGTERM")) {
      // Set timeout to SIGKILL if SIGTERM doesn't work
      setTimeout(() => {
        if (!activeScanProcesses.has(scanId)) return;
        process.kill("SIGKILL");
      }, 2000);
      return true;
    }
    return false;
  } catch (err) {
    console.error(`Error stopping scan ${scanId}:`, err);
    return false;
  }
}

function getScanById(scanId) {
  return inMemory.scans.find((s) => s.id === scanId);
}

function getScansByUser(userId) {
  return inMemory.scans.filter((s) => s.userId === userId);
}

module.exports = {
  startNmapScan,
  stopScan,
  getScanById,
  getScansByUser,
  validateTarget,
};
