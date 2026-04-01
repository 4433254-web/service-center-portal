@echo off
chcp 65001 >nul
title Сервисный Центр — Запуск
echo.
echo ========================================
echo   Сервисный Центр — Запуск системы
echo ========================================
echo.

set NODE_ENV=development
set ROOT=%~dp0

echo [1/2] Запуск бэкенда (порт 3001)...
start "Backend :3001" cmd /k "set NODE_ENV=development && cd /d %ROOT%backend && npm run start:dev"

timeout /t 4 /nobreak >nul

echo [2/2] Запуск фронтенда (порт 3000)...
start "Frontend :3000" cmd /k "cd /d %ROOT%frontend && npm run dev"

timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo   Система запущена!
echo   Фронтенд: http://localhost:3000
echo   Бэкенд:   http://localhost:3001
echo ========================================
echo.
echo Нажмите любую клавишу для закрытия...
pause >nul
