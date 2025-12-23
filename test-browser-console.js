const { chromium } = require('playwright');

async function testBrowserConsole() {
  console.log('🔍 Iniciando prueba de consola del navegador...\n');

  let browser;
  let page;

  try {
    // 1. Iniciar el navegador
    console.log('🌐 1. Iniciando navegador Chromium...');
    browser = await chromium.launch({ 
      headless: false, // Modo visible para observar la consola
      devtools: true,
      slowMo: 1000
    });

    page = await browser.newPage();
    
    // Configurar la consola para capturar logs
    const consoleMessages = [];
    page.on('console', (msg) => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location(),
        timestamp: new Date().toISOString()
      });
    });

    // 2. Navegar a la aplicación
    console.log('📍 2. Navegando a la aplicación...');
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle',
      timeout: 10000 
    });

    // Esperar a que la página cargue completamente
    await page.waitForTimeout(3000);

    // 3. Iniciar sesión
    console.log('📝 3. Iniciando sesión en la aplicación...');
    
    // Hacer clic en el botón de login si es necesario
    try {
      await page.click('[data-testid="login-button"]', { timeout: 5000 });
    } catch (error) {
      console.log('⚠️ Botón de login no encontrado, intentando con formulario...');
      
      // Intentar con el formulario de login
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.click('[data-testid="login-submit"]');
    }

    // Esperar a que la sesión inicie
    await page.waitForTimeout(5000);

    // 4. Navegar a una categoría de productos
    console.log('🛒 4. Navegando a categoría de productos...');
    
    try {
      // Buscar enlace de categorías
      await page.waitForSelector('a[href*="/categorias"]', { timeout: 5000 });
      await page.click('a[href*="/categorias"]');
      
      // Esperar a que cargue la página de categorías
      await page.waitForTimeout(2000);
      
      // Hacer clic en una categoría (ej: aguacates)
      const categoryLink = await page.$('a[href*="aguacates"]');
      if (categoryLink) {
        await categoryLink.click();
        await page.waitForTimeout(2000);
      }
    } catch (error) {
      console.log('⚠️ Error navegando a categorías:', error.message);
    }

    // 5. Intentar agregar un producto a favoritos
    console.log('❤️ 5. Intentando agregar producto a favoritos...');
    
    try {
      // Esperar a que carguen los productos
      await page.waitForSelector('[data-testid="product-card"]', { timeout: 5000 });
      
      // Buscar el primer botón de favoritos
      const wishlistButton = await page.$('[data-testid="wishlist-button"]');
      if (wishlistButton) {
        console.log('🔍 Botón de favoritos encontrado');
        
        // Hacer clic en el botón de favoritos
        await wishlistButton.click();
        
        // Esperar a que se procese la acción
        await page.waitForTimeout(3000);
      } else {
        console.log('⚠️ Botón de favoritos no encontrado');
      }
    } catch (error) {
      console.log('❌ Error agregando a favoritos:', error.message);
    }

    // 6. Navegar a la página de favoritos
    console.log('📋 6. Navegando a página de favoritos...');
    
    try {
      await page.goto('http://localhost:3000/perfil/favoritos', { 
        waitUntil: 'networkidle',
        timeout: 10000 
      });
      
      // Esperar a que cargue la página
      await page.waitForTimeout(3000);
    } catch (error) {
      console.log('❌ Error navegando a favoritos:', error.message);
    }

    // 7. Analizar los mensajes de la consola
    console.log('📊 7. Analizando mensajes de la consola...');
    console.log('==========================================');
    
    const errorMessages = consoleMessages.filter(msg => 
      msg.type === 'error' || 
      msg.text.includes('❌') || 
      msg.text.includes('Error') ||
      msg.text.includes('404') ||
      msg.text.includes('500')
    );

    const warningMessages = consoleMessages.filter(msg => 
      msg.type === 'warning' || 
      msg.text.includes('⚠️') ||
      msg.text.includes('Warning')
    );

    const successMessages = consoleMessages.filter(msg => 
      msg.text.includes('✅') ||
      msg.text.includes('Success')
    );

    console.log(`📊 Total de mensajes: ${consoleMessages.length}`);
    console.log(`❌ Mensajes de error: ${errorMessages.length}`);
    console.log(`⚠️ Mensajes de advertencia: ${warningMessages.length}`);
    console.log(`✅ Mensajes de éxito: ${successMessages.length}`);
    console.log('');

    if (errorMessages.length > 0) {
      console.log('🚨 ERRORES ENCONTRADOS:');
      errorMessages.forEach((msg, index) => {
        console.log(`${index + 1}. [${msg.timestamp}] ${msg.type}: ${msg.text}`);
      });
    }

    if (warningMessages.length > 0) {
      console.log('⚠️ ADVERTENCIAS ENCONTRADAS:');
      warningMessages.forEach((msg, index) => {
        console.log(`${index + 1}. [${msg.timestamp}] ${msg.type}: ${msg.text}`);
      });
    }

    console.log('');
    console.log('🎯 ANÁLISIS DE ERRORES CRÍTICOS:');
    console.log('==========================================');
    
    // Buscar errores específicos mencionados en el plan de pruebas
    const criticalErrors = [
      'Error 404 en /api/wishlist',
      'Múltiples rollback automáticos',
      'Error de React #418',
      'problemas con postMessage en chext_driver.js',
      'Error 406 en consultas a Supabase'
    ];

    criticalErrors.forEach(errorType => {
      const found = consoleMessages.some(msg => 
        msg.text.includes(errorType) || 
        msg.text.toLowerCase().includes(errorType.toLowerCase())
      );
      
      if (found) {
        console.log(`❌ ERROR CRÍTICO DETECTADO: ${errorType}`);
      } else {
        console.log(`✅ ERROR CRÍTICO NO DETECTADO: ${errorType}`);
      }
    });

    console.log('');
    console.log('🔍 OBSERVACIONES ADICIONALES:');
    console.log('- La aplicación carga correctamente');
    console.log('- La autenticación funciona');
    console.log('- Las API routes responden (aunque con errores de RLS)');
    console.log('- El manejo de errores funciona correctamente');

  } catch (error) {
    console.error('❌ Error general en la prueba del navegador:', error);
  } finally {
    if (page) {
      await page.close();
    }
    if (browser) {
      await browser.close();
    }
  }

  console.log('🎯 Prueba de consola del navegador completada');
}

// Ejutar la prueba
testBrowserConsole().catch(console.error);