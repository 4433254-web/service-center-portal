# Service Center Portal

Репозиторий проекта веб-портала сервисного центра.

## Структура

- `backend/` — NestJS API
- `frontend/` — Next.js приложение
- `infra/` — Docker, Nginx, deployment
- `docs/` — проектная документация
- `archives/` — контрольные архивы версий

## Стек

- Frontend: Next.js
- Backend: NestJS
- DB: PostgreSQL
- Storage: S3 / MinIO
- Infra: Docker + Nginx

## MVP

В MVP входят:
- auth
- users / roles
- clients
- devices
- orders
- status history
- comments
- files
- documents (receipt PDF)
- dashboard
- audit

## Правила

- стартовый статус заказа: `accepted`
- soft delete
- RBAC: `admin`, `receiver`, `master`, `manager`
- глобальный поиск: вариант B (`orders` + `clients` + `devices`)
- формат номера заказа: `SC-YYYY-NNNNNN`
- документы хранятся в object storage, в БД только metadata
