-- ============================================================================
-- RECIPES AND HEALTHY TIPS SYSTEM FOR TUS AGUACATES
-- Migration: 20251223_create_recipes_and_tips.sql
-- Description: Complete schema for recipe videos generator with branding
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. RECIPES TABLE - Main recipe information
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Basic info (bilingual)
    title_es VARCHAR(200) NOT NULL,
    title_en VARCHAR(200),
    slug VARCHAR(200) UNIQUE NOT NULL,
    description_es TEXT,
    description_en TEXT,

    -- Recipe details
    prep_time_minutes INTEGER DEFAULT 10,
    cook_time_minutes INTEGER DEFAULT 0,
    total_time_minutes INTEGER GENERATED ALWAYS AS (prep_time_minutes + cook_time_minutes) STORED,
    servings INTEGER DEFAULT 2,
    difficulty VARCHAR(20) DEFAULT 'facil' CHECK (difficulty IN ('facil', 'medio', 'dificil')),

    -- Categorization
    category VARCHAR(50) DEFAULT 'general', -- guacamole, ensaladas, smoothies, snacks, etc.
    tags TEXT[] DEFAULT '{}',

    -- Video generation settings
    video_style VARCHAR(30) DEFAULT 'frame_elegante' CHECK (video_style IN (
        'frame_elegante',    -- Borde dorado elegante
        'sutil',             -- Mini logo en esquina
        'organico'           -- Elementos naturales integrados
    )),
    video_status VARCHAR(20) DEFAULT 'draft' CHECK (video_status IN (
        'draft',             -- Borrador
        'generating_images', -- Generando imágenes
        'generating_video',  -- Animando y ensamblando
        'ready',             -- Listo para publicar
        'published'          -- Publicado
    )),

    -- Generated video URLs
    video_url_vertical VARCHAR(500),    -- 9:16 para Instagram/TikTok
    video_url_horizontal VARCHAR(500),  -- 16:9 para YouTube/Web
    thumbnail_url VARCHAR(500),

    -- Social media links (after upload)
    instagram_url VARCHAR(500),
    tiktok_url VARCHAR(500),
    youtube_url VARCHAR(500),

    -- SEO & Display
    featured BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ,

    -- Admin tracking
    created_by UUID REFERENCES admin_users(id),
    updated_by UUID REFERENCES admin_users(id)
);

-- Index for fast lookups
CREATE INDEX idx_recipes_slug ON recipes(slug);
CREATE INDEX idx_recipes_category ON recipes(category);
CREATE INDEX idx_recipes_status ON recipes(video_status);
CREATE INDEX idx_recipes_featured ON recipes(featured) WHERE featured = TRUE;

-- ----------------------------------------------------------------------------
-- 2. RECIPE INGREDIENTS - Links recipes to products
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,

    -- Can link to existing product or be custom
    product_id VARCHAR(50), -- References product from JSON catalog

    -- Ingredient details (bilingual)
    name_es VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit_es VARCHAR(30) DEFAULT 'unidad', -- unidad, taza, cucharada, gramos, etc.
    unit_en VARCHAR(30) DEFAULT 'unit',

    -- For display
    is_optional BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    notes_es VARCHAR(200), -- "bien maduro", "picado finamente"
    notes_en VARCHAR(200),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);

-- ----------------------------------------------------------------------------
-- 3. RECIPE STEPS - Each step with video generation prompts
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recipe_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,

    -- Step instruction (bilingual)
    instruction_es TEXT NOT NULL,
    instruction_en TEXT,

    -- Subtitle for video (bilingual) - shorter version for overlay
    subtitle_es VARCHAR(100),
    subtitle_en VARCHAR(100),

    -- AI Image Generation
    image_prompt TEXT, -- Prompt for DALL-E/Midjourney
    image_url VARCHAR(500), -- Generated image URL
    image_selected BOOLEAN DEFAULT FALSE, -- User approved this image

    -- AI Video Animation
    animation_type VARCHAR(30) DEFAULT 'smooth_motion' CHECK (animation_type IN (
        'smooth_motion',     -- Movimiento suave general
        'cutting_motion',    -- Movimiento de corte
        'pouring_motion',    -- Vertiendo líquido
        'mixing_motion',     -- Mezclando
        'floating_ingredients', -- Ingredientes flotando
        'zoom_in',           -- Acercamiento
        'zoom_out',          -- Alejamiento
        'pan_left_right',    -- Paneo horizontal
        'ken_burns'          -- Efecto Ken Burns (zoom lento)
    )),
    animation_duration_seconds INTEGER DEFAULT 5,
    video_clip_url VARCHAR(500), -- Animated clip URL

    -- Timing in final video
    start_time_seconds DECIMAL(5,2),
    end_time_seconds DECIMAL(5,2),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(recipe_id, step_number)
);

