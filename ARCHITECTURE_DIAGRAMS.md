# Real Network Scanner - Architecture Diagrams

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         NetworkLab Platform                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                   Firefox/Chrome Browser                     │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │  ScannerPage.jsx                                       │ │  │
│  │  │  ┌──────────────────────────────────────────┐          │ │  │
│  │  │  │ Target: 192.168.1.0/24                  │          │ │  │
│  │  │  │ Scan Type: [Quick][Full]                │          │ │  │
│  │  │  │ [Start Scan]                            │          │ │  │
│  │  │  └──────────────────────────────────────────┘          │ │  │
│  │  │                                                         │ │  │
│  │  │  ┌──────────────────────────────────────────┐          │ │  │
│  │  │  │ TerminalOutput Panel                     │          │ │  │
│  │  │  │ ┌──────────────────────────────────────┐ │          │ │  │
│  │  │  │ │ [*] Starting Nmap...                 │ │          │ │  │
│  │  │  │ │ [+] Host 192.168.1.1 is up           │ │  (Real-  │ │  │
│  │  │  │ │ [*] Ports: 22/ssh, 80/http          │ │  time)   │ │  │
│  │  │  │ │ [+] Scan complete: 45 hosts found    │ │          │ │  │
│  │  │  │ └──────────────────────────────────────┘ │          │ │  │
│  │  │  └──────────────────────────────────────────┘          │ │  │
│  │  │                                                         │ │  │
│  │  │  Discovered Hosts (Real Data):                         │ │  │
│  │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐                   │ │  │
│  │  │  │192.168  │ │192.168  │ │192.168  │                   │ │  │
│  │  │  │.1.1     │ │.1.2     │ │.1.3     │                   │ │  │
│  │  │  │SSH/HTTP │ │   HTTP  │ │  RDP    │                   │ │  │
│  │  │  └─────────┘ └─────────┘ └─────────┘                   │ │  │
│  │  │                                                         │ │  │
│  │  │  AuditLogsPage.jsx (Admin Only):                       │ │  │
│  │  │  ┌──────────────────────────────────────┐              │ │  │
│  │  │  │ Event Type: [SCAN_INITIATED]         │              │ │  │
│  │  │  │ Date: [Today]                        │              │ │  │
│  │  │  │ ┌────────────────────────────────────┐              │ │  │
│  │  │  │ │ SCAN_INITIATED | MEDIUM | 14:32   │              │ │  │
│  │  │  │ │ User: student@test.com             │              │ │  │
│  │  │  │ │ Target: 192.168.1.0/24             │              │ │  │
│  │  │  │ │ Consent: No                        │              │ │  │
│  │  │  │ └────────────────────────────────────┘              │ │  │
│  │  │  └──────────────────────────────────────┘              │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  │                                                              │  │
│  │  WebSocket Connection                                      │  │
│  │  (socket.io)                                               │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                          ↑        ↓ (EventSocket)                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Express.js Backend Server (localhost:4000)                 │  │
│  │                                                              │  │
│  │  ┌────────────────────────────────────────────────────┐   │  │
│  │  │ sockets/index.js                                  │   │  │
│  │  │ broadcast(event, payload)                         │   │  │
│  │  │   ├─ scan:started                                 │   │  │
│  │  │   ├─ scan:progress (streaming, real-time)        │   │  │
│  │  │   ├─ scan:completed                               │   │  │
│  │  │   └─ scan:error                                   │   │  │
│  │  └────────────────────────────────────────────────────┘   │  │
│  │                                                              │  │
│  │  ┌────────────────────────────────────────────────────┐   │  │
│  │  │ routes/scans.js (API Endpoints)                   │   │  │
│  │  │ ├─ POST /api/scans/start                          │   │  │
│  │  │ │   (validateTarget → checkRateLimit →            │   │  │
│  │  │ │    logAudit → startNmapScan)                    │   │  │
│  │  │ ├─ GET /api/scans                                 │   │  │
│  │  │ └─ POST /api/scans/:scanId/stop                   │   │  │
│  │  └────────────────────────────────────────────────────┘   │  │
│  │                                                              │  │
│  │  ┌────────────────────────────────────────────────────┐   │  │
│  │  │ services/nmapEngine.js (Real Scanner)             │   │  │
│  │  │ ├─ validateTarget(target)                         │   │  │
│  │  │ │   • IPv4 format check                           │   │  │
│  │  │ │   • CIDR bounds (no /16+ public)                │   │  │
│  │  │ │   • Allowlist check (10.x, 192.168.x, etc)      │   │  │
│  │  │ ├─ checkRateLimit(userId, role)                   │   │  │
│  │  │ │   • Admin: 10/min, Analyst: 5/min, Student: 2/min   │  │
│  │  │ ├─ startNmapScan()                                │   │  │
│  │  │ │   • spawn("nmap", args)                         │   │  │
│  │  │ │   • buildNmapCommand(target, scanType, isProd)  │   │  │
│  │  │ │     - Private IP: nmap -sn / -sS -sV -O -T4     │   │  │
│  │  │ │     - Public IP:  nmap -sT --top-ports 100 -T2  │   │  │
│  │  │ │   • stdout.on("data", parse & format)           │   │  │
│  │  │ │   • parseNmapOutput() → extract hosts/ports/OS  │   │  │
│  │  │ │   • emit scan:progress events                   │   │  │
│  │  │ └─ stopScan(scanId)                               │   │  │
│  │  │     • process.kill("SIGTERM") → SIGKILL           │   │  │
│  │  └────────────────────────────────────────────────────┘   │  │
│  │                                                              │  │
│  │  ┌────────────────────────────────────────────────────┐   │  │
│  │  │ services/auditLogger.js (Audit Trail)             │   │  │
│  │  │ ├─ logEvent(eventType, details)                   │   │  │
│  │  │ ├─ SCAN_INITIATED                                 │   │  │
│  │  │ ├─ PRODUCTION_ACCESS_ATTEMPT                      │   │  │
│  │  │ ├─ AUTHORIZATION_FAILURE                          │   │  │
│  │  │ ├─ RATE_LIMIT_VIOLATION                           │   │  │
│  │  │ └─ getAuditLogs(filters) → query database         │   │  │
│  │  │                                                    │   │  │
│  │  │ Storage:                                          │   │  │
│  │  │ /backend/logs/audit.log (NDJSON: persistent)     │   │  │
│  │  │ auditLogs[] (5000 max: in-memory buffer)          │   │  │
│  │  └────────────────────────────────────────────────────┘   │  │
│  │                                                              │  │
│  │  ┌────────────────────────────────────────────────────┐   │  │
│  │  │ routes/admin.js (Admin APIs)                      │   │  │
│  │  │ ├─ GET /api/admin/audit-logs?eventType=...        │   │  │
│  │  │ │   (query by event type, date, limit)            │   │  │
│  │  │ └─ POST /api/admin/audit-report                   │   │  │
│  │  │     (generate compliance report)                  │   │  │
│  │  └────────────────────────────────────────────────────┘   │  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                          ↓ (spawn process)                          │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Nmap (Real Binary Execution)                               │  │
│  │                                                              │  │
│  │  $ nmap -sn -oG - 192.168.1.0/24                           │  │
│  │  $ nmap -sS -sV -O -T4 -oG - 192.168.1.0/24              │  │
│  │  $ nmap -sT --top-ports 100 -T2 -oG - 203.0.113.50        │  │
│  │                                                              │  │
│  │  stdout (greppable format):                                 │  │
│  │  Host: 192.168.1.1 (router.local) Status: up               │  │
│  │  Host: 192.168.1.1 Ports: 22/open/tcp/ssh/, 80/...        │  │
│  │                                                              │  │
│  │  stderr (errors/warnings):                                  │  │
│  │  Warning: No targets were specified                         │  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Request/Response Flow

