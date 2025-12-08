/**
 * Script para probar y debuggear el flujo de recuperación de contraseña
 * con los logs agregados en la página reset-password
 */

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = "https://gxqkmaaqoehydulksudj.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4cWttYWFxb2VoeWR1bGtzdWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NDI5NDQsImV4cCI6MjA3ODAxODk0NH0.XAR-ysQgt0ZkRZfIZx_DvpYMzmEMFsdAYK3EP1tc0mw";

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  }
});

console.log('=== INICIO DE PRUEBA DE RECUPERACIÓN DE CONTRASEÑA ===');
console.log('Fecha y hora:', new Date().toISOString());
console.log('');

async function testPasswordResetFlow() {
  const testEmail = 'test@example.com'; // Reemplazar con email de prueba
  
  try {
    console.log('PASO 1: Enviando correo de recuperación...');
    
    // Enviar correo de recuperación
    const { data: resetData, error: resetError } = await supabase.auth.resetPasswordForEmail(testEmail, {
      redirectTo: 'http://localhost:3000/auth/reset-password',
    });

    if (resetError) {
      console.error('❌ Error al enviar correo de recuperación:', resetError);
      return;
    }

    console.log('✅ Correo de recuperación enviado exitosamente');
    console.log('Datos:', resetData);
    console.log('');

    console.log('PASO 2: Instrucciones para probar el flujo');
    console.log('1. Revisa tu correo y haz clic en el enlace de recuperación');
    console.log('2. Abre la consola del navegador en la página de reset-password');
    console.log('3. Observa los logs con la etiqueta [RESET-PASSWORD DEBUG]');
    console.log('4. Intenta cambiar la contraseña');
    console.log('5. Observa los logs del proceso completo');
    console.log('');

    console.log('PASO 3: Verificando sesión actual...');
    
    // Verificar sesión actual
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Error al obtener sesión:', sessionError);
    } else {
      console.log('✅ Sesión actual:', {
        hasSession: !!sessionData.session,
        userEmail: sessionData.session?.user?.email,
        expiresAt: sessionData.session?.expires_at
      });
    }

    console.log('');
    console.log('=== ESPERANDO INTERACCIÓN DEL USUARIO ===');
    console.log('Sigue las instrucciones del PASO 2 para continuar...');
    console.log('Los logs aparecerán en la consola del navegador');
    
  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

// Función para simular el procesamiento del token PKCE
async function simulateTokenProcessing(token) {
  console.log('Simulando procesamiento de token PKCE...');
  console.log('Token:', token ? 'PRESENT' : 'NOT FOUND');
  
  try {
    // Intentar verificar OTP si hay token
    if (token) {
      const { data, error } = await supabase.auth.verifyOtp({
        token: token,
        type: 'recovery'
      });
      
      if (error) {
        console.error('❌ Error al verificar OTP:', error);
        return { success: false, error };
      }
      
      console.log('✅ OTP verificado exitosamente:', data);
      return { success: true, data };
    }
  } catch (error) {
    console.error('❌ Error en simulación:', error);
    return { success: false, error };
  }
}

// Función para probar la actualización de contraseña
async function testPasswordUpdate(newPassword) {
  console.log('Probando actualización de contraseña...');
  
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) {
      console.error('❌ Error al actualizar contraseña:', error);
      return { success: false, error };
    }
    
    console.log('✅ Contraseña actualizada exitosamente:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error en actualización:', error);
    return { success: false, error };
  }
}

// Ejecutar prueba principal
testPasswordResetFlow();

// Exportar funciones para uso manual
module.exports = {
  testPasswordResetFlow,
  simulateTokenProcessing,
  testPasswordUpdate
};

console.log('');
console.log('=== NOTAS IMPORTANTES ===');
console.log('1. Este script debe ejecutarse junto con la aplicación en desarrollo');
console.log('2. Los logs detallados aparecerán en la consola del navegador');
console.log('3. Asegúrate de que la aplicación esté corriendo en http://localhost:3000');
console.log('4. Revisa los logs [RESET-PASSWORD DEBUG] para diagnóstico completo');
console.log('');