CREATE INDEX idx_recipe_steps_recipe ON recipe_steps(recipe_id);

-- ----------------------------------------------------------------------------
-- 4. RECIPE VIDEOS - Generated video versions and metadata
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recipe_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,

    -- Video format
    format VARCHAR(10) NOT NULL CHECK (format IN ('9:16', '16:9')),

    -- Video file
    video_url VARCHAR(500) NOT NULL,
    duration_seconds INTEGER,
    file_size_mb DECIMAL(10,2),
    resolution VARCHAR(20), -- "1080x1920" or "1920x1080"

    -- Generation metadata
    generation_cost_usd DECIMAL(10,4), -- Track API costs
    generation_time_seconds INTEGER,
    ai_services_used TEXT[], -- ['dalle3', 'runway', 'ffmpeg']

    -- Versioning
    version INTEGER DEFAULT 1,
    is_current BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recipe_videos_recipe ON recipe_videos(recipe_id);

-- ----------------------------------------------------------------------------
-- 5. HEALTH TIPS - Tips saludables
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS health_tips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Content (bilingual)
    title_es VARCHAR(200) NOT NULL,
    title_en VARCHAR(200),
    content_es TEXT NOT NULL,
    content_en TEXT,

    -- Categorization
    category VARCHAR(50) DEFAULT 'general', -- nutricion, bienestar, consejos, datos
    tags TEXT[] DEFAULT '{}',

    -- Related product (optional)
    related_product_id VARCHAR(50),
    related_recipe_id UUID REFERENCES recipes(id),

    -- Media
    image_url VARCHAR(500),
    video_url VARCHAR(500), -- Short tip video

    -- Display
    icon VARCHAR(50) DEFAULT 'lightbulb', -- lucide icon name
    color VARCHAR(20) DEFAULT 'verde-aguacate', -- tailwind color
    featured BOOLEAN DEFAULT FALSE,

    -- Status
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    view_count INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ,

    -- Admin tracking
    created_by UUID REFERENCES admin_users(id)
);

CREATE INDEX idx_health_tips_category ON health_tips(category);
CREATE INDEX idx_health_tips_status ON health_tips(status);
CREATE INDEX idx_health_tips_featured ON health_tips(featured) WHERE featured = TRUE;

