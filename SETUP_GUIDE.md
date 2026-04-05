# Real Network Scanner - Setup & Deployment Guide

## Prerequisites

### System Requirements
- **OS**: Linux, macOS, or Windows (WSL2)
- **Node.js**: v18+
- **npm**: v8+
- **Nmap**: Latest version
- **Disk Space**: 500MB+ for logs and scan data

### Install Nmap

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install nmap
```

**CentOS/RHEL:**
```bash
sudo yum install nmap
```

**macOS:**
```bash
brew install nmap
```

**Windows (via WSL2):**
```bash
wsl --install ubuntu
wsl apt install nmap
```

**Verify installation:**
```bash
nmap -V
```

**Windows note:** if Nmap is installed but not on PATH, set `NMAP_PATH` in `backend/.env` to the full path of `nmap.exe`, for example `C:\Program Files\Nmap\nmap.exe`.

---

## Installation

### 1. Clone/Setup Repository

```bash
cd c:\NetworkLab
```

### 2. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd ../frontend
npm install
```

### 3. Create Logs Directory

```bash
# Backend logs for audit trail
mkdir -p backend/logs
chmod 755 backend/logs
```

### 4. Configure Environment

**Backend `.env` file** (if using environment variables):
```bash
# backend/.env
PORT=4000
NODE_ENV=development
ADMIN_EMAIL=jumajamil314@gmail.com
ADMIN_PASSWORD=Jamil2003
ADMIN_NAME="Hacker Jamil"
```

---

## Running the System

### Development Mode

**Terminal 1 - Backend:**
```bash
cd c:\NetworkLab\backend
npm start
```

Expected output:
```
Backend listening on http://localhost:4000
Default admin: jumajamil314@gmail.com / Jamil2003
```

**Terminal 2 - Frontend:**
```bash
cd c:\NetworkLab\frontend
npm run dev
```

Expected output:
```
VITE v8.0.3 ready in 245 ms
➜ Local:   http://localhost:5173/
```

### Production Build

**Frontend:**
```bash
cd frontend
npm run build
```

Generated files in `frontend/dist/`

**Backend:**
```bash
cd backend
npm run build
```

