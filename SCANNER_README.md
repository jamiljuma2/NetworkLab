# Real Network Scanner Documentation

## Overview

NetworkLab's production-grade Network Scanner integrates **real Nmap execution** with comprehensive security controls, audit logging, and role-based access management. The system is designed to safely scan both internal networks and authorized production systems while maintaining compliance with security protocols.

---

## Architecture

### Backend Components

#### 1. **nmapEngine.js** - Core Real-Time Scanning Engine
Handles live Nmap process execution with the following capabilities:

**Key Functions:**
- `startNmapScan()` - Initiates real Nmap process with validation & audit logging
- `stopScan()` - Gracefully terminates scan process
- `validateTarget()` - Comprehensive target validation & allowlist checking
- `buildNmapCommand()` - Constructs appropriate nmap command based on target type & scan mode

**Target Validation:**
- Private IPs: `10.x.x.x`, `192.168.x.x`, `172.16–31.x.x`, `127.x.x.x`
- Hostnames: Supports `*.local`, `*.internal`, `localhost`
- CIDR notation with bounds checking (prevents `/16` or larger public ranges)

**Safe Scan Modes:**
```
🔒 INTERNAL SCANS (Private IPs)
├─ Quick:  nmap -sn <target>  (host discovery only)
└─ Full:   nmap -sS -sV -O -T4 <target>  (aggressive, safe for internal)

🛡️ PRODUCTION SCANS (Public IPs - SafeMode Auto-Enabled)
├─ TCP Connect (not SYN): nmap -sT <target>
├─ Limited Scope: --top-ports 100
├─ Slower Timing: -T2 (avoids detection/DoS)
└─ No OS Detection: (disabled by default for production)
```

**Rate Limiting Per Role:**
- **Admin**: 10 scans/minute
- **Analyst**: 5 scans/minute  
- **Student**: 2 scans/minute

#### 2. **auditLogger.js** - Comprehensive Audit Trail
Persistent logging of all security-sensitive operations with disk persistence.

**Event Types:**
| Event | Severity | When |
|-------|----------|------|
| `SCAN_INITIATED` | MEDIUM/HIGH | User starts scan |
| `SCAN_COMPLETED` | MEDIUM | Scan finishes |
| `PRODUCTION_ACCESS_ATTEMPT` | HIGH | Public/prod target accessed |
| `AUTHORIZATION_FAILURE` | HIGH | Role violation attempts |
| `RATE_LIMIT_VIOLATION` | MEDIUM | User exceeds quota |
| `VALIDATION_FAILURE` | MEDIUM | Invalid input detected |
| `VULNERABILITY_DETECTED` | HIGH | Critical service found open |

**Log Persistence:**
```
logs/
└─ audit.log  (stream of JSON events, one per line)
```

Each event includes: timestamp, event type, user ID, target, action, severity level

#### 3. **scans.js Route Handler** - API Endpoints

**POST /api/scans/start**
```json
Request: {
  "target": "192.168.1.0/24",
  "scanType": "quick|full",
  "consent": false  // Required for production targets
}

Response (202 Accepted): {
  "id": "scan_abc123",
  "target": "192.168.1.0/24",
  "scanType": "quick",
  "status": "running",
  "progress": 0,
  "logs": [],
  "hosts": [],
  "isProduction": false,
  "scanMode": "quick"
}
```

**GET /api/scans**
- Students see only their own scans
- Analysts/Admins see all scans

**POST /api/scans/:scanId/stop**
- Gracefully stop a running scan
- Only creator or admin can stop

**GET /api/admin/audit-logs?eventType=SCAN_INITIATED&startDate=...&endDate=...**
- Filter audit logs by event type, user, date range
- Admin-only access

---

## Frontend Integration

### ScannerPage.jsx - Real-Time Scanner UI

**State Management:**
```javascript
- target: string (default: "192.168.1.0/24")
- scanType: "quick" | "full"
- scanning: boolean
- lines: string[]  (terminal output)
- progress: number (0-100)
- currentScan: { id }
- showConsentDialog: boolean (for production targets)
- hosts: Host[]
```

