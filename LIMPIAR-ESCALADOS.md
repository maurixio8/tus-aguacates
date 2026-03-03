# 🧹 LIMPIAR CLIENTES ESCALADOS

**Ejecutar en pgAdmin/DBeaver:**

```sql
-- =====================================================
-- LIMPIAR TODOS LOS CLIENTES EN ESTADO ESCALADO
-- =====================================================

-- 1. Limpiar estado de escalado
UPDATE clientes
SET
    estado_conversacion = 'NUEVO',
    fecha_escalado = NULL,
    motivo_escalado = NULL,
    prioridad_escalado = NULL,
    notificado_escalado = NULL,
    atendido_por = NULL,
    fecha_atencion = NULL,
    tiempo_respuesta_minutos = NULL,
    resolucion = NULL,
    fecha_resolucion = NULL
WHERE estado_conversacion = 'ESCALADO';

-- 2. Verificar que se limpiaron todos
SELECT COUNT(*) as clientes_limpiados
FROM clientes
WHERE estado_conversacion = 'ESCALADO';

-- 3. Verificar que ya no haya clientes escalados
SELECT COUNT(*) as escalados_restantes
FROM clientes
WHERE estado_conversacion = 'ESCALADO';
```

**Click en Execute**

**Resultado esperado**:
- `clientes_limpiados`: Número de clientes que fueron limpiados
- `escalados_restantes`: Debería ser 0

---

## ✅ VERIFICACIÓN

Luego de ejecutar, verifica en pgAdmin/DBeaver:

```sql
-- Verificar que la vista está vacía
SELECT * FROM vw_escalados_pendientes;
```

**Debería devolver 0 filas** (sin clientes escalados).

---

## 📋 PRÓXIMO: EXPLORAR COPILOTO DEL DIRECTOR

Una vez limpiados los clientes escalados, exploraremos tu workflow de Copiloto para configurarlo para que solo tú (el director) pueda enviarle mensajes.

**¿Los clientes se limpiaron correctamente?** (responde con el resultado de la query de verificación)
