// ============================================================================
// TYPES FOR RECIPES AND VIDEO GENERATOR SYSTEM
// TUS AGUACATES - Recipe Video Generator
// ============================================================================

// ----------------------------------------------------------------------------
// ENUMS AND CONSTANTS
// ----------------------------------------------------------------------------

export type RecipeDifficulty = 'facil' | 'medio' | 'dificil';

export type VideoStyle = 'frame_elegante' | 'sutil' | 'organico';

export type VideoStatus = 'draft' | 'generating_images' | 'generating_video' | 'ready' | 'published';

export type AnimationType =
  | 'smooth_motion'
  | 'cutting_motion'
  | 'pouring_motion'
  | 'mixing_motion'
  | 'floating_ingredients'
  | 'zoom_in'
  | 'zoom_out'
  | 'pan_left_right'
  | 'ken_burns';

export type VideoFormat = '9:16' | '16:9';

export type TipStatus = 'draft' | 'published' | 'archived';

export type TipCategory = 'nutricion' | 'bienestar' | 'consejos' | 'datos_curiosos' | 'beneficios' | 'general';

export type RecipeCategory =
  | 'guacamole'
  | 'ensaladas'
  | 'smoothies'
  | 'snacks'
  | 'platos_principales'
  | 'postres'
  | 'bebidas'
  | 'salsas'
  | 'general';

export type QueueJobType = 'generate_image' | 'animate_image' | 'assemble_video' | 'full_pipeline';

export type QueueStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export type AnalyticsEventType =
  | 'page_view'
  | 'video_play'
  | 'video_complete'
  | 'add_to_cart'
  | 'share_instagram'
  | 'share_tiktok'
  | 'share_whatsapp';

// ----------------------------------------------------------------------------
// RECIPE TYPES
// ----------------------------------------------------------------------------

export interface Recipe {
  id: string;

  // Basic info (bilingual)
  title_es: string;
  title_en?: string;
  slug: string;
  description_es?: string;
  description_en?: string;

  // Recipe details
  prep_time_minutes: number;
  cook_time_minutes: number;
  total_time_minutes: number; // Generated field
  servings: number;
  difficulty: RecipeDifficulty;

  // Categorization
  category: RecipeCategory;
  tags: string[];

  // Video settings
  video_style: VideoStyle;
  video_status: VideoStatus;

  // Video URLs
  video_url_vertical?: string;
  video_url_horizontal?: string;
  thumbnail_url?: string;

  // Social media
  instagram_url?: string;
  tiktok_url?: string;
  youtube_url?: string;

  // Display
  featured: boolean;
  view_count: number;

  // Timestamps
  created_at: string;
  updated_at: string;
  published_at?: string;

  // Relations (populated on queries)
  ingredients?: RecipeIngredient[];
  steps?: RecipeStep[];
  videos?: RecipeVideo[];
}

export interface RecipeIngredient {
  id: string;
  recipe_id: string;

  // Product link (optional)
  product_id?: string;

  // Ingredient details (bilingual)
  name_es: string;
  name_en?: string;
  quantity: number;
  unit_es: string;
  unit_en?: string;

  // Display
  is_optional: boolean;
  sort_order: number;
  notes_es?: string;
  notes_en?: string;

  created_at: string;

  // Populated on queries
  product?: {
    id: string;
    name: string;
    price: number;
    image?: string;
    main_image_url?: string;
  };
}

export interface RecipeStep {
  id: string;
  recipe_id: string;
  step_number: number;

  // Instructions (bilingual)
  instruction_es: string;
  instruction_en?: string;

  // Subtitles for video (bilingual)
  subtitle_es?: string;
  subtitle_en?: string;

  // AI Image Generation
  image_prompt?: string;
  image_url?: string;
  image_selected: boolean;

  // AI Video Animation
  animation_type: AnimationType;
  animation_duration_seconds: number;
  video_clip_url?: string;

  // Timing
  start_time_seconds?: number;
  end_time_seconds?: number;