**WebSocket Events (Real-Time Updates):**
```javascript
// On scan start
socket.on("scan:started", (payload) => {
  // { scanId, target, scanType, isProduction, scanMode }
  setCurrentScan({ id: scanId });
  setScanning(true);
})

// Live output streaming
socket.on("scan:progress", (payload) => {
  // { scanId, latestLog, progress, hosts }
  setLines(prev => [...prev, latestLog]);
  setProgress(newProgress);
  setHosts(prev => updateHost(prev, hosts));
})

// Final results
socket.on("scan:completed", (payload) => {
  // { scanId, status, hosts, logs, progress }
  setScanning(false);
  setLines(finalLogs);
  setHosts(finalHosts);
})

// Error handling
socket.on("scan:error", (payload) => {
  // { scanId, error }
  setError(payload.error);
})
```

**Production Target Warning:**
```
User clicks "Start Scan" on public IP
↓
Frontend detects public-like target (regex check)
↓
Modal dialog appears: "By proceeding, confirm you own/have permission..."
↓
User confirms consent
↓
POST /api/scans/start with consent=true
↓
Backend logs consent in audit trail (HIGH severity)
↓
Scan proceeds with safe mode enforced
```

**Terminal Output Formatting:**
```
[+] open port found      (success/found)
[!] VULNERABLE service   (error/critical)
[~] Warning detected     (warning)
[*] scanoutput logs      (generic)
```

---

## Security Controls

### 1. Target Allowlisting

**Whitelist Rules:**
```
✅ Allowed:
├─ 127.x.x.x (localhost)
├─ 10.x.x.x (private Class A)
├─ 172.16–31.x.x (private Class B)
├─ 192.168.x.x (private Class C)
└─ *.local, *.internal domains

❌ Blocked:
├─ Public IP addresses (unless consent + safe mode)
├─ /16 and larger public ranges (too broad)
└─ Malformed IPs/CIDR
```

### 2. Consent & Authorization

**Production Targets Require:**
1. Explicit user consent via modal dialog
2. Confirmation message: "I own this system or have explicit permission"
3. Consent logged in audit trail with timestamp & consent flag
4. Safe mode enforcement (TCP connect, limited ports, slow timing)

**Role-Based Access:**
```
Student:
├─ Can scan: localhost, private IPs only
└─ Rate limit: 2 scans/minute

Analyst:
├─ Can scan: private IPs
└─ Rate limit: 5 scans/minute

Admin:
├─ Can scan: all (with production safe mode)
├─ Rate limit: 10 scans/minute
└─ Can view all audit logs & make reports
```

### 3. Rate Limiting

Per-user scan frequency tracking:
```javascript
const limitsPerMinute = {
  Admin: 10,
  Analyst: 5,
  Student: 2,
};

// Resets every 60 seconds
// Error if limit exceeded: "Rate limit exceeded. Try again at HH:MM:SS"
```

### 4. Command Injection Prevention

**Safe Process Execution:**
```javascript
// ✅ SAFE: Uses child_process.spawn (no shell)
const nmapProcess = spawn("nmap", nmapArgs.slice(1), {
  stdio: ["ignore", "pipe", "pipe"],
  timeout: 300000,
});

// ❌ NEVER: child_process.exec() - shell injection risk
// ❌ NEVER: string concatenation in commands
```

---

## Audit Logging System

### Log Storage

**In-Memory Index:**
`auditLogger.auditLogs` - circular buffer (max 5000 events)

**Persistent Storage:**
`backend/logs/audit.log` - newline-delimited JSON (NDJSON) format

### Querying Logs

**Frontend Admin Panel Example:**
```javascript
GET /api/admin/audit-logs
  ?eventType=SCAN_INITIATED
  &startDate=2026-04-01T00:00:00Z
  &endDate=2026-04-05T23:59:59Z
  &limit=100

Response: [
  {
    "id": "aud_xyz123",
    "timestamp": "2026-04-05T14:32:18Z",
    "eventType": "SCAN_INITIATED",
    "scanId": "scan_abc123",
    "userId": "usr_john",
    "userRole": "Admin",
    "target": "192.168.1.0/24",
    "scanType": "quick",
    "isProduction": false,
    "consentProvided": false,
    "severity": "MEDIUM"
  },
  ...
]
```

### Generating Reports

