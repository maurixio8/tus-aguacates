-- Crear tabla para mensajes configurables del banner
CREATE TABLE IF NOT EXISTS public.banner_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_type VARCHAR(50) NOT NULL,
    template_text TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    display_conditions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índice para mejor rendimiento
CREATE INDEX idx_banner_messages_active_priority ON public.banner_messages (is_active, priority DESC) WHERE is_active = true;

-- Crear trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_banner_messages_updated_at
    BEFORE UPDATE ON public.banner_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertar mensajes iniciales de ejemplo
INSERT INTO public.banner_messages (message_type, template_text, priority, display_conditions) VALUES
('stock', 'Solo {{stock}} cajas de {{product}} disponibles hoy', 10, '{"min_stock": 0, "max_stock": 50}'),
('offer', 'Las {{category}} están {{discount}}% más baratas esta semana', 20, '{"has_discount": true}'),
('urgency', '¡Últimas {{stock}} unidades de {{product}}!', 30, '{"max_stock": 10}'),
('promotion', 'Descuento especial en {{category}}: {{discount}}% OFF', 25, '{"has_discount": true}'),
('freshness', 'Recién llegada: Cosecha de {{product}} de hoy', 15, '{"is_fresh": true}'),
('seasonal', '¡Productos de temporada en su punto óptimo!', 5, '{}'),
('quality', 'Calidad Premium garantizada en todas nuestras {{category}}', 8, '{}'),
('combo', 'Solo {{stock}} cajas + {{discount}}% descuento en {{product}}', 35, '{"has_discount": true, "max_stock": 30}');

-- Políticas RLS (Row Level Security)
ALTER TABLE public.banner_messages ENABLE ROW LEVEL SECURITY;

-- Política para lecturas públicas (solo mensajes activos)
CREATE POLICY "Public read active messages" ON public.banner_messages
    FOR SELECT USING (is_active = true);

-- Política para administración completa
CREATE POLICY "Admin full access to banner messages" ON public.banner_messages
    FOR ALL USING (
        auth.uid() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );