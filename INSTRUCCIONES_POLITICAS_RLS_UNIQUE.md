# Instrucciones para Implementar Políticas RLS con Restricción UNIQUE en Wishlist

## 📋 Resumen

Este documento proporciona instrucciones detalladas para implementar y probar las políticas RLS mejoradas que manejan correctamente la restricción UNIQUE compuesta (user_id, product_id) en la tabla wishlist.

## 🎯 Objetivo

Asegurar que las políticas RLS cooperen correctamente con la restricción UNIQUE de la base de datos para prevenir duplicados en la tabla wishlist y manejar los errores de manera elegante.

## 🔧 Implementación

### 1. Ejecutar el Script SQL Mejorado

1. Abre la consola SQL de Supabase:
   - Ve a https://supabase.com/dashboard/project/gxqkmaaqoehydulksudj/sql
   - Inicia sesión con tus credenciales

2. Ejecuta el script mejorado:
   ```bash
   # Copia y pega el contenido del archivo:
   tus-aguacates/create-wishlist-policies.sql
   ```

3. Verifica que no haya errores durante la ejecución

### 2. Cambios Clave en las Políticas

#### Política INSERT Mejorada
```sql
CREATE POLICY "Users can insert own wishlist items" ON wishlist
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    product_id IS NOT NULL AND
    NOT EXISTS (
      SELECT 1 FROM wishlist 
      WHERE user_id = auth.uid() 
        AND product_id = product_id
    )
  );
```

**Mejoras implementadas:**
- ✅ Verificación explícita de duplicados con `NOT EXISTS`
- ✅ Cooperación con la restricción UNIQUE a nivel de base de datos
- ✅ Doble capa de protección (política RLS + restricción DB)

## 🧪 Pruebas

### 1. Pruebas Automatizadas

Ejecuta el script de pruebas para verificar el funcionamiento:

```bash
cd tus-aguacates
node test-wishlist-unique-constraint.js
```

**Resultados esperados:**
- ✅ Inserción inicial funciona correctamente
- ✅ Inserción duplicada es rechazada por política RLS
- ✅ Verificación de unicidad funciona correctamente
- ✅ Inserción con diferente usuario funciona
- ✅ Inserción con diferente producto funciona

### 2. Pruebas Manuales en Consola SQL

```sql
-- 1. Insertar un producto en favoritos (debe funcionar)
INSERT INTO wishlist (user_id, product_id) 
VALUES ('tu_usuario_uuid', 'tu_producto_uuid');

-- 2. Intentar insertar el mismo producto (debe fallar)
INSERT INTO wishlist (user_id, product_id) 
VALUES ('tu_usuario_uuid', 'tu_producto_uuid');

-- 3. Verificar que solo exista un registro
SELECT * FROM wishlist 
WHERE user_id = 'tu_usuario_uuid' 
  AND product_id = 'tu_producto_uuid';
```

### 3. Pruebas en el Frontend

1. Inicia sesión en la aplicación
2. Navega a un producto
3. Haz clic en "Agregar a favoritos"
4. Intenta hacer clic nuevamente en el mismo botón
5. Verifica que aparezca un mensaje indicando que el producto ya está en favoritos

## 🚨 Manejo de Errores

### Códigos de Error Esperados

1. **Violación de restricción UNIQUE (código 23505)**:
   ```json
   {
     "error": "duplicate key value violates unique constraint \"wishlist_user_id_product_id_key\"",
     "code": "23505"
   }
   ```

2. **Rechazo por política RLS (código 42501)**:
   ```json
   {
     "error": "new row violates row-level security policy for table \"wishlist\"",
     "code": "42501"
   }
   ```

3. **Manejo en el API (código 409)**:
   ```json
   {
     "error": "El producto ya está en favoritos"
   }
   ```

### Implementación en el Frontend

```javascript
try {
  const response = await fetch('/api/wishlist', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ product_id })
  });
  
  if (response.status === 409) {
    // El producto ya está en favoritos (manejado por el API)
    showMessage('Este producto ya está en tus favoritos');
  } else if (response.status === 400 && response.error?.code === '23505') {
    // Violación de restricción UNIQUE (manejado por la base de datos)
    showMessage('Este producto ya está en tus favoritos');
  } else if (response.status === 403 && response.error?.code === '42501') {
    // Rechazado por política RLS (manejado por la política)
    showMessage('Este producto ya está en tus favoritos');
  } else if (!response.ok) {
    throw new Error('Error al agregar a favoritos');
  }
  
  // Éxito
  showMessage('Producto agregado a favoritos');
} catch (error) {
  showMessage('Error al agregar a favoritos');
}
```

## 🔍 Verificación

### 1. Verificar Políticas Creadas

```sql
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'wishlist'
ORDER BY policyname;
```

### 2. Verificar Restricciones

```sql
SELECT
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'wishlist'
  AND tc.table_schema = 'public'
ORDER BY tc.constraint_type, tc.constraint_name;
```

### 3. Verificar RLS Habilitado

```sql
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'wishlist';
```

## 📊 Arquitectura de Seguridad

### Capas de Protección

1. **Capa 1 - Política RLS**:
   - Verifica duplicados antes de la inserción
   - Rechaza inserciones que violarían la unicidad
   - Proporciona mensajes de error claros

2. **Capa 2 - Restricción UNIQUE**:
   - Garantiza integridad a nivel de base de datos
   - Previene duplicados incluso si la política falla
   - Proporciona seguridad adicional

3. **Capa 3 - API**:
   - Verifica duplicados antes de intentar inserción
   - Maneja errores de manera elegante
   - Proporciona respuestas consistentes al frontend

### Flujo de Inserción

```
Frontend → API → Verificación API → Política RLS → Restricción UNIQUE → Base de Datos
    ↓           ↓              ↓              ↓              ↓              ↓
  Click     POST /api/     SELECT          NOT EXISTS    UNIQUE        INSERT
  Button    wishlist       wishlist        (user_id,     (user_id,      (user_id,
                          WHERE           product_id)    product_id)    product_id)
                          user_id=...     NOT EXISTS     CHECK          SUCCESS
                          AND
                          product_id=...
```

## 🎉 Resultados Esperados

Con estas mejoras implementadas:

1. **✅ Prevención de duplicados**: Los usuarios no pueden agregar el mismo producto dos veces
2. **✅ Manejo de errores elegante**: Los errores se manejan de manera consistente
3. **✅ Seguridad robusta**: Doble capa de protección contra duplicados
4. **✅ Experiencia de usuario mejorada**: Mensajes claros y consistentes
5. **✅ Integridad de datos**: La base de datos mantiene la consistencia

## 📝 Notas Adicionales

- Las políticas RLS ahora cooperan con la restricción UNIQUE en lugar de combatirla
- El frontend debe manejar múltiples códigos de error para una experiencia completa
- Las pruebas automatizadas verifican todos los escenarios importantes
- La documentación incluye ejemplos de manejo de errores en el frontend

## 🔚 Conclusión

Las políticas RLS mejoradas proporcionan una solución robusta para manejar la restricción UNIQUE compuesta (user_id, product_id) en la tabla wishlist, asegurando la integridad de los datos y una experiencia de usuario consistente.