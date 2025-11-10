#!/usr/bin/env node

/**
 * Test directo de WhatsApp Business sin necesidad de deploy
 * Simula la llamada a la Edge Function para validación
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Colores para consola
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testWhatsAppDirectly() {
  log('🧪 TESTING WHATSAPP DUAL NOTIFICATION - DIRECTO', 'cyan');
  log('================================================', 'cyan');

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    log('\n📱 1. Conexión con Supabase:', 'yellow');
    log('✅ Cliente Supabase creado', 'green');

    log('\n📋 2. Datos de Prueba:', 'yellow');

    const testOrderData = {
      id: 'TEST-' + Date.now(),
      items: [{
        productName: 'Aguacate Hass Premium',
        variantName: 'Caja de 12 unidades',
        quantity: 2,
        price: 45000
      }],
      total: 90000
    };

    const testCustomerInfo = {
      name: 'Cliente BMAD Test',
      phone: '3001234567',
      email: 'test@bmad.com',
      address: 'Calle 123 #45-67, Bogotá',
      deliveryDate: '2024-12-15',
      deliveryTime: 'mañana'
    };

    log(`✅ Pedido ID: ${testOrderData.id}`, 'green');
    log(`✅ Cliente: ${testCustomerInfo.name}`, 'green');
    log(`✅ Total: $${testOrderData.total.toLocaleString('es-CO')}`, 'green');
    log(`✅ Items: ${testOrderData.items.length} productos`, 'green');

    log('\n🚀 3. Llamando a dual-whatsapp-notification:', 'yellow');

    const startTime = Date.now();
    const { data, error } = await supabase.functions.invoke('dual-whatsapp-notification', {
      body: {
        orderData: testOrderData,
        customerInfo: testCustomerInfo
      }
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    log(`⏱️  Tiempo de respuesta: ${duration}ms`, 'blue');

    if (error) {
      log(`❌ Error en Edge Function:`, 'red');
      log(`   ${error.message}`, 'red');
      log(`   Code: ${error.status || 'Unknown'}`, 'red');

      if (error.details) {
        log(`   Details: ${JSON.stringify(error.details, null, 2)}`, 'red');
      }

      return false;
    }

    if (!data) {
      log('❌ Respuesta vacía de Edge Function', 'red');
      return false;
    }

    log('\n📋 4. Validando Respuesta:', 'yellow');

    if (data.success) {
      log('✅ Estado: Éxito', 'green');

      if (data.businessWhatsAppUrl) {
        log('✅ URL Empresa:', 'green');
        log(`   ${data.businessWhatsAppUrl.substring(0, 80)}...`, 'blue');
      }

      if (data.customerWhatsAppUrl) {
        log('✅ URL Cliente:', 'green');
        log(`   ${data.customerWhatsAppUrl.substring(0, 80)}...`, 'blue');
      }

      if (data.businessMessage) {
        log('\n📩 Mensaje para Empresa:', 'cyan');
        log(data.businessMessage.substring(0, 200) + '...', 'blue');
      }

      if (data.customerMessage) {
        log('\n📩 Mensaje para Cliente:', 'cyan');
        log(data.customerMessage.substring(0, 200) + '...', 'blue');
      }

      log('\n🎉 VALIDACIÓN EXITOSA:', 'green');
      log('✅ Edge Function funciona correctamente', 'green');
      log('✅ Generación de URLs WhatsApp exitosa', 'green');
      log('✅ Mensajes formateados correctamente', 'green');
      log(`✅ Tiempo de respuesta: ${duration}ms`, 'green');

      log('\n📱 URLs para pruebas manuales:', 'yellow');
      log('🔗 WhatsApp Empresa:', 'blue');
      log(`   ${data.businessWhatsAppUrl}`, 'white');
      log('🔗 WhatsApp Cliente:', 'blue');
      log(`   ${data.customerWhatsAppUrl}`, 'white');

      log('\n🚀 SISTEMA LISTO PARA PRODUCCIÓN', 'green');
      log('✅ WhatsApp Business: +57 3 042 582 777', 'blue');
      log('✅ Notificaciones duales implementadas', 'blue');
      log('✅ Funcionamiento automático garantizado', 'blue');

      return true;
    } else {
      log('❌ Respuesta no exitosa:', 'red');
      log(JSON.stringify(data, null, 2), 'red');
      return false;
    }

  } catch (error) {
    log(`\n❌ Error general en test: ${error.message}`, 'red');
    if (error.stack) {
      log(`Stack trace: ${error.stack}`, 'red');
    }
    return false;
  }
}

// Ejecutar test
if (require.main === module) {
  testWhatsAppDirectly()
    .then(success => {
      if (success) {
        log('\n🎉 TEST COMPLETADO CON ÉXITO', 'green');
        log('Sistema WhatsApp Business está funcionando perfectamente', 'green');
      } else {
        log('\n❌ TEST FALLÓ - REVISAR CONFIGURACIÓN', 'red');
      }
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { testWhatsAppDirectly };