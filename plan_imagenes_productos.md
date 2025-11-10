# Plan de Implementación: Imágenes de Productos

## Estado Actual
- **Total productos**: 367
- **Productos con imagen**: 0
- **Estado**: Todos los productos tienen `main_image_url = null`

## Estrategia de Implementación

### Fase 1: Configuración de Infraestructura
1. Crear bucket en Supabase Storage: `product-images`
2. Configurar políticas de acceso público para lectura
3. Crear estructura de carpetas por categoría

### Fase 2: Obtención de Imágenes
Usar búsqueda automatizada de imágenes para obtener fotos de calidad profesional:

**Categorías principales**:
- Frutas (87 productos): Imágenes de frutas frescas
- Verduras (114 productos): Imágenes de vegetales frescos
- Aguacates (5 productos): Imágenes específicas de aguacates
- Cajas de Aguacate (9 productos): Cajas/empaques de aguacates
- Mallas de Aguacate (1 producto): Mallas con aguacates
- Combos (4 productos): Combinaciones de productos
- Hierbas Aromáticas (8 productos): Hierbas frescas
- Especias (59 productos): Especias en polvo/granos
- Otros (80 productos): Variedad según nombre del producto

**Método**: 
- Buscar imágenes por nombre de producto + categoría
- Descargar y optimizar (formato WebP, resolución 800x800)
- Subir a Supabase Storage con nombres únicos

### Fase 3: Asignación de Imágenes
1. Subir imágenes al bucket
2. Generar URLs públicas
3. Actualizar registros en tabla `products` con las URLs

### Fase 4: Validación
1. Verificar que todos los productos tienen imagen
2. Probar carga de imágenes en frontend
3. Optimizar rendimiento (lazy loading, CDN)

## Implementación Técnica

### Script Automatizado
Crear script Python que:
1. Lee productos de la BD
2. Busca imágenes apropiadas por categoría
3. Descarga y optimiza imágenes
4. Sube a Supabase Storage
5. Actualiza BD con URLs

### Estructura en Storage
```
product-images/
├── frutas/
│   ├── platano-verde-001.webp
│   ├── mango-tommy-002.webp
│   └── ...
├── verduras/
│   ├── tomate-chonto-001.webp
│   └── ...
├── aguacates/
├── cajas-aguacate/
├── hierbas/
└── especias/
```

## Tiempo Estimado
- Configuración Storage: 10 minutos
- Búsqueda y descarga de imágenes: 2-3 horas (automatizado)
- Subida y actualización BD: 30 minutos
- Validación y testing: 20 minutos

**Total**: ~4 horas (la mayor parte automatizada)

## Alternativa Rápida
Si se requiere solución inmediata:
- Usar imágenes placeholder genéricas por categoría (8 imágenes base)
- Cada categoría comparte 1-2 imágenes representativas
- Tiempo: 30 minutos

**Recomendación**: Implementar solución completa para mejor experiencia de usuario
