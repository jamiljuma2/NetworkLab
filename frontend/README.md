# Frontend - NetworkLab

Cyberpunk React client for the Network Vulnerability Assessment Lab.

## Commands
- `npm run dev` - start local dev server
- `npm run build` - create production bundle
- `npm run preview` - preview production build
- `npm test` - run frontend tests

## Environment
Create `.env` if needed:

```env
VITE_API_URL=http://localhost:4000
```

## Main Modules
- Dashboard (realtime metrics/charts)
- Scanner (quick/full scan simulation)
- Topology (D3 graph)
- Vulnerabilities (CVE/CVSS explorer)
- Packet Analysis (Wireshark-style table)
- Interactive Labs (5 security scenarios)
- Reporting (executive summary + export)
- Admin (users, logs, scan rules)
