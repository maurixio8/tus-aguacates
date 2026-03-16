# Auditoria De Catalogo

Fecha: 2026-03-16

## Resumen Ejecutivo

Revise el catalogo activo directamente en Supabase para separar dos problemas que hoy se mezclan en operacion:

1. deuda real del catalogo actual
2. deuda historica de pedidos que no guardaron bien la variante

Hallazgo principal: el catalogo activo no esta roto a nivel de duplicados exactos, pero si tiene deuda de modelado y normalizacion. Mucho de lo que aparece como `sin variante` en `lista-compras` no significa que el catalogo actual no tenga variante; significa que el pedido historico no la persistio bien.

## Foto Actual Del Catalogo Activo

- Productos activos: 193
- Productos sin variantes: 3
- Productos con una sola variante: 54
- Productos con multiples variantes: 136

Los 3 productos activos sin variantes son:

- `Aceite de Aguacate`
- `Combo Aceite y Caja de Aguacates 24`
- `Combo Aceite y Caja PREMIUM aguacates`

## Que Si Tiene Variantes Hoy

Revise varios de los productos que se veian mal en `lista-compras` y confirme que en el catalogo activo si tienen variantes definidas. Algunos ejemplos:

- `Arandanos Organicos` -> `X125grs`, `X250grs`
- `Cerezas` -> `125 grs`, `250grs`
- `Ciruela nacional` -> `500grs`, `1000grs`
- `Fresa Economica` -> `500 gr`, `1000 gr`, `500grs`, `1000grs`
- `Fresas premium` -> `250 gr`, `500 gr`, `1000 gr`
- `Granadillas` -> `Bandeja`, `2 Bandejas`
- `Kiwis` -> `450grs`, `900grs`
- `Limon tahiti` -> `500grs`, `1000grs`
- `Mandarina` -> `500grs`, `1000grs`
- `Mango Azucar` -> `1 kg`, `500grs`, `1000grs`
- `Mango Comun` -> `500grs`, `1 kg`, `1000grs`
- `Papa criolla` -> `X 500 grs`, `X 1000 grs`
- `Tomate cherry` -> `250 grs`, `500 grs`
- `Uva verde importada sin semilla` -> `500grs`, `1000 grs`
- `Zucchini Amarillo` -> `500gr`, `1000gr`
- `Zucchini verde` -> `500gr`, `1000gr`

Conclusion operativa: si estos productos siguen apareciendo `sin variante` en la lista de compras, el problema ya no es el catalogo activo sino la calidad del dato historico guardado en pedidos.

## Hallazgos Del Catalogo

### 1. Variantes con formato inconsistente

No encontre duplicados exactos de productos activos, pero si variantes equivalentes escritas de formas distintas.

Casos confirmados:

- `Aceite de coco`: `105 ml` y `X 105 ml`; `250 ml` y `X 250 ml`; `500 ml` y `X 500 ml`
- `Frijol desgranado`: `1000 gr` y `1000gr`

Esto hoy contamina la lectura operativa y obliga a meter reglas especiales en UI/reportes.

### 2. Empaque o cantidad metidos en el nombre del producto

Encontre 28 productos cuyo nombre ya trae empaque, peso o presentacion que deberia vivir principalmente en la variante.

Ejemplos prioritarios:

- `Banano bocadillo kilo`
- `Banano criollo Kilo`
- `Ciruela importada bandeja`
- `Mangostinos kilo`
- `Mazorca sabanera x3 uni`
- `Apio Entero paquete`
- `Apio tallos bandeja`
- `Cebolla larga malla`
- `Champiñones tajados bandeja`
- `Manzanilla paquete`
- `Manzana bandeja combinada`
- `Manzana roja Bandeja`
- `Manzana verde Bandeja`

Esto no siempre es un bug, pero si es una senal de catalogo mezclando identidad de producto con presentacion.

### 3. Familias que merecen decision de negocio

No las trataria como duplicado automatico sin validar con ustedes, pero si requieren criterio:

- `Apio Entero paquete` vs `Apio tallos bandeja`
- `Ciruela Importada` vs `Ciruela importada bandeja`
- `Toronja x1000 grs` vs `Toronja x1kilo`
- `Zanahoria` vs `Zanahoria baby`
- `Flor de Jamaica` vs `Flor de Jamaica Extra`

Algunas pueden ser productos realmente distintos. Otras parecen la misma familia mal modelada.

## Mi Opinion Profesional

El catalogo actual esta utilizable, pero no esta gobernado todavia. El problema principal no es cantidad de productos; es falta de una convencion unica para:

- nombre base del producto
- variante
- empaque
- peso
- unidad de venta

Mientras eso siga repartido entre `name`, `variant_value` y el historial de pedidos, la operacion siempre va a sentir que el catalogo esta "sucio", aunque tecnicamente el producto exista.

## Recomendacion Por Etapas

### Fase 1

- Congelar una convencion canonica para variantes: `gr`, `kg`, `ml`, `unidad`, `bandeja`, `paquete`, `malla`
- Normalizar primero casos evidentes:
  - `Aceite de coco`
  - `Frijol desgranado`
  - `Fresa Economica`
  - `Duraznos`

### Fase 2

- Renombrar productos donde el empaque esta en `name` y pasar esa informacion a variante cuando aplique
- Prioridad:
  - `Banano bocadillo kilo`
  - `Banano criollo Kilo`
  - `Ciruela importada bandeja`
  - `Mangostinos kilo`
  - `Mazorca sabanera x3 uni`

### Fase 3

- Backfill del historial de pedidos o tabla de aliases para que `lista-compras` y reportes no dependan de nombres viejos
- Agregar validacion en admin para que no se creen nuevas variantes con formato libre

## Utilidad Reproducible

Deje una utilidad para repetir esta auditoria:

`node scripts/audit-catalog-normalization.js`

Usa variables de entorno existentes y revisa:

- resumen del catalogo activo
- variantes con formato inconsistente
- nombres con empaque incrustado
- familias que parecen partidas en varios productos
