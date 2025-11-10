#!/usr/bin/env node

/**
 * Script para deploy de WhatsApp Edge Function
 * Maneja configuración de variables de entorno para Windows
 */

const { spawn } = require('child_process');
require('dotenv').config({ path: '.env.local' });

const BUSINESS_TOKEN = 'sbp_1a25d98bf7d9594396577ebdbb7bbf332b13da00';

console.log('🚀 DEPLOYING WHATSAPP BUSINESS EDGE FUNCTION');
console.log('================================================');
console.log(`📱 Business Number: +57 3 042 582 777`);
console.log('🔧 Supabase Project: gxqkmaaqoehydulksudj');

async function deployWhatsAppFunction() {
  try {
    // Configurar variable de entorno para este proceso
    process.env.SUPABASE_ACCESS_TOKEN = BUSINESS_TOKEN;

    console.log('\n📋 1. Preparando deploy...', 'yellow');

    // Ejecutar comando de deploy
    const deployProcess = spawn('npx', ['supabase', 'functions', 'deploy', 'dual-whatsapp-notification'], {
      stdio: 'inherit',
      stderr: 'inherit',
      env: {
        ...process.env,
        SUPABASE_ACCESS_TOKEN: BUSINESS_TOKEN
      }
    });

    return new Promise((resolve, reject) => {
      deployProcess.on('close', (code) => {
        if (code === 0) {
          console.log('\n✅ DEPLOY EXITOSO', 'green');
          console.log('🚀 dual-whatsapp-notification deployed successfully', 'green');
          resolve(true);
        } else {
          console.log(`\n❌ DEPLOY FALLÓ con código ${code}`, 'red');
          reject(new Error(`Deploy failed with code ${code}`));
        }
      });

      deployProcess.on('error', (error) => {
        console.error('\n❌ ERROR DEPLOY:', 'red');
        console.error(error);
        reject(error);
      });
    });

  } catch (error) {
    console.error('\n❌ ERROR GENERAL:', 'red');
    console.error(error);
    throw error;
  }
}

// Ejecutar deploy
if (require.main === module) {
  deployWhatsAppFunction()
    .then(() => {
      console.log('\n🎉 DEPLOY COMPLETADO', 'green');
      console.log('✅ Edge Function lista para producción', 'green');
      console.log('\n📞 WhatsApp Business: +57 3 042 582 777', 'blue');
      console.log('🔄 Las notificaciones ahora son automáticas', 'blue');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 DEPLOY FAILED:', 'red');
      console.error('Contacta al equipo de soporte técnico', 'red');
      process.exit(1);
    });
}

module.exports = { deployWhatsAppFunction };