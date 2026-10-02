# Safer Signal

Safer Signal is a bank-network monitoring platform. It provides a public view of bank availability and trust signals, an authenticated business console, and a server-to-server API for reading bank status and submitting verified transaction outcomes.

## Repository layout

- `frontend/` - React + Vite public monitor and business dashboard.
- `backend/` - Express + Prisma monitoring API, MySQL schema, migrations, tests, and Docker deployment files.
- `SAFER_UNIFIED_PRD.md` - product requirements and operating model.

## Local development

### Backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma generate
npm run db:migrate:dev
npm run start
```

The API listens on the port configured in `backend/.env` and exposes the versioned API under `/api/v1`.

### Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Set `VITE_API_URL` in `frontend/.env.local` to the backend API URL used by the local environment.

## Production

The backend includes `Dockerfile`, `docker-compose.yml`, Prisma migrations, and a deployment helper under `backend/deploy/`. The frontend is a static Vite build and includes deployment configuration under `frontend/deploy/`.

Never commit `.env` files, API keys, database credentials, OTP peppers, JWT secrets, mail credentials, or Cloudflare credentials. Use the example environment files as configuration templates.
