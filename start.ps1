# =============================================================
# Сервисный центр — скрипт запуска (Windows PowerShell)
# Использование: правый клик -> "Запустить с PowerShell"
# или: powershell -ExecutionPolicy Bypass -File start.ps1
# =============================================================

$env:NODE_ENV = "development"
$root = $PSScriptRoot

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Сервисный Центр — Запуск системы" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Запуск бэкенда
Write-Host "`n[1/2] Запуск бэкенда (порт 3001)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
  "`$env:NODE_ENV='development'; Set-Location '$root\backend'; npm run start:dev" `
  -WindowStyle Normal

Start-Sleep -Seconds 3

# Запуск фронтенда
Write-Host "[2/2] Запуск фронтенда (порт 3000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
  "Set-Location '$root\frontend'; npm run dev" `
  -WindowStyle Normal

Start-Sleep -Seconds 5

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  Система запущена!" -ForegroundColor Green
Write-Host "  Фронтенд: http://localhost:3000" -ForegroundColor White
Write-Host "  Бэкенд:   http://localhost:3001/api/health" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Green
Write-Host "`nТестовые учётные записи:" -ForegroundColor Gray
Write-Host "  admin / admin123" -ForegroundColor Gray
Write-Host "  receiver1 / receiver123" -ForegroundColor Gray
Write-Host "  master1 / master123" -ForegroundColor Gray
Write-Host "  manager1 / manager123" -ForegroundColor Gray
