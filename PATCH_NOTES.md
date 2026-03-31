# Backend fixes & additions — patch notes

## Что изменено и добавлено

### Критический баг (исправлен)
- `backend/src/devices/devices.service.ts`
  - Удалён хардкоженный UUID `'986c2998-...'` в методе `create` → заменён на `user.id`

### Новые файлы (создать)
| Файл | Назначение |
|------|-----------|
| `backend/Dockerfile` | Docker-образ для backend |
| `backend/src/dashboard/dashboard.service.ts` | Статистика для дашборда |
| `backend/src/dashboard/dashboard.controller.ts` | `GET /api/dashboard` |
| `backend/src/dashboard/dashboard.module.ts` | Модуль дашборда |
| `backend/src/documents/documents.service.ts` | Генерация HTML-квитанции |
| `backend/src/documents/documents.controller.ts` | `GET /api/documents/:id`, `GET /api/documents/:id/view` |
| `backend/src/documents/documents.module.ts` | Модуль документов |

### Обновлённые файлы (заменить)
| Файл | Что добавлено |
|------|--------------|
| `backend/src/app.module.ts` | Импорты DashboardModule, DocumentsModule |
| `backend/src/orders/orders.controller.ts` | GET/:id, PATCH/:id, DELETE/:id, comments, documents endpoints |
| `backend/src/orders/orders.service.ts` | findOne, update, delete, getComments, addComment, getDocuments |
| `backend/src/orders/orders.module.ts` | Импорт DocumentsModule |
| `backend/src/clients/clients.controller.ts` | GET/:id, GET/:id/orders, GET/:id/devices |
| `backend/src/clients/clients.service.ts` | findOne, findOrders, findDevices |
| `backend/src/devices/devices.controller.ts` | GET/:id, GET/:id/orders |
| `backend/src/devices/devices.service.ts` | Баг-фикс + findOne, findOrders |
| `backend/src/users/users.controller.ts` | @Roles('admin') на класс + GET/:id, PATCH/:id, POST/:id/reset-password |
| `backend/src/users/users.service.ts` | findOne, update, resetPassword |
| `backend/src/health/health.controller.ts` | Добавлен @Public() — healthcheck теперь доступен без токена |
| `backend/src/audit/audit.controller.ts` | @Roles('admin','manager') + пагинация |
| `backend/src/audit/audit.service.ts` | Пагинация + фильтры в findAll |

## Как применить

Скопируй все файлы из архива в корень репозитория, сохраняя структуру папок:

```bash
# Распакуй архив в корень репозитория
unzip service-center-backend-patch.zip -d /путь/к/репозиторию

# Если нужно пересобрать docker
docker compose up -d --build
```

## API endpoints (полный список после патча)

```
POST   /api/auth/login
GET    /api/auth/me

GET    /api/health
GET    /api/health/db
GET    /api/health/storage

GET    /api/dashboard

GET    /api/users                      (admin)
POST   /api/users                      (admin)
GET    /api/users/:id                  (admin)
PATCH  /api/users/:id                  (admin)
POST   /api/users/:id/reset-password   (admin)

GET    /api/clients
POST   /api/clients
GET    /api/clients/:id
PATCH  /api/clients/:id
DELETE /api/clients/:id
GET    /api/clients/:id/orders
GET    /api/clients/:id/devices

GET    /api/devices
POST   /api/devices
GET    /api/devices/:id
PATCH  /api/devices/:id
DELETE /api/devices/:id
GET    /api/devices/:id/orders

GET    /api/orders
POST   /api/orders
GET    /api/orders/:id
PATCH  /api/orders/:id
DELETE /api/orders/:id
POST   /api/orders/:id/status
GET    /api/orders/:id/status-history
GET    /api/orders/:id/comments
POST   /api/orders/:id/comments
GET    /api/orders/:id/documents
POST   /api/orders/:id/documents/receipt
GET    /api/orders/:id/files

POST   /api/files/upload
GET    /api/files/:id
GET    /api/files/:id/download

GET    /api/documents/:id
GET    /api/documents/:id/view         (HTML квитанция для печати)

GET    /api/audit
```
