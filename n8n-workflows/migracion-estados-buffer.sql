-- =====================================================
-- 📦 MIGRACIÓN: Buffer de Mensajes + Nuevos Estados
-- =====================================================
-- Ejecutar en PostgreSQL local
-- Fecha: 2026-01-10
-- =====================================================

-- =====================================================
-- 1. TABLA: mensaje_buffer
-- =====================================================
-- Almacena mensajes temporalmente para agrupar consecutivos

CREATE TABLE IF NOT EXISTS mensaje_buffer (
    id SERIAL PRIMARY KEY,
    cliente_telefono VARCHAR(20) NOT NULL,
    mensaje TEXT NOT NULL,
    mensaje_type VARCHAR(20) DEFAULT 'text',
    raw_data JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    procesado BOOLEAN DEFAULT FALSE,
    session_id UUID DEFAULT gen_random_uuid()
);

-- Índice principal para consultas de agrupación
CREATE INDEX IF NOT EXISTS idx_buffer_telefono_procesado 
ON mensaje_buffer (cliente_telefono, procesado, timestamp);

-- Índice para limpieza de mensajes antiguos
CREATE INDEX IF NOT EXISTS idx_buffer_timestamp 
ON mensaje_buffer (timestamp);

COMMENT ON TABLE mensaje_buffer IS 'Buffer temporal para agrupar mensajes consecutivos de un cliente (30s)';
COMMENT ON COLUMN mensaje_buffer.procesado IS 'true cuando ya fue enviado al AI Agent';

-- =====================================================
-- 2. ACTUALIZAR ESTADOS DE CONVERSACIÓN
-- =====================================================
-- Agregar PEDIDO_ONLINE y asegurar todos los estados

-- Primero eliminar el constraint viejo si existe
ALTER TABLE clientes 
DROP CONSTRAINT IF EXISTS chk_estado_conversacion;

-- Agregar constraint con todos los estados
ALTER TABLE clientes
ADD CONSTRAINT chk_estado_conversacion 
CHECK (estado_conversacion IN (
    'NUEVO',
    'ATENCION_LUZ',
    'EN_PEDIDO',
    'CONFIRMANDO',
    'PAGANDO',
    'COMPLETADO',
    'ESCALADO',
    'PEDIDO_ONLINE'
));

-- =====================================================
-- 3. TABLA: conversion_tracking
-- =====================================================
-- Métricas del funnel de ventas

CREATE TABLE IF NOT EXISTS conversion_tracking (
    id SERIAL PRIMARY KEY,
    cliente_telefono VARCHAR(20) NOT NULL,
    session_id UUID DEFAULT gen_random_uuid(),
    
    -- Timestamps de cada etapa
    ts_inicio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ts_primer_producto TIMESTAMP WITH TIME ZONE,
    ts_confirmando TIMESTAMP WITH TIME ZONE,
    ts_pagando TIMESTAMP WITH TIME ZONE,
    ts_completado TIMESTAMP WITH TIME ZONE,
    ts_abandonado TIMESTAMP WITH TIME ZONE,
    
    -- Datos del pedido
    productos_agregados INTEGER DEFAULT 0,
    total_carrito DECIMAL(12,2),
    
    -- Estado final
    resultado VARCHAR(20), -- 'completado', 'abandonado', 'escalado'
    
    -- Origen
    origen VARCHAR(20) DEFAULT 'whatsapp', -- 'whatsapp', 'tienda_online'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tracking_telefono 
ON conversion_tracking(cliente_telefono);

CREATE INDEX IF NOT EXISTS idx_tracking_fecha 
ON conversion_tracking(created_at);

COMMENT ON TABLE conversion_tracking IS 'Tracking del funnel de conversión por sesión de cliente';

-- =====================================================
-- 4. TABLA: transiciones_estado
-- =====================================================
-- Historial de cambios de estado

CREATE TABLE IF NOT EXISTS transiciones_estado (
    id SERIAL PRIMARY KEY,
    cliente_telefono VARCHAR(20) NOT NULL,
    estado_anterior VARCHAR(20),
    estado_nuevo VARCHAR(20) NOT NULL,
    trigger_mensaje TEXT,
    trigger_tipo VARCHAR(50), -- 'automatico', 'herramienta', 'admin'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transiciones_cliente 
ON transiciones_estado(cliente_telefono, created_at DESC);

COMMENT ON TABLE transiciones_estado IS 'Historial de todas las transiciones de estado por cliente';

-- =====================================================
-- 5. JOBS DE LIMPIEZA (ejecutar periódicamente)
-- =====================================================

-- Limpiar buffer de mensajes procesados > 1 hora
-- DELETE FROM mensaje_buffer WHERE procesado = true AND timestamp < NOW() - INTERVAL '1 hour';

-- Limpiar transiciones > 30 días
-- DELETE FROM transiciones_estado WHERE created_at < NOW() - INTERVAL '30 days';

-- =====================================================
-- 6. VERIFICACIÓN
-- =====================================================
SELECT 'Tablas creadas correctamente' as resultado;
