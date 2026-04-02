CREATE TABLE IF NOT EXISTS order_parts (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  order_id   TEXT NOT NULL REFERENCES repair_orders(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  quantity   INTEGER NOT NULL DEFAULT 1,
  price      DECIMAL(10,2) NOT NULL DEFAULT 0,
  note       TEXT,
  added_by   TEXT NOT NULL REFERENCES users(id),
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_order_parts_order_id ON order_parts(order_id);
SELECT 'order_parts table OK' as status;
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'order_parts' ORDER BY ordinal_position;
