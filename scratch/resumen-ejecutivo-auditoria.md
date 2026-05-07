# RESUMEN EJECUTIVO - Auditoría de Catálogo Tus Aguacates
**Fecha:** 2026-05-07 | **Productos:** 196 | **API:** tusaguacates.com/api/agent/products

---

## 🟢 ¿QUÉ FUNCIONA BIEN?

| Aspecto | Estado | Detalle |
|---------|--------|---------|
| Búsqueda por nombres simples | ✅ | "tomate", "fresa", "aguacate", "lechuga" → resultados correctos |
| Plural/Singular | ✅ | API interna busca tokens, "tomate"/"tomates" funcionan igual |
| Números de 2 dígitos (fix aplicado) | ✅ | "caja 18", "caja 24", "12 unidades" se preservan |
| "caja 18" → "Caja Selección 18" | ✅ | Normalización pre-procesamiento funciona |
| "caja 24" → "Caja 24 unidades hass mediano" | ✅ | Normalización pre-procesamiento funciona |
| Champiñones enteros/tajados | ✅ | Lógica de distinción en `normalizarTerminoEspecial()` |
| "combo ahorro" → 3 combos | ✅ | API de Supabase busca bien |

---

## 🔴 RIESGOS ALTOS (13 productos con números)

| Producto | Riesgo | Búsqueda Cliente |
|----------|--------|-----------------|
| **Caja Selección 18** | ALTO | ✅ "caja 18" ok, ❌ "caja 18 hass" no encuentra |
| **Caja de 24 unidades hass mediano** | ALTO | ✅ "caja 24" ok |
| **Caja de 12 unidades Premium** | ALTO | ✅ "caja 12" ok |
| **Paquete 4 uni premium hass** | ALTO | ✅ "paquete 4" ok, ⚠️ "4 unidades" muestra varios |
| **Paquete 8 unidades mediano** | ALTO | ✅ "paquete 8" ok |
| **Injerto 4 unidades** | ALTO | ✅ "injerto 4" ok |
| **Nuevo combo 4** | ALTO | ✅ "combo 4" ok |
| **Combo Ahorro #1/#2/#3** | ALTO | ✅ "combo ahorro" ok, ⚠️ verificar "#" vs "1" |
| **Combo Aceite y Caja de Aguacates 24** | ALTO | ✅ "combo aceite" ok |
| **Miel de Abejas 100% Natural** | BAJO | "100%" no es problema de búsqueda |
| **Ají chipotle x 50 g** | BAJO | "x 50 g" en nombre, ok |

---

## 🟡 RIESGOS MEDIOS - Principales familias

| Familia | Productos | Riesgo |
|---------|-----------|--------|
| **Tomate** | Uvalina, cherry, chonto mixto, de Árbol, larga vida | 🟡 Cliente dice "tomate" → 5 opciones |
| **Ajo** | Nacional, Negro Artesanal, Polvo, importado, pelado importado, Pasta de Ajo | 🟡 6 productos de ajo |
| **Cebolla** | Ocañera, Puerro, cabezona blanca, larga, roja mediana | 🟡 5 cebollas |
| **Manzana** | combinada, de Agua, roja, verde | 🟡 4 manzanas |
| **Fresa** | Económica, premium | 🟡 2 calidades |
| **Papa** | criolla, sabanera | 🟡 2 tipos |
| **Champiñón** | enteros, tajados | 🟡 ya manejado |
| **Ciruela** | importada (x2), nacional | 🟡 posible duplicado |

---

## 🚨 HALLAZGOS CRÍTICOS

### 1. "Zumo" vs "Jugo" — MAPEO AUSENTE
**Problema:** 7 productos se llaman "Zumo [fruta] concentrado" pero los clientes dicen "jugo de [fruta]".
**Ejemplo:** Cliente: "¿tienen jugo de naranja?" → API busca "jugo naranja" → 0 resultados.
**Fix:** Agregar en `normalizarTerminoEspecial()`:
```javascript
if (/\b(zumo|jugo|jugos?)\b/.test(n)) return n.replace(/\bjugos?\b/g, 'zumo');
```

### 2. "Caja Selección 18" + "hass" = SIN RESULTADOS
**Problema:** Cliente dice "caja de 18 hass". La API busca "caja 18 hass" → 0 resultados porque el producto se llama "Caja Selección 18" (sin "hass" en el nombre).
**Fix:** El preprocesamiento normaliza "caja 18" correctamente cuando el texto contiene "18", pero si también tiene "hass" el término resultante es "caja 18 hass" que falla. Se necesita ajuste.

