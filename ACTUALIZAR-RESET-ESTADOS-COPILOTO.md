# 🔧 ACTUALIZAR HERRAMIENTA DEL COPILOTO PARA INCLUIR ESCALADO

**Ejecutar en pgAdmin/DBeaver:**

```sql
-- =====================================================
-- ACTUALIZAR HERRAMIENTA TOOL_ADMIN_ResetearEstados
-- =====================================================

-- Primero, eliminar la herramienta existente
DELETE FROM n8n_workflow_tool_credentials
WHERE workflow_id = (
    SELECT id FROM n8n_workflow 
    WHERE name = '🧠 Copiloto de Operaciones (YCloud)'
    LIMIT 1
)
) AND tool_name = 'TOOL_ADMIN_ResetearEstados';

-- Insertar la herramienta actualizada
INSERT INTO n8n_tool_credentials (
    workflow_id,
    tool_name,
    tool_type,
    type,
    parameters
) 
SELECT 
    (
        SELECT id 
        FROM n8n_workflow 
        WHERE name = '🧠 Copiloto de Operaciones (YCloud)'
        LIMIT 1
    ),
    'TOOL_ADMIN_ResetearEstados',
    'n8n-nodes-base.postgresTool',
    'toolDescription',
    '🔧 ESTADOS DISPONIBLES PARA RESETEO:

Puedes resetear el estado de TODOS los clientes a uno de estos estados:

• ATENCION_LUZ - Atendiendo por el Agente Luz (estándar)
• NUEVO - Cliente nuevo sin interacción
• ATENCION_COPILOTO - Atendiendo por Copiloto del Director

ESTADO ESCALADO:
• ❌ NO está disponible en esta herramienta
• ✅ Usa la herramienta: TOOL_ADMIN_CambiarEstado con estado='ESCALADO'
• El Agente Luz NO responderá a clientes en ESCALADO (solo el Director puede usar el Agente Luz)

MODO DE RESETEO:
• Por defecto, resetea a: ATENCION_LUZ
• Si especificas otro estado, resetea a ese estado

INPUT: 
- estado_objetivo (opcional) - Estado al que resetear
- telefono_cliente (opcional) - Teléfono específico para resetear individualmente
- confirmar (opcional) - Confirmación antes de resetear masivamente

EJEMPLOS:
1. Resetear TODOS los clientes a ATENCION_LUZ:
   → TOOL_ADMIN_ResetearEstados()

2. Resetear TODOS a NUEVO:
   → TOOL_ADMIN_ResetearEstados('NUEVO')

3. Resetear un cliente específico:
   → TOOL_ADMIN_ResetearEstados('573001234567', 'ATENCION_LUZ')
   
4. Resetear un cliente específico con estado personalizado:
   → TOOL_ADMIN_ResetearEstados('573001234567', 'NUEVO')

IMPORTANTE:
- El Agente Luz NUNCA responderá a clientes en estado ESCALADO
- Solo el Director (tú) puede usar el Agente Luz cuando el estado es ESCALADO
- El Copiloto SOLO puede resetear estados (el Agente Luz no puede)
- Los clientes en ESCALADO verán este mensaje si intentan usar el Agente Luz: 
  "🔒 Lo siento, actualmente estás en espera de atención por el equipo. Te contactaremos pronto. Para mayor urgencia, escribe al director: 573203062007"

ESTADOS DE TRANSICIÓN SEGURA:
• Al resetear de ESCALADO → ATENCION_LUZ: Cliente vuelve a interactuar con Agente Luz
• Al resetear a cualquier otro estado: El cliente deja de estar en ESCALADO
• El Agente Luz detecta el estado y actúa en consecuencia

USO CORRECTO:
1. Cliente en ESCALADO → Copiloto resetea a ATENCION_LUZ → Agente Luz puede responder
2. Cliente interactúa con Agente Luz → Copiloto puede cambiar estado a ESCALADO → Agente Luz no responde

NOTA: El Agente Luz v6.5 tiene configurada una herramienta TOOL_EscalarServicioCliente que cambia el estado a ESCALADO automáticamente.',
       El Copiloto puede usar esta herramienta o TOOL_ADMIN_CambiarEstado.',
       El Agente Luz está configurado para NO responder a clientes en estado ESCALADO.
```,
    {
        "operation": "executeQuery",
        "query": "WITH clientes_a_resetear AS (\n    SELECT telefono, 'ATENCION_LUZ' as estado_objetivo\n    FROM clientes\n    WHERE ($1 = 'ATENCION_LUZ' OR $1 IS NULL)\n      AND estado_conversacion IN ('ESCALADO', 'ATENCION_LUZ', 'NUEVO')\n      -- Si se especifica teléfono, filtra por ese teléfono\n      ($2 IS NULL OR REPLACE(REPLACE(telefono, '+', ''), ' ', '') LIKE '%' || REPLACE($2, '+', ''), ' ', '') || '%')\n),\n\n    -- Límite de seguridad (max 1000 clientes a la vez)\n    LIMIT 1000\n),\n    actualizaciones AS (\n        UPDATE clientes\n        SET estado_conversacion = ca.estado_objetivo,\n            fecha_atencion = CASE WHEN ca.estado_objetivo = 'ATENCION_LUZ' THEN NOW() ELSE NULL END\n        FROM clientes c\n        JOIN clientes_a_resetear ca ON REPLACE(REPLACE(c.telefono, '+', ''), ' ', '') LIKE '%' || REPLACE(REPLACE(ca.telefono, '+', ''), ' ', '') || '%') || '%' || REPLACE(REPLACE(c.telefono, '+', ''), ' ', '') || '%'\n        WHERE c.id = ca.id\n        RETURNING c.id, c.nombre, c.telefono, ca.estado_objetivo, 'Cliente reseteado de X a Y'\n    )\n    SELECT id, nombre, telefono, estado_objetivo, 'Cliente ' || nombre || ' reseteado de ' || estado_objetivo\n    FROM actualizaciones\n)\n\n-- 3. Si se especifica teléfono, cuenta cuántos se van a resetear\nSELECT \n    COUNT(*) as cantidad_resetes, \n    STRING_AGG(telefono, ', ') as telefonos\nFROM clientes_a_resetear\nWHERE $2 IS NOT NULL;\n",
        "options": {
            "queryReplacement": "={{ [$fromAI('estado_objetivo','Estado objetivo para reseteo (ATENCION_LUZ/NUEVO)', 'ATENCION_LUZ']], [$fromAI('telefono_cliente','Teléfono específico para reseteo (opcional)', '')] }}"
        }
    },
    "id": "tool-admin-reset-estados-actualizado",
    "name": "TOOL_ADMIN_ResetearEstados",
    "type": "n8n-nodes-base.postgresTool",
    "typeVersion": 2.6,
    "position": [200, 800],
    "credentials": {
        "postgres": {
            "id": "R6hc0vEZJhKQSi3G",
            "name": "Mi PostgreSQL Docker"
        }
    }
);

