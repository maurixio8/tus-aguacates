-- Crear tabla de administradores para el sistema de autenticación
-- Migration: create_admin_auth.sql
-- Creado: 2025-11-11
-- BMAD Spectrum Plan - Fase 1.1

-- Extensión para UUIDs si no está disponible
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de usuarios administradores
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'admin',
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para registro de actividad de administradores
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(100),
  record_id VARCHAR(100),
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin_id ON admin_activity_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_action ON admin_activity_log(action);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_created_at ON admin_activity_log(created_at);

-- Insertar administrador inicial (credenciales: admin@tusaguacates.com / admin123)
INSERT INTO admin_users (email, password_hash, name, role, is_active)
VALUES (
  'admin@tusaguacates.com',
  '$2b$10$rJzGKQgxX5vCEXvmEdvxCOHxzj2jJ8iJGHsWn.CVRmRsUpnEpMA1e', -- hash de 'admin123'
  'Administrador Principal',
  'super_admin',
  TRUE
) ON CONFLICT (email) DO NOTHING;

-- Habilitar Row Level Security (RLS)
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para admin_users
-- Solo usuarios autenticados pueden leer administradores
CREATE POLICY "Allow authenticated users to read admin users"
ON admin_users FOR SELECT
USING (auth.role() = 'authenticated');

-- Solo super_admins pueden modificar otros admins
CREATE POLICY "Allow super_admins to manage admin users"
ON admin_users FOR ALL
USING (
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid() AND role = 'super_admin' AND is_active = TRUE
  )
);

-- Políticas de seguridad para admin_activity_log
-- Los admins pueden ver su propia actividad
CREATE POLICY "Allow admins to read own activity"
ON admin_activity_log FOR SELECT
USING (
  auth.role() = 'authenticated' AND
  admin_id = auth.uid()
);

-- Los super_admins pueden ver toda la actividad
CREATE POLICY "Allow super_admins to read all activity"
ON admin_activity_log FOR SELECT
USING (
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid() AND role = 'super_admin' AND is_active = TRUE
  )
);

-- Los admins pueden registrar su propia actividad
CREATE POLICY "Allow admins to insert own activity"
ON admin_activity_log FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated' AND
  admin_id = auth.uid()
);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentarios para documentación
COMMENT ON TABLE admin_users IS 'Tabla de usuarios administradores del sistema';
COMMENT ON TABLE admin_activity_log IS 'Registro de auditoría de actividades de administradores';
COMMENT ON COLUMN admin_users.password_hash IS 'Hash de contraseña usando bcrypt';
COMMENT ON COLUMN admin_users.role IS 'Rol del administrador: admin, super_admin, viewer';
COMMENT ON COLUMN admin_activity_log.action IS 'Acción realizada: login, logout, create, update, delete';
COMMENT ON COLUMN admin_activity_log.old_values IS 'Valores anteriores antes del cambio (JSON)';
COMMENT ON COLUMN admin_activity_log.new_values IS 'Nuevos valores después del cambio (JSON)';