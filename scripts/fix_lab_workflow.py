import json
import sys

# Leer el archivo original
with open("n8n-workflows/lab-fix-api-key.json", "r", encoding="utf-8") as f:
    wf = json.load(f)

# Encontrar y corregir TOOL_BuscarProductos
for node in wf["nodes"]:
    if node.get("id") == "f0b60d84-7f58-4f11-8e4d-0a4c0d7f9b11":
        js_code = node["parameters"]["jsCode"]
        # Corregir la lógica invertida
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

# Guardar el archivo corregido sin BOM
with open("n8n-workflows/lab-fixed.json", "w", encoding="utf-8") as f:
    json.dump(wf, f, ensure_ascii=False, indent=2)

print("Archivo guardado: lab-fixed.json")
