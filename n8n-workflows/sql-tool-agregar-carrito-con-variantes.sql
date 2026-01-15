-- =====================================================
-- ACTUALIZACIÓN TOOL_AnadirAlCarrito para incluir VARIANTES
-- =====================================================
-- Este SQL debe reemplazar la query actual en el nodo TOOL_AnadirAlCarrito
-- del workflow Agente Luz
-- =====================================================

UPDATE clientes 
SET 
  pre_pedido = COALESCE(pre_pedido, '[]'::jsonb) || 
    jsonb_build_object(
      'producto_id', $1::int,
      'producto_nombre', $2,
      'precio', $3::numeric,
      'cantidad', $4::int,
      'variante_id', $5::int,
      'variante_nombre', $6
    ),
  estado_conversacion = 'EN_PEDIDO'
WHERE telefono = '{{ $('1. Pre-procesamiento YCloud').first().json.from }}'
RETURNING pre_pedido;

-- =====================================================
-- PARA LA SECCIÓN "Query Replacement" del nodo:
-- =====================================================
--
-- {{ $fromAI('producto_id','ID numérico del producto','number',0) }}
-- {{ $fromAI('producto_nombre','Nombre exacto del producto','string','') }}
-- {{ $fromAI('precio','Precio numérico del producto','number',0) }}
-- {{ $fromAI('cantidad','Cantidad a agregar','number',1) }}
-- {{ $fromAI('variante_id','ID de la variante seleccionada (puede ser null)','number',null) }}
-- {{ $fromAI('variante_nombre','Nombre de la variante (ej: 500g, 1kg, Bandeja)','string','') }}
--
-- =====================================================

-- =====================================================
-- TAMBIÉN: Actualiza la descripción de la herramienta:
-- =====================================================
--
-- "Añadir producto al carrito. PARÁMETROS OBLIGATORIOS:
-- - producto_id: ID numérico del producto
-- - producto_nombre: Nombre exacto del producto
-- - precio: Precio numérico
-- - cantidad: Cantidad a agregar (default 1)
-- - variante_id: ID de la variante (si aplica, puede ser null)
-- - variante_nombre: Nombre de la variante (ej: '500g', '1kg', 'Bandeja 12 unidades')"
--
-- =====================================================
