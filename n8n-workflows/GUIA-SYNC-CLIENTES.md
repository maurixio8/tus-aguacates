# 🔄 Guía: Sincronización de Clientes

## Resumen
Sincronización bidireccional de clientes entre PostgreSQL local (n8n) y Supabase.

---

## Paso 1: Ejecutar Migración SQL

Primero, agrega la columna `supabase_id` a la tabla local.

### En n8n:
1. Abre cualquier workflow con un nodo Postgres
2. Agrega un nodo **Postgres** temporal
3. Usa credencial **"Mi PostgreSQL Docker"**
4. Operation: **Execute Query**
5. Pega este SQL:

```sql
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS supabase_id UUID;
CREATE INDEX IF NOT EXISTS idx_clientes_supabase_id ON clientes(supabase_id);
```

6. Ejecuta y luego elimina el nodo temporal

---

## Paso 2: Importar Workflows

### Workflow A: Supabase → Local
**Archivo:** `workflow-sync-clientes-supabase-to-local.json`
- Trae clientes de Supabase (con emails del registro web)
- Los crea/actualiza en PostgreSQL local
- Usa UPSERT para no duplicar

### Workflow B: Local → Supabase  
**Archivo:** `workflow-sync-clientes-local-to-supabase.json`
- Encuentra clientes que solo existen en local (de WhatsApp)
- Los crea en Supabase
- Vincula el `supabase_id` en local

---

## Paso 3: Probar Manualmente

1. Importa ambos workflows en n8n
2. Ejecuta primero **"Sync Clientes Supabase → Local"**
3. Verifica en el nodo final cuántos clientes se sincronizaron
4. Ejecuta **"Sync Clientes Local → Supabase"**
5. Verifica que los clientes de WhatsApp aparezcan en Supabase

---

## Paso 4: Activar

Una vez que funcione:
1. Activa ambos workflows (toggle superior derecho)
2. Se ejecutarán cada hora automáticamente

---

## Verificación SQL

```sql
-- En PostgreSQL local
SELECT 
  COUNT(*) as total,
  COUNT(supabase_id) as vinculados,
  COUNT(email) as con_email
FROM clientes;
```

---

## Flujo de Datos

```
                    ┌─────────────────┐
  WhatsApp ──────► │ PostgreSQL      │ ◄──────── Tienda Online
  (clientes nuevos) │ Local (clientes)│           (nuevos registros)
                    └────────┬────────┘
                             │
                    Sincronización Bidireccional
                             │
                    ┌────────▼────────┐
                    │    Supabase     │
                    │   (customers)   │
                    └─────────────────┘
```
