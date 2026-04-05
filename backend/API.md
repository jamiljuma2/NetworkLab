# NetworkLab API Documentation

Base URL: `http://localhost:4000`

## Health
- `GET /health`

## Auth
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/auth/users` (Admin)

## Dashboard
- `GET /api/dashboard/overview`

## Scans
- `GET /api/scans`
- `GET /api/scans/:scanId`
- `POST /api/scans/start`

Request body:
```json
{
  "target": "10.0.0.0/24",
  "scanType": "quick"
}
```

## Topology
- `GET /api/topology`

## Vulnerabilities
- `GET /api/vulnerabilities?severity=all&q=`

## Packet Analysis
- `GET /api/packets?protocol=all&q=`

## Labs
- `GET /api/labs`
- `GET /api/labs/:labId`

## Reports
- `GET /api/reports/executive`
- `GET /api/reports/export/json`
- `GET /api/reports/export/csv`

## Admin
- `GET /api/admin/logs`
- `GET /api/admin/scan-rules`
- `PUT /api/admin/scan-rules`
- `POST /api/admin/users`
- `PUT /api/admin/users/:id`
- `DELETE /api/admin/users/:id`

## Realtime Events (Socket.io)
- `system:hello`
- `scan:started`
- `scan:progress`
- `scan:completed`
