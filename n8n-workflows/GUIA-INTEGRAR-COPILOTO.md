# 🧠 Guía: Integrar Copiloto en Agente Luz v4

## Resumen
Integrar el Copiloto de Operaciones directamente en el workflow del Agente Luz v4, usando el mismo webhook de YCloud.

**Nota:** YCloud NO reenvía mensajes de grupos, así que usamos **chat directo** entre tu número personal y el número de negocio.

---

## Paso 1: Actualizar el Pre-procesamiento

1. Abre el workflow **"🥑 Tus Aguacates - Agente Luz v4 (Híbrido)"** en n8n
2. Busca el nodo **"1. Pre-procesamiento YCloud"**
3. Doble-click para editarlo
4. Reemplaza TODO el código con el contenido del archivo:
   - `n8n-workflows/preprocesamiento-v10-director-copiloto.js`

**Esto agrega:** Detección automática de tu número (`+57 320 306 2007`). Cuando TÚ escribas al número de negocio, tus mensajes tendrán `esComandoCopiloto: true`.

---

## Paso 2: Agregar Nodo Switch después del Pre-procesamiento

1. Agrega un nodo **Switch** después del nodo **"1. Pre-procesamiento YCloud"**
2. **Nombre**: `🔀 ¿Es Copiloto?`
3. **Configuración**:
   - **Mode**: Rules
   - **Rule 1**:
     - Output name: `Copiloto`
     - Condition: `{{ $json.esComandoCopiloto }}` → `equals` → `true`
   - **Rule 2** (fallback):
     - Output name: `Cliente`
     - Condition: `{{ $json.esComandoCopiloto }}` → `equals` → `false`

4. Conectar:
   - Salida `Cliente` → flujo existente (hacia `❓ ¿Es Media?`)
   - Salida `Copiloto` → nuevo flujo del Copiloto

---

## Paso 3: Agregar el Agente Copiloto

1. Agrega un nodo **AI Agent** al canvas
2. **Nombre**: `🧠 Agente Copiloto`
3. **Prompt**: `={{ $json.messageText }}`
4. **System Message**: (copiar de abajo)
5. **Modelo**: DeepSeek (ya tienes las credenciales)
6. **Memoria**: Buffer Window (sessionKey: `copiloto_operaciones`)

---

## Paso 4: Agregar las Herramientas del Copiloto

Agrega estos nodos **Postgres Tool** conectados al Agente Copiloto:

### TOOL_ListarClientesSinNombre
```sql
SELECT telefono, estado_conversacion, total_pedidos 
FROM clientes 
WHERE nombre IS NULL OR TRIM(nombre) = '' 
   OR nombre ILIKE '%cliente%' OR nombre ILIKE '%whatsapp%' 
ORDER BY total_pedidos DESC 
LIMIT 50;
```

### TOOL_ADMIN_ActualizarDatosCliente
```sql
UPDATE clientes 
SET nombre = COALESCE($1, nombre), 
    direccion = COALESCE($2, direccion)
WHERE REPLACE(REPLACE(telefono, '+', ''), ' ', '') = $3
RETURNING telefono, nombre, 'OK' as status;
```
- Parámetro $1: `{{ $fromAI('nombre') || $json.nombre_extraido }}`
- Parámetro $2: `{{ $fromAI('direccion') }}`
- Parámetro $3: `{{ $fromAI('telefono') || $json.telefono_objetivo }}`

### TOOL_ADMIN_ContarClientes
```sql
SELECT COUNT(*) as total, 
       COUNT(CASE WHEN nombre IS NOT NULL AND nombre != '' THEN 1 END) as con_nombre
FROM clientes;
```

---

## Paso 5: Conectar Respuesta del Copiloto a YCloud

1. Agrega un nodo **Code** después del Agente Copiloto
2. **Nombre**: `📤 Preparar Respuesta Copiloto`
3. Código:
```javascript
const respuesta = $input.first().json.output || 'Error procesando comando';
const contexto = $('🔀 ¿Es Copiloto?').first().json;

return [{
    json: {
        from: contexto.to,
        to: contexto.from,
        type: 'text',
        text: { body: respuesta }
    }
}];
```

4. Conecta esto al nodo **"📱 Enviar WhatsApp YCloud"** existente

---

## Paso 6: Probar

1. **Guardar** el workflow
2. Envía un mensaje al grupo de comando: `"Dame los clientes sin nombre"`
3. Verifica que el copiloto responda

---

## Archivos de Referencia

| Archivo | Descripción |
|---------|-------------|
| `preprocesamiento-v9-con-copiloto.js` | Código actualizado con detección |
| `Copiloto-Operaciones-v2-YCloud.json` | Workflow standalone (alternativa) |