(Backend doesn't require build for Node.js)

---

## Testing the Scanner

### Test Case 1: Quick Localhost Scan

1. **Login**
   - Email: `jumajamil314@gmail.com`
   - Password: `Jamil2003`
   - Role: Admin

2. **Navigate to Scanner page**

3. **Enter target:** `localhost` or `127.0.0.1`

4. **Select:** `Quick scan`

5. **Click:** "Start Scan"

**Expected behavior:**
- ✅ Scan starts immediately (no consent dialog for localhost)
- ✅ Real Nmap command: `nmap -sn localhost`
- ✅ Terminal output streams in real-time
- ✅ Progress bar updates 0 → 100%
- ✅ Hosts discovered and displayed

---

### Test Case 2: Private Network Scan (Student Role)

1. **Create test user:**
   - Go to Admin Panel → Users
   - Create: email `student@test.com`, password `Test123`, role `Student`

2. **Login with student account**

3. **Navigate to Scanner page**

4. **Enter target:** `192.168.1.0/24`

5. **Select:** `Full scan`

6. **Click:** "Start Scan"

**Expected behavior:**
- ✅ Scan permitted (private IP)
- ✅ No consent dialog
- ✅ Nmap command: `nmap -sS -sV -O -T4 192.168.1.0/24`
- ✅ Rate limit enforced (2 scans/minute for Student role)

---

### Test Case 3: Production Target (Admin with Consent)

1. **Login as Admin**

2. **Navigate to Scanner page**

3. **Enter target:** `8.8.8.8` (public IP - example)

4. **Select:** `Quick scan`

5. **Click:** "Start Scan"

**Expected behavior:**
- ⚠️ Production target warning dialog appears
- ⚠️ Shows: "This target is PUBLIC. Confirm ownership/permission"
- ✅ Admin clicks "I Confirm"
- ✅ Consent recorded in audit logs (HIGH severity)
- ✅ Scan proceeds with SAFE mode:
  - Command: `nmap -sT --top-ports 100 -T2 8.8.8.8`
  - TCP connect (stealthy, not SYN)
  - Limited to top 100 ports
  - Slower timing (-T2) to avoid detection

---

### Test Case 4: Rate Limiting

1. **Login as Student**

2. **Start Scan 1:** `192.168.1.1`

3. **Start Scan 2:** `192.168.1.2` (< 1 second later)

4. **Attempt Scan 3:** `192.168.1.3`

**Expected behavior:**
- ✅ Scans 1 & 2 succeed
- ❌ Scan 3 rejected: "Rate limit exceeded (2/Student). Try again at HH:MM:SS+60sec"

---

### Test Case 5: Audit Log Review

1. **Login as Admin**

2. **Navigate to Audit Logs page** (📋 icon in sidebar)

3. **View all events with filters:**
   - Event Type: `SCAN_INITIATED`
   - Date Range: Today

**Expected data:**
```
[+] SCAN_INITIATED (MEDIUM severity)
    User: student@test.com
    Role: Student
    Target: 192.168.1.0/24
    Consent Provided: No
    Timestamp: 2026-04-05 14:32:18

[+] SCAN_INITIATED (HIGH severity)
    User: jumajamil314@gmail.com
    Role: Admin
    Target: 8.8.8.8
    Consent Provided: Yes
    Timestamp: 2026-04-05 14:35:42
```

---

## Troubleshooting

### "Nmap: command not found"

**Cause:** Nmap not installed or not in PATH  
**Solution:** 
```bash
# Check if installed
which nmap
nmap -V

# Install if missing
sudo apt install nmap  # Linux
brew install nmap      # macOS
```

### "Cannot spawn nmap process"

**Cause:** Permission issue or process limit  
**Solution:**
```bash
# Check process limits
ulimit -n  # Should be > 1024

# Increase if needed (macOS/Linux)
ulimit -n 4096

# Check file permissions
ls -la /usr/bin/nmap  # Should be executable
```

### "WebSocket connection failed"

**Cause:** Frontend can't reach backend  
**Solution:**
1. Verify backend running on port 4000
2. Check CORS configuration in `backend/src/config/env.js`
3. Frontend should connect to `VITE_API_URL` (default: `http://localhost:4000`)

### "Scan hangs indefinitely"

**Cause:** Nmap blocked by firewall or unresponsive target  
**Solution:**
1. Click "Stop Scan" button (graceful SIGTERM)
2. Process killed with SIGKILL after 2 seconds
3. Check firewall rules (especially for network scans)

### "Audit logs not persisting"

**Cause:** `backend/logs/` directory missing or no write permissions  
**Solution:**
```bash
mkdir -p backend/logs
chmod 755 backend/logs
chmod 666 backend/logs/audit.log
```

---

## Configuration

### Scan Rules (Admin Panel)

**GET /api/admin/scan-rules**
```json
{
  "quickPorts": [22, 80, 443, 445, 3389],
  "fullPortRange": "1-1024",
  "enableTopology": true,
  "enablePacketSim": true
}
```

**PUT /api/admin/scan-rules**
```bash
curl -X PUT http://localhost:4000/api/admin/scan-rules \
  -H "Content-Type: application/json" \
  -d '{
    "quickPorts": [22, 80, 443],
    "fullPortRange": "1-65535"
  }'
```

---

## API Reference

### Start Scan

**Endpoint:** `POST /api/scans/start`

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "target": "192.168.1.0/24",
  "scanType": "quick",
  "consent": false
}
```

**Response (202 Accepted):**
```json
{
  "id": "scan_abc123",
  "target": "192.168.1.0/24",
  "scanType": "quick",
  "userId": "usr_xyz789",
  "status": "running",
  "progress": 0,
  "logs": [],
  "hosts": [],
  "startedAt": "2026-04-05T14:32:18.000Z",
  "completedAt": null,
  "isProduction": false,
  "scanMode": "quick",
  "consentProvided": false
}
```

**Error Responses:**

```json
// Invalid target
{ "message": "Invalid target format: '...' Expected CIDR or single IP" }

// Rate limited
{ "message": "Rate limit exceeded (5/Analyst). Try again at 14:35:18" }

// Production target without consent
{ "message": "Production target requires explicit consent..." }
```

---

### Get Scans

**Endpoint:** `GET /api/scans`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
[
  {
    "id": "scan_abc123",
    "target": "192.168.1.0/24",
    "scanType": "quick",
    "userId": "usr_xyz789",
    "status": "completed",
    "progress": 100,
    "logs": ["[*] Starting Nmap...", "[+] 192.168.1.1 is up"],
    "hosts": [
      {
        "ip": "192.168.1.1",
        "hostname": "router.local",
        "os": "Linux",
        "ports": [
          { "port": 22, "state": "open", "service": "ssh" }
        ],
        "vulnerable": false
      }
    ],
    "startedAt": "2026-04-05T14:32:18.000Z",
    "completedAt": "2026-04-05T14:35:42.000Z"
  }
]
```

