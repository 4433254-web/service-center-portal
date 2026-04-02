# Сервисный центр — MVP

Веб-портал для управления заказами на ремонт. NestJS + Next.js + PostgreSQL.

---

## Быстрый старт (Docker Compose)

### 1. Требования
- Docker >= 24
- Docker Compose >= 2.20

### 2. Клонирование и настройка

```bash
git clone <ваш-репозиторий> service-center
cd service-center

# Создать .env из примера
cp .env.example .env

# Обязательно поменяйте секреты в .env:
# JWT_SECRET=ваш-длинный-секрет-минимум-32-символа
# POSTGRES_PASSWORD=надёжный-пароль
```

### 3. Запуск

```bash
docker compose up -d --build
```

Первый запуск занимает 3–5 минут (сборка образов).

### 4. Заполнение тестовыми данными

```bash
docker compose exec backend npx tsx prisma/seed.ts
```

### 5. Доступ

| Сервис | URL |
|--------|-----|
| Приложение | http://localhost |
| API | http://localhost/api |
| MinIO Console | http://localhost:9001 |

### 6. Тестовые пользователи

| Логин | Пароль | Роль |
|-------|--------|------|
| admin | admin123 | Администратор |
| receiver1 | receiver123 | Приёмщик |
| master1 | master123 | Мастер |

---

## Локальная разработка (без Docker)

### Требования
- Node.js 20+
- PostgreSQL 15+
- npm

### Настройка

```bash
# Создать .env в папке backend/
cp .env.example backend/.env
# Поменяйте DATABASE_URL на локальную базу
```

### Бэкенд

```bash
cd backend
npm install
npx prisma migrate deploy
npx tsx prisma/seed.ts
npm run start:dev
# → http://localhost:3001/api/health
```

### Фронтенд

```bash
cd frontend
npm install
# Создать .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:3001/api" > .env.local
npm run dev
# → http://localhost:3000
```

---

## Загрузка в Git-репозиторий

```bash
cd service-center

# Инициализировать репозиторий
git init
git branch -M main

# Добавить .gitignore
cat > .gitignore << 'GITEOF'
node_modules/
dist/
.next/
coverage/
.env
.env.*
!.env.example
*.log
.DS_Store
.idea/
.vscode/
postgres_data/
minio_data/
uploads/
documents/
GITEOF

git add .
git commit -m "feat: MVP сервисного центра — начальная версия"

# Подключить удалённый репозиторий (GitHub/GitLab/etc.)
git remote add origin https://github.com/ВАШ-АККАУНТ/service-center.git
git push -u origin main
```

---

## Структура проекта

```
service-center/
├── backend/                  # NestJS API
│   ├── src/
│   │   ├── auth/             # JWT авторизация
│   │   ├── users/            # Пользователи
│   │   ├── clients/          # Клиенты
│   │   ├── devices/          # Устройства
│   │   ├── orders/           # Заказы + статусы
│   │   ├── documents/        # Генерация PDF квитанций
│   │   ├── files/            # Загрузка файлов
│   │   ├── dashboard/        # Статистика
│   │   ├── audit/            # Журнал действий
│   │   └── health/           # Health check
│   └── prisma/               # Схема БД + миграции
├── frontend/                 # Next.js 14
│   └── src/
│       ├── app/              # Страницы (App Router)
│       │   ├── login/
│       │   ├── dashboard/
│       │   ├── orders/
│       │   ├── clients/
│       │   └── users/
│       ├── components/       # UI компоненты
│       └── lib/              # API клиент, хелперы
├── infra/
│   └── nginx/                # Nginx конфиги
└── docker-compose.yml
```

---

## Полезные команды

```bash
# Просмотр логов
docker compose logs -f backend
docker compose logs -f frontend

# Перезапуск одного сервиса
docker compose restart backend

# Пересборка после изменений в коде
docker compose up -d --build backend

# Подключиться к БД
docker compose exec db psql -U service_user -d service_center

# Открыть Prisma Studio (GUI для БД)
cd backend && npx prisma studio

# Бэкап БД
docker compose exec db pg_dump -U service_user service_center > backup.sql

# Восстановление БД
docker compose exec -T db psql -U service_user service_center < backup.sql

# Полная остановка с удалением данных
docker compose down -v
```

---

## API Документация

После запуска все эндпоинты доступны по адресу `http://localhost/api/`.

Основные маршруты:

| Метод | URL | Описание |
|-------|-----|----------|
| POST | /api/auth/login | Вход |
| GET | /api/auth/me | Текущий пользователь |
| GET | /api/orders | Список заказов |
| POST | /api/orders | Создать заказ |
| GET | /api/orders/:id | Детали заказа |
| POST | /api/orders/:id/status | Изменить статус |
| POST | /api/orders/:id/documents/receipt | Сформировать квитанцию |
| GET | /api/clients | Список клиентов |
| POST | /api/clients | Создать клиента |
| GET | /api/devices | Список устройств |
| GET | /api/dashboard | Статистика |
| GET | /api/health | Проверка работоспособности |
