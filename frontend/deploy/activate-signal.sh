#!/usr/bin/env bash
set -euo pipefail

# Run on the VPS as: sudo bash /home/tony/projects/safer-signal-frontend/activate-signal.sh
# This script owns only the Safer Signal static release and its dedicated Nginx site.

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this script with sudo." >&2
  exit 1
fi

SOURCE="/home/tony/projects/safer-signal-frontend/current"
DEPLOY_ROOT="/home/tony/projects/safer-signal-frontend"
WEB_ROOT="/var/www/safer-signal"
RELEASE_ID="$(date -u +%Y%m%d%H%M%S)"
RELEASE_DIR="${WEB_ROOT}/releases/${RELEASE_ID}"
NGINX_SOURCE="${DEPLOY_ROOT}/nginx/signal.saference.com.conf"
NGINX_AVAILABLE="/etc/nginx/sites-available/signal.saference.com"
NGINX_ENABLED="/etc/nginx/sites-enabled/signal.saference.com"

if [[ ! -f "${SOURCE}/index.html" ]]; then
  echo "Frontend release not found at ${SOURCE}." >&2
  exit 1
fi

mkdir -p "${RELEASE_DIR}"
cp -a "${SOURCE}/." "${RELEASE_DIR}/"
chown -R www-data:www-data "${WEB_ROOT}"
ln -sfn "${RELEASE_DIR}" "${WEB_ROOT}/current"

if [[ ! -f "${NGINX_SOURCE}" ]]; then
  echo "Nginx template not found at ${NGINX_SOURCE}." >&2
  exit 1
fi

install -m 0644 "${NGINX_SOURCE}" "${NGINX_AVAILABLE}"
ln -sfn "${NGINX_AVAILABLE}" "${NGINX_ENABLED}"
nginx -t
systemctl reload nginx

echo "Safer Signal frontend is active over HTTP at http://signal.saference.com/"
echo "Safer Signal frontend is active over HTTPS at https://signal.saference.com/"
echo "The API proxy targets 127.0.0.1:4002 and will become live when the backend is deployed."
