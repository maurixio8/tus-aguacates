-- =====================================================
-- 🥑 TUS AGUACATES - Base de Datos para Agente WhatsApp
-- =====================================================
-- Ejecutar en tu PostgreSQL Docker
-- =====================================================

-- Tabla de clientes
CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    telefono VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(100),
    email VARCHAR(100),
    direccion TEXT,
    ciudad VARCHAR(50) DEFAULT 'Bogotá',
    notas TEXT,
    
    -- Métricas
    total_pedidos INTEGER DEFAULT 0,
    total_gastado DECIMAL(12,2) DEFAULT 0,
    ultima_compra TIMESTAMP,
    
    -- Estado
    fecha_registro TIMESTAMP DEFAULT NOW(),
    activo BOOLEAN DEFAULT TRUE,
    
    -- Conversación
    ultimo_mensaje TIMESTAMP,
    estado_conversacion VARCHAR(50) DEFAULT 'idle',
    contexto_conversacion JSONB DEFAULT '{}'::jsonb,
    
    -- Índices útiles
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índice para búsquedas rápidas por teléfono
CREATE INDEX IF NOT EXISTS idx_clientes_telefono ON clientes(telefono);
CREATE INDEX IF NOT EXISTS idx_clientes_activo ON clientes(activo);

-- Tabla de conversaciones (historial)
CREATE TABLE IF NOT EXISTS conversaciones (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
    
    -- Mensajes
    mensaje_entrante TEXT,
    mensaje_saliente TEXT,
    
    -- Metadata
    intencion VARCHAR(50), -- compra, consulta, queja, seguimiento
    confianza DECIMAL(3,2),
    resuelto BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índice para búsquedas por cliente
CREATE INDEX IF NOT EXISTS idx_conversaciones_cliente ON conversaciones(cliente_id);
CREATE INDEX IF NOT EXISTS idx_conversaciones_fecha ON conversaciones(created_at DESC);

-- Tabla de pedidos desde WhatsApp (opcional, para tracking)
CREATE TABLE IF NOT EXISTS pedidos_whatsapp (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES clientes(id),
    
    -- Datos del pedido
    productos JSONB, -- Array de productos
    total DECIMAL(12,2),
    estado VARCHAR(50) DEFAULT 'pendiente',
    
    -- Delivery
    direccion_entrega TEXT,
    fecha_entrega_solicitada DATE,
    hora_entrega_solicitada TIME,
    
    -- Notas
    notas TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    confirmado_at TIMESTAMP,
    entregado_at TIMESTAMP
);

-- Índice para pedidos
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente ON pedidos_whatsapp(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos_whatsapp(estado);

-- Tabla de campañas de mensajes (para seguimiento automático)
CREATE TABLE IF NOT EXISTS campanas_mensajes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    mensaje_template TEXT NOT NULL,
    
    -- Segmentación
    filtro_clientes JSONB, -- Criterios de selección
    
    -- Programación
    programado_para TIMESTAMP,
    ejecutado_at TIMESTAMP,
    
    -- Estadísticas
    total_enviados INTEGER DEFAULT 0,
    total_entregados INTEGER DEFAULT 0,
    total_leidos INTEGER DEFAULT 0,
    total_respuestas INTEGER DEFAULT 0,
    
    -- Estado
    estado VARCHAR(50) DEFAULT 'borrador',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_clientes_updated_at ON clientes;
CREATE TRIGGER update_clientes_updated_at
    BEFORE UPDATE ON clientes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pedidos_updated_at ON pedidos_whatsapp;
CREATE TRIGGER update_pedidos_updated_at
    BEFORE UPDATE ON pedidos_whatsapp
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DATOS DE PRUEBA (Opcional)
-- =====================================================

-- Insertar algunos clientes de ejemplo
INSERT INTO clientes (telefono, nombre, email, ciudad, total_pedidos)
VALUES 
    ('573001234567', 'Cliente Prueba', 'prueba@email.com', 'Bogotá', 0),
    ('573009876543', 'María García', 'maria@email.com', 'Bogotá', 3)
ON CONFLICT (telefono) DO NOTHING;

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista de clientes con última conversación
CREATE OR REPLACE VIEW v_clientes_conversaciones AS
SELECT 
    c.id,
    c.telefono,
    c.nombre,
    c.total_pedidos,
    c.ultima_compra,
    c.activo,
    (SELECT mensaje_entrante 
     FROM conversaciones 
     WHERE cliente_id = c.id 
     ORDER BY created_at DESC 
     LIMIT 1) as ultimo_mensaje_cliente,
    (SELECT created_at 
     FROM conversaciones 
     WHERE cliente_id = c.id 
     ORDER BY created_at DESC 
     LIMIT 1) as fecha_ultimo_mensaje
FROM clientes c;

-- Vista de métricas diarias
CREATE OR REPLACE VIEW v_metricas_diarias AS
SELECT 
    DATE(created_at) as fecha,
    COUNT(*) as total_conversaciones,
    COUNT(DISTINCT cliente_id) as clientes_unicos,
    COUNT(CASE WHEN resuelto THEN 1 END) as resueltas
FROM conversaciones
GROUP BY DATE(created_at)
ORDER BY fecha DESC;

-- =====================================================
-- PERMISOS (Ajustar según tu configuración)
-- =====================================================

-- Si usas un usuario específico para n8n
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO tu_usuario_n8n;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO tu_usuario_n8n;

COMMENT ON TABLE clientes IS 'Clientes registrados desde WhatsApp - Tus Aguacates';
COMMENT ON TABLE conversaciones IS 'Historial de conversaciones del agente IA';
COMMENT ON TABLE pedidos_whatsapp IS 'Pedidos iniciados desde WhatsApp';
COMMENT ON TABLE campanas_mensajes IS 'Campañas de mensajes masivos programados';
