const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Configuración de Supabase
const supabaseUrl = 'https://gxqkmaaqoehydulksudj.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4cWttYWFxb2VoeWR1bGtzdWRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjQ0Mjk0NCwiZXhwIjoyMDc4MDE4OTQ0fQ.hQpBcmGfCjJqX8fBRMCJs0Knxyms8KxekVWHxkfOn0M';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestUser() {
  try {
    // Crear usuario en auth.users
    const email = 'test@example.com';
    const password = 'password123';
    
    // Generar un ID único para el usuario
    const userId = crypto.randomUUID();
    
    // Insertar directamente en la tabla de usuarios de autenticación
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Confirmar el email automáticamente
      user_metadata: {
        full_name: 'Usuario de Prueba'
      }
    });
    
    if (authError) {
      console.error('Error creando usuario en auth:', authError);
      return;
    }
    
    console.log('Usuario creado en auth:', authData.user);
    
    // Crear perfil en la tabla profiles
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        full_name: 'Usuario de Prueba',
        role: 'customer'
      })
      .select();
    
    if (profileError) {
      console.error('Error creando perfil:', profileError);
    } else {
      console.log('Perfil creado:', profileData);
    }
    
    console.log('\nUsuario de prueba creado exitosamente:');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('ID:', authData.user.id);
    
  } catch (error) {
    console.error('Error general:', error);
  }
}

createTestUser();