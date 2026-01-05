# 🔄 Guía: Workflow de Sincronización Supabase → PostgreSQL Local

## Resumen
Este workflow sincroniza automáticamente los productos de Supabase (tienda online) con tu PostgreSQL local (n8n) cada hora.

---

## Paso 1: Importar el Workflow

1. En n8n, ve al menú lateral → **Workflows**
2. Click en **Import from File**
3. Selecciona el archivo: `workflow-sync-productos.json`

---

## Paso 2: Configurar Credenciales

Una vez importado, necesitas actualizar las credenciales en cada nodo:

### Nodo "📥 Obtener Productos Supabase"
1. Click en el nodo
2. En **Credential to connect with**, selecciona **"Supabase account 2"** (la que ya funciona)

### Nodos Postgres (3 nodos)
Para cada uno de estos nodos:
- 🗑️ Limpiar Tabla
- 💾 Insertar Productos  
- ✅ Verificar Total

1. Click en el nodo
2. En **Credential to connect with**, selecciona **"Mi PostgreSQL Docker"**

---

## Paso 3: Ejecutar Manualmente

1. Click en **Execute Workflow** para probar
2. Verifica que no haya errores
3. El último nodo "✅ Verificar Total" debería mostrar el número de productos sincronizados

---

## Paso 4: Activar el Workflow

Una vez que funcione correctamente:
1. Click en el toggle **Active** (arriba a la derecha)
2. El workflow se ejecutará automáticamente cada hora

---

## ⚠️ Notas Importantes

1. **Primera ejecución**: Puede tardar unos segundos si hay muchos productos
2. **La tabla se limpia cada vez**: Es una sincronización completa, no incremental
3. **Si falla**: Revisa que la credencial de Supabase esté funcionando

---

## Estructura del Workflow

```
⏰ Cada Hora
    ↓
📥 Obtener Productos Supabase (API REST)
    ↓
🔄 Transformar Datos (adaptar campos)
    ↓
🗑️ Limpiar Tabla (DELETE FROM productos_tienda)
    ↓
💾 Insertar Productos (INSERT)
    ↓
✅ Verificar Total (SELECT COUNT)
```

---

## Verificar que Funcionó

Después de ejecutar, puedes verificar en el nodo de búsqueda del agente:
```sql
SELECT COUNT(*) FROM productos_tienda;
```

Debería mostrar ~345 productos (el mismo número que en Supabase).
