# 📋 PASO 1: Usar Copiloto para limpiar clientes escalados

**Objetivo**: Usar el Copiloto del Director para limpiar todos los clientes en ESCALADO y resetearlos a ATENCION_LUZ

**Ejecutar en pgAdmin/DBeaver**:

```sql
-- =====================================================
-- USAR COPILOTO PARA LIMPIAR CLIENTES ESCALADOS
-- =====================================================

-- Versión 1: Resetear SOLO el estado de conversación
UPDATE clientes
SET estado_conversacion = 'ATENCION_LUZ',
    fecha_escalado = NULL,
    motivo_escalado = NULL,
    prioridad_escalado = NULL,
    notificado_escalado = NULL,
    atendido_por = NULL,
    fecha_atencion = NULL,
    tiempo_respuesta_minutos = NULL,
    resolucion = NULL,
    fecha_resolucion = NULL
WHERE estado_conversacion = 'ESCALADO'
RETURNING
    COUNT(*) as clientes_limpiados,
    'Clientes en ESCALADO reseteados a ATENCION_LUZ' as mensaje;
```

**Click en Execute**

**Resultado esperado**:
- `clientes_limpiados`: Número de clientes reseteados
- Mensaje: "Clientes en ESCALADO reseteados a ATENCION_LUZ"

**¿Funcionó?** (responde con: ✅ "Sí" o ❌ "No con error")

---

## 📋 PASO 2: Verificar reseteo

**Ejecutar en pgAdmin/Dbeaver**:

```sql
-- Verificar que ya no hay clientes en ESCALADO
SELECT 
    COUNT(*) as clientes_en_escalado
FROM clientes
WHERE estado_conversacion = 'ESCALADO';
```

**Resultado esperado**:
- `clientes_en_escalado`: 0 (si funcionó)

**¿Funcionó el reseteo?** (responde con el resultado de la query)
