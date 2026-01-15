// Fix para el error de JSON con DISTINCT
const fs = require('fs');

const filePath = 'c:\\Users\\Usuario\\Documents\\proyecto tienda\\tus-aguacates\\n8n-workflows\\agente-luz-v6.5-admin-copiloto.json';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const busquedaNode = data.nodes.find(n => n.name === '3. Búsqueda Automática Productos');

if (busquedaNode) {
    // Query corregida: sin DISTINCT, usando GROUP BY en su lugar
    const queryCorregida = `WITH search_terms AS (
  SELECT '{{ $json.terminoBusqueda }}' as term_original, 
  CASE 
    WHEN '{{ $json.terminoBusqueda }}' ~ 'es$' AND LENGTH('{{ $json.terminoBusqueda }}') > 4 
    THEN TRIM(TRAILING 'es' FROM '{{ $json.terminoBusqueda }}') 
    WHEN '{{ $json.terminoBusqueda }}' ~ 's$' AND LENGTH('{{ $json.terminoBusqueda }}') > 3 
    THEN TRIM(TRAILING 's' FROM '{{ $json.terminoBusqueda }}') 
    ELSE '{{ $json.terminoBusqueda }}' 
  END as term_base
),
productos_match AS (
  SELECT 
    p.id, 
    p.name, 
    p.price, 
    p.main_image_url, 
    p.description, 
    p.category_name, 
    p.stock, 
    p.supabase_id,
    CASE 
      WHEN LOWER(p.name) LIKE LOWER(s.term_base) || '%' THEN 1 
      WHEN LOWER(p.category_name) LIKE '%' || LOWER(s.term_base) || '%' THEN 2 
      WHEN LOWER(p.name) LIKE '%' || LOWER(s.term_base) || '%' THEN 3 
      WHEN LOWER(p.description) LIKE '%' || LOWER(s.term_base) || '%' THEN 4 
      ELSE 5 
    END as match_priority
  FROM public.productos_tienda p, search_terms s 
  WHERE p.is_active = true 
  AND (
    LOWER(p.name) LIKE '%' || LOWER(s.term_base) || '%' 
    OR LOWER(p.category_name) LIKE '%' || LOWER(s.term_base) || '%' 
    OR LOWER(p.description) LIKE '%' || LOWER(s.term_base) || '%'
  )
)
SELECT 
  pm.id, 
  pm.name, 
  pm.price, 
  pm.main_image_url, 
  pm.description, 
  pm.category_name, 
  pm.stock, 
  pm.supabase_id,
  pm.match_priority,
  (SELECT COALESCE(json_agg(json_build_object(
    'variante_id', v.id,
    'tipo', v.variant_name,
    'presentacion', v.variant_value,
    'precio', v.price,
    'stock', v.stock_quantity
  ) ORDER BY v.price), '[]'::json)
  FROM variantes_productos v 
  WHERE v.product_supabase_id = pm.supabase_id 
  AND v.is_active = true) as variantes
FROM productos_match pm
GROUP BY pm.id, pm.name, pm.price, pm.main_image_url, pm.description, pm.category_name, pm.stock, pm.supabase_id, pm.match_priority
ORDER BY pm.match_priority, pm.name 
LIMIT 10;`;

    busquedaNode.parameters.query = queryCorregida;
    console.log('✅ Query corregida: sin DISTINCT, usando GROUP BY');
}

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('Archivo guardado!');
