# 🔧 Instrucciones para Aplicar la Migración de Base de Datos

## Problema Identificado

El dashboard admin está mostrando el error:
```
Error: Could not find the 'customer_name' column of 'orders' in the schema cache
```

Esto ocurre porque la tabla `orders` en Supabase no tiene las columnas necesarias para crear pedidos desde el dashboard.

## Solución

Ejecutar la migración SQL que agregará las columnas faltantes a la tabla `orders`.

---

## Opción 1: Aplicar desde el Dashboard de Supabase (Recomendado)

### Paso 1: Accede a Supabase Dashboard
1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a la sección **SQL Editor** en el menú lateral

### Paso 2: Ejecuta la Migración
1. Crea un nuevo query
2. Copia **TODO** el contenido del archivo:
   ```
   supabase/migrations/20251203_add_missing_columns_to_orders.sql
   ```
3. Pega el contenido en el editor SQL
4. Haz clic en **Run** (o presiona Ctrl+Enter)

### Paso 3: Verifica que se aplicó correctamente
Deberías ver un mensaje de éxito. Verifica ejecutando:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;
```

---

## Opción 2: Aplicar usando Supabase CLI

Si tienes Supabase CLI instalado:

```bash
# 1. Asegúrate de estar en la raíz del proyecto
cd /home/user/tus-aguacates

# 2. Link al proyecto de Supabase (si no lo has hecho)
supabase link --project-ref YOUR_PROJECT_REF

# 3. Aplica las migraciones pendientes
supabase db push
```

---

## Columnas que se Agregarán

La migración agrega estas columnas a la tabla `orders`:

- ✅ `customer_name` - Nombre del cliente
- ✅ `customer_phone` - Teléfono del cliente
- ✅ `customer_email` - Email del cliente
- ✅ `delivery_address` - Dirección de entrega
- ✅ `delivery_notes` - Notas de entrega
- ✅ `total_amount` - Monto total del pedido
- ✅ `order_status` - Estado del pedido (pendiente, completado, etc.)
- ✅ `payment_method` - Método de pago
- ✅ `payment_status` - Estado del pago
- ✅ `created_by` - ID del admin que creó el pedido
- ✅ `created_at` - Fecha de creación
- ✅ `updated_at` - Fecha de última actualización

---

## Después de Aplicar la Migración

1. **Espera** 1-2 minutos para que Supabase actualice el schema cache
2. **Recarga** el dashboard admin (Ctrl+F5 o Cmd+Shift+R)
3. **Intenta crear** un nuevo pedido

El error debería estar resuelto y podrás crear pedidos desde el dashboard.

---

## ¿Necesitas Ayuda?

Si encuentras algún problema al aplicar la migración, comparte el error específico que recibes.
