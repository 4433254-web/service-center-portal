# Сервисный Центр — Веб-портал управления ремонтами

## Быстрый запуск

```bash
# Двойной клик или через CMD:
start.bat

# Или через PowerShell:
powershell -ExecutionPolicy Bypass -File start.ps1
```

Или запустить раздельно:

```powershell
# Терминал 1 — бэкенд
$env:NODE_ENV = "development"
cd backend
npm run start:dev

# Терминал 2 — фронтенд
cd frontend
npm run dev
```

## Адреса

| Сервис | URL |
|--------|-----|
| Фронтенд | http://localhost:3000 |
| Бэкенд API | http://localhost:3001/api |
| Health | http://localhost:3001/api/health |

## Тестовые учётные записи

| Логин | Пароль | Роль |
|-------|--------|------|
| admin | admin123 | Администратор |
| receiver1 | receiver123 | Приёмщик |
| master1 | master123 | Мастер |
| manager1 | manager123 | Руководитель |

## QR-коды заказов

- В карточке заказа — блок «📱 QR-код заказа» в правой колонке
- В списке заказов — иконка QR рядом с каждым заказом
- В квитанции — QR-код в правом верхнем углу

**Для production** укажите в `backend/.env`:
```
APP_URL=https://ваш-домен.ru
```

## Стек

- **Frontend**: Next.js 14 + Tailwind CSS + react-qr-code
- **Backend**: NestJS + Prisma + PostgreSQL
- **Инфра**: Docker Compose + Nginx + MinIO

## ⚠️ Важно

Переменная `NODE_ENV=production` в системе блокирует установку devDependencies.
Всегда запускайте бэкенд через `start.bat` или устанавливайте `$env:NODE_ENV = "development"` перед `npm run start:dev`.
