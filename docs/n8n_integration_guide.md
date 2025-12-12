# 🧠 Guía de Integración: Cerebro n8n

Para que el "Mayordomo Digital" funcione, tu instancia de n8n debe cumplir con este contrato de datos.

## 1. El Webhook (Entrada)
Crea un nodo **Webhook** en n8n que acepte el método `POST`.
Este nodo recibirá el siguiente JSON desde nuestra tienda:

```json
{
  "message": "Quiero hacer un guacamole para 6 personas",
  "userId": "uuid-del-usuario-o-null",
  "cartContext": {
    "itemCount": 2,
    "total": 45000,
    "items": [
      { "name": "Cilantro", "qty": 1 }
    ]
  },
  "history": [
    { "role": "user", "content": "Hola" },
    { "role": "assistant", "content": "¡Hola!..." }
  ]
}
```

## 2. El Procesamiento (Tu Magia)
Aquí es donde conectas tu **AI Agent** (OpenAI/Anthropic).
- Usa `cartContext` para saber si el usuario ya tiene envío gratis.
- Usa `history` para mantener la conversación.
- Usa `message` como el prompt del usuario.

## 3. La Respuesta (Salida - Modo "Cine")
El último nodo de tu workflow debe devolver un JSON con una **Línea de Tiempo (timeline)**.
Esto permite que el bot envíe varios mensajes seguidos, piense, y luego muestre productos.

```json
{
  "timeline": [
    {
      "type": "text",
      "content": "¡Hola Ana! 👋 Qué bueno verte de nuevo.",
      "delay": 0
    },
    {
      "type": "typing",
      "duration": 1500
    },
    {
      "type": "text",
      "content": "Hoy llegaron unos Hass increíbles. ¿Buscas para hoy o para la semana?",
      "delay": 0
    },
    {
      "type": "options",
      "options": [
        { "label": "🥑 Para Hoy", "value": "maduros" },
        { "label": "📅 Para la Semana", "value": "verdes" }
      ]
    }
  ]
}
```

### Tipos de Elementos Soportados en `timeline`:
1.  **text**: Mensaje de texto simple.
2.  **typing**: Muestra "Escribiendo..." por `duration` milisegundos.
3.  **options**: Botones de respuesta rápida.
4.  **products**: Carrusel de tarjetas de producto.
    ```json
    {
      "type": "products",
      "items": [
        { "id": "1", "name": "Aguacate Hass", "price": 5500, "image": "..." }
      ]
    }
    ```


### 4. Ejemplos Reales (Copiar y Pegar en n8n)

#### A. El Saludo (Menú Principal)
Este JSON debe enviarse cuando `action == "greeting"`.

```json
{
  "timeline": [
    {
      "type": "text",
      "content": "¡Hola! 👋 Bienvenido a la familia Tus Aguacates.",
      "delay": 500
    },
    {
      "type": "text",
      "content": "Soy tu Mayordomo Digital. Viendo que es hora de mercado, ¿cómo te puedo servir hoy?",
      "delay": 0
    },
    {
      "type": "options",
      "options": [
        { "label": "🥑 Aguacates Hass", "value": "intent_avocados" },
        { "label": "🧺 Combos & Mercado", "value": "intent_market" },
        { "label": "🔥 Ofertas Flash", "value": "intent_offers" }
      ]
    }
  ]
}
```

#### B. Flujo "Mercado Semanal" (Ticket Alto)
Este JSON se envía cuando el usuario elige "Mercado Semanal".
*Nota: Usamos el producto real "Combo Mercado Semanal Completo" ($68.900).*

```json
{
  "timeline": [
    {
      "type": "typing",
      "duration": 1500
    },
    {
      "type": "text",
      "content": "¡Excelente decisión! 🌟 Para la semana, lo más inteligente es nuestro **Combo Full**.",
      "delay": 500
    },
    {
      "type": "text",
      "content": "Trae lo mejor de la cosecha y **TE DA ENVÍO GRATIS** de inmediato.",
      "delay": 0
    },
    {
      "type": "products",
      "items": [
        {
          "id": "combo-semanal-id", 
          "name": "Combo Mercado Semanal Completo",
          "price": 68900,
          "image": "https://tus-aguacates.com/images/combo-semanal.jpg",
          "description": "Variedad premium para toda la familia."
        }
      ]
    },
    {
      "type": "options",
      "options": [
        { "label": "🛒 Agregar al Carrito", "value": "action_add_combo_semanal" },
        { "label": "👀 Ver qué trae", "value": "action_details_combo_semanal" },
        { "label": "🔙 Ver algo más pequeño", "value": "intent_back_to_menu" }
      ]
    }
  ]
}
```

#### C. Flujo "Antojo de Frutas" (Frutos Rojos)
Este JSON se envía cuando el usuario elige "🍓 Antojo de Frutas".
*Nota: Mostramos un carrusel con lo más deseado.*

```json
{
  "timeline": [
    {
      "type": "typing",
      "duration": 1000
    },
    {
      "type": "text",
      "content": "¡Delicioso! Los frutos rojos están en su punto hoy. 🍒🍓",
      "delay": 0
    },
    {
      "type": "products",
      "items": [
        {
          "id": "fresa-premium-id",
          "name": "Fresas Premium (500g)",
          "price": 8500,
          "image": "https://tus-aguacates.com/images/fresa-premium.jpg",
          "description": "Dulces, rojas y gigantes."
        },
        {
          "id": "cerezas-id",
          "name": "Cerezas Frescas (250g)",
          "price": 20300,
          "image": "https://tus-aguacates.com/images/cerezas.jpg",
          "description": "La joya de la corona."
        }
      ]
    },
    {
      "type": "options",
      "options": [
        { "label": "🛒 Agregar Fresas", "value": "action_add_fresas" },
        { "label": "👀 Ver más Frutos Rojos", "value": "intent_more_berries_page_2" },
        { "label": "🔙 Ver Menú Principal", "value": "intent_back_to_menu" }
      ]
    }
  ]
}
```

#### D. Lógica de Calendario (Ejemplo de Respuesta)
Si el usuario pregunta "¿Cuándo llega?", el n8n debe calcular si es Martes o Viernes.

```json
{
  "timeline": [
    {
      "type": "text",
      "content": "Operamos con el modelo **'De la Plaza a tu Casa'** para garantizar frescura máxima.",
      "delay": 500
    },
    {
      "type": "text",
      "content": "Nuestras próximas rutas van el **Martes** y **Viernes**. Si ordenas ya, aseguras tu cupo en el camión. 🚚",
      "delay": 0
    }
  ]
}
```

