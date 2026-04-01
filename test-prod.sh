#!/bin/bash
BASE="https://servis.leto-pg.ru"

echo "=== Test 1: Health Check ==="
curl -sk "$BASE/api/health"
echo ""

echo "=== Test 2: Login ==="
RESP=$(curl -sk -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"login":"admin","password":"admin123"}')
echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print('login:', 'OK' if 'access_token' in d else 'FAIL'); print('user:', d.get('user',{}).get('login','?')); print('roles:', d.get('user',{}).get('roles',[])); open('/tmp/token','w').write(d.get('access_token',''))"

TOKEN=$(cat /tmp/token)

echo ""
echo "=== Test 3: Orders list ==="
curl -sk -H "Authorization: Bearer $TOKEN" "$BASE/api/orders?limit=3" | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print('total orders:', d.get('total',0)); [print(' -', o.get('orderNumber','?'), o.get('status','?')) for o in d.get('items',[])]"

echo ""
echo "=== Test 4: Users list ==="
curl -sk -H "Authorization: Bearer $TOKEN" "$BASE/api/users" | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print('users count:', len(d)); [print(' -', u.get('login','?'), u.get('roles',[])) for u in d]"

echo ""
echo "=== Test 5: Locations ==="
curl -sk -H "Authorization: Bearer $TOKEN" "$BASE/api/locations" | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print('locations:', len(d))"

echo ""
echo "=== ALL DONE ==="
