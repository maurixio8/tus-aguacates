-- Asegurar que la tabla profiles existe con todos los campos necesarios
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  preferred_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  preferred_payment_method TEXT CHECK (preferred_payment_method IN ('daviplata', 'efectivo')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver su propio perfil
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Política: Los usuarios pueden insertar su propio perfil
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Política: Los usuarios pueden actualizar su propio perfil
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Política: Los admins pueden ver todos los perfiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Comentarios en la tabla y columnas
COMMENT ON TABLE profiles IS 'Perfiles de usuario con información personal y preferencias';
COMMENT ON COLUMN profiles.id IS 'ID del usuario (referencia a auth.users)';
COMMENT ON COLUMN profiles.full_name IS 'Nombre completo del usuario';
COMMENT ON COLUMN profiles.preferred_name IS 'Nombre preferido para saludos personalizados';
COMMENT ON COLUMN profiles.phone IS 'Número de teléfono del usuario';
COMMENT ON COLUMN profiles.avatar_url IS 'URL del avatar del usuario';
COMMENT ON COLUMN profiles.role IS 'Rol del usuario: customer o admin';
COMMENT ON COLUMN profiles.preferred_payment_method IS 'Método de pago preferido: daviplata o efectivo';
COMMENT ON COLUMN profiles.created_at IS 'Fecha de creación del perfil';
COMMENT ON COLUMN profiles.updated_at IS 'Fecha de última actualización del perfil';
