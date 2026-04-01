# -*- coding: utf-8 -*-
import json

# Leer el workflow actual
with open('n8n-workflows/lab-current-check.json', 'r', encoding='utf-8') as f:
    wf = json.load(f)

print("=== ANÁLISIS DE NODOS TOOL DE LUZ ===")

# Buscar nodos que terminan con TOOL_
tool_nodes = []
for node in wf['nodes']:
    name = node.get('name', '')
    if 'TOOL_' in name:
        tool_nodes.append({
            'id': node.get('id'),
            'name': name,
            'type': node.get('type', '')
        })

print(f"Total de nodos TOOL: {len(tool_nodes)}")

# Analizar cada nodo TOOL
for tool_node in tool_nodes:
    print(f"\n--- {tool_node['name']} ({tool_node['id']}) ---")
    params = tool_node.get('parameters', {})
    js_code = params.get('jsCode', '')
    
    if not js_code:
        print("  ❌ No tiene jsCode")
        continue
    
    # Analizar el valor de API_KEY y la condición de validación
    has_api_key_assignment = "API_KEY =" in js_code
    has_placeholder_check = "API_KEY ===" in js_code
    
    # Extraer valor de API_KEY si existe
    api_key_value = None
    if "const API_KEY = '" in js_code:
        try:
            # Extraer valor entre comillas
            parts = js_code.split("const API_KEY = '", 1)
            if len(parts) > 1:
                api_key_value = parts[1].split("'")[0]
        except:
            pass
    
    print(f"  Tiene asignación API_KEY: {has_api_key_assignment}")
    print(f"  Tiene verificación placeholder: {has_placeholder_check}")
    
    if api_key_value:
        print(f"  API_KEY valor: {api_key_value}")
    if api_key_value.startswith('4d8cfb14fba5451c875ac515fa047f9b'):
        print("  ✅ API_KEY real configurada")
    elif api_key_value == 'CONFIGURAR_AQUI_NUEVA_AGENT_OPS_API_KEY':
        print("  ⚠️  Placeholder configurado (esto causará que la herramienta nunca ejecute)")
    else:
        print(f"  ⚠️ API_KEY desconocido: {api_key_value}")
    
    # Verificar condiciones de validación
    if 'if (API_KEY === '4d8cfb14fba5451c875ac515fa047f9b')' in js_code:
        print("  ❌ ERROR: Valida contra key real (esto hará que la herramienta falle)")
    elif 'if (API_KEY === 'CONFIGURAR_AQUI_NUEVA_AGENT_OPS_API_KEY')' in js_code:
        print("  ✅ Valida contra placeholder (correcto)")

print(f"\n=== ANÁLISIS COMPLETA ===")
print(f"  API_KEY real configurada: '4d8cfb14fba5451c875ac515fa047f9b'")
print(f"  Lógica correcta: API_KEY debe ser la key real y validar contra el placeholder")