```
┌─────────────────┐
│  User Action    │
│  "Start Scan"   │
└────────┬────────┘
         │
         ↓
┌─────────────────────────────────────────────────────┐
│ ScannerPage.jsx                                     │
│ ├─ Detect target type (regex check)                │
│ ├─ If public IP: showConsentDialog()               │
│ │   • User clicks "I Confirm"                      │
│ │   • setConsentGiven(true)                        │
│ └─ POST /api/scans/start                           │
│    { target, scanType, consent }                   │
└────────┬────────────────────────────────────────────┘
         │
         ↓ POST /api/scans/start
┌─────────────────────────────────────────────────────┐
│ scans.js Route Handler                              │
│                                                     │
│ 1. validate(target, scanType) → validateTarget()   │
│    ├─ Check format (IP/CIDR/hostname)              │
│    ├─ Check allowlist (10.x, 192.168.x, etc)      │
│    └─ Return { valid, normalized, isProduction }   │
│                                                     │
│ 2. Rate Limit Check → checkScanFrequency()          │
│    ├─ Get role from req.user                       │
│    ├─ Get limit: Admin=10, Analyst=5, Student=2    │
│    ├─ Get count: scans in last 60 seconds          │
│    └─ If count >= limit: reject with reset time    │
│                                                     │
│ 3. Log Audit Event                                  │
│    ├─ logScanInitiated({                           │
│    │   scanId, userId, target, scanType,           │
│    │   isProduction, consentProvided               │
│    │ })                                            │
│    └─ Written to: auditLogs[] + audit.log          │
│                                                     │
│ 4. Call startNmapScan()                            │
│    └─ return scan object (202 Accepted)            │
└────────┬────────────────────────────────────────────┘
         │ 202 Accepted
         │ { id: "scan_abc123", status: "running", ... }
         ↓
┌─────────────────────────────────────────────────────┐
│ Frontend receives scan object                       │
│ setCurrentScan(data)                                │
│ setScanning(true)                                   │
│ setLines(["[*] Scan started..."])                   │
└────────┬────────────────────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────────────────────┐
│ nmapEngine.js                                       │
│                                                     │
│ 1. Build Nmap command                              │
│    ├─ If private + quick:  nmap -sn                │
│    ├─ If private + full:   nmap -sS -sV -O -T4     │
│    └─ If production:       nmap -sT --top-ports 100 -T2
│                                                     │
│ 2. Spawn process                                    │
│    └─ const proc = spawn("nmap", args)             │
│                                                     │
│ 3. Stream stdout line-by-line                      │
│    ├─ proc.stdout.on("data", (data) => {          │
│    │   ├─ outputBuffer += data                     │
│    │   ├─ Split by "\n"                            │
│    │   ├─ Process complete lines                   │
│    │   ├─ parseNmapOutput(line)                    │
│    │   ├─ Format output: "[+] ...", "[!] ..."      │
│    │   └─ onProgress("scan:progress", {            │
│    │       latestLog, progress, hosts              │
│    │     })                                        │
│    │ })                                            │
│    └─ broadcast via WebSocket                      │
│                                                     │
│ 4. Handle process completion                       │
│    └─ proc.on("close", (code) => {                │
│        ├─ Finalize logs                           │
│        ├─ Set status: "completed"                 │
│        └─ onProgress("scan:completed", {          │
│            hosts, logs, status                    │
│          })                                        │
│      })                                            │
└────────┬────────────────────────────────────────────┘
         │
         ↓ WebSocket broadcast
┌─────────────────────────────────────────────────────┐
│ sockets/index.js                                    │
│                                                     │
│ ├─ emit("scan:started", ...)                       │
│ ├─ emit("scan:progress", ...)  [streaming]         │
│ └─ emit("scan:completed", ...)                     │
└────────┬────────────────────────────────────────────┘
         │
         ↓ Socket.io WebSocket
┌─────────────────────────────────────────────────────┐
│ Browser WebSocket Client                            │
│ socket.on("scan:progress", (payload) => {           │
│   setLines(prev => [...prev, payload.latestLog])   │
│   setProgress(payload.progress)                    │
│   setHosts(prev => updateHosts(prev, payload))    │
│ })                                                  │
│                                                     │
│ socket.on("scan:completed", (payload) => {         │
│   setLines(payload.logs)                           │
│   setHosts(payload.hosts)                          │
│   setProgress(100)                                 │
│   setScanning(false)                               │
│ })                                                  │
└────────┬────────────────────────────────────────────┘
         │
         ↓ React render
┌─────────────────────────────────────────────────────┐
│ ScannerPage.jsx UI Updates (Real-Time)             │
│                                                     │
│ ✅ Terminal output appended (stagger animation)     │
│ ✅ Progress bar updates                            │
│ ✅ Host cards populated with data                  │
│ ✅ Scan history updated                            │
└─────────────────────────────────────────────────────┘
```