  created_at: string;
  updated_at: string;
}

export interface RecipeVideo {
  id: string;
  recipe_id: string;

  // Format
  format: VideoFormat;

  // File info
  video_url: string;
  duration_seconds?: number;
  file_size_mb?: number;
  resolution?: string;

  // Generation metadata
  generation_cost_usd?: number;
  generation_time_seconds?: number;
  ai_services_used?: string[];

  // Versioning
  version: number;
  is_current: boolean;

  created_at: string;
}

// ----------------------------------------------------------------------------
// HEALTH TIPS TYPES
// ----------------------------------------------------------------------------

export interface HealthTip {
  id: string;

  // Content (bilingual)
  title_es: string;
  title_en?: string;
  content_es: string;
  content_en?: string;

  // Categorization
  category: TipCategory;
  tags: string[];

  // Relations
  related_product_id?: string;
  related_recipe_id?: string;

  // Media
  image_url?: string;
  video_url?: string;

  // Display
  icon: string;
  color: string;
  featured: boolean;

  // Status
  status: TipStatus;
  view_count: number;

  // Timestamps
  created_at: string;
  updated_at: string;
  published_at?: string;

  // Relations (populated)
  related_recipe?: Recipe;
}

// ----------------------------------------------------------------------------
// VIDEO BRAND SETTINGS
// ----------------------------------------------------------------------------

export interface VideoBrandSettings {
  id: string;
  is_active: boolean;

  // Colors
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;

  // Frame style
  frame_style: VideoStyle;
  frame_border_width: number;
  frame_corner_radius: number;

  // Logo
  logo_url?: string;
  logo_position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  logo_size: number;
  logo_opacity: number;

  // Watermark
  watermark_text: string;
  watermark_font: string;

  // Intro/Outro
  intro_duration_seconds: number;
  outro_duration_seconds: number;
  intro_logo_animation: 'fade_scale' | 'slide_in' | 'bounce';
  outro_cta_text_es: string;
  outro_cta_text_en: string;

  // Subtitles
  subtitle_font: string;
  subtitle_font_size: number;
  subtitle_position: 'top-center' | 'center' | 'bottom-center';
  subtitle_bg_opacity: number;
  subtitle_style: 'modern' | 'classic' | 'minimal';

  // Audio
  default_music_url?: string;
  music_volume: number;
  include_sound_effects: boolean;

  // Sparkles
  include_sparkles: boolean;
  sparkle_color: string;
  sparkle_intensity: 'subtle' | 'medium' | 'strong';

  created_at: string;
  updated_at: string;
}

// ----------------------------------------------------------------------------
// VIDEO GENERATION QUEUE
// ----------------------------------------------------------------------------

export interface VideoGenerationJob {
  id: string;
  recipe_id: string;

  job_type: QueueJobType;
  step_id?: string;

  status: QueueStatus;
  priority: number;

  progress_percent: number;
  current_step?: string;

  result_url?: string;
  error_message?: string;

  created_at: string;
  started_at?: string;
  completed_at?: string;

  estimated_cost_usd?: number;
  actual_cost_usd?: number;
}

// ----------------------------------------------------------------------------
// ANALYTICS
// ----------------------------------------------------------------------------

export interface RecipeAnalytics {
  id: string;
  recipe_id: string;
  event_type: AnalyticsEventType;
  source?: string;
  created_at: string;
}

// Aggregated analytics for display
export interface RecipeAnalyticsSummary {
  recipe_id: string;
  total_views: number;
  video_plays: number;
  video_completions: number;
  cart_additions: number;
  shares: {
    instagram: number;
    tiktok: number;
    whatsapp: number;
  };
}

// ----------------------------------------------------------------------------
// API REQUEST/RESPONSE TYPES
// ----------------------------------------------------------------------------

// Create Recipe
export interface CreateRecipeRequest {
  title_es: string;
  title_en?: string;
  description_es?: string;
  description_en?: string;
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  servings?: number;
  difficulty?: RecipeDifficulty;
  category?: RecipeCategory;
  tags?: string[];
  video_style?: VideoStyle;
  ingredients?: CreateRecipeIngredientRequest[];
  steps?: CreateRecipeStepRequest[];
}