-- ----------------------------------------------------------------------------
-- 6. VIDEO BRAND SETTINGS - Global branding configuration
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS video_brand_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Only one active config
    is_active BOOLEAN DEFAULT TRUE,

    -- Brand colors (hex)
    primary_color VARCHAR(7) DEFAULT '#2D5016',      -- verde-bosque
    secondary_color VARCHAR(7) DEFAULT '#6B8E23',    -- verde-aguacate
    accent_color VARCHAR(7) DEFAULT '#D4AF37',       -- dorado
    background_color VARCHAR(7) DEFAULT '#FFFEF5',   -- crema
    text_color VARCHAR(7) DEFAULT '#FFFFFF',

    -- Frame style settings
    frame_style VARCHAR(30) DEFAULT 'frame_elegante',
    frame_border_width INTEGER DEFAULT 8,
    frame_corner_radius INTEGER DEFAULT 12,

    -- Logo settings
    logo_url VARCHAR(500),
    logo_position VARCHAR(20) DEFAULT 'bottom-right',
    logo_size INTEGER DEFAULT 80, -- pixels
    logo_opacity DECIMAL(3,2) DEFAULT 0.85,

    -- Watermark
    watermark_text VARCHAR(100) DEFAULT 'TusAguacates.com',
    watermark_font VARCHAR(50) DEFAULT 'Plus Jakarta Sans',

    -- Intro/Outro
    intro_duration_seconds DECIMAL(3,1) DEFAULT 3.0,
    outro_duration_seconds DECIMAL(3,1) DEFAULT 3.0,
    intro_logo_animation VARCHAR(30) DEFAULT 'fade_scale', -- fade_scale, slide_in, bounce
    outro_cta_text_es VARCHAR(100) DEFAULT 'Pide los ingredientes frescos',
    outro_cta_text_en VARCHAR(100) DEFAULT 'Order fresh ingredients',

    -- Subtitles
    subtitle_font VARCHAR(50) DEFAULT 'Plus Jakarta Sans',
    subtitle_font_size INTEGER DEFAULT 42,
    subtitle_position VARCHAR(20) DEFAULT 'bottom-center',
    subtitle_bg_opacity DECIMAL(3,2) DEFAULT 0.7,
    subtitle_style VARCHAR(20) DEFAULT 'modern', -- modern, classic, minimal

    -- Audio
    default_music_url VARCHAR(500),
    music_volume DECIMAL(3,2) DEFAULT 0.3,
    include_sound_effects BOOLEAN DEFAULT FALSE,

    -- Sparkle effects (signature Tus Aguacates style)
    include_sparkles BOOLEAN DEFAULT TRUE,
    sparkle_color VARCHAR(7) DEFAULT '#D4AF37',
    sparkle_intensity VARCHAR(10) DEFAULT 'subtle', -- subtle, medium, strong

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure only one active config
CREATE UNIQUE INDEX idx_video_brand_settings_active ON video_brand_settings(is_active) WHERE is_active = TRUE;

-- ----------------------------------------------------------------------------
-- 7. VIDEO GENERATION QUEUE - Track generation jobs
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS video_generation_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,

    -- Job info
    job_type VARCHAR(30) NOT NULL CHECK (job_type IN (
        'generate_image',
        'animate_image',
        'assemble_video',
        'full_pipeline'
    )),
    step_id UUID REFERENCES recipe_steps(id), -- For step-specific jobs

    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending',
        'processing',
        'completed',
        'failed',
        'cancelled'
    )),
    priority INTEGER DEFAULT 5, -- 1=highest, 10=lowest

    -- Progress
    progress_percent INTEGER DEFAULT 0,
    current_step VARCHAR(100),

    -- Results
    result_url VARCHAR(500),
    error_message TEXT,

    -- Timing
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    -- Cost tracking
    estimated_cost_usd DECIMAL(10,4),
    actual_cost_usd DECIMAL(10,4)
);

CREATE INDEX idx_video_queue_status ON video_generation_queue(status);
CREATE INDEX idx_video_queue_recipe ON video_generation_queue(recipe_id);

-- ----------------------------------------------------------------------------
-- 8. RECIPE ANALYTICS - Track views and engagement
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recipe_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,

    -- Event type
    event_type VARCHAR(30) NOT NULL CHECK (event_type IN (
        'page_view',
        'video_play',
        'video_complete',
        'add_to_cart',      -- Added ingredients to cart
        'share_instagram',
        'share_tiktok',
        'share_whatsapp'
    )),

    -- Context
    source VARCHAR(50), -- web, instagram, tiktok, etc.
    user_agent TEXT,
    ip_hash VARCHAR(64), -- Hashed for privacy

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recipe_analytics_recipe ON recipe_analytics(recipe_id);
CREATE INDEX idx_recipe_analytics_event ON recipe_analytics(event_type);
CREATE INDEX idx_recipe_analytics_date ON recipe_analytics(created_at);

-- ----------------------------------------------------------------------------
-- 9. RLS POLICIES
-- ----------------------------------------------------------------------------

-- Enable RLS
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_brand_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_generation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_analytics ENABLE ROW LEVEL SECURITY;

-- Public read for published recipes
CREATE POLICY "Public can view published recipes" ON recipes
    FOR SELECT USING (video_status = 'published');

