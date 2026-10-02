# Safer Signal network monitor

A React + Vite public bank-network monitor with a separate authenticated business operations console.

Public monitoring includes:

- Landing page at `/` with the live network snapshot
- Public bank directory at `/monitoring` with search and status filters
- Public per-bank uptime reports at `/monitoring/banks/:bankId`
- Availability, uptime signal, trust score, latency, source, and recent check history

The authenticated business console at `/business/monitoring` includes:

- OTP-authenticated business operator access
- Network overview with healthy, degraded, down, and unknown states
- Bank inventory with search, status filters, trust scores, latency, and last-check timestamps
- Per-bank event history and audit trail
- Manual, synthetic, customer, and bank-integration check reporting
- Server-side monitoring API credentials and key rotation

The consumer unified-number experience, public account lookup, linked-account management, payment routing, and authorizations are not part of this frontend.

## Run locally

```bash
npm install
npm run dev
```

The web app defaults to `http://localhost:5173`. It expects the Express API at `http://localhost:4000/api/v1`, configurable with `VITE_API_URL`.

The active backend is `/Users/mac/Desktop/unified-backend`. Start it separately with its own environment and database configuration.

## Monitoring API surface

The console uses:

- `GET /business/banks/status` for the live dashboard snapshot
- `GET /banks/status` for public bank status snapshots
- `GET /banks` for the report form inventory
- `GET /banks/:bankId` and `GET /banks/:bankId/events` for bank details and history
- `POST /business/banks/report` to submit telemetry
- `GET /business/credentials` and `POST /business/credentials/rotate` for integration keys

The frontend refreshes the network snapshot every 15 seconds. Trust scores are calculated by the backend from recent reported checks; the frontend presents the result and does not claim to connect directly to bank networks.
