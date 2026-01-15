# 🔄 Guía de Instalación: Sincronización Productos + Variantes

## 📋 Resumen

Este sistema sincroniza productos **Y variantes** desde Supabase a PostgreSQL local cada 30 minutos, permitiendo que el Agente Luz tenga información actualizada de precios y presentaciones.

---

## 🚀 Pasos de Instalación

### Paso 1: Crear tabla de variantes en PostgreSQL local

1. Abre tu cliente PostgreSQL (pgAdmin, DBeaver, o psql)
2. Conéctate a la base de datos **Mi PostgreSQL Docker**
3. Ejecuta el script:

```sql
-- Copiar contenido de:
-- scripts/create-variantes-table-local.sql
```

O directamente:

```sql
DROP TABLE IF EXISTS variantes_productos CASCADE;

CREATE TABLE variantes_productos (
  id SERIAL PRIMARY KEY,
  supabase_id UUID,
  product_id INTEGER REFERENCES productos_tienda(id) ON DELETE CASCADE,
  product_supabase_id UUID,
  variant_name VARCHAR(100) NOT NULL,
  variant_value VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) DEFAULT 0.00,
  price_adjustment DECIMAL(10, 2) DEFAULT 0.00,
  stock_quantity INTEGER DEFAULT 100,
  sku VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  synced_from_supabase_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_variantes_product_supabase_id ON variantes_productos(product_supabase_id);
CREATE INDEX idx_variantes_is_active ON variantes_productos(is_active);
```

---

### Paso 2: Importar el workflow de sincronización

1. En n8n, click **Import from file**
2. Selecciona: `sync-productos-variantes-completo.json`
3. Verifica las credenciales:
   - Supabase account 2 ✅
   - Mi PostgreSQL Docker ✅
4. **Activa** el workflow

---

### Paso 3: Ejecutar primera sincronización

1. Click en **Execute Workflow** manualmente
2. O llama al webhook:
   ```
   POST https://dep-n8n.n8ntusaguacates.space/webhook/sync-completo
   ```

---

### Paso 4: Agregar tool de variantes al Agente Luz

1. Abre el workflow **🥑 Tus Aguacates - Agente Luz v6**
2. Crea un nuevo nodo **Postgres Tool**:
   - Nombre: `TOOL_ObtenerVariantes`
   - Descripción: `Buscar variantes/presentaciones de un producto...`
   - Query: (usar el de `tool-obtener-variantes.json`)
3. Conecta el tool al nodo **🤖 Agente Luz v4**
4. Actualiza el prompt del agente para incluir uso de variantes

---

## ✅ Verificación

Después de la sincronización, verifica:

```sql
-- Contar productos y variantes
SELECT 
  (SELECT COUNT(*) FROM productos_tienda) as productos,
  (SELECT COUNT(*) FROM variantes_productos) as variantes;

-- Ver productos con variantes
SELECT 
  p.name,
  v.variant_name,
  v.variant_value,
  v.price
FROM productos_tienda p
JOIN variantes_productos v ON p.supabase_id = v.product_supabase_id
ORDER BY p.name;
```

---

## 📁 Archivos Creados

| Archivo | Propósito |
|---------|-----------|
| `scripts/create-variantes-table-local.sql` | Script SQL para crear tabla |
| `n8n-workflows/sync-productos-variantes-completo.json` | Workflow de sync |
| `n8n-workflows/tool-obtener-variantes.json` | Tool para el agente |
