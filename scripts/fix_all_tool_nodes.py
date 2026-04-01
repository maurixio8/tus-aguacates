import json
import sys

# Leer el archivo original (no el que tiene problemas)
with open("n8n-workflows/lab-fresh-check.json", "r", encoding="utf-8") as f:
    wf = json.load(f)

# Buscar y corregir los 3 nodos TOOL
for node in wf["nodes"]:
    node_name = node.get("name", "")
    node_id = node.get("id", "")
    params = node.get("parameters", {})
    js_code = params.get("jsCode", "")

    # Solo procesar nodos toolCode con API_KEY
    if "API_KEY" in js_code:
        # Corregir TOOL_BuscarProductos
        if node_id == "f0b60d84-7f58-4f11-8e4d-0a4c0d7f9b11":
            js_code = js_code.replace(
                "const API_KEY = 'CONFIGURAR_AQUI_NUEVA_AGENT_OPS_API_KEY';",
                "const API_KEY = '4d8cfb14fba5451c875ac515fa047f9b';",
            )
            js_code = js_code.replace(
                "if (API_KEY === '4d8cfb14fba5451c875ac515fa047f9b') {",
                "if (API_KEY === 'CONFIGURAR_AQUI_NUEVA_AGENT_OPS_API_KEY') {",
            )
            node["parameters"]["jsCode"] = js_code
            print(f"✅ {node_name} corregido")

# Crear payload con solo los campos requeridos
payload = {
    "name": wf.get("name"),
    "nodes": wf.get("nodes"),
    "connections": wf.get("connections"),
    "settings": {},
}

# Guardar payload limpio
with open("n8n-workflows/lab-payload-clean.json", "w", encoding="utf-8") as f:
    json.dump(payload, f, ensure_ascii=False, indent=2)

print("Payload guardado: lab-payload-clean.json")
