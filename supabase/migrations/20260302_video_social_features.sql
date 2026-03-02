-- Migración para funcionalidades sociales de vídeos (Likes y Comentarios Moderados)
-- Fecha: 2026-03-02

-- 1. Tabla para Likes/Favoritos de vídeos
CREATE TABLE IF NOT EXISTS video_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL, -- ID del vídeo (ej: "video-1")
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Un usuario solo puede dar like una vez a cada vídeo
  UNIQUE(user_id, video_id)
);

-- 2. Tabla para Comentarios Moderados
CREATE TABLE IF NOT EXISTS video_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_video_likes_user_id ON video_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_video_likes_video_id ON video_likes(video_id);
CREATE INDEX IF NOT EXISTS idx_video_comments_video_id ON video_comments(video_id);
CREATE INDEX IF NOT EXISTS idx_video_comments_status ON video_comments(status);

-- Habilitar RLS
ALTER TABLE video_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_comments ENABLE ROW LEVEL SECURITY;

-- Políticas para LIKES
CREATE POLICY "Usuarios pueden ver todos los likes" 
  ON video_likes FOR SELECT USING (true);

CREATE POLICY "Usuarios pueden gestionar sus propios likes" 
  ON video_likes FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Políticas para COMENTARIOS
CREATE POLICY "Cualquiera puede ver comentarios aprobados" 
  ON video_comments FOR SELECT 
  USING (status = 'approved');

CREATE POLICY "Usuarios pueden ver sus propios comentarios pendientes" 
  ON video_comments FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden insertar sus propios comentarios" 
  ON video_comments FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar sus propios comentarios" 
  ON video_comments FOR DELETE 
  USING (auth.uid() = user_id);

-- Comentarios para documentación
COMMENT ON TABLE video_likes IS 'Almacena los likes de los vídeos por usuario';
COMMENT ON TABLE video_comments IS 'Almacena los comentarios de los vídeos con sistema de moderación';
