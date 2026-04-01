import json
import sys

# Leer el workflow original
with open("n8n-workflows/lab-fresh-check.json", "r", encoding="utf-8") as f:
    wf = json.load(f)

# Buscar y corregir TOOL_BuscarProductos (ID: f0b60d84-7f58-4f11-8e4d-0a4c0d7f9b11)
for node in wf["nodes"]:
    if node.get("id") == "f0b60d84-7f58-4f11-8e4d-0a4c0d7f9b11":
        js_code = node["parameters"]["jsCode"]
        # Invertir lógica
        js_code = js_code.replace(
            "const API_KEY = 'CONFIGURAR_AQUI_NUEVA_AGENT_OPS_API_KEY';",
            "const API_KEY = '4d8cfb14fba5451c875ac515fa047f9b';",
        )
        js_code = js_code.replace(
            "if (API_KEY === '4d8cfb14fba5451c875ac515fa047f9b') {",
            "if (API_KEY === 'CONFIGURAR_AQUI_NUEVA_AGENT_OPS_API_KEY') {",
        )
        node["parameters"]["jsCode"] = js_code
        print("✅ TOOL_BuscarProductos corregido")

# Crear payload con solo el nodo corregido
payload = {
    "name": wf.get("name"),
    "nodes": [node],
    "connections": wf.get("connections"),
    "settings": {},
}

# Guardar payload
with open("n8n-workflows\node-only.json", "w", encoding="utf-8") as f:
    json.dump(payload, f, ensure_ascii=False, indent=2)

print("Payload creado: node-only.json")
print(f"Nombre: {payload['name']}")
print(f"Nodos: {len(payload['nodes'])}")
print(f"Conexiones: {len(payload['connections'])}")
