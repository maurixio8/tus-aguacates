# 🧠 Guía de Configuración RAG para n8n

## El Mayordomo "Magistral" - Búsqueda Semántica de Productos

Esta guía explica cómo configurar el sistema RAG (Retrieval-Augmented Generation) en n8n para que El Mayordomo pueda buscar y recomendar productos de forma inteligente.

---

## 📋 Tabla de Contenidos

1. [Arquitectura General](#arquitectura-general)
2. [Pre-requisitos](#pre-requisitos)
3. [Paso 1: Vectorizar el Catálogo](#paso-1-vectorizar-el-catálogo)
4. [Paso 2: Configurar Supabase en n8n](#paso-2-configurar-supabase-en-n8n)
5. [Paso 3: Crear el Tool de Búsqueda](#paso-3-crear-el-tool-de-búsqueda)
6. [Paso 4: Configurar el Agente](#paso-4-configurar-el-agente)
7. [Paso 5: Probar el Sistema](#paso-5-probar-el-sistema)
8. [Referencia de Funciones SQL](#referencia-de-funciones-sql)

---

## Arquitectura General

```
┌────────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Usuario      │────▶│   n8n Agent  │────▶│   Supabase      │
│   "Ensalada"   │     │   + Tools    │     │   Vector Store  │
└────────────────┘     └──────────────┘     └─────────────────┘
                              │                     │
                              ▼                     ▼
                       ┌──────────────┐     ┌─────────────────┐
                       │   OpenAI     │     │   Resultados:   │
                       │   Embeddings │     │   Lechuga 0.92  │
                       └──────────────┘     │   Tomate  0.89  │
                                            │   Aguacate 0.85 │
                                            └─────────────────┘
```

---

## Pre-requisitos

### 1. Variables de Entorno

Asegúrate de tener estas variables en tu `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# OpenAI (para embeddings)
OPENAI_API_KEY=sk-...

# n8n Webhook
N8N_CHAT_WEBHOOK_URL=https://tu-n8n.com/webhook/chat
```

### 2. Migración de Base de Datos

Ejecuta la migración que crea las tablas necesarias:

```bash
# Usando Supabase CLI
supabase db push

# O aplicar manualmente el archivo:
# supabase/migrations/20251212_create_chat_history_and_vectors.sql
```

### 3. Dependencias del Script

```bash
npm install @supabase/supabase-js dotenv
npm install -D tsx  # Para ejecutar TypeScript
```

---

## Paso 1: Vectorizar el Catálogo

### Ejecutar el Script

```bash
npx tsx scripts/vectorize-catalog.ts
```

### Salida Esperada

```
🥑 =====================================================
   VECTORIZACIÓN DEL CATÁLOGO - EL MAYORDOMO MAGISTRAL
   =====================================================

📂 Cargando productos desde: /public/productos tus_aguacates.json
✅ Cargadas 12 categorías con 217 productos
📦 Aplanados 217 productos para vectorización
🧠 Generando embeddings para 217 productos...
  🔄 Progreso: 217/217 (100%)
📤 Subiendo 217 productos a Supabase...
  📦 Lote 1/11 completado
  ...
✅ Todos los productos subidos a Supabase

✅ =====================================================
   VECTORIZACIÓN COMPLETADA
   =====================================================
   📦 Productos procesados: 217
   🧠 Dimensiones embedding: 1536
   📊 Modelo: text-embedding-3-small
   =====================================================
```

### Verificar en Supabase

```sql
-- Contar productos vectorizados
SELECT COUNT(*) FROM product_embeddings;

-- Ver muestra de datos
SELECT product_id, product_name, category, price
FROM product_embeddings
LIMIT 10;
```

---

## Paso 2: Configurar Supabase en n8n

### Crear Credencial de Supabase

1. Ve a **Settings** → **Credentials** → **New Credential**
2. Busca **Supabase**
3. Completa:
   - **Host**: `https://xxx.supabase.co`
   - **Service Role Key**: Tu `SUPABASE_SERVICE_ROLE_KEY`

### Crear Credencial de OpenAI

1. Ve a **Settings** → **Credentials** → **New Credential**
2. Busca **OpenAI**
3. Completa:
   - **API Key**: Tu `OPENAI_API_KEY`

---

## Paso 3: Crear el Tool de Búsqueda

### Nodo: Supabase Vector Store Tool

En n8n, agrega un nodo **Vector Store Tool** con esta configuración:

```json
{
  "operation": "retrieve",
  "vectorStore": {
    "supabase": {
      "tableName": "product_embeddings",
      "queryColumn": "embedding",
      "contentColumn": "search_text"
    }
  },
  "topK": 5,
  "filter": {}
}
```

### Alternativa: HTTP Request + RPC

Si prefieres usar la función SQL directamente:

```javascript
// Nodo: HTTP Request
// Método: POST
// URL: {{ $credentials.supabase.host }}/rest/v1/rpc/match_products

// Body:
{
  "query_embedding": "{{ $json.embedding }}",
  "match_threshold": 0.7,
  "match_count": 5,
  "filter_category": null
}
```

### Generar Embedding de la Consulta

Antes de buscar, necesitas convertir la consulta del usuario a embedding:

```javascript
// Nodo: OpenAI
// Operación: Create Embedding
// Modelo: text-embedding-3-small
// Input: {{ $json.message }}
```

---

## Paso 4: Configurar el Agente

### Estructura del Workflow

```
┌─────────────┐    ┌──────────────┐    ┌─────────────────┐
│   Webhook   │───▶│   AI Agent   │───▶│ Response Node   │
│   Trigger   │    │   + Tools    │    │ (Timeline JSON) │
└─────────────┘    └──────────────┘    └─────────────────┘
                          │
           ┌──────────────┼──────────────┐
           ▼              ▼              ▼
    ┌────────────┐ ┌────────────┐ ┌────────────┐
    │ Search     │ │ Get User   │ │ Category   │
    │ Products   │ │ Context    │ │ Browser    │
    └────────────┘ └────────────┘ └────────────┘
```

### Configuración del AI Agent

```javascript
// System Prompt para el Agente

Eres "El Mayordomo", el asistente virtual de TusAguacates.com.
Tu personalidad es cálida, servicial y experta en productos frescos.

HERRAMIENTAS DISPONIBLES:
1. search_products: Busca productos por similitud semántica
2. get_user_context: Obtiene historial y preferencias del usuario
3. browse_categories: Lista categorías disponibles

REGLAS:
- Siempre usa search_products cuando el usuario mencione un producto o tipo de comida
- Muestra máximo 5 productos por respuesta
- Si no encuentras productos relevantes, sugiere categorías
- Incluye precios en formato COP (ej: $16,600)
- Responde SIEMPRE en español colombiano

FORMATO DE RESPUESTA:
Responde en JSON con estructura timeline:
{
  "timeline": [
    {"type": "text", "content": "mensaje"},
    {"type": "products", "items": [...]}
  ]
}
```

### Tool Definition: search_products

```json
{
  "name": "search_products",
  "description": "Busca productos en el catálogo usando búsqueda semántica. Usa esta herramienta cuando el usuario pregunte por productos, ingredientes o tipos de comida.",
  "parameters": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "La consulta de búsqueda (ej: 'ensalada', 'aguacate maduro', 'frutas rojas')"
      },
      "category": {
        "type": "string",
        "description": "Filtrar por categoría específica (opcional)"
      },
      "limit": {
        "type": "number",
        "description": "Número máximo de resultados (default: 5)"
      }
    },
    "required": ["query"]
  }
}
```

### Tool Definition: get_user_context

```json
{
  "name": "get_user_context",
  "description": "Obtiene el contexto del usuario: preferencias, historial de compras y mensajes recientes. Usa esta herramienta al inicio de la conversación para personalizar respuestas.",
  "parameters": {
    "type": "object",
    "properties": {
      "user_id": {
        "type": "string",
        "description": "UUID del usuario autenticado"
      }
    },
    "required": ["user_id"]
  }
}
```

---

## Paso 5: Probar el Sistema

### Test 1: Búsqueda Semántica

**Input:**
```json
{
  "message": "Quiero algo para una ensalada",
  "history": [],
  "userId": null,
  "cartContext": { "itemCount": 0, "total": 0, "items": [] }
}
```

**Output Esperado:**
```json
{
  "timeline": [
    { "type": "typing", "duration": 1500 },
    { "type": "text", "content": "¡Perfecto! Para tu ensalada te recomiendo estos productos frescos:" },
    {
      "type": "products",
      "items": [
        {
          "id": "verduras-lechuga-1",
          "name": "Lechuga Crespa",
          "price": 3500,
          "description": "Fresca y crujiente",
          "image": "/images/products/lechuga.jpg"
        },
        {
          "id": "verduras-tomate-2",
          "name": "Tomate Chonto",
          "price": 4200,
          "description": "Ideal para ensaladas",
          "image": "/images/products/tomate.jpg"
        }
      ]
    },
    {
      "type": "text",
      "content": "¿Te gustaría agregar aguacate? Queda espectacular en ensaladas 🥑"
    }
  ]
}
```

### Test 2: Usuario Recurrente

**Input:**
```json
{
  "message": "Hola",
  "history": [],
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "cartContext": { "itemCount": 0, "total": 0, "items": [] }
}
```

**Output Esperado:**
```json
{
  "timeline": [
    { "type": "typing", "duration": 1000 },
    { "type": "text", "content": "¡Hola Juan! Qué gusto verte de nuevo. La semana pasada compraste aguacates Hass, ¿te gustaría repetir el pedido?" },
    {
      "type": "options",
      "options": [
        { "label": "Sí, repetir pedido", "value": "repeat_order" },
        { "label": "Ver novedades", "value": "new_products" },
        { "label": "Buscar algo diferente", "value": "search" }
      ]
    }
  ]
}
```

### Verificar Logs

En la consola de n8n, deberías ver:

```
✅ Tool called: search_products
   Query: "ensalada"
   Results: 5 products (similarity > 0.7)

✅ Timeline generated: 3 items
   - text: "¡Perfecto! Para tu ensalada..."
   - products: 5 items
   - text: "¿Te gustaría agregar aguacate?"
```

---

## Referencia de Funciones SQL

### match_products

Busca productos por similitud de embedding.

```sql
SELECT * FROM match_products(
  query_embedding := '[0.1, 0.2, ...]'::vector,  -- Vector de 1536 dims
  match_threshold := 0.7,                         -- Mínima similitud
  match_count := 5,                               -- Máx resultados
  filter_category := 'Aguacates'                  -- Opcional
);
```

**Retorna:**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | ID del registro |
| product_id | TEXT | ID único del producto |
| product_name | TEXT | Nombre del producto |
| product_description | TEXT | Descripción |
| category | TEXT | Categoría |
| price | NUMERIC | Precio |
| metadata | JSONB | Variantes, beneficios, etc. |
| similarity | FLOAT | Score de similitud (0-1) |

### get_user_chat_context

Obtiene contexto completo del usuario.

```sql
SELECT * FROM get_user_chat_context('550e8400-e29b-41d4-a716-446655440000');
```

**Retorna:**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| user_context | JSONB | Preferencias, dietary_preferences, etc. |
| recent_messages | JSONB | Últimos 10 mensajes del chat |
| recent_purchases | JSONB | Últimas 3 órdenes |

### save_chat_message

Guarda un mensaje y actualiza contexto.

```sql
SELECT save_chat_message(
  p_session_id := '...',
  p_user_id := '...',
  p_guest_id := NULL,
  p_role := 'user',
  p_content := 'Quiero aguacates',
  p_message_type := 'text',
  p_metadata := '{}',
  p_cart_context := '{"itemCount": 2}',
  p_page_context := '/productos'
);
```

---

## Troubleshooting

### Error: "No embeddings found"

1. Verifica que ejecutaste el script de vectorización
2. Comprueba que los productos tienen `embedding IS NOT NULL`

```sql
SELECT COUNT(*) FROM product_embeddings WHERE embedding IS NULL;
```

### Error: "Similarity too low"

1. Reduce el `match_threshold` a 0.5
2. Verifica que el texto de búsqueda es relevante

### Error: "Rate limit exceeded" (OpenAI)

1. Aumenta el `rateLimitDelay` en el script
2. Considera usar batch embeddings
3. Usa un modelo más económico (`text-embedding-3-small`)

### Error: "Vector dimension mismatch"

1. Asegúrate de usar el mismo modelo para indexar y buscar
2. `text-embedding-3-small` = 1536 dimensiones
3. `text-embedding-3-large` = 3072 dimensiones

---

## Próximos Pasos

1. **Memoria Persistente**: Integrar `chat_history` para recordar conversaciones
2. **Proactividad**: Configurar triggers basados en tiempo y comportamiento
3. **Analytics**: Implementar dashboard de métricas del chat
4. **A/B Testing**: Probar diferentes prompts y respuestas

---

## Recursos

- [Supabase Vector Store Docs](https://supabase.com/docs/guides/ai/vector-columns)
- [n8n AI Agent Node](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.agent/)
- [OpenAI Embeddings API](https://platform.openai.com/docs/guides/embeddings)
- [pgvector Extension](https://github.com/pgvector/pgvector)
