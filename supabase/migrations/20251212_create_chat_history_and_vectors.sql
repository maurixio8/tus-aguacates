-- =====================================================
-- EL MAYORDOMO "MAGISTRAL" - Migración de Arquitectura Empresarial
-- Crea tablas para historial de chat y búsqueda vectorial RAG
-- =====================================================

-- Habilitar extensión vector (pgvector) para embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- =====================================================
-- TABLA: chat_sessions
-- Sesiones de conversación agrupadas
-- =====================================================
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    guest_id TEXT, -- Para usuarios no autenticados
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    -- Contexto de la sesión
    initial_page TEXT, -- Página donde inició el chat
    device_type TEXT, -- mobile, desktop, tablet
    is_proactive BOOLEAN DEFAULT FALSE, -- Si el chat fue iniciado proactivamente

    CONSTRAINT check_user_or_guest CHECK (user_id IS NOT NULL OR guest_id IS NOT NULL)
);

-- =====================================================
-- TABLA: chat_history
-- Mensajes individuales del chat
-- =====================================================
CREATE TABLE IF NOT EXISTS public.chat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    guest_id TEXT,

    -- Contenido del mensaje
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,

    -- Metadata del mensaje
    message_type TEXT DEFAULT 'text', -- text, products, options, action
    metadata JSONB DEFAULT '{}', -- Productos mostrados, opciones, etc.

    -- Contexto en el momento del mensaje
    cart_context JSONB, -- Snapshot del carrito
    page_context TEXT, -- Página actual del usuario

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Índices para consultas
    CONSTRAINT check_chat_user_or_guest CHECK (user_id IS NOT NULL OR guest_id IS NOT NULL)
);

-- =====================================================
-- TABLA: product_embeddings
-- Vectores de embeddings para búsqueda semántica RAG
-- =====================================================
CREATE TABLE IF NOT EXISTS public.product_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT NOT NULL UNIQUE, -- Referencia al ID del producto

    -- Contenido indexado
    product_name TEXT NOT NULL,
    product_description TEXT,
    category TEXT,
    search_text TEXT NOT NULL, -- Texto combinado para embedding

    -- Vector embedding (1536 dimensiones para OpenAI, 384 para all-MiniLM)
    embedding vector(1536), -- Cambiar a 384 si usas modelos más pequeños

    -- Metadata del producto
    price NUMERIC(10, 2),
    metadata JSONB DEFAULT '{}', -- Variantes, beneficios, etc.

    -- Control de sincronización
    source_updated_at TIMESTAMPTZ, -- Última actualización del producto original
    embedding_updated_at TIMESTAMPTZ DEFAULT NOW(),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLA: user_context
