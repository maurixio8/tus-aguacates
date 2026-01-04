# 🥑 Agente Luz v3 - Tus Aguacates (YCloud Edition)

## Descripción

Este flujo de n8n implementa el agente de atención al cliente "Luz" para WhatsApp, adaptado para usar la nueva tienda en línea y YCloud como proveedor de WhatsApp.

---

## 📁 Archivos

| Archivo | Descripción |
|---------|-------------|
| `agente-luz-v3-ycloud.json` | Flujo principal (nuevo) |
| `unico 316 (2).json` | Flujo anterior (referencia) |
| `supabase-search-function.sql` | Función de búsqueda para Supabase |
| `setup-database.sql` | Tablas para PostgreSQL (si aplica) |

---

## 🚀 Instalación

### Paso 1: Crear función en Supabase

1. Ve al SQL Editor de Supabase
2. Ejecuta el contenido de `supabase-search-function.sql`
3. Verifica: `SELECT * FROM search_products('aguacate');`

### Paso 2: Configurar credenciales en n8n

#### 1. PostgreSQL Docker (ya lo tienes)
- ID: `R6hc0vEZJhKQSi3G`
- Nombre: `Mi PostgreSQL Docker`

#### 2. DeepSeek (ya lo tienes)
- ID: `8BVSsLxHakKs5L6l`
- Nombre: `DeepSeek account 2`

#### 3. YCloud API Key (HTTP Header Auth) - **NUEVO**
- Nombre: `YCloud API Key`
- Header Name: `X-API-Key`
- Header Value: Tu API key de YCloud

#### 4. Supabase API Key (HTTP Header Auth) - **NUEVO**
- Nombre: `Supabase API Key`
- Header Name: `apikey`
- Header Value: Tu anon key de Supabase

### Paso 3: Importar flujo

1. En n8n: Workflows → Import from File
2. Selecciona `agente-luz-v3-ycloud.json`
3. Actualiza las credenciales marcadas con `TU_CREDENCIAL_*`

### Paso 4: Configurar webhook en YCloud

1. Activa el flujo en n8n
2. Copia la URL del webhook (aparece en `📥 Webhook YCloud`)
3. En YCloud Dashboard → Webhooks → Add Webhook
4. Event: `whatsapp.inbound_message.received`
5. URL: La URL copiada de n8n

---

## 🤖 Herramientas del Agente

| Herramienta | Descripción | Fuente |
|-------------|-------------|--------|
| `TOOL_BuscarProductos` | Busca productos | Supabase |
| `TOOL_BuscarConocimiento` | Info de la empresa | PostgreSQL |
| `TOOL_GuardarNombreCliente` | Guarda nombre | PostgreSQL |
| `TOOL_AnadirAlCarrito` | Añade a pre_pedido | PostgreSQL |
| `TOOL_CalcularTotalPrePedido` | Suma del carrito | PostgreSQL |
| `TOOL_CambiarEstadoCliente` | Cambia estado | PostgreSQL |

---

## 📊 Estados del Cliente

```
NUEVO → NOMBRE_SOLICITADO → ATENCION_LUZ → EN_PEDIDO → PEDIDO_FINALIZADO
                                    ↓
                                ESCALADO
```

---

## 🔧 Diferencias vs Flujo Anterior

| Componente | Antes (unico 316) | Ahora (v3) |
|------------|-------------------|------------|
| Entrada | WAHA Trigger | Webhook HTTP (YCloud) |
| Envío | WAHA Node | HTTP Request (YCloud API) |
| Productos | PostgreSQL local | Supabase RPC |
| Tienda | OlaClick | tus-aguacates.vercel.app |
| Modelo IA | DeepSeek | DeepSeek (igual) |

---

## 🧪 Pruebas

### Probar búsqueda de productos
```bash
curl -X POST "https://TU_SUPABASE_URL/rest/v1/rpc/search_products" \
  -H "apikey: TU_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"search_term": "aguacate"}'
```

### Probar envío YCloud
```bash
curl -X POST "https://api.ycloud.com/v2/whatsapp/messages" \
  -H "X-API-Key: TU_YCLOUD_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "573001234567",
    "type": "text",
    "text": {"body": "Prueba desde n8n 🥑"}
  }'
```

---

## 🐛 Troubleshooting

### Error: "Invalid API Key" (YCloud)
- Verifica que el header sea `X-API-Key` (con X mayúscula)

### Error: "Function not found" (Supabase)
- Ejecuta `supabase-search-function.sql` en el SQL Editor

### El agente no responde
- Verifica que el webhook esté activo en n8n
- Revisa los logs del flujo

---

**Versión**: 3.0 (YCloud Edition)  
**Última actualización**: Diciembre 2024
