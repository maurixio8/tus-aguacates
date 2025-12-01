# Instrucciones para Aplicar Migración de Base de Datos

## Migración: Tabla de Direcciones de Usuarios

### Método Recomendado: Supabase Dashboard (SQL Editor)

1. **Abre el SQL Editor de Supabase:**
   - Ve a: https://supabase.com/dashboard/project/gxqkmaaqoehydulksudj/sql/new
   - O navega a tu proyecto → SQL Editor → "New query"

2. **Copia el contenido del archivo:**
   - Archivo: `supabase/migrations/20251129_create_addresses_table.sql`
   - Copia TODO el contenido (105 líneas)

3. **Pega y ejecuta:**
   - Pega el SQL en el editor
   - Haz clic en "Run" o presiona Ctrl+Enter

4. **Verifica que se ejecutó correctamente:**
   - Deberías ver el mensaje "Success. No rows returned"
   - Ve a Table Editor y verifica que aparece la tabla "addresses"

### ¿Qué hace esta migración?

Esta migración crea:

✅ **Tabla `addresses`**: Para guardar direcciones de usuarios
- Campos: label, full_name, phone, street_address, city, state, postal_code, etc.
- Función para asegurar solo una dirección por defecto por usuario
- Índices para mejorar el rendimiento

✅ **Políticas de seguridad (RLS)**:
- Los usuarios solo pueden ver/editar sus propias direcciones
- Los admins pueden ver todas las direcciones

✅ **Columnas nuevas en `orders`**:
- `address_id`: Referencia a la dirección usada
- `shipping_address`: Snapshot de la dirección (JSONB)

✅ **Triggers**:
- Auto-actualización de `updated_at`
- Garantía de dirección por defecto única

### Verificación Post-Migración

Después de ejecutar la migración, verifica:

```sql
-- Verifica que la tabla existe
SELECT * FROM addresses LIMIT 1;

-- Verifica que las columnas se agregaron a orders
SELECT address_id, shipping_address FROM orders LIMIT 1;

-- Verifica las políticas de seguridad
SELECT * FROM pg_policies WHERE tablename = 'addresses';
```

### En Caso de Error

Si obtienes un error como "relation already exists", significa que parte de la migración ya se aplicó. Puedes:

1. **Verificar qué existe:**
   ```sql
   SELECT table_name
   FROM information_schema.tables
   WHERE table_name = 'addresses';
   ```

2. **Si la tabla ya existe**, solo necesitas agregar las columnas a orders:
   ```sql
   ALTER TABLE orders ADD COLUMN IF NOT EXISTS address_id UUID REFERENCES addresses(id);
   ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address JSONB;
   ```

### Soporte

Si encuentras problemas, revisa:
- Los logs de errores en Supabase Dashboard
- La consola de PostgreSQL en el Dashboard
- Verifica que tu usuario tenga permisos de administrador

---

**Creado por**: Sistema de migración automática
**Fecha**: 2025-11-30
**Archivo de migración**: `supabase/migrations/20251129_create_addresses_table.sql`
