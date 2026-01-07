# 🚀 Mejoras Agente Luz v6

## 1. Toggle Modo Pruebas `/test` y `/admin`

### Código Actualizado para "1. Pre-procesamiento YCloud"

Reemplaza las líneas 64-89 del preprocesamiento actual con esto:

```javascript
// =====================================================
// 🛡️ DETECTAR MODO ADMIN/PRUEBAS (MAURICIO)
// =====================================================
const NUMEROS_DIRECTOR = ['573203062007', '3203062007'];

const fromRaw = whatsappMsg?.from || '';
const fromNormalizado = fromRaw.replace(/[+\s-]/g, '');
const messageText = whatsappMsg?.text?.body || '';

// NUEVO: Detectar comandos de toggle
const esComandoTest = messageText.toLowerCase().trim() === '/test';
const esComandoAdmin = messageText.toLowerCase().trim() === '/admin';

// Verificar si es el número del director
const esNumeroDirector = NUMEROS_DIRECTOR.some(num =>
    fromNormalizado === num ||
    fromNormalizado.endsWith(num)
);

// LÓGICA DE TOGGLE:
// - /test: Aunque sea el director, tratarlo como cliente
// - /admin: Volver a modo copiloto
// - Sin comando: comportamiento normal
let esComandoCopiloto = false;

if (esNumeroDirector) {
    if (esComandoTest) {
        // El director quiere probar como cliente
        return [{
            json: {
                esComandoCopiloto: false,
                from, to, customerName, saludo,
                messageText: '__MODO_TEST_ACTIVADO__',
                modoTestActivado: true,
                esRespuestaBoton: false,
                // ... resto de campos
            }
        }];
    } else if (esComandoAdmin) {
        // El director vuelve a modo admin
        return [{
            json: {
                esComandoCopiloto: true,
                from, to, customerName, saludo,
                messageText: '__MODO_ADMIN_ACTIVADO__',
                modoAdminActivado: true,
            }
        }];
    } else {
        // Comportamiento normal: es copiloto
        esComandoCopiloto = true;
    }
}
```

---

## 2. Nuevo Saludo Natural

### System Message Actualizado (sección Estado: NUEVO)

```markdown
#### Estado: NUEVO
1. Saluda así dependiendo si conoces el nombre:
   - **SIN nombre**: "[saludo del contexto] 😊 Bienvenido a tusaguacates.com. ¿En qué puedo servirte?"
   - **CON nombre**: "[saludo del contexto] [Nombre] 😊 Bienvenida/o a tusaguacates.com. ¿En qué puedo ayudarte hoy?"
2. NO pidas el nombre inmediatamente
3. Espera a que el cliente se presente o lo mencione naturalmente
4. Si el cliente pide algo sin presentarse, atiéndelo normalmente

**Ejemplos:**
- Cliente nuevo: "Buenas tardes 😊 Bienvenido a tusaguacates.com. ¿En qué puedo servirte?"
- Cliente con nombre (Claudia): "Hola Claudia, buenas tardes 😊 Bienvenida a tusaguacates.com. ¿En qué puedo ayudarte hoy?"
```

---

## 3. Nodo Pulidor de Respuestas (Filtro de Lenguaje)

### Nuevo Nodo: "✨ Pulir Respuesta" (Code Node)

**Ubicación**: Entre "🤖 Agente Luz v4" y "📤 Preparar Respuesta"

