import json
import sys

# Leer el archivo original
with open("n8n-workflows/lab-fixed.json", "r", encoding="utf-8") as f:
    wf = json.load(f)

# Crear payload con solo los campos requeridos
payload = {
    "name": wf.get("name"),
    "nodes": wf.get("nodes"),
    "connections": wf.get("connections"),
    "settings": {},
}

# Guardar el payload
with open("n8n-workflows\lab-payload.json", "w", encoding="utf-8") as f:
    json.dump(payload, f, ensure_ascii=False, indent=2)

print("Payload creado: lab-payload.json")
print(f"Nodos: {len(payload['nodes'])}")
print(f"Conexiones: {len(payload['connections'])}")
