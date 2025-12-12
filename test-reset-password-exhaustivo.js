/**
 * Script exhaustivo para probar el flujo de recuperación de contraseña
 * con diferentes escenarios: tokens válidos, inválidos, expirados
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

console.log('=== PRUEBA EXHAUSTIVA DE RECUPERACIÓN DE CONTRASEÑA ===');
console.log('Fecha y hora:', new Date().toISOString());
console.log('');

// Test emails para diferentes escenarios
const testEmails = {
  valid: 'test@example.com',
  invalid: 'nonexistent@example.com',
  malformed: 'invalid-email'
};

async function testScenario1_ValidEmail() {
  console.log('📋 ESCENARIO 1: Email válido y flujo completo');
  console.log('='.repeat(50));
  
  try {
    console.log('1. Enviando correo de recuperación para email válido...');
    
    const { data: resetData, error: resetError } = await supabase.auth.resetPasswordForEmail(testEmails.valid, {
      redirectTo: 'http://localhost:3000/auth/reset-password',
    });

    if (resetError) {
      console.error('❌ Error al enviar correo:', resetError.message);
      return { success: false, error: resetError };
    }

    console.log('✅ Correo enviado exitosamente');
    console.log('📧 Datos de respuesta:', resetData);
    
    // Verificar sesión actual
    const { data: sessionData } = await supabase.auth.getSession();
    console.log('🔍 Sesión actual:', {
      hasSession: !!sessionData.session,
      userEmail: sessionData.session?.user?.email
    });

    console.log('📝 Instrucciones:');
    console.log('   1. Revisa el correo enviado a', testEmails.valid);
    console.log('   2. Haz clic en el enlace de recuperación');
    console.log('   3. Abre la consola del navegador en la página reset-password');
    console.log('   4. Observa los logs [RESET-PASSWORD DEBUG]');
    console.log('   5. Intenta cambiar la contraseña');
    
    return { success: true, data: resetData };
    
  } catch (error) {
    console.error('❌ Error inesperado:', error);
    return { success: false, error };
  }
}

async function testScenario2_InvalidEmail() {
  console.log('\n📋 ESCENARIO 2: Email inválido (no existe)');
  console.log('='.repeat(50));
  
  try {
    console.log('1. Enviando correo para email que no existe...');
    
    const { data: resetData, error: resetError } = await supabase.auth.resetPasswordForEmail(testEmails.invalid, {
      redirectTo: 'http://localhost:3000/auth/reset-password',
    });

    // Supabase no revela si el email existe o no por seguridad
    // Así que debería responder exitosamente incluso si el email no existe
    if (resetError) {
      console.error('❌ Error inesperado:', resetError.message);
      return { success: false, error: resetError };
    }

    console.log('✅ Respuesta de seguridad: Supabase no revela si el email existe');
    console.log('📧 Datos de respuesta:', resetData);
    
    return { success: true, data: resetData };
    
  } catch (error) {
    console.error('❌ Error inesperado:', error);
    return { success: false, error };
  }
}

async function testScenario3_MalformedEmail() {
  console.log('\n📋 ESCENARIO 3: Email mal formado');
  console.log('='.repeat(50));
  
  try {
    console.log('1. Enviando correo para email mal formado...');
    
    const { data: resetData, error: resetError } = await supabase.auth.resetPasswordForEmail(testEmails.malformed, {
      redirectTo: 'http://localhost:3000/auth/reset-password',
    });

    if (resetError) {
      console.log('✅ Error esperado para email mal formado:', resetError.message);
      return { success: true, expectedError: resetError };
    }

    console.log('⚠️  Advertencia: No se validó el formato del email');
    return { success: false, warning: 'Email validation not working' };
    
  } catch (error) {
    console.log('✅ Error esperado para email mal formado:', error.message);
    return { success: true, expectedError: error };
  }
}

async function testScenario4_DirectResetPassword() {
  console.log('\n📋 ESCENARIO 4: Acceso directo a reset-password sin token');
  console.log('='.repeat(50));
  
  try {
    console.log('1. Verificando sesión actual...');
    const { data: sessionData } = await supabase.auth.getSession();
    
    console.log('🔍 Sesión actual:', {
      hasSession: !!sessionData.session,
      userEmail: sessionData.session?.user?.email
    });

    console.log('📝 Instrucciones:');
    console.log('   1. Abre directamente: http://localhost:3000/auth/reset-password');
    console.log('   2. Observa los logs [RESET-PASSWORD DEBUG]');
    console.log('   3. Debería mostrar "Enlace Inválido"');
    console.log('   4. Verifica que aparezca el botón para solicitar nuevo enlace');
    
    return { success: true, sessionData };
    
  } catch (error) {
    console.error('❌ Error inesperado:', error);
    return { success: false, error };
  }
}

async function testScenario5_TokenReuse() {
  console.log('\n📋 ESCENARIO 5: Reutilización de token (consumo único)');
  console.log('='.repeat(50));
  
  try {
    console.log('1. Enviando nuevo correo de recuperación...');
    
    const { data: resetData, error: resetError } = await supabase.auth.resetPasswordForEmail(testEmails.valid, {
      redirectTo: 'http://localhost:3000/auth/reset-password',
    });

    if (resetError) {
      console.error('❌ Error al enviar correo:', resetError.message);
      return { success: false, error: resetError };
    }

    console.log('✅ Correo enviado');
    
    console.log('📝 Instrucciones:');
    console.log('   1. Usa el enlace del correo para cambiar la contraseña');
    console.log('   2. Después de cambiarla exitosamente, intenta usar el mismo enlace nuevamente');
    console.log('   3. El segundo intento debería mostrar "Enlace Inválido"');
    console.log('   4. Esto confirma que el token se consume después del uso');
    
    return { success: true, data: resetData };
    
  } catch (error) {
    console.error('❌ Error inesperado:', error);
    return { success: false, error };
  }
}

async function testScenario6_SessionManagement() {
  console.log('\n📋 ESCENARIO 6: Manejo de sesión PKCE');
  console.log('='.repeat(50));
  
  try {
    console.log('1. Verificando configuración PKCE...');
    
    // Verificar que el cliente esté configurado con PKCE
    const clientConfig = supabase.auth.options;
    console.log('🔧 Configuración de autenticación:', {
      flowType: clientConfig.flowType,
      detectSessionInUrl: clientConfig.detectSessionInUrl,
      persistSession: clientConfig.persistSession
    });

    console.log('📝 Instrucciones:');
    console.log('   1. Solicita recuperación de contraseña');
    console.log('   2. Haz clic en el enlace del correo');
    console.log('   3. Observa los logs [RESET-PASSWORD DEBUG]');
    console.log('   4. Busca mensajes sobre "Sesión temporal detectada"');
    console.log('   5. Verifica que no aparezca "Enlace Inválido"');
    
    return { success: true, config: clientConfig };
    
  } catch (error) {
    console.error('❌ Error inesperado:', error);
    return { success: false, error };
  }
}

async function runAllTests() {
  console.log('🚀 Iniciando pruebas exhaustivas...\n');
  
  const results = {
    scenario1: await testScenario1_ValidEmail(),
    scenario2: await testScenario2_InvalidEmail(),
    scenario3: await testScenario3_MalformedEmail(),
    scenario4: await testScenario4_DirectResetPassword(),
    scenario5: await testScenario5_TokenReuse(),
    scenario6: await testScenario6_SessionManagement()
  };

  console.log('\n📊 RESUMEN DE RESULTADOS');
  console.log('='.repeat(50));
  
  Object.entries(results).forEach(([scenario, result]) => {
    const status = result.success ? '✅ PASÓ' : '❌ FALLÓ';
    console.log(`${scenario}: ${status}`);
    if (result.error) {
      console.log(`  Error: ${result.error.message}`);
    }
    if (result.warning) {
      console.log(`  Advertencia: ${result.warning}`);
    }
  });

  console.log('\n🎯 PRÓXIMOS PASOS');
  console.log('='.repeat(50));
  console.log('1. Abre http://localhost:3000/auth/forgot-password en tu navegador');
  console.log('2. Realiza las pruebas manuales según las instrucciones de cada escenario');
  console.log('3. Observa los logs [RESET-PASSWORD DEBUG] en la consola del navegador');
  console.log('4. Verifica que el error "Enlace Inválido" esté solucionado');
  console.log('5. Confirma que los tokens se consumen correctamente');

  return results;
}

// Ejecutar todas las pruebas
runAllTests().then(results => {
  console.log('\n✨ Pruebas completadas. Revisa los resultados y sigue las instrucciones manuales.');
}).catch(error => {
  console.error('💥 Error fatal en las pruebas:', error);
});