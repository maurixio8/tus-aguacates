const puppeteer = require('puppeteer');

async function testAuthFlow() {
  console.log('🔍 Iniciando prueba del flujo de autenticación...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 800 }
  });
  
  try {
    const page = await browser.newPage();
    
    // 1. Acceder a la página principal
    console.log('📱 Accediendo a la página principal...');
    await page.goto('http://localhost:3000');
    await page.waitForSelector('body', { timeout: 10000 });
    
    // 2. Verificar enlace de login en el header
    console.log('🔗 Verificando enlace de login en el header...');
    const loginLink = await page.$('a[href="/auth/login"]');
    if (loginLink) {
      console.log('✅ Enlace de login encontrado en el header');
    } else {
      console.log('❌ Enlace de login NO encontrado en el header');
    }
    
    // 3. Hacer clic en login
    console.log('🖱️ Haciendo clic en enlace de login...');
    await page.click('a[href="/auth/login"]');
    await page.waitForNavigation();
    
    // 4. Verificar página de login
    console.log('🔐 Verificando página de login...');
    const loginTitle = await page.$('h1');
    const titleText = await loginTitle?.evaluate(el => el.textContent);
    
    if (titleText?.includes('Iniciar Sesión')) {
      console.log('✅ Página de login cargada correctamente');
    } else {
      console.log('❌ Página de login no cargó correctamente');
    }
    
    // 5. Verificar enlace de "¿Olvidaste tu contraseña?"
    console.log('🔍 Verificando enlace de recuperación de contraseña...');
    const forgotLink = await page.$('a[href="/auth/forgot-password"]');
    if (forgotLink) {
      console.log('✅ Enlace de recuperación de contraseña encontrado');
    } else {
      console.log('❌ Enlace de recuperación de contraseña NO encontrado');
    }
    
    // 6. Verificar enlace de registro
    console.log('📝 Verificando enlace de registro...');
    const registerLink = await page.$('a[href="/auth/registro"]');
    if (registerLink) {
      console.log('✅ Enlace de registro encontrado');
    } else {
      console.log('❌ Enlace de registro NO encontrado');
    }
    
    // 7. Probar enlace de recuperación
    console.log('🔄 Probando enlace de recuperación de contraseña...');
    await page.click('a[href="/auth/forgot-password"]');
    await page.waitForNavigation();
    
    const forgotTitle = await page.$('h1');
    const forgotTitleText = await forgotTitle?.evaluate(el => el.textContent);
    
    if (forgotTitleText?.includes('¿Olvidaste tu contraseña?')) {
      console.log('✅ Página de recuperación de contraseña funciona correctamente');
    } else {
      console.log('❌ Página de recuperación de contraseña no funciona');
    }
    
    // 8. Volver a login y probar registro
    console.log('🔙 Volviendo a login...');
    await page.goBack();
    await page.waitForTimeout(1000);
    
    console.log('📝 Probando enlace de registro...');
    await page.click('a[href="/auth/registro"]');
    await page.waitForNavigation();
    
    const registerTitle = await page.$('h1');
    const registerTitleText = await registerTitle?.evaluate(el => el.textContent);
    
    if (registerTitleText?.includes('Crear Cuenta')) {
      console.log('✅ Página de registro funciona correctamente');
    } else {
      console.log('❌ Página de registro no funciona');
    }
    
    // 9. Verificar navegación móvil
    console.log('📱 Verificando navegación móvil...');
    await page.setViewport({ width: 375, height: 667 });
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);
    
    // Verificar botón de cuenta en navegación inferior
    const mobileAccountBtn = await page.$('button');
    // Buscar el botón que contiene "Cuenta" o "Iniciar" en su texto
    const buttons = await page.$$('button');
    let accountBtnFound = false;
    
    for (const button of buttons) {
      const buttonText = await button.evaluate(el => el.textContent);
      if (buttonText && (buttonText.includes('Cuenta') || buttonText.includes('Iniciar'))) {
        accountBtnFound = true;
        console.log('✅ Botón de cuenta encontrado en navegación móvil');
        
        // Probar clic en móvil
        await button.click();
        await page.waitForTimeout(1000);
        
        const currentUrl = page.url();
        if (currentUrl.includes('/auth/login') || currentUrl.includes('/cuenta')) {
          console.log('✅ Navegación móvil redirige correctamente');
        } else {
          console.log('❌ Navegación móvil no redirige correctamente');
        }
        break;
      }
    }
    
    if (!accountBtnFound) {
      console.log('❌ Botón de cuenta NO encontrado en navegación móvil');
    }
    
    console.log('🎉 Prueba del flujo de autenticación completada');
    
  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
  } finally {
    await browser.close();
  }
}

// Ejecutar prueba
testAuthFlow().catch(console.error);