### 3. Combo Ahorro con numeral (#)
**Problema:** "Combo Ahorro #1" → cliente dice "combo ahorro 1" o "combo número 1". La API busca con/sin numeral.
**Fix:** Agregar mapeo: `/#(\d+)/g → '$1'` y `/(\d+)/g → '#$1'`

### 4. "Pasta de Ajo" confunde con "Ajo Polvo"
**Problema:** Ambos productos existen. Cliente dice "ajo molido" → no existe, debería sugerir "Ajo Polvo" o "Pasta de Ajo" según contexto.

### 5. Variantes sin precio (None)
**Problema:** Fresa Económica, Mango Común, Duraznos tienen variantes con `price: None`. Causa errores al mostrar precio.

---

## 📊 RESUMEN DE RIESGOS

```
🔴 ALTO RIESGO (con números):   13 productos  (7%)
🟡 MEDIO RIESGO (familias):    142 productos (72%)
🟢 BAJO RIESGO (únicos):        41 productos (21%)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL:                          196 productos
```

> **Nota:** El 72% medio riesgo es por productos con variantes (casi todos tienen 2 presentaciones: 500g/1kg). El riesgo real es que el agente muestre bien las opciones, no que falle la búsqueda.

---

## 📋 RECOMENDACIONES PRIORIZADAS

| # | Prioridad | Acción | Impacto |
|---|-----------|--------|---------|
| 1 | 🔴 CRÍTICO | Mapear "jugo" → "zumo" en `normalizarTerminoEspecial()` | 7 productos de zumo no encontrados |
| 2 | 🔴 CRÍTICO | Verificar búsqueda combos con numeral (#) | 3 combos |
| 3 | 🟡 ALTA | Informar que no hay "aguacate suelto", solo cajas | Expectativa cliente |
| 4 | 🟡 ALTA | Distinción "ajo molido/triturado" → Ajo Polvo vs Pasta de Ajo | 2 productos |
| 5 | 🟡 MEDIA | Alias "choclo/elote" → "mazorca" | 3 productos |
| 6 | 🟡 MEDIA | Revisar precios None en variantes | 3-4 productos |
| 7 | 🟢 BAJA | Duplicado "Ciruela importada" (mayúsc/minúsc) | 1 duplicado |

---

## 📁 ARCHIVOS GENERADOS

| Archivo | Descripción |
|---------|-------------|
| `scratch/auditoria-catalogo-productos.json` | Reporte completo (JSON, 49KB) |
| `scratch/all-products-raw.json` | Todos los productos (raw API, 164KB) |
| `scratch/resumen-ejecutivo-auditoria.md` | Este resumen |

---

## 🔍 CÓDIGO DE NORMALIZACIÓN ACTUAL

Análisis del preprocesamiento en `normalizarTerminoEspecial()`:

```javascript
// ACTUAL (en 1. Pre-procesamiento YCloud):
function normalizarTerminoEspecial(textoOriginal, limpio) {
    const n = normalizar(textoOriginal).replace(/jazz/g, 'hass');
    if (/b(caja|aguacate|...)b/.test(n) && /b18b/.test(n)) return 'caja 18';
    if (/b(caja|...)/.test(n) && /b24b/.test(n)) return 'caja 24';
    if (/b(champinon|...)b/.test(n)) return n.includes('tajad') ? 'champinones tajados' : 'champinones enteros';
    return limpio;
}
```

### Código sugerido para agregar:

```javascript
// NUEVOS MAPEOS PARA normalizarTerminoEspecial:

// 1. ZUMO → JUGO (y viceversa)
const conZumo = /\b(zumo|jugo|jugos?|sumo)\b/i;
if (conZumo.test(textoOriginal)) {
    return (limpio || textoOriginal)
        .replace(/\bjugos?\b/gi, 'zumo')
        .replace(/\bsumo\b/gi, 'zumo');
}

// 2. Combo Ahorro con/sin numeral
// Cliente dice "combo ahorro 1" → debe buscar "Combo Ahorro #1"
const comboNumeral = textoOriginal.match(/combo\s+(ahorro\s+)?#?(\d+)/i);
if (comboNumeral) {
    return 'combo ahorro #' + comboNumeral[2];
}

// 3. Mazorca / Choclo / Elote
if (/\b(choclo|elote)\b/i.test(textoOriginal)) {
    return (limpio || textoOriginal).replace(/\b(choclo|elote)s?\b/gi, 'mazorca');
}

// 4. Cebolla cabezona
if (/\b(cebolla\s+cabezona)\b/i.test(textoOriginal) && 
    !/\bblanca\b/i.test(textoOriginal)) {
    return 'cebolla cabezona blanca';
}
```