```javascript
// =====================================================
// ✨ PULIDOR DE RESPUESTAS - Filtro de Lenguaje
// =====================================================
// Mejora las respuestas para que sean más humanas y cercanas
// Costo: $0 (procesamiento local)
// =====================================================

const respuestaOriginal = $input.first().json.output || $input.first().json.text || '';

let respuestaMejorada = respuestaOriginal;

// 1. FORMATEO DE PRECIOS
// Convertir números a formato colombiano con separadores
respuestaMejorada = respuestaMejorada.replace(
    /\$(\d+)(?:\.(\d+))?/g,
    (match, entero, decimales) => {
        const numero = parseInt(entero);
        const formateado = numero.toLocaleString('es-CO');
        return decimales ? `$${formateado},${decimales}` : `$${formateado}`;
    }
);

// 2. LIMITAR LONGITUD (máx ~500 caracteres para WhatsApp)
if (respuestaMejorada.length > 600) {
    // Cortar en el último punto o salto de línea antes del límite
    const corte = respuestaMejorada.lastIndexOf('.', 550);
    if (corte > 300) {
        respuestaMejorada = respuestaMejorada.substring(0, corte + 1);
    } else {
        respuestaMejorada = respuestaMejorada.substring(0, 550) + '...';
    }
}

// 3. AGREGAR EMOJIS SI FALTAN
const tieneEmoji = /[\u{1F300}-\u{1F9FF}]/u.test(respuestaMejorada);
if (!tieneEmoji) {
    // Agregar emoji apropiado al inicio si no hay ninguno
    if (respuestaMejorada.toLowerCase().includes('pedido')) {
        respuestaMejorada = '📦 ' + respuestaMejorada;
    } else if (respuestaMejorada.toLowerCase().includes('aguacate')) {
        respuestaMejorada = '🥑 ' + respuestaMejorada;
    } else if (respuestaMejorada.toLowerCase().includes('gracias')) {
        respuestaMejorada = '💚 ' + respuestaMejorada;
    }
}

// 4. LIMPIAR FORMATO EXCESIVO
// Reducir múltiples saltos de línea
respuestaMejorada = respuestaMejorada.replace(/\n{3,}/g, '\n\n');

// Reducir múltiples espacios
respuestaMejorada = respuestaMejorada.replace(/  +/g, ' ');

// 5. AGREGAR TONO CERCANO
// Reemplazar frases formales por más cercanas
const reemplazos = {
    'Le informo que': 'Te cuento que',
    'Estimado cliente': '',
    'Por favor, proporcione': '¿Me das',
    'se encuentra disponible': 'tenemos disponible',
    'No dude en': 'Si necesitas algo más',
};

for (const [formal, cercano] of Object.entries(reemplazos)) {
    respuestaMejorada = respuestaMejorada.replace(new RegExp(formal, 'gi'), cercano);
}

// Retornar respuesta mejorada
return [{
    json: {
        ...$input.first().json,
        output: respuestaMejorada.trim(),
        text: respuestaMejorada.trim(),
        respuestaOriginal: respuestaOriginal
    }
}];
```

---

## 4. Selector de Modelos con Fallback

### Credenciales Necesarias en n8n

1. **Groq**: Crear credencial tipo "Header Auth"
   - Name: `Groq API`
   - Header Name: `Authorization`
   - Header Value: `Bearer YOUR_GROQ_KEY`

2. **OpenRouter**: Crear credencial tipo "Header Auth"
   - Name: `OpenRouter API`
   - Header Name: `Authorization`
   - Header Value: `Bearer YOUR_OPENROUTER_KEY`

### Nodo de Fallback (HTTP Request con Error Handling)

```javascript
// Configuración del nodo HTTP Request para Groq (primer intento)
{
  "url": "https://api.groq.com/openai/v1/chat/completions",
  "method": "POST",
  "body": {
    "model": "llama-3.3-70b-versatile",
    "messages": [
      {"role": "system", "content": "{{ $json.systemMessage }}"},
      {"role": "user", "content": "{{ $json.userMessage }}"}
    ],
    "temperature": 0.7,
    "max_tokens": 500
  },
  "options": {
    "timeout": 30000
  }
}
```

### Flujo de Fallback en n8n

```
[Mensaje] → [Try Groq] → ¿Error? → [Try OpenRouter] → ¿Error? → [OpenAI Backup]
                ↓ OK                      ↓ OK
            [Respuesta]              [Respuesta]
```

---

## 📋 Resumen de Cambios

| Cambio | Archivo/Nodo | Estado |
|--------|--------------|--------|
| Toggle `/test` `/admin` | Pre-procesamiento YCloud | 🔧 Por implementar |
| Nuevo saludo natural | System Message | 🔧 Por implementar |
| Pulidor de respuestas | Nuevo nodo Code | 🔧 Por implementar |
| Fallback APIs gratis | Múltiples nodos HTTP | 🔧 Por implementar |
