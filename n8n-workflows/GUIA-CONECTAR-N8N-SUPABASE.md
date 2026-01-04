# 🔧 Guía: Conectar n8n a Supabase

## Paso 1: Obtener Credenciales de Supabase

1. Ve a tu **Dashboard de Supabase**: https://app.supabase.com
2. Selecciona tu proyecto "Tus Aguacates"
3. Ve a **Settings > Database**
4. En la sección **Connection String**, copia los datos:
   - Host: `db.[tu-proyecto-id].supabase.co`
   - Port: `5432` (o usa `6543` si hay problemas de conexión)
   - Database: `postgres`
   - User: `postgres`
   - Password: (el que configuraste)

---

## Paso 2: Crear Credencial en n8n

1. En n8n, ve a **Credentials** (menú lateral)
2. Click en **Add Credential**
3. Busca y selecciona **Postgres**
4. Configura:

| Campo | Valor |
|-------|-------|
| Host | `db.[tu-proyecto].supabase.co` |
| Port | `5432` |
| Database | `postgres` |
| User | `postgres` |
| Password | [Tu password de Supabase] |
| SSL | ✅ Activado |

5. Nombra la credencial: **"Supabase - Tus Aguacates"**
6. Click en **Save**

---

## Paso 3: Actualizar Nodo "3. Búsqueda Automática Productos"

1. Abre el nodo **"3. Búsqueda Automática Productos"**
2. En **Credential to connect with**, selecciona **"Supabase - Tus Aguacates"**
3. Reemplaza la query con el contenido de:
   `query-busqueda-supabase.sql`
4. Guarda

---

## Paso 4: Actualizar TOOL_BuscarProductos

1. Abre el nodo **"TOOL_BuscarProductos"**
2. En **Credential to connect with**, selecciona **"Supabase - Tus Aguacates"**
3. Reemplaza la query con el contenido de:
   `tool-buscar-productos-supabase.sql`
4. Configura **Options > Query Parameters**:
   ```
   ={{ $fromAI('termino_busqueda','Producto a buscar','string','aguacate') }}
   ```
5. Guarda

---

## Paso 5: Verificar Conexión

Prueba manualmente con este query simple:

```sql
SELECT COUNT(*) as total, 
       COUNT(CASE WHEN is_active THEN 1 END) as activos
FROM products;
```

Si funciona, verás el conteo de productos.

---

## Paso 6: Probar Búsqueda

Envía un mensaje al agente:
- "¿Tienen champiñones?"
- "Quiero aguacates"
- "¿Cuánto cuestan las fresas?"

El agente ahora buscará directamente en la misma tabla que usa tu tienda online.

---

## ⚠️ Notas Importantes

1. **SSL**: Supabase requiere SSL. Asegúrate de que esté activado en n8n.
2. **Pooler**: Si hay errores de conexión, usa el puerto `6543` (connection pooler).
3. **Tiempo de espera**: Si las queries son lentas, considera usar el pooler.

---

## Archivos de Referencia

| Archivo | Propósito |
|---------|-----------|
| `query-busqueda-supabase.sql` | Query para nodo "3. Búsqueda Automática" |
| `tool-buscar-productos-supabase.sql` | Query para TOOL_BuscarProductos |