-- Verificar que la herramienta se actualizó correctamente
SELECT '✅ Herramienta TOOL_ADMIN_ResetearEstados actualizada con soporte para ESCALADO' as mensaje;
```

**Click en Execute**

**Resultado esperado**: ✅ "Query returned successfully" + mensaje de verificación

---

## 🔧 EXPLICACIÓN DE LOS ESTADOS

| Estado | Descripción | Quién puede usar el Agente Luz | Quién puede usar Copiloto |
|--------|-----------|----------------------------------|-------------------|
| ATENCION_LUZ | Atendiendo por Agente Luz | ✅ Sí | ✅ Sí |
| NUEVO | Cliente nuevo sin interacción | ✅ Sí | ✅ Sí |
| EN_PEDIDO | Haciendo pedido | ✅ Sí | ❌ No |
| PEDIDO_CONFIRMADO | Pedido confirmado | ❌ No | ❌ No |
| PIDIENDO_DIRECCION | Pidiendo dirección | ✅ Sí | ❌ No |
| ESCALADO | Esperando atención humana | ❌ NO | ✅ Solo el Director |

---

## 🎯 USO RECOMENDADO

### Para el Agente Luz v6.5:
- ✅ Funciona en: ATENCION_LUZ, NUEVO, EN_PEDIDO, PEDIDO_CONFIRMADO
- ❌ NO responde en: ESCALADO
- ❌ NO usa herramientas de Copiloto

### Para el Copiloto del Director:
- ✅ Puede cambiar estados: TODOS
- ✅ Puede usar herramientas: TODAS
- ✅ Puede resetear masivamente estados
- ✅ Puede usar Agente Luz en ESCALADO (solo él)

### Flujo Típico:

1. **Cliente conversando con Agente Luz** → Estado: ATENCION_LUZ
2. **Cliente necesita hablar con humano** → Copiloto: TOOL_ADMIN_CambiarEstado(ESCALADO)
3. **Agente Luz NO responde** → Cliente ve mensaje de espera
4. **Director atiende al cliente** → Copiloto: TOOL_ADMIN_ResetearEstados('ATENCION_LUZ')
5. **Cliente vuelve a interactuar** → Agente Luz vuelve a funcionar normalmente

---

## 📋 PASOS SIGUIENTES

1. **Verificar que la herramienta se actualizó correctamente**
2. **Usar la herramienta en el Copiloto para limpiar los escalados**:
   ```sql
   -- En el nodo "🤖 Agente Copiloto", ejecuta:
   SELECT * FROM TOOL_ADMIN_ResetearEstados();
   ```
3. **Verificar en la vista que ya no hay clientes escalados**
4. **Probar que el Agente Luz no responde a clientes en estado ESCALADO**

---

**¿Funcionó la actualización?** (Sí/No)
