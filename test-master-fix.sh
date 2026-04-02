#!/bin/bash
BASE="https://servis.leto-pg.ru"

login_as() {
  curl -sk -X POST "$BASE/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"login\":\"$1\",\"password\":\"$2\"}" | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))"
}

echo "=== Тест 1: Мастер видит ВСЕ заказы (не только свои) ==="
TOKEN=$(login_as master1 master123)
RESULT=$(curl -sk -H "Authorization: Bearer $TOKEN" "$BASE/api/orders?limit=5")
TOTAL=$(echo $RESULT | python3 -c "import sys,json; print(json.load(sys.stdin).get('total',0))")
echo "master1 видит заказов: $TOTAL (должно быть > 0 даже без назначения)"

echo ""
echo "=== Тест 2: Мастер СОЗДАЁТ заказ ==="
# Сначала нужен клиент и устройство
ADMIN=$(login_as admin admin123)
CLIENT=$(curl -sk -X POST "$BASE/api/clients" \
  -H "Authorization: Bearer $ADMIN" -H "Content-Type: application/json" \
  -d '{"fullName":"Тест Мастер","phone":"+70000000001","clientType":"individual"}' | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))")
DEVICE=$(curl -sk -X POST "$BASE/api/devices" \
  -H "Authorization: Bearer $ADMIN" -H "Content-Type: application/json" \
  -d "{\"clientId\":\"$CLIENT\",\"deviceType\":\"phone\",\"brand\":\"Samsung\",\"model\":\"Galaxy S21\"}" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))")

# Создаём заказ от имени мастера
ORDER=$(curl -sk -X POST "$BASE/api/orders" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"clientId\":\"$CLIENT\",\"deviceId\":\"$DEVICE\",\"issueDescription\":\"Не включается\",\"conditionAtAcceptance\":\"Трещина\"}" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('orderNumber','ERROR:'+str(d)))")
echo "Создан заказ мастером: $ORDER"

echo ""
echo "=== Тест 3: Receiver+Master видит ВСЕ заказы ==="
# Назначим receiver1 ещё и мастером
curl -sk -X PATCH "$BASE/api/users/$(curl -sk -H "Authorization: Bearer $ADMIN" "$BASE/api/users" | python3 -c "import sys,json; u=[x for x in json.load(sys.stdin) if x['login']=='receiver1'][0]; print(u['id'])")" \
  -H "Authorization: Bearer $ADMIN" -H "Content-Type: application/json" \
  -d '{"roles":["receiver","master"]}' > /dev/null

REC=$(login_as receiver1 receiver123)
TOTAL2=$(curl -sk -H "Authorization: Bearer $REC" "$BASE/api/orders?limit=5" | python3 -c "import sys,json; print(json.load(sys.stdin).get('total',0))")
echo "receiver1 (receiver+master) видит заказов: $TOTAL2 (должны видеть все)"

echo ""
echo "=== ГОТОВО ==="
