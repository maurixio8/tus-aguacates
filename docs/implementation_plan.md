# 🦅 Plan Maestro: El Mayordomo "Magistral" (Arquitectura Empresarial)

Este documento define la evolución del Mayordomo Digital de un demo funcional a un sistema empresarial con **RAG**, **Memoria Persistente** y **Proactividad Inteligente**.

---

## 📊 Estado Actual vs. Visión Objetivo

| Característica | Estado Actual (Demo) | Visión Magistral | Estado |
|----------------|----------------------|------------------|--------|
| Conocimiento | Hardcoded en n8n (~5 productos) | RAG: Acceso a 200+ productos | ✅ Infraestructura lista |
| Interacción | Reactiva (espera click) | Proactiva: Saluda según contexto | ✅ Motor implementado |
| Contexto | Se pierde tras recargar | Memoria Persistente en Supabase | ✅ Tablas creadas |
| UX Visual | Carrusel simple | Tarjetas + Filtros + Categorías | ⏳ En progreso |
| Búsqueda | Switch fijo | Búsqueda Semántica (Vector Search) | ✅ Endpoint creado |

---

## 🏗️ Arquitectura Implementada

### Diagrama de Flujo
Ver: [`/docs/architecture_diagram.mermaid`](./architecture_diagram.mermaid)

### Componentes Principales

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                  │
│  ChatBot.tsx + ProactiveEngine + ChatHistoryService             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API ROUTES (Next.js)                         │
│  /api/chat          → Proxy a n8n + persistencia                │
│  /api/chat/session  → Gestión de sesiones                       │
│  /api/products/search → Búsqueda semántica RAG                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     n8n (Orquestador IA)                         │
│  Webhook → AI Agent + Tools → Timeline Response                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SUPABASE                                    │
│  chat_sessions    → Sesiones de conversación                    │
│  chat_history     → Mensajes persistentes                       │
│  product_embeddings → Vectores para RAG                         │
│  user_context     → Preferencias aprendidas                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✅ Fase 1: Cimientos de Datos [COMPLETADO]

### 1.1 Migración de Base de Datos
**Archivo:** `supabase/migrations/20251212_create_chat_history_and_vectors.sql`

Tablas creadas:
- `chat_sessions` - Sesiones de conversación
- `chat_history` - Historial de mensajes
- `product_embeddings` - Vectores para búsqueda semántica
- `user_context` - Preferencias del usuario

Funciones SQL:
- `match_products()` - Búsqueda vectorial con similitud coseno
- `get_user_chat_context()` - Obtener contexto completo del usuario
- `save_chat_message()` - Guardar mensaje con actualización de contexto

### 1.2 Script de Vectorización
**Archivo:** `scripts/vectorize-catalog.ts`

```bash
# Ejecutar vectorización del catálogo
npx tsx scripts/vectorize-catalog.ts
```

El script:
1. Lee `productos tus_aguacates.json` (217 productos)
2. Genera embeddings con OpenAI (text-embedding-3-small)
3. Sube vectores a `product_embeddings` en Supabase

### 1.3 Documentación RAG
**Archivo:** `docs/n8n_rag_setup.md`

Guía completa para configurar:
- Vector Store Tool en n8n
- Funciones SQL de búsqueda
- Configuración del AI Agent

---

## ✅ Fase 2: UX "Magistral" [PARCIALMENTE COMPLETADO]

### 2.1 Motor de Proactividad
**Archivo:** `lib/chat/proactive-engine.ts`

Triggers implementados:
- `idle` - Usuario inactivo 30+ segundos
- `returning_user` - Usuario recurrente con compras previas
- `cart_reminder` - Carrito con items sin checkout
- `time_offer` - Ofertas según hora del día

### 2.2 Servicio de Historial
**Archivo:** `lib/chat/chat-history-service.ts`

Características:
- Persistencia en Supabase + localStorage (fallback)
- Gestión de sesiones
- Recuperación de contexto para n8n
- Sincronización entre dispositivos

