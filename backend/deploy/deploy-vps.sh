#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/home/tony/projects/safer-signal-backend"
cd "${APP_DIR}"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required." >&2
  exit 1
fi

if [[ ! -f .env ]]; then
  umask 077
  mysql_root_password="$(openssl rand -hex 32)"
  mysql_password="$(openssl rand -hex 32)"
  jwt_access_secret="$(openssl rand -hex 48)"
  jwt_refresh_secret="$(openssl rand -hex 48)"
  otp_pepper="$(openssl rand -hex 32)"
  api_key_pepper="$(openssl rand -hex 32)"

  printf '%s\n' \
    'NODE_ENV=production' \
    'PORT=4000' \
    'API_HOST_PORT=4002' \
    "MYSQL_ROOT_PASSWORD=${mysql_root_password}" \
    'MYSQL_DATABASE=safer_unified' \
    'MYSQL_USER=safer' \
    "MYSQL_PASSWORD=${mysql_password}" \
    "DATABASE_URL=mysql://safer:${mysql_password}@mysql:3306/safer_unified" \
    "JWT_ACCESS_SECRET=${jwt_access_secret}" \
    "JWT_REFRESH_SECRET=${jwt_refresh_secret}" \
    'ACCESS_TOKEN_TTL=15m' \
    'REFRESH_TOKEN_TTL_DAYS=30' \
    'CORS_ORIGINS=https://signal.saference.com' \
    'OTP_TTL_MINUTES=10' \
    "OTP_PEPPER=${otp_pepper}" \
    "API_KEY_PEPPER=${api_key_pepper}" \
    'LOG_LEVEL=info' > .env
  chmod 600 .env
  echo "Created production secrets in ${APP_DIR}/.env"
fi

docker compose -p safer-signal up -d --build

for attempt in $(seq 1 30); do
  if curl -fsS http://127.0.0.1:4002/health >/dev/null 2>&1; then
    echo "Safer Signal backend is healthy on 127.0.0.1:4002"
    exit 0
  fi
  sleep 2
done

echo "Backend did not become healthy. Recent logs:" >&2
docker compose -p safer-signal logs --tail=100 api >&2
exit 1
