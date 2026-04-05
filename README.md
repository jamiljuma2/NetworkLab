# Network Vulnerability Assessment Lab

A full-stack cyber range platform with simulated scanning, vulnerability analysis, packet inspection, topology visualization, interactive exploit labs, and reporting.

## Stack
- Frontend: React + Vite + TailwindCSS + Framer Motion + Recharts + D3.js
- Backend: Node.js + Express + Socket.io + JWT + RBAC
- Database: PostgreSQL schema and seeds in `database/`
- Optional orchestration: Docker Compose in `docker/`

## Core Features
- JWT login/signup with role-based access (`Admin`, `Analyst`, `Student`)
- Real-time scan simulation and progress events
- Dashboard with severity charts and activity feed
- Force-directed network topology visualization
- Real CVE dataset with CVSS scoring + remediation guidance
- Packet analysis table with suspicious traffic highlighting
- 5 interactive lab scenarios
- Executive reporting + JSON/CSV export
- Admin panel for users, logs, and scan rules

## Local Setup
1. Backend:
   - `cd backend`
   - `cp .env.example .env`
   - `npm install`
   - `npm run dev`
2. Frontend:
   - `cd frontend`
   - `npm install`
   - `npm run dev`
3. Open `http://localhost:5173`

Default admin account:
- Email: `admin@networklab.local`
- Password: `Admin123!Secure`

## Docker Setup
From `docker/`:
- `docker compose up --build`

## Testing
- Backend: `cd backend && npm test`
- Frontend: `cd frontend && npm test`

## API Docs
See `backend/API.md`.