### 2.3 API Endpoints Mejorados

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/chat` | POST | Chat principal con RAG context |
| `/api/chat/session` | POST | Crear nueva sesión |
| `/api/chat/session` | GET | Obtener sesión + mensajes |
| `/api/chat/session` | PATCH | Finalizar sesión |
| `/api/products/search` | POST | Búsqueda semántica |
| `/api/products/search` | GET | Búsqueda por texto |

---

## ⏳ Fase 3: Memoria y Personalización [PENDIENTE]

### 3.1 Integración en ChatBot.tsx
- [ ] Conectar ProactiveEngine al componente
- [ ] Usar ChatHistoryService para persistencia
- [ ] Mostrar historial al recargar página

### 3.2 n8n con Herramientas RAG
- [ ] Configurar Vector Store Tool
- [ ] Conectar función `match_products`
- [ ] Implementar herramienta `get_user_context`

### 3.3 Contexto en Tiempo Real
- [ ] Enviar `ragContext` completo a n8n
- [ ] Personalizar saludos según compras previas
- [ ] Sugerir productos basados en historial

---

## 🚀 Roadmap de Activación

### Paso 1: Base de Datos
```bash
# Aplicar migración
supabase db push
# O ejecutar manualmente el SQL
```

### Paso 2: Vectorizar Catálogo
```bash
# Configurar .env.local con OPENAI_API_KEY
npx tsx scripts/vectorize-catalog.ts
```

### Paso 3: Configurar n8n
1. Importar credenciales de Supabase
2. Configurar Vector Store Tool
3. Actualizar AI Agent con herramientas

### Paso 4: Activar en Frontend
1. Integrar servicios en ChatBot.tsx
2. Probar flujo completo
3. Verificar persistencia

---

## 📁 Archivos Creados

### Documentación
- `docs/architecture_diagram.mermaid` - Diagrama de arquitectura
- `docs/sequence_diagram.mermaid` - Flujo de secuencia
- `docs/n8n_rag_setup.md` - Guía de configuración RAG

### Servicios
- `lib/chat/index.ts` - Exportaciones centralizadas
- `lib/chat/proactive-engine.ts` - Motor de proactividad
- `lib/chat/chat-history-service.ts` - Servicio de historial

### API Routes
- `app/api/chat/route.ts` - Actualizado con RAG
- `app/api/chat/session/route.ts` - Gestión de sesiones
- `app/api/products/search/route.ts` - Búsqueda semántica

### Migraciones
- `supabase/migrations/20251212_create_chat_history_and_vectors.sql`

### Scripts
- `scripts/vectorize-catalog.ts` - Vectorización del catálogo

---

## 🔧 Variables de Entorno Requeridas

```env
# Supabase (existentes)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Supabase Admin (nuevo - solo servidor)
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# OpenAI (para embeddings)
OPENAI_API_KEY=sk-...

# n8n (existente)
N8N_CHAT_WEBHOOK_URL=https://tu-n8n.com/webhook/chat
```

---

## 📈 Métricas de Éxito

| Métrica | Actual | Objetivo |
|---------|--------|----------|
| Productos accesibles | ~5 | 217 |
| Tiempo de respuesta | N/A | <3s |
| Precisión de búsqueda | Exacta | Semántica (>0.7) |
| Retención de contexto | 0 mensajes | Ilimitado |
| Tasa de conversión | Baseline | +20% |

---

## ❓ Decisiones Pendientes

1. **Modelo de Embedding**: ¿text-embedding-3-small (económico) o large (preciso)?
2. **Threshold de Similitud**: ¿0.7 es adecuado o ajustar por categoría?
3. **Límite de Proactividad**: ¿3 triggers por sesión es suficiente?
4. **Retención de Historial**: ¿Cuánto tiempo guardar mensajes?

---

> **Próximo Paso**: Ejecutar migración en Supabase y vectorizar catálogo para pruebas de RAG.
