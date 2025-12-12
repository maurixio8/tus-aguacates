const { chromium } = require('playwright');
const path = require('path');

async function testAuthImprovements() {
  console.log('🧪 Iniciando pruebas de mejoras de autenticación...\n');
  
  const browser = await chromium.launch({ 
    headless: false, // Modo visible para observar las pruebas
    slowMo: 500 // Ralentizar para mejor observación
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    // Habilitar persistencia para probar "Recordarme"
    storageState: {
      cookies: [],
      origins: []
    }
  });
  
  const page = await context.newPage();
  
  try {
    // Test 1: Validación en tiempo real en login
    console.log('📝 Test 1: Validación en tiempo real en login');
    await page.goto('http://localhost:3000/auth/login');
    await page.waitForLoadState('networkidle');
    
    // Probar email inválido
    await page.fill('#email', 'email-invalido');
    await page.locator('#email').blur();
    await page.waitForTimeout(1000);
    
    const emailError = await page.locator('text=Por favor, ingresa un correo electrónico válido').isVisible();
    console.log(emailError ? '✅ Validación de email funciona' : '❌ Validación de email falla');
    
    // Probar contraseña corta
    await page.fill('#password', '123');
    await page.locator('#password').blur();
    await page.waitForTimeout(1000);
    
    const passwordError = await page.locator('text=La contraseña debe tener al menos 6 caracteres').isVisible();
    console.log(passwordError ? '✅ Validación de contraseña funciona' : '❌ Validación de contraseña falla');
    
    // Probar email válido
    await page.fill('#email', 'test@ejemplo.com');
    await page.locator('#email').blur();
    await page.waitForTimeout(1000);
    
    const emailValid = await page.locator('.text-green-600').first().isVisible();
    console.log(emailValid ? '✅ Indicador de email válido funciona' : '❌ Indicador de email válido falla');
    
    // Test 2: Checkbox "Recordarme"
    console.log('\n📝 Test 2: Checkbox "Recordarme"');
    const rememberCheckbox = await page.locator('#rememberMe');
    await rememberCheckbox.check();
    const isChecked = await rememberCheckbox.isChecked();
    console.log(isChecked ? '✅ Checkbox "Recordarme" funciona' : '❌ Checkbox "Recordarme" falla');
    
    // Test 3: Atributos autocomplete
    console.log('\n📝 Test 3: Atributos autocomplete');
    const emailInput = await page.locator('#email');
    const emailAutocomplete = await emailInput.getAttribute('autocomplete');
    console.log(emailAutocomplete === 'email' ? '✅ Autocomplete email configurado' : '❌ Autocomplete email no configurado');
    
    const passwordInput = await page.locator('#password');
    const passwordAutocomplete = await passwordInput.getAttribute('autocomplete');
    console.log(passwordAutocomplete === 'current-password' ? '✅ Autocomplete password configurado' : '❌ Autocomplete password no configurado');
    
    // Test 4: Validación en registro
    console.log('\n📝 Test 4: Validación en tiempo real en registro');
    await page.goto('http://localhost:3000/auth/registro');
    await page.waitForLoadState('networkidle');
    
    // Probar nombre corto
    await page.fill('#fullName', 'Jo');
    await page.locator('#fullName').blur();
    await page.waitForTimeout(1000);
    
    const nameError = await page.locator('text=El nombre debe tener al menos 3 caracteres').isVisible();
    console.log(nameError ? '✅ Validación de nombre funciona' : '❌ Validación de nombre falla');
    
    // Probar coincidencia de contraseñas
    await page.fill('#password', 'password123');
    await page.fill('#confirmPassword', 'password456');
    await page.locator('#confirmPassword').blur();
    await page.waitForTimeout(1000);
    
    const matchError = await page.locator('text=Las contraseñas no coinciden').isVisible();
    console.log(matchError ? '✅ Validación de coincidencia funciona' : '❌ Validación de coincidencia falla');
    
    // Test 5: Validación en recuperación de contraseña
    console.log('\n📝 Test 5: Validación en recuperación de contraseña');
    await page.goto('http://localhost:3000/auth/forgot-password');
    await page.waitForLoadState('networkidle');
    
    await page.fill('#email', 'email-invalido');
    await page.locator('#email').blur();
    await page.waitForTimeout(1000);
    
    const forgotEmailError = await page.locator('text=Por favor, ingresa un correo electrónico válido').isVisible();
    console.log(forgotEmailError ? '✅ Validación en recuperación funciona' : '❌ Validación en recuperación falla');
    
    // Test 6: Responsive design
    console.log('\n📝 Test 6: Responsive design en móvil');
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto('http://localhost:3000/auth/login');
    await page.waitForLoadState('networkidle');
    
    const mobileForm = await page.locator('form').isVisible();
    const mobileCheckbox = await page.locator('#rememberMe').isVisible();
    const mobileInputs = await page.locator('input').count();
    
    console.log(mobileForm ? '✅ Formulario visible en móvil' : '❌ Formulario no visible en móvil');
    console.log(mobileCheckbox ? '✅ Checkbox visible en móvil' : '❌ Checkbox no visible en móvil');
    console.log(mobileInputs >= 3 ? '✅ Inputs accesibles en móvil' : '❌ Inputs no accesibles en móvil');
    
    // Test 7: Persistencia de sesión (simulación)
    console.log('\n📝 Test 7: Persistencia de sesión extendida');
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('http://localhost:3000/auth/login');
    await page.waitForLoadState('networkidle');
    
    // Simular login con "Recordarme"
    await page.fill('#email', 'test@ejemplo.com');
    await page.fill('#password', 'password123');
    await page.check('#rememberMe');
    
    // Verificar que se guarda en localStorage
    const rememberMeStorage = await page.evaluate(() => {
      return localStorage.getItem('rememberMe');
    });
    
    console.log(rememberMeStorage === 'true' ? '✅ Preferencia "Recordarme" se guarda' : '❌ Preferencia "Recordarme" no se guarda');
    
    console.log('\n🎉 Pruebas completadas exitosamente!');
    
  } catch (error) {
    console.error('❌ Error durante las pruebas:', error);
  } finally {
    await browser.close();
  }
}

// Ejecutar pruebas
testAuthImprovements().catch(console.error);