CREATE POLICY "Public can view recipe ingredients" ON recipe_ingredients
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM recipes WHERE id = recipe_ingredients.recipe_id AND video_status = 'published')
    );

CREATE POLICY "Public can view recipe steps" ON recipe_steps
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM recipes WHERE id = recipe_steps.recipe_id AND video_status = 'published')
    );

CREATE POLICY "Public can view recipe videos" ON recipe_videos
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM recipes WHERE id = recipe_videos.recipe_id AND video_status = 'published')
    );

CREATE POLICY "Public can view published tips" ON health_tips
    FOR SELECT USING (status = 'published');

CREATE POLICY "Public can read brand settings" ON video_brand_settings
    FOR SELECT USING (is_active = TRUE);

-- Service role full access (for admin API)
CREATE POLICY "Service role full access recipes" ON recipes
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access ingredients" ON recipe_ingredients
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access steps" ON recipe_steps
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access videos" ON recipe_videos
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access tips" ON health_tips
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access brand settings" ON video_brand_settings
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access queue" ON video_generation_queue
    FOR ALL USING (auth.role() = 'service_role');

-- Analytics - anyone can insert, only service can read
CREATE POLICY "Anyone can insert analytics" ON recipe_analytics
    FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Service role can read analytics" ON recipe_analytics
    FOR SELECT USING (auth.role() = 'service_role');

-- ----------------------------------------------------------------------------
-- 10. HELPER FUNCTIONS
-- ----------------------------------------------------------------------------

-- Function to generate slug from title
CREATE OR REPLACE FUNCTION generate_recipe_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := LOWER(
            REGEXP_REPLACE(
                REGEXP_REPLACE(
                    UNACCENT(NEW.title_es),
                    '[^a-zA-Z0-9\s-]', '', 'g'
                ),
                '\s+', '-', 'g'
            )
        );
        -- Ensure uniqueness
        WHILE EXISTS (SELECT 1 FROM recipes WHERE slug = NEW.slug AND id != COALESCE(NEW.id, gen_random_uuid())) LOOP
            NEW.slug := NEW.slug || '-' || FLOOR(RANDOM() * 1000)::TEXT;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_recipe_slug
    BEFORE INSERT OR UPDATE ON recipes
    FOR EACH ROW
    EXECUTE FUNCTION generate_recipe_slug();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_recipe_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_recipe_timestamp
    BEFORE UPDATE ON recipes
    FOR EACH ROW
    EXECUTE FUNCTION update_recipe_timestamp();

CREATE TRIGGER trigger_update_step_timestamp
    BEFORE UPDATE ON recipe_steps
    FOR EACH ROW
    EXECUTE FUNCTION update_recipe_timestamp();

CREATE TRIGGER trigger_update_tip_timestamp
    BEFORE UPDATE ON health_tips
    FOR EACH ROW
    EXECUTE FUNCTION update_recipe_timestamp();

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_recipe_views(recipe_slug VARCHAR)
RETURNS VOID AS $$
BEGIN
    UPDATE recipes SET view_count = view_count + 1 WHERE slug = recipe_slug;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 11. INSERT DEFAULT BRAND SETTINGS
-- ----------------------------------------------------------------------------
INSERT INTO video_brand_settings (
    is_active,
    primary_color,
    secondary_color,
    accent_color,
    background_color,
    frame_style,
    logo_position,
    watermark_text,
    subtitle_style,
    include_sparkles,
    sparkle_color
) VALUES (
    TRUE,
    '#2D5016',
    '#6B8E23',
    '#D4AF37',
    '#FFFEF5',
    'frame_elegante',
    'bottom-right',
    'TusAguacates.com',
    'modern',
    TRUE,
    '#D4AF37'
) ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 12. SAMPLE RECIPE CATEGORIES (for reference)
-- ----------------------------------------------------------------------------
COMMENT ON TABLE recipes IS 'Categories: guacamole, ensaladas, smoothies, snacks, platos_principales, postres, bebidas, salsas';
COMMENT ON TABLE health_tips IS 'Categories: nutricion, bienestar, consejos, datos_curiosos, beneficios';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