---

## Security Validation Flow

```
┌────────────────────────────────┐
│  User submits target            │
│  "203.0.113.50" (public IP)     │
└────────┬───────────────────────┘
         │
         ↓ Client-side detection
┌────────────────────────────────────────────┐
│ Frontend regex check                        │
│ !/^(localhost|127\.|10\.|172\.16-31\.|...) │
│ Match: NO (public IP detected)              │
└────────┬───────────────────────────────────┘
         │
         ↓ Show consent dialog
┌────────────────────────────────────────────┐
│ Modal Dialog                               │
│                                           │
│ ⚠️ PRODUCTION TARGET WARNING              │
│                                           │
│ This target is PUBLIC.                    │
│ You must have explicit permission.        │
│                                           │
│ ☑️ I own this system or have explicit     │
│    written permission to scan it.         │
│                                           │
│ [Cancel]        [I Confirm]               │
└────────┬───────────────────────────────────┘
         │ (User clicks "I Confirm")
         ↓ POST with consent=true
┌────────────────────────────────────────────┐
│ Backend Validation                         │
│                                           │
│ 1. validateTarget("203.0.113.50")         │
│    ├─ isPrivateIPv4() → FALSE             │
│    ├─ isAllowlisted()  → FALSE            │
│    └─ Result: { valid: true,              │
│               normalized: "203.0.113.50", │
│               isProduction: true }        │
│                                           │
│ 2. Check consent flag                     │
│    ├─ consent === true? YES ✅            │
│    └─ Continue (would reject if false)    │
│                                           │
│ 3. Auto-enforce SAFE MODE                │
│    ├─ isProduction = true                 │
│    └─ Command: nmap -sT --top-ports 100   │
│        -T2 203.0.113.50                   │
│                                           │
│ 4. Log Audit Events                       │
│    ├─ SCAN_INITIATED (HIGH severity)     │
│    │  └─ consentProvided: true            │
│    │     isProduction: true               │
│    │     scanMode: "safe"                 │
│    │                                      │
│    └─ PRODUCTION_ACCESS_ATTEMPT (HIGH)   │
│       └─ allowed: true                    │
│          reason: "Explicit consent"       │
│                                           │
│ 5. Launch Nmap (safe mode enforced)      │
│    ├─ spawn("nmap", [                     │
│        "-sT",                             │
│        "--top-ports", "100",              │
│        "-T2",                             │
│        "203.0.113.50"                     │
│      ])                                    │
│    └─ TCP Connect: stealthy, not SYN      │
│       Limited: top 100 ports only         │
│       Timing: -T2 slow (avoid detection) │
│                                           │
└────────┬───────────────────────────────────┘
         │
         ↓ Scan completes with audit trail
┌────────────────────────────────────────────┐
│ Audit Log Entry                            │
│                                           │
│ {                                         │
│   "eventType": "SCAN_COMPLETED",         │
│   "userId": "usr_admin",                 │
│   "target": "203.0.113.50",              │
│   "scanMode": "safe",                    │
│   "consentProvided": true,               │
│   "timestamp": "2026-04-05T14:35:42Z",   │
│   "hostsFound": 2,                       │
│   "duration": "3.5 seconds",             │
│ }                                        │
│                                           │
│ Persisted to:                            │
│ /backend/logs/audit.log (NDJSON)        │
│                                           │
└────────────────────────────────────────────┘
```

