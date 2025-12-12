const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuración de pruebas
const CONFIG = {
  baseUrl: 'http://localhost:3001',
  screenshotsDir: './screenshots-pruebas-integrales',
  timeout: 30000,
  headless: false, // Para poder observar las pruebas
  slowMo: 100 // Ralentizar para mejor observación
};

// Crear directorio de screenshots
if (!fs.existsSync(CONFIG.screenshotsDir)) {
  fs.mkdirSync(CONFIG.screenshotsDir, { recursive: true });
}

// Función para tomar screenshots
async function takeScreenshot(page, name, description = '') {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${timestamp}_${name}.png`;
  const filepath = path.join(CONFIG.screenshotsDir, filename);
  
  await page.screenshot({ 
    path: filepath, 
    fullPage: true,
    type: 'png'
  });
  
  console.log(`📸 Screenshot guardado: ${filename}`);
  if (description) {
    console.log(`   Descripción: ${description}`);
  }
  
  return filepath;
}

// Función para esperar y hacer clic
async function waitAndClick(page, selector, timeout = CONFIG.timeout) {
  await page.waitForSelector(selector, { timeout });
  await page.click(selector);
}

// Función para esperar y escribir
async function waitAndType(page, selector, text, timeout = CONFIG.timeout) {
  await page.waitForSelector(selector, { timeout });
  await page.type(selector, text);
}

// Función para esperar navegación
async function waitForNavigation(page, timeout = CONFIG.timeout) {
  await Promise.all([
    page.waitForNavigation({ timeout }),
    page.waitForLoadState('networkidle')
  ]);
}

// Pruebas de Personalización de Saludos
async function probarPersonalizacionSaludos(page) {
  console.log('\n🧪 INICIANDO PRUEBAS DE PERSONALIZACIÓN DE SALUDOS');
  
  try {
    // 1. Probar saludo en página principal (usuario no autenticado)
    await page.goto(`${CONFIG.baseUrl}/`);
    await takeScreenshot(page, '01_home_no_autenticado', 'Página principal sin autenticación');
    
    // 2. Navegar a login
    await waitAndClick(page, 'a[href="/auth/login"]');
    await waitForNavigation(page);
    await takeScreenshot(page, '02_pagina_login', 'Página de login');
    
    // 3. Iniciar sesión con usuario de prueba
    await waitAndType(page, 'input[type="email"]', 'test@tusaguacates.com');
    await waitAndType(page, 'input[type="password"]', 'test123456');
    await waitAndClick(page, 'button[type="submit"]');
    await waitForNavigation(page);
    await takeScreenshot(page, '03_despues_login', 'Página después del login');
    
    // 4. Verificar saludo personalizado en header
    const headerGreeting = await page.$eval('text=/Hola,/', el => el.textContent);
    console.log(`✅ Saludo en header: ${headerGreeting}`);
    
    // 5. Verificar saludo en hero section
    const heroGreeting = await page.$eval('text=/Buenos días|Buenas tardes|Buenas noches/', el => el.textContent);
    console.log(`✅ Saludo en hero: ${heroGreeting}`);
    
    // 6. Navegar a cuenta para verificar saludos personalizados
    await waitAndClick(page, 'a[href="/cuenta"]');
    await waitForNavigation(page);
    await takeScreenshot(page, '04_pagina_cuenta', 'Página de cuenta con saludos personalizados');
    
    // 7. Verificar edición de perfil con preferred_name
    await waitAndClick(page, 'button:has-text("Editar Perfil")');
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '05_edicion_perfil', 'Formulario de edición de perfil');
    
    // 8. Probar chatbot con saludo personalizado
    await waitAndClick(page, 'button:has-text("Mayordomo Digital")');
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '06_chatbot_saludo', 'Chatbot con saludo personalizado');
    
    console.log('✅ Pruebas de personalización de saludos completadas exitosamente');
    return true;
    
  } catch (error) {
    console.error('❌ Error en pruebas de personalización de saludos:', error);
    await takeScreenshot(page, 'error_personalizacion', 'Error en personalización');
    return false;
  }
}

// Pruebas de Checkout Autocompletado
async function probarCheckoutAutocompletado(page) {
  console.log('\n🧪 INICIANDO PRUEBAS DE CHECKOUT AUTOCOMPLETADO');
  
  try {
    // 1. Agregar productos al carrito
    await page.goto(`${CONFIG.baseUrl}/productos`);
    await waitForNavigation(page);
    await takeScreenshot(page, '07_pagina_productos', 'Página de productos');
    
    // 2. Agregar primer producto al carrito
    await waitAndClick(page, 'button:has-text("Agregar")');
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '08_producto_agregado', 'Producto agregado al carrito');
    
    // 3. Ir al checkout
    await waitAndClick(page, 'a[href="/cart"]');
    await waitForNavigation(page);
    await takeScreenshot(page, '09_carrito', 'Página del carrito');
    
    await waitAndClick(page, 'button:has-text("Finalizar Pedido")');
    await waitForNavigation(page);
    await takeScreenshot(page, '10_checkout_autenticado', 'Checkout para usuario autenticado');
    
    // 4. Verificar información personal autocompletada
    const personalInfo = await page.$eval('.space-y-3', el => el.textContent);
    console.log(`✅ Información personal autocompletada: ${personalInfo.substring(0, 100)}...`);
    
    // 5. Verificar dirección predeterminada
    const addressInfo = await page.$eval('text=/Dirección de entrega/', el => el.textContent);
    console.log(`✅ Información de dirección: ${addressInfo.substring(0, 100)}...`);
    
    // 6. Verificar método de pago preferido
    const paymentMethod = await page.$eval('text=/Método de Pago Preferido/', el => el.textContent);
    console.log(`✅ Método de pago preferido: ${paymentMethod.substring(0, 100)}...`);
    
    // 7. Probar edición de información personal
    await waitAndClick(page, 'button:has-text("Editar")');
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '11_edicion_info_personal', 'Edición de información personal');
    
    // 8. Probar cambio de dirección
    await waitAndClick(page, 'button:has-text("Cambiar dirección")');
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '12_seleccion_direccion', 'Selección de dirección');
    
    // 9. Continuar al pago
    await waitAndClick(page, 'button:has-text("Continuar al Pago")');
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '13_metodo_pago', 'Selección de método de pago');
    
    console.log('✅ Pruebas de checkout autocompletado completadas exitosamente');
    return true;
    
  } catch (error) {
    console.error('❌ Error en pruebas de checkout autocompletado:', error);
    await takeScreenshot(page, 'error_checkout', 'Error en checkout');
    return false;
  }
}

// Pruebas de Sistema de Suscripciones
async function probarSistemaSuscripciones(page) {
  console.log('\n🧪 INICIANDO PRUEBAS DE SISTEMA DE SUSCRIPCIONES');
  
  try {
    // 1. Navegar a página de suscripciones
    await page.goto(`${CONFIG.baseUrl}/cuenta/suscripciones`);
    await waitForNavigation(page);
    await takeScreenshot(page, '14_pagina_suscripciones', 'Página de suscripciones');
    
    // 2. Verificar mensaje si no hay suscripciones
    const noSubscriptionsMessage = await page.$eval('text=/No tienes suscripciones activas/', el => el.textContent);
    console.log(`✅ Mensaje sin suscripciones: ${noSubscriptionsMessage}`);
    
    // 3. Ir a productos para crear suscripción
    await waitAndClick(page, 'a:has-text("Explorar Productos")');
    await waitForNavigation(page);
    
    // 4. Agregar producto para suscripción
    await waitAndClick(page, 'button:has-text("Agregar")');
    await page.waitForTimeout(1000);
    
    // 5. Ir al checkout
    await waitAndClick(page, 'a[href="/cart"]');
    await waitForNavigation(page);
    
    await waitAndClick(page, 'button:has-text("Finalizar Pedido")');
    await waitForNavigation(page);
    await takeScreenshot(page, '15_checkout_con_suscripcion', 'Checkout con opción de suscripción');
    
    // 6. Verificar opción de suscripción
    const subscriptionOption = await page.$eval('text=/¿Pedido recurrente?/', el => el.textContent);
    console.log(`✅ Opción de suscripción visible: ${subscriptionOption.substring(0, 100)}...`);
    
    // 7. Hacer clic en crear suscripción
    await waitAndClick(page, 'button:has-text("Hacer este pedido recurrente")');
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '16_modal_suscripcion', 'Modal de configuración de suscripción');
    
    // 8. Verificar campos del modal
    const modalTitle = await page.$eval('text=/Configurar Pedido Recurrente/', el => el.textContent);
    console.log(`✅ Título del modal: ${modalTitle}`);
    
    // 9. Probar configuración de suscripción
    await waitAndType(page, 'input[placeholder*="suscripción"]', 'Mi Suscripción de Prueba');
    await page.waitForTimeout(500);
    
    // 10. Seleccionar frecuencia
    await page.selectOption('select', '15');
    await page.waitForTimeout(500);
    
    // 11. Verificar productos fijos y opcionales
    const fixedProducts = await page.$eval('text=/Productos Fijos/', el => el.textContent);
    console.log(`✅ Sección productos fijos: ${fixedProducts}`);
    
    // 12. Verificar resumen
    const summarySection = await page.$eval('text=/Resumen de la Suscripción/', el => el.textContent);
    console.log(`✅ Resumen de suscripción: ${summarySection.substring(0, 100)}...`);
    
    // 13. Cerrar modal sin crear
    await waitAndClick(page, 'button:has-text("Cancelar")');
    await page.waitForTimeout(1000);
    
    console.log('✅ Pruebas de sistema de suscripciones completadas exitosamente');
    return true;
    
  } catch (error) {
    console.error('❌ Error en pruebas de sistema de suscripciones:', error);
    await takeScreenshot(page, 'error_suscripciones', 'Error en suscripciones');
    return false;
  }
}

// Pruebas de Integración
async function probarIntegracion(page) {
  console.log('\n🧪 INICIANDO PRUEBAS DE INTEGRACIÓN');
  
  try {
    // 1. Flujo completo: registro → compra → suscripción
    await page.goto(`${CONFIG.baseUrl}/`);
    await waitForNavigation(page);
    await takeScreenshot(page, '17_inicio_integracion', 'Inicio de pruebas de integración');
    
    // 2. Verificar consistencia de saludos en todas las páginas
    const headerGreeting = await page.$eval('text=/Hola,/', el => el.textContent);
    console.log(`✅ Saludo consistente en header: ${headerGreeting}`);
    
    // 3. Navegar por diferentes secciones
    await waitAndClick(page, 'a[href="/tienda"]');
    await waitForNavigation(page);
    await page.waitForTimeout(1000);
    
    // 4. Verificar que el saludo persista
    const persistentGreeting = await page.$eval('text=/Hola,/', el => el.textContent);
    console.log(`✅ Saludo persistente en navegación: ${persistentGreeting}`);
    
    // 5. Probar responsive design
    await page.setViewport({ width: 375, height: 667 }); // Mobile
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '18_version_movil', 'Versión móvil de la aplicación');
    
    // 6. Verificar que los saludos funcionen en móvil
    const mobileGreeting = await page.$eval('text=/Hola,/', el => el.textContent);
    console.log(`✅ Saludo en móvil: ${mobileGreeting}`);
    
    // 7. Restaurar vista desktop
    await page.setViewport({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000);
    
    // 8. Probar chatbot en contexto de suscripción
    await waitAndClick(page, 'button:has-text("Mayordomo Digital")');
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '19_chatbot_integracion', 'Chatbot en contexto de integración');
    
    console.log('✅ Pruebas de integración completadas exitosamente');
    return true;
    
  } catch (error) {
    console.error('❌ Error en pruebas de integración:', error);
    await takeScreenshot(page, 'error_integracion', 'Error en integración');
    return false;
  }
}

// Pruebas de Rendimiento y Seguridad
async function probarRendimientoSeguridad(page) {
  console.log('\n🧪 INICIANDO PRUEBAS DE RENDIMIENTO Y SEGURIDAD');
  
  try {
    // 1. Medir tiempos de carga
    const startTime = Date.now();
    await page.goto(`${CONFIG.baseUrl}/`);
    await waitForNavigation(page);
    const loadTime = Date.now() - startTime;
    console.log(`⏱️ Tiempo de carga página principal: ${loadTime}ms`);
    
    // 2. Medir tiempo de carga de checkout
    const checkoutStartTime = Date.now();
    await page.goto(`${CONFIG.baseUrl}/checkout`);
    await waitForNavigation(page);
    const checkoutLoadTime = Date.now() - checkoutStartTime;
    console.log(`⏱️ Tiempo de carga checkout: ${checkoutLoadTime}ms`);
    
    // 3. Verificar manejo de datos personales
    const personalDataElements = await page.$$('input[type="email"], input[type="tel"], input[name*="name"]');
    console.log(`✅ Campos de datos personales encontrados: ${personalDataElements.length}`);
    
    // 4. Verificar que los datos sensibles no estén expuestos
    const pageContent = await page.content();
    const hasSensitiveData = pageContent.includes('password') || pageContent.includes('token');
    console.log(`✅ Verificación de datos sensibles: ${hasSensitiveData ? '⚠️ Datos encontrados' : '✅ Sin datos expuestos'}`);
    
    // 5. Probar manejo de errores
    await page.goto(`${CONFIG.baseUrl}/pagina-inexistente`);
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '20_pagina_error', 'Manejo de página no encontrada');
    
    // 6. Verificar redirecciones correctas
    await page.goto(`${CONFIG.baseUrl}/cuenta`);
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    console.log(`✅ Redirección de cuenta: ${currentUrl}`);
    
    // 7. Probar límites y validaciones
    await page.goto(`${CONFIG.baseUrl}/checkout`);
    await waitForNavigation(page);
    
    // Intentar continuar sin dirección
    const continueButton = await page.$('button:has-text("Continuar al Pago")');
    if (continueButton) {
      await continueButton.click();
      await page.waitForTimeout(1000);
      await takeScreenshot(page, '21_validacion_direccion', 'Validación de dirección requerida');
    }
    
    console.log('✅ Pruebas de rendimiento y seguridad completadas exitosamente');
    return true;
    
  } catch (error) {
    console.error('❌ Error en pruebas de rendimiento y seguridad:', error);
    await takeScreenshot(page, 'error_rendimiento', 'Error en rendimiento/seguridad');
    return false;
  }
}

// Función principal de ejecución
async function ejecutarPruebasIntegrales() {
  console.log('🚀 INICIANDO PRUEBAS INTEGRALES DE TUS AGUACATES');
  console.log('📅 Fecha y hora:', new Date().toLocaleString('es-CO'));
  console.log('🌐 URL base:', CONFIG.baseUrl);
  
  let browser;
  let page;
  
  try {
    // Iniciar navegador
    browser = await puppeteer.launch({
      headless: CONFIG.headless,
      slowMo: CONFIG.slowMo,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Configurar timeout
    page.setDefaultTimeout(CONFIG.timeout);
    
    // Resultados de las pruebas
    const resultados = {
      personalizacionSaludos: false,
      checkoutAutocompletado: false,
      sistemaSuscripciones: false,
      integracion: false,
      rendimientoSeguridad: false
    };
    
    // Ejecutar pruebas
    resultados.personalizacionSaludos = await probarPersonalizacionSaludos(page);
    resultados.checkoutAutocompletado = await probarCheckoutAutocompletado(page);
    resultados.sistemaSuscripciones = await probarSistemaSuscripciones(page);
    resultados.integracion = await probarIntegracion(page);
    resultados.rendimientoSeguridad = await probarRendimientoSeguridad(page);
    
    // Generar reporte
    await generarReporte(resultados);
    
  } catch (error) {
    console.error('❌ Error general en las pruebas:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Generar reporte de resultados
async function generarReporte(resultados) {
  const reporte = {
    fecha: new Date().toISOString(),
    urlBase: CONFIG.baseUrl,
    resultados: {
      personalizacionSaludos: {
        estado: resultados.personalizacionSaludos ? '✅ EXITOSO' : '❌ FALLIDO',
        descripcion: 'Pruebas de personalización de saludos usando nombres de usuario'
      },
      checkoutAutocompletado: {
        estado: resultados.checkoutAutocompletado ? '✅ EXITOSO' : '❌ FALLIDO',
        descripcion: 'Pruebas de checkout con autocompletado para clientes registrados'
      },
      sistemaSuscripciones: {
        estado: resultados.sistemaSuscripciones ? '✅ EXITOSO' : '❌ FALLIDO',
        descripcion: 'Pruebas de sistema de pedidos recurrentes automáticos'
      },
      integracion: {
        estado: resultados.integracion ? '✅ EXITOSO' : '❌ FALLIDO',
        descripcion: 'Pruebas de integración entre las tres funcionalidades'
      },
      rendimientoSeguridad: {
        estado: resultados.rendimientoSeguridad ? '✅ EXITOSO' : '❌ FALLIDO',
        descripcion: 'Pruebas de rendimiento y seguridad'
      }
    },
    resumen: {
      totalPruebas: Object.keys(resultados).length,
      pruebasExitosas: Object.values(resultados).filter(r => r).length,
      pruebasFallidas: Object.values(resultados).filter(r => !r).length,
      porcentajeExito: Math.round((Object.values(resultados).filter(r => r).length / Object.keys(resultados).length) * 100)
    },
    screenshots: fs.readdirSync(CONFIG.screenshotsDir).length,
    recomendaciones: []
  };
  
  // Agregar recomendaciones basadas en resultados
  if (!resultados.personalizacionSaludos) {
    reporte.recomendaciones.push('Revisar implementación de saludos personalizados en greetings.ts');
  }
  if (!resultados.checkoutAutocompletado) {
    reporte.recomendaciones.push('Verificar lógica de autocompletado en EnhancedAuthenticatedCheckoutForm.tsx');
  }
  if (!resultados.sistemaSuscripciones) {
    reporte.recomendaciones.push('Revisar configuración de suscripciones en SubscriptionConfigModal.tsx');
  }
  if (!resultados.integracion) {
    reporte.recomendaciones.push('Mejorar integración entre componentes y consistencia de datos');
  }
  if (!resultados.rendimientoSeguridad) {
    reporte.recomendaciones.push('Optimizar tiempos de carga y reforzar seguridad de datos');
  }
  
  // Guardar reporte
  const reportePath = path.join(CONFIG.screenshotsDir, `reporte-pruebas-${Date.now()}.json`);
  fs.writeFileSync(reportePath, JSON.stringify(reporte, null, 2));
  
  // Mostrar resumen en consola
  console.log('\n📊 REPORTE DE PRUEBAS INTEGRALES');
  console.log('=' .repeat(50));
  console.log(`📅 Fecha: ${new Date().toLocaleString('es-CO')}`);
  console.log(`🌐 URL: ${CONFIG.baseUrl}`);
  console.log(`📸 Screenshots: ${reporte.screenshots}`);
  console.log('\n📋 RESULTADOS:');
  
  Object.entries(reporte.resultados).forEach(([key, value]) => {
    console.log(`  ${value.estado} ${value.descripcion}`);
  });
  
  console.log('\n📈 RESUMEN:');
  console.log(`  Total pruebas: ${reporte.resumen.totalPruebas}`);
  console.log(`  Exitosas: ${reporte.resumen.pruebasExitosas}`);
  console.log(`  Fallidas: ${reporte.resumen.pruebasFallidas}`);
  console.log(`  Porcentaje éxito: ${reporte.resumen.porcentajeExito}%`);
  
  if (reporte.recomendaciones.length > 0) {
    console.log('\n💡 RECOMENDACIONES:');
    reporte.recomendaciones.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
  }
  
  console.log(`\n📄 Reporte completo guardado en: ${reportePath}`);
  console.log(`📁 Screenshots guardados en: ${CONFIG.screenshotsDir}`);
  
  return reporte;
}

// Ejecutar pruebas
if (require.main === module) {
  ejecutarPruebasIntegrales().catch(console.error);
}

module.exports = {
  ejecutarPruebasIntegrales,
  probarPersonalizacionSaludos,
  probarCheckoutAutocompletado,
  probarSistemaSuscripciones,
  probarIntegracion,
  probarRendimientoSeguridad
};