**Audit Report Generation:**
```javascript
POST /api/admin/audit-report
Body: {
  "startDate": "2026-04-01T00:00:00Z",
  "endDate": "2026-04-05T23:59:59Z"
}

Response: {
  "generatedAt": "2026-04-05T19:20:45Z",
  "period": { "start": "...", "end": "..." },
  "summary": {
    "totalEvents": 247,
    "byEventType": {
      "SCAN_INITIATED": 45,
      "SCAN_COMPLETED": 43,
      "PRODUCTION_ACCESS_ATTEMPT": 8,
      "AUTHORIZATION_FAILURE": 2
    },
    "byUserRole": {
      "Admin": 150,
      "Analyst": 75,
      "Student": 22
    },
    "highSeverityEvents": 10
  },
  "events": [...]
}
```

---

## Real-Time Data Flow

```
┌─────────────────┐
│  Frontend UI    │
│  ScannerPage    │
└────────┬────────┘
         │ POST /api/scans/start
         │ { target, scanType, consent }
         ↓
┌─────────────────────────────────────┐
│  Backend: scans.js Route            │
│  ├─ Validate target                 │
│  ├─ Check rate limits               │
│  ├─ Log audit event                 │
│  └─ Call startNmapScan()            │
└────────┬────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────┐
│  nmapEngine.js                      │
│  ├─ spawn("nmap", args)             │
│  ├─ stdout.on("data", callback)     │
│  └─ Parse Nmap greppable output     │
└────────┬────────────────────────────┘
         │
         │ Event: scan:started
         │         scan:progress (streaming)
         │         scan:completed
         │
         ↓
┌─────────────────────────────────────┐
│  sockets/index.js                   │
│  broadcast(event, payload)          │
└────────┬────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────┐
│  WebSocket Clients                  │
│  ├─ Receive real-time events        │
│  ├─ Update progress bar              │
│  ├─ Append output lines              │
│  └─ Display discovered hosts         │
└─────────────────────────────────────┘
```

---

## Output Parsing

Nmap's greppable format (`-oG -`) is parsed to extract:

**Host Status Lines:**
```
Host: 192.168.1.1 (router.local) Status: up
```

**Port Information:**
```
Host: 192.168.1.2 Ports: 22/open/tcp/ssh/, 80/open/tcp/http/, 443/open/tcp/https/
```

**OS Detection:**
```
Host: 192.168.1.3 OS details: Linux Kernel 5.10 - 5.18
```

**Parsed Data Structure:**
```javascript
{
  ip: "192.168.1.2",
  hostname: "router.local",
  os: "Linux Kernel...",
  ports: [
    { port: 22, state: "open", service: "ssh" },
    { port: 80, state: "open", service: "http" }
  ],
  vulnerable: false
}
```

---

## Error Handling

**Frontend User Feedback:**
- Input validation errors (invalid IP/CIDR)
- Rate limit exceeded with reset time
- Production target consent required
- Nmap execution failures
- Network/connection errors

**Backend Logging:**
- All errors logged with event type & reason
- Failed scans logged as "VALIDATION_FAILURE"
- Authorization failures logged as "AUTHORIZATION_FAILURE"

---

## Example Workflow

### Scanning a Private Network (Student Role)

1. **User navigates to Scanner page**
   - Input: `192.168.1.0/24`
   - Scan Type: `quick`
   - Click "Start Scan"

2. **Frontend validation**
   - Detects private IP
   - No consent dialog shown
   - POST /api/scans/start with consent=false

3. **Backend processing**
   - Rate limit check: ✅ (1st scan, < 2/min limit)
   - Target validation: ✅ (private IP)
   - Build command: `nmap -sn 192.168.1.0/24`
   - Log audit: `SCAN_INITIATED (MEDIUM severity)`
   - Launch process

4. **Real-time updates**
   - Nmap stdout streams output line-by-line
   - Each line formatted with prefix: `[+] 192.168.1.1 is up`
   - Host info parsed & extracted
   - WebSocket events broadcast to frontend
   - Progress bar updates (0 → 95 → 100%)

5. **Scan completion**
   - `scan:completed` event with final host list
   - Terminal output display freezes (preserved)
   - Host cards populate with IP/ports/OS
   - Entry added to history

