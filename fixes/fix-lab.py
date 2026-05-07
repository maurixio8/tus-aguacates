#!/usr/bin/env python3
"""Fix LAB workflow bugs and clean copiloto code."""
import json, sys, copy

with open('/tmp/lab-workflow.json') as f:
    wf = json.load(f)

nodes = wf['nodes']
changes = []

for node in nodes:
    name = node.get('name', '')
    
    # === BUG 1: TOOL_CalcularTotalPrePedido ===
    if name == 'TOOL_CalcularTotalPrePedido':
        old_query = node['parameters']['query']
        # Fix: .item.json.from → .first().json.from
        if '.item.json.from' in old_query:
            new_query = old_query.replace('.item.json.from', '.first().json.from')
            node['parameters']['query'] = new_query
            changes.append(f"BUG1 FIXED: TOOL_CalcularTotalPrePedido .item → .first()")
    
    # === BUG 2: TOOL_GuardarDireccionCliente ===
    if name == 'TOOL_GuardarDireccionCliente':
        old_replacement = node['parameters']['options']['queryReplacement']
        # Fix: =={{ [ → ={{ $fromAI(
        if old_replacement.startswith('=={{ [') or '=={{' in old_replacement:
            new_replacement = '={{ $fromAI(\'direccion\',\'Dirección completa del cliente incluyendo calle, número, barrio y ciudad\',\'string\',\'\') }}'
            node['parameters']['options']['queryReplacement'] = new_replacement
            changes.append(f"BUG2 FIXED: TOOL_GuardarDireccionCliente == → =")

    # === CLEANUP: Remove copiloto from pre-processing ===
    if name == '1. Pre-procesamiento YCloud':
        code = node['parameters']['jsCode']
        
        # Replace NUMEROS_DIRECTOR with empty (no copiloto)
        code = code.replace(
            "const NUMEROS_DIRECTOR = ['573203062007', '3203062007'];",
            "const NUMEROS_DIRECTOR = [];"
        )
        
        # Remove the entire copiloto block: from "// SI ES DIRECTOR" to the end of that if block
        # We'll replace the copiloto mode with just treating director as normal client
        
        # Find and remove the copiloto mode block
        # Pattern: if (esNumeroDirector) { ... copiloto return ... }
        # Replace with: if (esNumeroDirector) { /* director treated as normal client */ }
        
        # More surgical: remove the "MODO COPILOTO" section
        # The copiloto block starts with "if (esNumeroDirector) {" after the escalado check
        # and has an inner "if (mensajeEmpiezaConPrefijo)" check
        
        # Let's find the copiloto block and replace it
        copiloto_start = code.find("// =====================================================\n// SI ES DIRECTOR")
        if copiloto_start == -1:
            copiloto_start = code.find("// SI ES DIRECTOR")
        
        if copiloto_start > 0:
            # Find the end of the director block - it ends before "// RESTO DEL CÓDIGO"
            copiloto_end = code.find("// =====================================================\n// RESTO DEL C", 
                                      copiloto_start)
            if copiloto_end == -1:
                copiloto_end = code.find("// RESTO DEL C", copiloto_start)
            
            if copiloto_end > copiloto_start:
                # Replace the entire copiloto block with a simple version
                new_block = """// =====================================================
// DIRECTOR: tratado como cliente normal (copiloto desactivado)
// =====================================================
// El director es tratado igual que cualquier cliente

"""
                code = code[:copiloto_start] + new_block + code[copiloto_end:]
                changes.append("COPILOTO CLEANED: Removed copiloto mode from pre-processing")

        # Also set esComandoCopiloto to always false in the code
        # This is a safety measure
        code = code.replace(
            "esComandoCopiloto: true",
            "esComandoCopiloto: false"
        )
        
        node['parameters']['jsCode'] = code

# === CLEANUP: Remove copiloto switch node connections ===
# Node "¿Es Copiloto?" (id: 757b19ad-...) should be bypassed
# Route: ?Cliente Bloqueado? → ¿Es Copiloto? → ¿Es Media?
# Change to: ?Cliente Bloqueado? → ¿Es Media? directly

conns = wf['connections']

# Find "¿Cliente Bloqueado?" connections - it outputs to "¿Es Copiloto?"
bloqueado_key = None
for key in conns:
    if 'Cliente Bloqueado' in key or 'cliente bloqueado' in key.lower():
        bloqueado_key = key
        break

# Also search by partial match
if not bloqueado_key:
    for key in conns:
        if 'Bloqueado' in key:
            bloqueado_key = key
            break

# The connections use the node name with emoji. Let me check
# From the JSON: "? ¿Cliente Bloqueado?" connects to "?? ¿Es Copiloto?"
# We need to reroute "? ¿Cliente Bloqueado?" output 1 (not blocked) to go to "? ¿Es Media?" instead of "?? ¿Es Copiloto?"

if bloqueado_key:
    bloqueado_conns = conns[bloqueado_key]
    changes.append(f"Found bloqueado connections for: {bloqueado_key}")
    
    # The "¿Es Copiloto?" node receives from "¿Cliente Bloqueado?" output index 1
    # And routes: Copiloto → Enviar WhatsApp, Cliente → ¿Es Media?
    # We want to bypass: ¿Cliente Bloqueado? → ¿Es Media? directly
    
    # Find the connection from ¿Cliente Bloqueado? to ¿Es Copiloto?
    for i, main_conn in enumerate(bloqueado_conns.get('main', [])):
        for j, conn in enumerate(main_conn):
            if 'Copiloto' in conn.get('node', ''):
                # Replace target with ¿Es Media?
                old_node = conn['node']
                conn['node'] = '? ¿Es Media?'
                changes.append(f"REROUTED: {bloqueado_key} → {old_node} changed to → ? ¿Es Media?")
                # Fix: need correct index - ¿Es Media? has input 0 for non-media
                conn['index'] = 1  # input index 1 is the "not media" path

# Remove the "¿Es Copiloto?" node from connections (disconnect it)
copiloto_key = None
for key in list(conns.keys()):
    if 'Copiloto' in key and 'Es' in key:
        copiloto_key = key
        break

if copiloto_key:
    # Remove all connections from the copiloto switch
    if copiloto_key in conns:
        del conns[copiloto_key]
        changes.append(f"REMOVED connections from: {copiloto_key}")

# Remove the copiloto switch node itself from nodes
wf['nodes'] = [n for n in wf['nodes'] if 'Copiloto' not in n.get('name', '') or 'Es' not in n.get('name', '')]
# Actually let's be more precise
nodes_to_remove = []
for n in wf['nodes']:
    nname = n.get('name', '')
    if nname == '¿Es Copiloto?' or (n.get('type') == 'n8n-nodes-base.switch' and 'Copiloto' in nname):
        nodes_to_remove.append(nname)

for n in nodes_to_remove:
    wf['nodes'] = [node for node in wf['nodes'] if node.get('name') != n]
    changes.append(f"REMOVED node: {n}")

# Save the fixed workflow
output_path = '/tmp/lab-workflow-fixed.json'
with open(output_path, 'w') as f:
    json.dump(wf, f, ensure_ascii=False)

print(f"Fixed workflow saved to {output_path}")
print(f"\nChanges made ({len(changes)}):")
for c in changes:
    print(f"  ✅ {c}")

if not changes:
    print("  ⚠️ NO CHANGES MADE - check the node names")
