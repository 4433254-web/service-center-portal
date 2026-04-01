#!/bin/bash
# /home/leto/service-center/restart.sh
# Скрипт обновления и перезапуска service-center

set -e
cd /home/leto/service-center

echo "[$(date)] Pulling latest code..."
git pull origin main

echo "[$(date)] Rebuilding containers..."
docker compose build --no-cache

echo "[$(date)] Restarting..."
docker compose up -d

echo "[$(date)] Health check..."
sleep 10
curl -sf http://localhost:$(docker inspect sc-backend --format='{{(index (index .NetworkSettings.Ports "3001/tcp") 0).HostPort}}' 2>/dev/null || echo 3001)/api/health || true

echo "[$(date)] Done!"
docker compose ps