---

### Stop Scan

**Endpoint:** `POST /api/scans/:scanId/stop`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "message": "Scan stopped",
  "scanId": "scan_abc123"
}
```

---

### Get Audit Logs

**Endpoint:** `GET /api/admin/audit-logs`

**Query Parameters:**
- `eventType`: `SCAN_INITIATED`, `SCAN_COMPLETED`, `PRODUCTION_ACCESS_ATTEMPT`, etc.
- `startDate`: ISO 8601 timestamp (e.g., `2026-04-01T00:00:00Z`)
- `endDate`: ISO 8601 timestamp
- `limit`: Max results (default 100, max 1000)

**Example:**
```bash
GET /api/admin/audit-logs?eventType=SCAN_INITIATED&startDate=2026-04-01T00:00:00Z&limit=50
```

**Response:**
```json
[
  {
    "id": "aud_xyz123",
    "timestamp": "2026-04-05T14:32:18.000Z",
    "eventType": "SCAN_INITIATED",
    "scanId": "scan_abc123",
    "userId": "usr_xyz789",
    "userRole": "Admin",
    "target": "192.168.1.0/24",
    "scanType": "quick",
    "isProduction": false,
    "consentProvided": false,
    "severity": "MEDIUM"
  }
]
```

---

## Security Best Practices

### For Operations Teams

1. **Run behind a reverse proxy** (nginx/Apache)
   ```nginx
   server {
     listen 443 ssl http2;
     server_name scanner.company.internal;
     
     location / {
       proxy_pass http://localhost:5173;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection "upgrade";
     }
   
     location /api {
       proxy_pass http://localhost:4000;
     }
   }
   ```

2. **Enable HTTPS only** (no HTTP in production)

3. **Restrict network access** to corporate VPN/internal networks

4. **Monitor audit logs** for production scans
   ```bash
   # Alert on high-severity events
   grep "severity.*HIGH" backend/logs/audit.log | wc -l
   ```

5. **Export logs daily** for archival
   ```bash
   tar czf audit_logs_$(date +%Y%m%d).tar.gz backend/logs/
   ```

---

### For Users

1. **Don't scan unauthorized targets** - You will be liable
2. **Keep passwords secure** - Change default admin password immediately
3. **Review your scans** - Check results for unexpected findings
4. **Respect rate limits** - Plan scans ahead if near quota

---

## Performance Tuning

### For Large Networks

**Single Scan Settings:**
- Max CIDR: `/24` networks (254 hosts) recommended
- For larger scans, break into smaller CIDRs:
  ```
  192.168.0.0/16 →
    192.168.1.0/24
    192.168.2.0/24
    ... (256 scans)
  ```

### Concurrent Scans

- Default: 1 scan per user simultaneously
- Admin nmap process timeout: 5 minutes
- If multiple scans needed, use sequential approach (respect rate limits)

### Memory Usage

- In-memory audit log buffer: ~5MB (5000 events)
- Per scan WebSocket buffer: ~1MB (120 events)
- Disk persistence: ~100KB per 100 scans (NDJSON format)

---

## Deployment Checklist

- [ ] Nmap installed and in system PATH
- [ ] Node.js v18+ installed
- [ ] Backend dependencies installed (`npm install`)
- [ ] Frontend dependencies installed (`npm install`)
- [ ] `backend/logs/` directory created with write permissions
- [ ] Default admin user created (check server startup logs)
- [ ] Frontend connects to correct backend URL
- [ ] SSL/TLS certificates installed (production)
- [ ] Firewall rules allow port 4000 (backend) internally only
- [ ] Firewall rules allow port 5173 (frontend) or reverse proxy port
- [ ] Database backups enabled (if using persistent storage)
- [ ] Audit logs exported to external storage
- [ ] Rate limiting tested
- [ ] Consent dialog tested for production targets
- [ ] Admin can access audit logs page

---

## Support & Troubleshooting

For issues:
1. Check backend logs: `tail -f backend/logs/audit.log`
2. Check browser console (F12 → Console tab)
3. Verify Nmap: `nmap -sn 127.0.0.1`
4. Test API endpoint: `curl http://localhost:4000/health`
5. Review WebSocket: Check DevTools → Network → WS tab

---

## License

NetworkLab Real Network Scanner - Part of NetworkLab cybersecurity training platform.
