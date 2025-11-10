#!/usr/bin/env node

/**
 * Script de validación para configuración WhatsApp Business
 * Verifica que todo esté configurado correctamente según BMAD Spec
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Colores para consola
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function validateWhatsAppConfig() {
  log('🔍 VALIDACIÓN DE CONFIGURACIÓN WHATSAPP BUSINESS', 'blue');
  log('================================================', 'blue');

  // 1. Verificar variables de entorno
  log('\n📋 1. Variables de Entorno:', 'yellow');

  const requiredVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'WHATSAPP_COMPANY_NUMBER'
  ];

  let configValid = true;
  const envVars = {};

  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (value) {
      envVars[varName] = value;
      log(`✅ ${varName}: ${varName === 'WHATSAPP_COMPANY_NUMBER' ? '***' + value.slice(-4) : value}`, 'green');
    } else {
      log(`❌ ${varName}: No configurada`, 'red');
      configValid = false;
    }
  }

  if (!configValid) {
    log('\n❌ ERROR: Faltan variables de entorno requeridas', 'red');
    log('Ejecuta: cp supabase/.env.example supabase/.env', 'yellow');
    log('Y configura las variables necesarias', 'yellow');
    return false;
  }

  // 2. Validar formato del número
  log('\n📱 2. Validación Formato Número WhatsApp:', 'yellow');

  const companyNumber = envVars.WHATSAPP_COMPANY_NUMBER;
  if (companyNumber.startsWith('57') && companyNumber.length === 12) {
    log(`✅ Formato válido: +${companyNumber}`, 'green');
    log(`📞 Número configurado: 3${companyNumber.slice(1)}`, 'blue');
  } else {
    log(`❌ Formato inválido: ${companyNumber}`, 'red');
    log('Formato esperado: 57 + 10 dígitos (ej: 573042582777)', 'yellow');
    configValid = false;
  }

  // 3. Validar conexión con Supabase
  log('\n🔌 3. Validación Conexión Supabase:', 'yellow');

  try {
    const supabase = createClient(envVars.SUPABASE_URL, envVars.SUPABASE_ANON_KEY);

    // Test de conexión simple
    const { data, error } = await supabase
      .from('guest_orders')
      .select('count')
      .limit(1);

    if (error) {
      log(`❌ Error de conexión: ${error.message}`, 'red');
      configValid = false;
    } else {
      log('✅ Conexión Supabase exitosa', 'green');
    }
  } catch (error) {
    log(`❌ Error al crear cliente Supabase: ${error.message}`, 'red');
    configValid = false;
  }

  // 4. Validar funciones Edge
  log('\n⚡ 4. Validación Edge Functions:', 'yellow');

  try {
    const supabase = createClient(envVars.SUPABASE_URL, envVars.SUPABASE_ANON_KEY);

    // Test de dual-whatsapp-notification
    const testOrderData = {
      id: 'TEST-' + Date.now(),
      items: [{
        productName: 'Aguacate Test',
        quantity: 1,
        price: 4500
      }],
      total: 4500
    };

    const testCustomerInfo = {
      name: 'Cliente Test',
      phone: '3001234567',
      email: 'test@example.com',
      address: 'Cra 1 #1-1'
    };

    const { data, error } = await supabase.functions.invoke('dual-whatsapp-notification', {
      body: {
        orderData: testOrderData,
        customerInfo: testCustomerInfo
      }
    });

    if (error) {
      log(`❌ Error en dual-whatsapp-notification: ${error.message}`, 'red');
      configValid = false;
    } else if (data?.success) {
      log('✅ dual-whatsapp-notification funcionando', 'green');
      log(`📲 URL Empresa: ${data.businessWhatsAppUrl?.substring(0, 50)}...`, 'blue');
      log(`📲 URL Cliente: ${data.customerWhatsAppUrl?.substring(0, 50)}...`, 'blue');
    } else {
      log('❌ Respuesta inesperada de dual-whatsapp-notification', 'red');
      configValid = false;
    }

  } catch (error) {
    log(`❌ Error al probar Edge Function: ${error.message}`, 'red');
    configValid = false;
  }

  // 5. Resumen
  log('\n📊 RESULTADO DE VALIDACIÓN:', 'blue');
  log('================================================', 'blue');

  if (configValid) {
    log('🎉 CONFIGURACIÓN COMPLETA Y FUNCIONAL', 'green');
    log('\n✅ SISTEMA LISTO PARA RECIBIR PEDIDOS', 'green');
    log('\n📱 Las notificaciones se enviarán a:', 'blue');
    log(`   - Empresa: +57 3 042 582 777`, 'blue');
    log(`   - Clientes: WhatsApp individual`, 'blue');
    log('\n🚀 Próximo paso: Hacer un pedido de prueba completo', 'yellow');
  } else {
    log('❌ CONFIGURACIÓN INCOMPLETA', 'red');
    log('\n❌ CORREGIR LOS ERRORES ANTES DE LANZAR', 'red');
  }

  return configValid;
}

// Ejecutar validación
if (require.main === module) {
  validateWhatsAppConfig()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Error en validación:', error);
      process.exit(1);
    });
}

module.exports = { validateWhatsAppConfig };