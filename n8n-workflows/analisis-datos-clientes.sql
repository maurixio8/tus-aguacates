-- =====================================================
-- 📊 ANÁLISIS DE DATOS CLIENTES - VERSIÓN CORREGIDA
-- =====================================================

-- 1️⃣ RESUMEN GENERAL
SELECT 
    COUNT(*) as total_clientes,
    COUNT(CASE WHEN nombre IS NOT NULL AND LENGTH(nombre) > 1 THEN 1 END) as con_nombre,
    COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as con_email,
    COUNT(CASE WHEN direccion IS NOT NULL THEN 1 END) as con_direccion,
    COUNT(CASE WHEN total_pedidos > 0 THEN 1 END) as con_pedidos,
    COUNT(CASE WHEN total_gastado > 0 THEN 1 END) as con_compras,
    COUNT(CASE WHEN activo = true THEN 1 END) as activos,
    COUNT(CASE WHEN puntos_fidelidad > 0 THEN 1 END) as con_puntos
FROM clientes;

-- 2️⃣ ESTADÍSTICAS DE COMPRAS
SELECT 
    SUM(total_pedidos) as pedidos_totales,
    SUM(total_gastado)::numeric(15,0) as gastado_total,
    AVG(total_gastado)::numeric(12,0) as promedio_gasto,
    MAX(total_gastado)::numeric(12,0) as max_gasto,
    SUM(puntos_fidelidad) as puntos_totales,
    SUM(pedidos_domicilio) as pedidos_domicilio,
    SUM(pedidos_llevar) as pedidos_llevar,
    SUM(pedidos_local) as pedidos_local
FROM clientes WHERE total_pedidos > 0;

-- 3️⃣ TOP 20 MEJORES CLIENTES
SELECT id, nombre, telefono, total_pedidos, total_gastado::numeric(12,0), puntos_fidelidad, tipo_cliente
FROM clientes WHERE total_pedidos > 0 ORDER BY total_gastado DESC LIMIT 20;

-- 4️⃣ SEGMENTACIÓN POR TIPO CLIENTE
SELECT tipo_cliente, COUNT(*) as cantidad, SUM(total_gastado)::numeric(15,0) as total_gastado
FROM clientes WHERE activo = true GROUP BY tipo_cliente ORDER BY cantidad DESC;

-- 5️⃣ SEGMENTACIÓN POR GASTO
SELECT 
    CASE 
        WHEN total_gastado >= 500000 THEN '🥇 VIP (>500K)'
        WHEN total_gastado >= 200000 THEN '🥈 Premium (200K-500K)'
        WHEN total_gastado >= 100000 THEN '🥉 Frecuente (100K-200K)'
        WHEN total_gastado >= 50000 THEN '⭐ Regular (50K-100K)'
        WHEN total_gastado > 0 THEN '👋 Ocasional (<50K)'
        ELSE '🆕 Sin compras'
    END as segmento,
    COUNT(*) as cantidad
FROM clientes WHERE activo = true
GROUP BY 1 ORDER BY MIN(total_gastado) DESC;

-- 6️⃣ TOP 250 PARA CAMPAÑA VIP
SELECT id, nombre, telefono, total_pedidos, total_gastado::numeric(12,0) as gastado
FROM clientes 
WHERE activo = true AND total_gastado > 0 AND nombre IS NOT NULL
ORDER BY total_gastado DESC LIMIT 250;

-- 7️⃣ CLIENTES SIN CAMPAÑA RECIENTE (reactivación)
SELECT COUNT(*) as sin_campana_reciente
FROM clientes 
WHERE activo = true 
  AND total_pedidos > 0
  AND (fecha_ultima_campana IS NULL OR fecha_ultima_campana < NOW() - INTERVAL '30 days');

-- 8️⃣ ORIGEN DE CLIENTES
SELECT origen, COUNT(*) as cantidad FROM clientes GROUP BY origen ORDER BY cantidad DESC;

-- 9️⃣ ESTADO DE CLIENTES  
SELECT estado_cliente, COUNT(*) as cantidad FROM clientes GROUP BY estado_cliente ORDER BY cantidad DESC;
