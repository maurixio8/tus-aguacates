# 🦅 Plan Maestro: Mayordomo Digital (Edición Director)

Este documento define la hoja de ruta para transformar el chat en un **Asistente de Ventas Activo**, basado en la realidad de "Tus Aguacates".

## 🎯 Objetivo
Crear un "Mayordomo Híbrido" que maximice el ticket promedio (Upsell) y reduzca la fricción de compra mediante botones y contenido visual, sin depender 100% de que el usuario escriba.

---

## 🏗️ Fase 1: Los Cimientos (INFRAESTRUCTURA) [✅ LISTO]
Hemos preparado el terreno técnico para que el asistente viva.
- [x] **API Proxy (`/api/chat`)**: El túnel seguro entre la tienda y el cerebro.
- [x] **Componente `ChatBot.tsx` 2.0**: 
    - Soporte para **Modo Cine** (Mensajes secuenciales).
    - Soporte para **Tarjetas de Producto Visuales**.
    - Soporte para **Botones de Acción**.
- [x] **Definición de Arquitectura**: Documento `assistant_architecture.md` aprobado.

---

## 🧠 Fase 2: El Cerebro (LÓGICA EN n8n) [⏳ PENDIENTE]
Aquí es donde definimos "qué piensa" el asistente. No escribiremos código en la web, configuraremos el flujo en n8n.

### Estrategia de Flujo (MVP "El Comprador con Prisa")
Implementaremos un árbol de decisión simple antes de conectar IA compleja.

1.  **El Saludo Inteligente**:
    - *Input:* ID de Usuario (Si existe).
    - *Lógica:* ¿Ha comprado antes? -> "Hola de nuevo Juan" vs "Bienvenido a la familia".
    - *Acción:* Mostrar Menú Principal (Botones).

2.  **El Menú Principal (Botones)**:
    - [🥑 Antojo Rápido] -> Lleva a Aguacates (Ticket Bajo).
    - [🏠 Mercado Semanal] -> Lleva a Combos (Ticket Alto - **Prioridad**).
    - [🔥 Ofertas] -> Upsell de productos en liquidación.

3.  **La Lógica de Venta (El "Vendedor")**:
    - Si elige **Mercado Semanal** -> Mostrar "Combo Completo ($68.900)" -> *Gancho: Envío Gratis*.
    - Si elige **Antojo** -> Mostrar "Pack x4 ($24.000)" -> *Upsell: "¿Llevas limones?"*.

### ❓ Preguntas para el Director (TÚ):
Para configurar esto con la realidad de tu negocio, necesito definir:
1.  **Cobertura**: ¿El "Combo Semanal" (que trae frescos) se puede enviar a **toda Colombia** o debemos preguntar primero "¿Estás en Bogotá?"? *Riesgo: Vender frescos a alguien en la costa que tardan 3 días.*
2.  **Stock Real**: ¿Podemos asumir que el "Combo Ahorro #2" siempre está disponible, o el n8n debe consultar el stock en Supabase antes de ofrecerlo?
3.  **Horario**: Si alguien escribe a las 3 AM, ¿el asistente debe decir "Te lo enviamos mañana" explícitamente?

---

### 🎨 Fase 3: Estética Premium & Escalabilidad Visual
Para mantener la fluidez y elegancia:

1.  **Regla de Oro del Carrusel**:
    - **Límite**: Máximo **5 productos** por tarjeta.
    - **Razón**: Más de 5 satura al usuario y ralentiza el chat.
    - **Solución "Ver Más"**: Si hay más productos, la última tarjeta o un botón debajo dirá: *"👀 Ver más [Categoría]"*.

2.  **Estética "Mayordomo"**:
    - **Colores**: Verde Bosque + Dorado.
    - **Animaciones**: Entrada suave (Fade-in).
    - **Tone of Voice**: Elegante pero cercano.

3.  **Botón "Ver Categorías"**:
    - Implementar un menú desplegable o botones escalonados para: *Frutas, Verduras, Tubérculos, Hierbas*.

## 🚀 Fase 4: Lanzamiento
1.  Conectar n8n a Producción.
2.  Prueba de fuego con 3 escenarios: "Comprador Nuevo", "Comprador Recurrente", "Usuario Enojado".

---

## User Review Required
> [!IMPORTANT]
> **Decisión Ejecutiva**: ¿Aprobamos la **Fase 2 (El Cerebro)** tal cual está descrita? ¿Y cuáles son las respuestas a las preguntas de Cobertura y Stock?
