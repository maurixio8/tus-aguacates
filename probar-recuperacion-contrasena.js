
/**
 * Script para probar el flujo de recuperación de contraseña
 * Ejecutar después de configurar Supabase
 */

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://gxqkmaaqoehydulksudj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4cWttYWFxb2VoeWR1bGtzdWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NDI5NDQsImV4cCI6MjA3ODAxODk0NH0.XAR-ysQgt0ZkRZfIZx_DvpYMzmEMFsdAYK3EP1tc0mw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function probarRecuperacionContrasena() {
  console.log('🧪 Probando flujo de recuperación de contraseña...');
  
  const emailTest = 'test@tusaguacates.com';
  
  try {
    // Enviar correo de recuperación
    const { error } = await supabase.auth.resetPasswordForEmail(emailTest, {
      redirectTo: 'https://tus-aguacates.vercel.app/auth/reset-password'
    });
    
    if (error) {
      console.error('❌ Error enviando correo:', error.message);
      return false;
    }
    
    console.log('✅ Correo de recuperación enviado exitosamente');
    console.log(`📧 Revisa el correo en: ${emailTest}`);
    console.log('🔗 El enlace debería apuntar a: https://tus-aguacates.vercel.app/auth/reset-password');
    
    return true;
  } catch (error) {
    console.error('❌ Error en prueba:', error.message);
    return false;
  }
}

// Ejecutar prueba
probarRecuperacionContrasena().then(success => {
  if (success) {
    console.log('\n🎉 Prueba completada exitosamente');
    console.log('📋 Siguientes pasos:');
    console.log('1. Revisa tu correo electrónico');
    console.log('2. Verifica que el remitente sea "Tus Aguacates"');
    console.log('3. Verifica que el enlace apunte a producción');
    console.log('4. Haz clic en el enlace para probar el flujo completo');
  } else {
    console.log('\n❌ La prueba falló. Revisa la configuración de Supabase');
  }
});
