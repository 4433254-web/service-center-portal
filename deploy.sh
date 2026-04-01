#!/bin/bash
# Деплой-скрипт для service-center на сервер 192.168.31.166
SERVER="leto@192.168.31.166"
REMOTE_DIR="/home/leto/service-center"

echo "=== Копирую backend ==="
rsync -avz --exclude='node_modules' --exclude='dist' --exclude='uploads' --exclude='.env' \
  /c/Projects/service-center-portal/backend/ $SERVER:$REMOTE_DIR/backend/

echo "=== Копирую frontend ==="
rsync -avz --exclude='node_modules' --exclude='.next' --exclude='.env.local' \
  /c/Projects/service-center-portal/frontend/ $SERVER:$REMOTE_DIR/frontend/

echo "=== Готово ==="