export interface CreateRecipeIngredientRequest {
  product_id?: string;
  name_es: string;
  name_en?: string;
  quantity: number;
  unit_es?: string;
  unit_en?: string;
  is_optional?: boolean;
  notes_es?: string;
  notes_en?: string;
}

export interface CreateRecipeStepRequest {
  instruction_es: string;
  instruction_en?: string;
  subtitle_es?: string;
  subtitle_en?: string;
  image_prompt?: string;
  animation_type?: AnimationType;
  animation_duration_seconds?: number;
}

// Update Recipe
export interface UpdateRecipeRequest extends Partial<CreateRecipeRequest> {
  video_status?: VideoStatus;
  featured?: boolean;
}

// Recipe with full relations
export interface RecipeWithDetails extends Recipe {
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  videos: RecipeVideo[];
  analytics_summary?: RecipeAnalyticsSummary;
}

// List recipes response
export interface RecipeListResponse {
  recipes: Recipe[];
  total: number;
  page: number;
  per_page: number;
}

// Video generation request
export interface GenerateVideoRequest {
  recipe_id: string;
  formats: VideoFormat[];
  regenerate_images?: boolean;
  priority?: number;
}

// Health tip requests
export interface CreateHealthTipRequest {
  title_es: string;
  title_en?: string;
  content_es: string;
  content_en?: string;
  category?: TipCategory;
  tags?: string[];
  related_product_id?: string;
  related_recipe_id?: string;
  icon?: string;
  color?: string;
}

export interface UpdateHealthTipRequest extends Partial<CreateHealthTipRequest> {
  status?: TipStatus;
  featured?: boolean;
}

// ----------------------------------------------------------------------------
// HELPERS AND UTILITIES
// ----------------------------------------------------------------------------

// Get difficulty label in Spanish
export const difficultyLabels: Record<RecipeDifficulty, string> = {
  facil: 'Fácil',
  medio: 'Medio',
  dificil: 'Difícil',
};

// Get category label in Spanish
export const categoryLabels: Record<RecipeCategory, string> = {
  guacamole: 'Guacamole',
  ensaladas: 'Ensaladas',
  smoothies: 'Smoothies',
  snacks: 'Snacks',
  platos_principales: 'Platos Principales',
  postres: 'Postres',
  bebidas: 'Bebidas',
  salsas: 'Salsas',
  general: 'General',
};

// Get animation label
export const animationLabels: Record<AnimationType, string> = {
  smooth_motion: 'Movimiento Suave',
  cutting_motion: 'Movimiento de Corte',
  pouring_motion: 'Vertiendo',
  mixing_motion: 'Mezclando',
  floating_ingredients: 'Ingredientes Flotando',
  zoom_in: 'Acercamiento',
  zoom_out: 'Alejamiento',
  pan_left_right: 'Paneo Horizontal',
  ken_burns: 'Efecto Ken Burns',
};

// Get video status label
export const statusLabels: Record<VideoStatus, string> = {
  draft: 'Borrador',
  generating_images: 'Generando Imágenes',
  generating_video: 'Generando Video',
  ready: 'Listo',
  published: 'Publicado',
};

// Format time helper
export function formatRecipeTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

// Get localized content helper
export function getLocalizedContent<T extends { [key: string]: any }>(
  item: T,
  field: string,
  locale: 'es' | 'en' = 'es'
): string {
  const localizedField = `${field}_${locale}`;
  const fallbackField = `${field}_es`;
  return item[localizedField] || item[fallbackField] || '';
}

// Calculate total ingredients cost
export function calculateIngredientsCost(ingredients: RecipeIngredient[]): number {
  return ingredients.reduce((total, ing) => {
    if (ing.product?.price) {
      return total + (ing.product.price * ing.quantity);
    }
    return total;
  }, 0);
}
