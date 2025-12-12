# 🛠️ Configuración de Herramientas (Tools) para el Mayordomo

Esta guía explica cómo configurar las herramientas que el AI Agent usará para buscar y mostrar productos.

---

## 📋 Resumen

El Mayordomo necesita "herramientas" para:
1. **Buscar productos** por nombre, categoría o descripción
2. **Obtener categorías** disponibles
3. **Ver detalles** de un producto específico

---

## 🔧 API Disponible

### Endpoint Base
```
https://tu-dominio.vercel.app/api/chatbot/products
```

Para el preview de Vercel:
```
https://tus-aguacates-git-claude-en-XXXXX.vercel.app/api/chatbot/products
```

---

## 1️⃣ Herramienta: Buscar Productos

### Configuración en n8n

1. **Agrega un nodo "HTTP Request Tool"** conectado al AI Agent
2. Configura así:

| Campo | Valor |
|-------|-------|
| **Method** | POST |
| **URL** | `https://tu-dominio.vercel.app/api/chatbot/products` |
| **Authentication** | None (es público) |
| **Body Content Type** | JSON |

### Body (JSON)
```json
{
  "query": "{{ $fromAI('query', 'Término de búsqueda del usuario') }}",
  "category": "{{ $fromAI('category', 'Categoría específica (opcional)') }}",
  "limit": 5
}
```

### Tool Description (para el AI Agent)
```
Busca productos en el catálogo de Tus Aguacates.

Parámetros:
- query: Texto de búsqueda (ej: "aguacates", "frutas", "manzanas")
- category: Filtrar por categoría (ej: "Aguacates", "Frutas Tropicales", "Verduras")
- limit: Máximo de productos a retornar (default: 5)

Usa esta herramienta cuando el usuario:
- Pregunte por productos específicos
- Quiera ver opciones de una categoría
- Busque algo para cocinar o una receta

Ejemplo de respuesta:
{
  "products": [
    {
      "id": "abc123",
      "name": "Caja de 24 unidades hass mediano",
      "price": 16600,
      "image": "https://...",
      "category": "Aguacates"
    }
  ],
  "contextMessage": "Encontré 3 productos..."
}
```

---

## 2️⃣ Herramienta: Obtener Categorías

### Configuración en n8n

1. **Agrega otro nodo "HTTP Request Tool"**
2. Configura así:

| Campo | Valor |
|-------|-------|
| **Method** | GET |
| **URL** | `https://tu-dominio.vercel.app/api/chatbot/products?action=categories` |

### Tool Description
```
Obtiene la lista de categorías de productos disponibles.

Usa esta herramienta cuando:
- El usuario pregunte "¿qué tienen?"
- Quiera ver las opciones disponibles
- No sepa qué buscar

Respuesta:
{
  "categories": [
    { "name": "Aguacates", "description": "..." },
    { "name": "Frutas Tropicales", "description": "..." }
  ]
}
```

---

## 3️⃣ Configuración del System Prompt

Actualiza el **System Message** del AI Agent:

```
Eres el Mayordomo de Tus Aguacates, un asistente de ventas experto y amable.

TU PERSONALIDAD:
- Colombiano, cálido y servicial
- Experto en frutas, verduras y productos frescos
- Enfocado en ayudar al cliente a encontrar lo que necesita

TUS HERRAMIENTAS:
1. buscar_productos: Busca productos por nombre o categoría
2. obtener_categorias: Lista las categorías disponibles

REGLAS DE RESPUESTA:
1. Cuando muestres productos, SIEMPRE incluye el precio formateado en pesos colombianos
2. Usa el campo "image" de cada producto para mostrar la foto
3. Sugiere productos complementarios (upsell)
4. Si no encuentras lo que busca, ofrece alternativas

FORMATO DE RESPUESTA:
Responde SIEMPRE en formato JSON con esta estructura:

Para mostrar productos:
{
  "text": "Tu mensaje aquí",
  "products": [
    {
      "id": "abc123",
      "name": "Nombre del producto",
      "price": 16600,
      "image": "URL de la imagen",
      "description": "Descripción corta"
    }
  ]
}

Para respuesta simple:
{
  "text": "Tu mensaje aquí"
}

EJEMPLOS:

Usuario: "Quiero aguacates"
Acción: Usa buscar_productos con query="aguacates"
Respuesta: Muestra los productos encontrados con sus imágenes y precios

Usuario: "¿Qué tienen?"
Acción: Usa obtener_categorias
Respuesta: Lista las categorías disponibles como botones
```

---

## 4️⃣ Configurar Respond to Webhook

El nodo **Respond to Webhook** debe transformar la respuesta del AI al formato timeline:

### Expresión para el Body:
```javascript
// Si el AI devolvió productos
{{
  JSON.stringify({
    timeline: [
      {
        type: "text",
        content: $json.output?.text || $json.output || "¿En qué puedo ayudarte?"
      },
      ...($json.output?.products ? [{
        type: "products",
        items: $json.output.products.map(p => ({
          id: p.id,
          name: p.name,
          price: p.price,
          image: p.image,
          description: p.description || ""
        }))
      }] : [])
    ]
  })
}}
```

**Alternativa más simple** (si el AI ya devuelve JSON):
```json
{
  "timeline": [
    {
      "type": "text",
      "content": "{{ $json.output }}"
    }
  ]
}
```

---

## 5️⃣ Flujo Completo en n8n

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Webhook   │────▶│  Es Botón?   │────▶│ Respuesta       │
│   (POST)    │     │  (IF node)   │     │ Estática        │
└─────────────┘     └──────────────┘     └─────────────────┘
                           │
                           │ False (texto libre)
                           ▼
                    ┌──────────────┐
                    │  AI Agent    │
                    │  (Mistral)   │
                    └──────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
       ┌───────────┐ ┌───────────┐ ┌───────────┐
       │ Buscar    │ │ Obtener   │ │ Ver       │
       │ Productos │ │ Categorías│ │ Producto  │
       │ (HTTP)    │ │ (HTTP)    │ │ (HTTP)    │
       └───────────┘ └───────────┘ └───────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  Respond to  │
                    │  Webhook     │
                    └──────────────┘
```

---

## 6️⃣ Probar la API

### Desde terminal:
```bash
# Buscar productos
curl -X POST https://tu-dominio.vercel.app/api/chatbot/products \
  -H "Content-Type: application/json" \
  -d '{"query": "aguacate", "limit": 3}'

# Obtener categorías
curl "https://tu-dominio.vercel.app/api/chatbot/products?action=categories"

# Productos destacados
curl "https://tu-dominio.vercel.app/api/chatbot/products"
```

### Respuesta esperada:
```json
{
  "success": true,
  "products": [
    {
      "id": "product-1",
      "name": "Caja de 24 unidades hass mediano",
      "description": "",
      "price": 16600,
      "image": "https://gxqkmaaqoehydulksudj.supabase.co/storage/v1/object/public/product-images/...",
      "category": "Aguacates",
      "unit": "caja",
      "stock": 100,
      "is_available": true
    }
  ],
  "count": 1,
  "contextMessage": "Encontré 1 producto relacionado con \"aguacate\":"
}
```

---

## 🎯 Próximos Pasos

1. [ ] Configurar las herramientas HTTP en n8n
2. [ ] Actualizar el System Prompt del AI Agent
3. [ ] Probar búsqueda de productos desde el chat
4. [ ] Agregar herramienta para gestionar carrito
