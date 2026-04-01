#!/bin/sh
# Обновить конфиг Caddy для servis.leto-pg.ru
CADDYFILE="/etc/caddy/Caddyfile"

# Удаляем старый блок servis и добавляем правильный
python3 - <<'PYEOF'
with open("/etc/caddy/Caddyfile", "r") as f:
    content = f.read()

old = """servis.leto-pg.ru {
    reverse_proxy sc-frontend:3000
}"""

new = """servis.leto-pg.ru {
    # API routes -> backend
    handle /api/* {
        reverse_proxy sc-backend:3001
    }
    # All other routes -> frontend
    handle {
        reverse_proxy sc-frontend:3000
    }
}"""

if old in content:
    content = content.replace(old, new)
    with open("/etc/caddy/Caddyfile", "w") as f:
        f.write(content)
    print("Updated OK")
else:
    print("Block not found, appending...")
    with open("/etc/caddy/Caddyfile", "a") as f:
        f.write("\n" + new + "\n")
    print("Appended OK")
PYEOF