6. **Audit trail**
   - `SCAN_COMPLETED` event logged with duration & results

---

### Scanning a Production Target (Admin Role)

1. **User inputs public IP**
   - Input: `203.0.113.50` (example public IP)
   - Click "Start Scan"

2. **Frontend detects public target**
   - Regex check fails private IP match
   - Console dialog appears:
     ```
     ⚠️ Production Target Warning
     This target is PUBLIC. Confirm ownership/permission:
     [Cancel] [I Confirm]
     ```

3. **Admin confirms consent**
   - Consent flag set to `true`
   - POST /api/scans/start with consent=true

4. **Backend processing**
   - Validation detects public IP
   - Checks consent flag: ✅
   - Build SAFE command:
     ```
     nmap -sT --top-ports 100 -T2 203.0.113.50
     ```
   - Log audit:
     ```
     SCAN_INITIATED (HIGH severity)
     consentProvided: true
     scanMode: "safe"
     
     PRODUCTION_ACCESS_ATTEMPT
     allowed: true
     reason: "Explicit consent provided"
     ```
   - Launch process with safe profile

5. **Results & audit**
   - Scan proceeds with TCP connect (stealthy) and limited ports
   - Slower timing avoids detection/triggering WAF
   - Admin sees results + confirmation in audit logs that consent was recorded

---

## Best Practices

### For Admins
1. **Review audit logs regularly** - Check for unauthorized access attempts
2. **Verify consent documentation** - Ensure production scans have explicit approval paper trail
3. **Monitor rate limits** - Check for abuse patterns (e.g., rapid repeated scans)
4. **Export reports** - Generate periodic audit reports for compliance

### For Users
1. **Enter specific targets** - Avoid large CIDR ranges; use `/24` max for breadth
2. **Use appropriate scan types**:
   - `quick` for network discovery
   - `full` for detailed port/OS enumeration (slower)
3. **Review scan results** - Identify vulnerable hosts and remediate
4. **Respect rate limits** - Plan scans ahead if nearing quota

### For Security Teams
1. **Store audit logs externally** - Export to SIEM/Splunk for long-term retention
2. **Alert on high-severity events** - Production access attempts, authorization failures
3. **Validate consent** - Confirm documented permission exists for production scans
4. **Analyze port trends** - Track changes in open/vulnerable ports over time

---

## Troubleshooting

### "Nmap not found" Error
**Cause:** Nmap binary not installed on server  
**Solution:** 
```bash
# Linux/Mac
sudo apt install nmap  # Debian/Ubuntu
brew install nmap      # macOS

# Windows (with WSL2)
wsl --install ubuntu
wsl apt install nmap
```

### Scan Hangs/Never Completes
**Cause:** Process hung, likely firewall blocking  
**Solution:** Click "Stop Scan" button to gracefully terminate within 2 seconds, then SIGKILL

### "Rate limit exceeded" on First Scan
**Cause:** User role quota misconfigured or another user's scans counted  
**Solution:** Check `scanFrequencyMap` in nmapEngine.js; each user tracked independently

### Audit Logs Not Persisting
**Cause:** `backend/logs/` directory doesn't exist or no write permissions  
**Solution:** 
```bash
mkdir -p backend/logs
chmod 755 backend/logs
```

---

## Performance Notes

- **Nmap timeout:** 5 minutes (300,000ms) per scan
- **Output buffer:** Max 5,000 audit log events in memory
- **WebSocket message limit:** 120 events per client (circular buffer)
- **Rate limit window:** 60 seconds (rolling)

---

## Future Enhancements

- [ ] Scheduled/recurring scans with cron expressions
- [ ] Custom scan profiles (user-defined port lists, scripts)
- [ ] Export results (CSV, JSON, Nessus format)
- [ ] Scan comparison (before/after snapshots)
- [ ] Integration with Slack/Teams for notifications
- [ ] DNS/reverse DNS resolution for hostname discovery
- [ ] Geolocation mapping of discovered hosts
- [ ] Machine learning for anomaly detection (unusual port patterns)

---

## License & Support

This module is part of NetworkLab cybersecurity training platform.  
For issues or feature requests, contact the security team.