---

## Concurrent Scan Management

```
User 1 (Student): 192.168.1.0/24
User 2 (Analyst):  10.0.0.0/24
User 3 (Admin):    8.8.8.8 (production)

Master Rate Limit Map:
{
  "usr_student": {
    lastScan: 1680000000,
    count: 1,      // 1/2 quota
  },
  "usr_analyst": {
    lastScan: 1680000000,
    count: 2,      // 2/5 quota
  },
  "usr_admin": {
    lastScan: 1680000000,
    count: 1,      // 1/10 quota
  }
}

Active Scan Processes:
{
  "scan_user1": Process {pid: 2345},
  "scan_user2": Process {pid: 2346},
  "scan_user3": Process {pid: 2347}  (safe mode enforced)
}

All scans run independently:
- Student scan: quick host discovery
- Analyst scan:   full port scan
- Admin scan:     safe mode (TCP connect, -T2)

Each emits progress independently:
socket.emit("scan:progress", {scanId: "scan_user1", ...})
socket.emit("scan:progress", {scanId: "scan_user2", ...})
socket.emit("scan:progress", {scanId: "scan_user3", ...})

Frontends receive and filter by current scan ID:
ScannerPage.jsx: socket.on("scan:progress", (e) => {
  if (e.payload.scanId === currentScan.id) {
    // Update this specific scan's progress
  }
})
```

---

## Audit Log Query Usage

