#!/bin/bash
# Применяем изменения schema напрямую через SQL

DB="service_center"
USER="sc_user"
CONTAINER="sc-postgres"

echo "=== Добавляем поля в repair_orders ==="
docker exec $CONTAINER psql -U $USER -d $DB -c "
ALTER TABLE repair_orders
  ADD COLUMN IF NOT EXISTS parts_cost  DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS labor_cost  DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS final_price DECIMAL(10,2);
"

echo "=== Добавляем значение в DocumentType enum ==="
docker exec $CONTAINER psql -U $USER -d $DB -c "
ALTER TYPE \"DocumentType\" ADD VALUE IF NOT EXISTS 'issue_receipt';
"

echo "=== Создаём таблицу order_parts ==="
docker exec $CONTAINER psql -U $USER -d $DB -c "
CREATE TABLE IF NOT EXISTS order_parts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   UUID NOT NULL REFERENCES repair_orders(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  quantity   INTEGER NOT NULL DEFAULT 1,
  price      DECIMAL(10,2) NOT NULL DEFAULT 0,
  note       TEXT,
  added_by   UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_order_parts_order_id ON order_parts(order_id);
"

echo "=== Готово ==="
docker exec $CONTAINER psql -U $USER -d $DB -c "\d order_parts"
