#!/bin/sh
set -e
echo "Running Prisma migrations..."
npx prisma migrate deploy
echo "Migrations done. Starting app..."
# Find main.js - could be dist/main.js or dist/src/main.js
if [ -f "dist/main.js" ]; then
  exec node dist/main
elif [ -f "dist/src/main.js" ]; then
  exec node dist/src/main
else
  echo "ERROR: Cannot find dist/main.js or dist/src/main.js"
  find dist -name "main.js" 2>/dev/null
  exit 1
fi
