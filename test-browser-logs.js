/**
 * Script para simular pruebas en el navegador y verificar los logs
 * de la página de reset-password
 */

const puppeteer = require('puppeteer');

console.log('=== PRUEBA DE LOGS EN NAVEGADOR ===');
console.log('Fecha y hora:', new Date().toISOString());
console.log('');

async function testBrowserLogs() {
  let browser;
  
  try {
    console.log('🚀 Iniciando navegador para pruebas...');
    
    // Iniciar navegador
    browser = await puppeteer.launch({
      headless: false, // Mostrar navegador para pruebas manuales
      defaultViewport: null,
      args: ['--start-maximized']
    });

    const page = await browser.newPage();

    // Capturar logs de la consola
    const consoleMessages = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(text);
      
      // Resaltar logs de reset-password
      if (text.includes('[RESET-PASSWORD')) {
        console.log(`🔍 ${text}`);
      }
    });

    // Capturar errores de la página
    page.on('pageerror', error => {
      console.error('❌ Error en página:', error.message);
    });

    console.log('\n📋 PRUEBA 1: Acceso directo a reset-password sin token');
    console.log('='.repeat(60));
    
    // Navegar directamente a reset-password sin token
    await page.goto('http://localhost:3000/auth/reset-password', {
      waitUntil: 'networkidle2',
      timeout: 10000
    });

    // Esperar a que cargue la página
    await page.waitForTimeout(3000);

    console.log('\n📋 PRUEBA 2: Verificar contenido de "Enlace Inválido"');
    console.log('='.repeat(60));
    
    // Verificar que muestra el mensaje de enlace inválido
    const invalidLinkText = await page.$eval('h2', el => el.textContent);
    console.log('Título de la página:', invalidLinkText);

    // Verificar botones de acción
    const buttons = await page.$$eval('a', buttons => 
      buttons.map(btn => btn.textContent)
    );
    console.log('Botones disponibles:', buttons);

    console.log('\n📋 PRUEBA 3: Navegar a forgot-password');
    console.log('='.repeat(60));
    
    // Navegar a forgot-password
    await page.goto('http://localhost:3000/auth/forgot-password', {
      waitUntil: 'networkidle2',
      timeout: 10000
    });

    await page.waitForTimeout(2000);

    console.log('\n📋 PRUEBA 4: Simular envío de correo');
    console.log('='.repeat(60));
    
    // Llenar formulario de recuperación
    await page.type('input[type="email"]', 'test@example.com');
    
    // Capturar logs antes de enviar
    const beforeSubmitLogs = consoleMessages.length;
    
    // Enviar formulario
    await page.click('button[type="submit"]');
    
    // Esperar respuesta
    await page.waitForTimeout(3000);

    console.log('\n📋 PRUEBA 5: Verificar logs después de enviar correo');
    console.log('='.repeat(60));
    
    // Verificar si hay nuevos logs
    const afterSubmitLogs = consoleMessages.length;
    console.log(`Logs capturados: ${afterSubmitLogs - beforeSubmitLogs}`);

    // Buscar logs específicos de reset-password
    const resetPasswordLogs = consoleMessages.filter(msg => 
      msg.includes('[RESET-PASSWORD')
    );
    
    console.log('\n🔍 LOGS DE RESET-PASSWORD ENCONTRADOS:');
    if (resetPasswordLogs.length > 0) {
      resetPasswordLogs.forEach((log, index) => {
        console.log(`${index + 1}. ${log}`);
      });
    } else {
      console.log('❌ No se encontraron logs [RESET-PASSWORD]');
    }

    console.log('\n📋 PRUEBA 6: Verificar página de éxito');
    console.log('='.repeat(60));
    
    // Verificar si muestra la página de éxito
    const successMessage = await page.$eval('h2', el => el.textContent).catch(() => null);
    if (successMessage && successMessage.includes('Correo Enviado')) {
      console.log('✅ Página de éxito mostrada correctamente');
    }

    console.log('\n📋 INSTRUCCIONES PARA PRUEBAS MANUALES');
    console.log('='.repeat(60));
    console.log('1. El navegador está abierto para pruebas manuales');
    console.log('2. Para probar el flujo completo:');
    console.log('   a. Revisa el correo enviado a test@example.com');
    console.log('   b. Haz clic en el enlace de recuperación');
    console.log('   c. Abre la consola del navegador (F12)');
    console.log('   d. Observa los logs [RESET-PASSWORD DEBUG]');
    console.log('   e. Intenta cambiar la contraseña');
    console.log('3. Para probar reutilización de token:');
    console.log('   a. Después de cambiar la contraseña, usa el mismo enlace');
    console.log('   b. Debería mostrar "Enlace Inválido"');
    console.log('4. Presiona Ctrl+C para terminar las pruebas');

    // Mantener navegador abierto para pruebas manuales
    console.log('\n⏳ Esperando interacción manual...');

  } catch (error) {
    console.error('❌ Error en pruebas del navegador:', error);
  } finally {
    // No cerrar el navegador automáticamente para permitir pruebas manuales
    // await browser.close();
  }
}

// Verificar si Puppeteer está disponible
try {
  require.resolve('puppeteer');
  testBrowserLogs();
} catch (error) {
  console.log('❌ Puppeteer no está instalado. Instálalo con:');
  console.log('npm install puppeteer');
  console.log('');
  console.log('📋 INSTRUCCIONES MANUALES:');
  console.log('='.repeat(60));
  console.log('1. Abre tu navegador y ve a http://localhost:3000');
  console.log('2. Navega a /auth/reset-password sin token');
  console.log('3. Debería mostrar "Enlace Inválido"');
  console.log('4. Abre la consola del navegador (F12)');
  console.log('5. Busca logs [RESET-PASSWORD DEBUG]');
  console.log('6. Ve a /auth/forgot-password');
  console.log('7. Envía un correo de recuperación');
  console.log('8. Revisa tu correo y haz clic en el enlace');
  console.log('9. Observa los logs en la consola');
  console.log('10. Intenta cambiar la contraseña');
  console.log('11. Después de cambiarla, usa el mismo enlace nuevamente');
  console.log('12. Debería mostrar "Enlace Inválido" (token consumido)');
}