```
┌──────────────────────────────────┐
│ Admin navigates to Audit Logs    │
└────────┬───────────────────────┘
         │
         ↓ Apply filters
┌──────────────────────────────────────────────────────────────┐
│ AuditLogsPage.jsx                                            │
│                                                              │
│ Filters:                                                     │
│ ├─ eventType: PRODUCTION_ACCESS_ATTEMPT                      │
│ ├─ startDate: 2026-04-01                                     │
│ ├─ endDate:   2026-04-05                                     │
│ └─ limit: 100                                                │
└────────┬────────────────────────────────────────────────────┘
         │ GET /api/admin/audit-logs?eventType=PRODUCTION_ACCESS_ATTEMPT&startDate=2026-04-01...
         ↓
┌──────────────────────────────────────────────────────────────┐
│ routes/admin.js                                              │
│                                                              │
│ router.get("/audit-logs", (req, res) => {                   │
│   const { eventType, userId, startDate, endDate, limit } =  │
│     req.query;                                               │
│                                                              │
│   const logs = getAuditLogs({                               │
│     eventType: "PRODUCTION_ACCESS_ATTEMPT",                  │
│     startDate: "2026-04-01T00:00:00Z",                       │
│     endDate: "2026-04-05T23:59:59Z",                         │
│     limit: 100                                               │
│   });                                                        │
│                                                              │
│   return res.json(logs);                                     │
│ })                                                           │
└────────┬────────────────────────────────────────────────────┘
         │
         ↓ Query auditLogger
┌──────────────────────────────────────────────────────────────┐
│ services/auditLogger.js                                      │
│                                                              │
│ function getAuditLogs({eventType, startDate, endDate, ...}){│
│   let results = [...auditLogs];  // In-memory buffer        │
│                                                              │
│   if (eventType) {                                           │
│     results = results.filter(log =>                          │
│       log.eventType === "PRODUCTION_ACCESS_ATTEMPT"          │
│     )                                                        │
│   }                                                          │
│                                                              │
│   if (startDate) {                                           │
│     const start = new Date(startDate);                       │
│     results = results.filter(log =>                          │
│       new Date(log.timestamp) >= start                       │
│     )                                                        │
│   }                                                          │
│                                                              │
│   if (endDate) {                                             │
│     const end = new Date(endDate);                           │
│     results = results.filter(log =>                          │
│       new Date(log.timestamp) <= end                         │
│     )                                                        │
│   }                                                          │
│                                                              │
│   return results.slice(0, limit);  // Max 100               │
│ }                                                            │
└────────┬────────────────────────────────────────────────────┘
         │
         ↓ Return filtered results
┌────────────────────────────────────────────────────────────────┐
│ Response JSON Array                                            │
│                                                               │
│ [                                                             │
│   {                                                           │
│     "id": "aud_xyz123",                                       │
│     "timestamp": "2026-04-05T14:35:42Z",                      │
│     "eventType": "PRODUCTION_ACCESS_ATTEMPT",                │
│     "userId": "usr_admin",                                    │
│     "userRole": "Admin",                                      │
│     "target": "8.8.8.8",                                      │
│     "action": "INITIATE_PRODUCTION_SCAN",                    │
│     "allowed": true,                                          │
│     "reason": "Explicit consent provided",                   │
│     "severity": "HIGH"                                        │
│   },                                                          │
│   ...                                                         │
│ ]                                                             │
└────────┬────────────────────────────────────────────────────┘
         │
         ↓ Frontend renders
┌────────────────────────────────────────────────────────────────┐
│ AuditLogsPage displays                                         │
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐  │
│ │ PRODUCTION_ACCESS_ATTEMPT | HIGH | 14:35               │  │
│ │ User: admin@test.com (Admin)                           │  │
│ │ Target: 8.8.8.8                                        │  │
│ │ Allowed: ✅ Yes                                        │  │
│ │ Reason: "Explicit consent provided"                    │  │
│ │ Timestamp: 2026-04-05 14:35:42                         │  │
│ │                                                        │  │
│ │ [Admin can click for details, export, archive]         │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                               │
└────────────────────────────────────────────────────────────────┘

Results are queryable for:
- Compliance audits
- User activity tracking
- Security incident investigation
- Scan history analysis
- Consent documentation
```

---

## Implementation Complete ✓

All diagrams show:
- ✅ Real Nmap execution flow
- ✅ Safety controls at every step
- ✅ Rate limiting enforcement
- ✅ Audit logging pipeline
- ✅ Real-time WebSocket streaming
- ✅ Consent workflow
- ✅ Admin query capabilities
- ✅ Concurrent scan management

**The system is production-ready and fully documented!**
