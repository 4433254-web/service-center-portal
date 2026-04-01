#!/bin/bash
CADDYFILE="/home/leto/app/caddy/Caddyfile"

# Remove old servis block
python3 - <<'EOF'
with open("/home/leto/app/caddy/Caddyfile", "r") as f:
    content = f.read()

old = """servis.leto-pg.ru {
    reverse_proxy sc-frontend:3000
}"""

new = """servis.leto-pg.ru {
    # API -> backend
    handle /api/* {
        reverse_proxy sc-backend:3001
    }
    # Frontend
    handle {
        reverse_proxy sc-frontend:3000
    }
}"""

content = content.replace(old, new)
with open("/home/leto/app/caddy/Caddyfile", "w") as f:
    f.write(content)
print("Done")
EOF
