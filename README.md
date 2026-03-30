# Service Center Backend — Final MVP Pack

Этот архив — финальная контрольная точка MVP backend/infra.

## Что внутри
- production-oriented `docker-compose.yml`
- `backend/.env.example`
- `infra/nginx/nginx.conf`
- `infra/nginx/conf.d/service-center.conf`
- `SMOKE_CHECKLIST.md`
- `MVP_RELEASE_CHECKLIST.md`
- `DEPLOY_STEPS.md`
- `GOOGLE_DRIVE_NAMING.md`

## Локальный запуск
```bash
docker compose up -d --build
```

## Проверки после запуска
- `GET /api/health`
- `GET /api/health/db`
- `GET /api/health/storage`
- login
- create client
- create device
- create order
- generate receipt
- dashboard
- audit
