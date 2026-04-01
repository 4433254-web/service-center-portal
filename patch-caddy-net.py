#!/usr/bin/env python3
"""Добавляет sc-net к Caddy и в список сетей app/docker-compose.yml"""
path = "/home/leto/app/docker-compose.yml"

with open(path, "r") as f:
    content = f.read()

# 1. Добавить sc-net к caddy (после leto-net)
old_caddy_net = """    networks:
      - leto-net

  # ---------------------------------------------------------------------------
  # Automation Brain (n8n)"""

new_caddy_net = """    networks:
      - leto-net
      - sc-net

  # ---------------------------------------------------------------------------
  # Automation Brain (n8n)"""

# 2. Добавить sc-net в раздел networks
old_networks = """networks:
  leto-net:"""

new_networks = """networks:
  leto-net:
  sc-net:
    external: true
    name: service-center_sc-net"""

if old_caddy_net in content:
    content = content.replace(old_caddy_net, new_caddy_net)
    print("Caddy network updated OK")
else:
    print("WARNING: caddy network block not found")

if old_networks in content:
    content = content.replace(old_networks, new_networks)
    print("Networks section updated OK")
else:
    print("WARNING: networks section not found")

with open(path, "w") as f:
    f.write(content)

print("File saved.")