-- Preferencias y contexto persistente del usuario
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_context (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Preferencias aprendidas
    preferred_categories TEXT[] DEFAULT '{}',
    dietary_preferences TEXT[] DEFAULT '{}', -- vegano, sin gluten, orgánico
    purchase_frequency TEXT, -- diario, semanal, mensual
    avg_order_value NUMERIC(10, 2),

    -- Contexto de interacción
    total_chats INTEGER DEFAULT 0,
    last_chat_at TIMESTAMPTZ,
    favorite_products TEXT[] DEFAULT '{}',

    -- Metadata adicional
    notes TEXT,
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES para rendimiento
-- =====================================================

-- Índice para buscar historial por usuario
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON public.chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_guest_id ON public.chat_history(guest_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_session_id ON public.chat_history(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_created_at ON public.chat_history(created_at DESC);

-- Índice para sesiones
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_guest_id ON public.chat_sessions(guest_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_started_at ON public.chat_sessions(started_at DESC);

-- Índice HNSW para búsqueda vectorial rápida (cosine similarity)
CREATE INDEX IF NOT EXISTS idx_product_embeddings_vector
ON public.product_embeddings
USING hnsw (embedding vector_cosine_ops);

-- Índice para búsqueda por categoría
CREATE INDEX IF NOT EXISTS idx_product_embeddings_category ON public.product_embeddings(category);

-- =====================================================
-- FUNCIÓN: match_products
-- Búsqueda semántica de productos por similitud de embedding
-- =====================================================
CREATE OR REPLACE FUNCTION public.match_products(
    query_embedding vector(1536),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 5,
    filter_category TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    product_id TEXT,
    product_name TEXT,
    product_description TEXT,
    category TEXT,
    price NUMERIC,
    metadata JSONB,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        pe.id,
        pe.product_id,
        pe.product_name,
        pe.product_description,
        pe.category,
        pe.price,
        pe.metadata,
        1 - (pe.embedding <=> query_embedding) as similarity
    FROM public.product_embeddings pe
    WHERE
        (filter_category IS NULL OR pe.category = filter_category)
        AND 1 - (pe.embedding <=> query_embedding) > match_threshold
    ORDER BY pe.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- =====================================================
-- FUNCIÓN: get_user_chat_context
-- Obtiene contexto del usuario para personalización
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_user_chat_context(p_user_id UUID)
RETURNS TABLE (
    user_context JSONB,
    recent_messages JSONB,
    recent_purchases JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        -- Contexto del usuario
        COALESCE(
            (SELECT to_jsonb(uc.*) FROM public.user_context uc WHERE uc.user_id = p_user_id),
            '{}'::jsonb
        ) as user_context,

        -- Últimos 10 mensajes
        COALESCE(
            (SELECT jsonb_agg(
                jsonb_build_object(
                    'role', ch.role,
                    'content', ch.content,
                    'created_at', ch.created_at
                ) ORDER BY ch.created_at DESC
            )
            FROM (
                SELECT role, content, created_at
                FROM public.chat_history
                WHERE user_id = p_user_id
                ORDER BY created_at DESC
                LIMIT 10
            ) ch),
            '[]'::jsonb
        ) as recent_messages,

        -- Últimas 3 órdenes
        COALESCE(
            (SELECT jsonb_agg(
                jsonb_build_object(
                    'id', o.id,
                    'total', o.total,
                    'created_at', o.created_at
                ) ORDER BY o.created_at DESC
            )
            FROM (
                SELECT id, total, created_at
                FROM public.orders
                WHERE user_id = p_user_id
                ORDER BY created_at DESC
                LIMIT 3
            ) o),
            '[]'::jsonb
        ) as recent_purchases;
END;
$$;

-- =====================================================
-- FUNCIÓN: save_chat_message
-- Guarda mensaje y actualiza contexto del usuario
-- =====================================================
CREATE OR REPLACE FUNCTION public.save_chat_message(
    p_session_id UUID,
    p_user_id UUID,
    p_guest_id TEXT,
    p_role TEXT,
    p_content TEXT,
    p_message_type TEXT DEFAULT 'text',
    p_metadata JSONB DEFAULT '{}',
    p_cart_context JSONB DEFAULT NULL,
    p_page_context TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    v_message_id UUID;
BEGIN
    -- Insertar mensaje
    INSERT INTO public.chat_history (
        session_id, user_id, guest_id, role, content,
        message_type, metadata, cart_context, page_context
    )
    VALUES (
        p_session_id, p_user_id, p_guest_id, p_role, p_content,
        p_message_type, p_metadata, p_cart_context, p_page_context
    )
    RETURNING id INTO v_message_id;

    -- Actualizar contexto del usuario si está autenticado
    IF p_user_id IS NOT NULL THEN
        INSERT INTO public.user_context (user_id, total_chats, last_chat_at)
        VALUES (p_user_id, 1, NOW())
        ON CONFLICT (user_id) DO UPDATE
        SET
            total_chats = user_context.total_chats + 1,
            last_chat_at = NOW(),
            updated_at = NOW();
    END IF;

    RETURN v_message_id;
END;
$$;

-- =====================================================
-- RLS (Row Level Security) Policies
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_embeddings ENABLE ROW LEVEL SECURITY;

-- Políticas para chat_sessions
CREATE POLICY "Users can view own sessions" ON public.chat_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions" ON public.chat_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Service role full access to sessions" ON public.chat_sessions
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Políticas para chat_history
CREATE POLICY "Users can view own chat history" ON public.chat_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own messages" ON public.chat_history
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Service role full access to history" ON public.chat_history
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Políticas para user_context
CREATE POLICY "Users can view own context" ON public.user_context
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own context" ON public.user_context
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to context" ON public.user_context
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Políticas para product_embeddings (lectura pública, escritura admin)
CREATE POLICY "Anyone can read product embeddings" ON public.product_embeddings
    FOR SELECT USING (true);

CREATE POLICY "Service role can manage embeddings" ON public.product_embeddings
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- COMENTARIOS DE DOCUMENTACIÓN
-- =====================================================
COMMENT ON TABLE public.chat_sessions IS 'Sesiones de conversación del Mayordomo Digital';
COMMENT ON TABLE public.chat_history IS 'Historial de mensajes individuales de cada chat';
COMMENT ON TABLE public.product_embeddings IS 'Vectores de embeddings para búsqueda semántica RAG';
COMMENT ON TABLE public.user_context IS 'Preferencias y contexto persistente del usuario';
COMMENT ON FUNCTION public.match_products IS 'Búsqueda semántica de productos usando similitud coseno';
COMMENT ON FUNCTION public.get_user_chat_context IS 'Obtiene contexto completo del usuario para el Mayordomo';
COMMENT ON FUNCTION public.save_chat_message IS 'Guarda un mensaje y actualiza automáticamente el contexto del usuario';
