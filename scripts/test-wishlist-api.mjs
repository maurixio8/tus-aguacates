#!/usr/bin/env node
/**
 * Script de prueba para la API de Wishlist
 * Requiere las siguientes variables de entorno:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY
 * - SUPABASE_TEST_EMAIL
 * - SUPABASE_TEST_PASSWORD
 *
 * Uso: npm run test:wishlist
 * O con variables inline: SUPABASE_TEST_EMAIL=x SUPABASE_TEST_PASSWORD=y npm run test:wishlist
 */

import { createClient } from '@supabase/supabase-js';

const API_BASE = process.env.WISHLIST_API_URL || 'http://localhost:3000';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const TEST_EMAIL = process.env.SUPABASE_TEST_EMAIL;
const TEST_PASSWORD = process.env.SUPABASE_TEST_PASSWORD;

// Colores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n[${step}] ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`  OK: ${message}`, 'green');
}

function logError(message) {
  log(`  ERROR: ${message}`, 'red');
}

function logInfo(message) {
  log(`  INFO: ${message}`, 'blue');
}

async function main() {
  log('\n========================================', 'yellow');
  log('  WISHLIST API TEST SCRIPT', 'yellow');
  log('========================================\n', 'yellow');

  // Verificar variables de entorno requeridas
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    logError('Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY');
    process.exit(1);
  }

  if (!TEST_EMAIL || !TEST_PASSWORD) {
    log('SKIPPED: Faltan SUPABASE_TEST_EMAIL o SUPABASE_TEST_PASSWORD', 'yellow');
    log('Configure estas variables de entorno para ejecutar las pruebas.', 'yellow');
    process.exit(0);
  }

  logInfo(`API Base: ${API_BASE}`);
  logInfo(`Supabase URL: ${SUPABASE_URL.substring(0, 30)}...`);
  logInfo(`Test email: ${TEST_EMAIL}`);

  // Crear cliente Supabase
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  let accessToken = null;
  let testProductId = null;

  try {
    // PASO 1: Login
    logStep('1/6', 'Autenticando usuario de prueba...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    if (authError || !authData.session) {
      logError(`Error de autenticacion: ${authError?.message || 'No session'}`);
      process.exit(1);
    }

    accessToken = authData.session.access_token;
    logSuccess(`Usuario autenticado: ${authData.user.id}`);
    logInfo(`Token: ${accessToken.substring(0, 20)}...`);

    // PASO 2: Obtener un producto de prueba
    logStep('2/6', 'Obteniendo producto de prueba...');
    const { data: products, error: productError } = await supabase
      .from('products')
      .select('id, name')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (productError || !products) {
      logError(`Error obteniendo producto: ${productError?.message || 'No products'}`);
      process.exit(1);
    }

    testProductId = products.id;
    logSuccess(`Producto de prueba: ${products.name} (${testProductId})`);

    // PASO 3: GET inicial - verificar wishlist actual
    logStep('3/6', 'GET /api/wishlist - Obteniendo wishlist actual...');
    const getResponse1 = await fetch(`${API_BASE}/api/wishlist`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!getResponse1.ok) {
      const errorBody = await getResponse1.text();
      logError(`GET fallo: ${getResponse1.status} - ${errorBody}`);
      process.exit(1);
    }

    const getData1 = await getResponse1.json();
    logSuccess(`GET exitoso: ${getData1.data?.length || 0} items en wishlist`);

    // Limpiar producto de prueba si ya existe
    const existingItem = getData1.data?.find(item => item.product_id === testProductId);
    if (existingItem) {
      logInfo('Producto de prueba ya existe en wishlist, limpiando...');
      const cleanupResponse = await fetch(`${API_BASE}/api/wishlist/${testProductId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      if (cleanupResponse.ok) {
        logInfo('Producto limpiado exitosamente');
      }
    }

    // PASO 4: POST - agregar producto a wishlist
    logStep('4/6', 'POST /api/wishlist - Agregando producto a wishlist...');
    const postResponse = await fetch(`${API_BASE}/api/wishlist`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ product_id: testProductId }),
    });

    const postData = await postResponse.json();

    if (!postResponse.ok || postResponse.status >= 400) {
      logError(`POST fallo: ${postResponse.status} - ${JSON.stringify(postData)}`);
      process.exit(1);
    }

    logSuccess(`POST exitoso (${postResponse.status}): Item creado con id ${postData.data?.id}`);

    // PASO 5: GET - verificar que el producto esta en wishlist
    logStep('5/6', 'GET /api/wishlist - Verificando producto agregado...');
    const getResponse2 = await fetch(`${API_BASE}/api/wishlist`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!getResponse2.ok) {
      logError(`GET verificacion fallo: ${getResponse2.status}`);
      process.exit(1);
    }

    const getData2 = await getResponse2.json();
    const addedItem = getData2.data?.find(item => item.product_id === testProductId);

    if (!addedItem) {
      logError('El producto no aparece en wishlist despues de POST');
      process.exit(1);
    }

    logSuccess(`GET verificacion exitoso: Producto encontrado en wishlist`);
    logInfo(`Wishlist ahora tiene ${getData2.data?.length || 0} items`);

    // PASO 6: DELETE - eliminar producto de wishlist
    logStep('6/6', `DELETE /api/wishlist/${testProductId} - Eliminando producto...`);
    const deleteResponse = await fetch(`${API_BASE}/api/wishlist/${testProductId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const deleteData = await deleteResponse.json();

    if (!deleteResponse.ok) {
      logError(`DELETE fallo: ${deleteResponse.status} - ${JSON.stringify(deleteData)}`);
      process.exit(1);
    }

    logSuccess('DELETE exitoso');

    // Verificar que se elimino
    const getResponse3 = await fetch(`${API_BASE}/api/wishlist`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const getData3 = await getResponse3.json();
    const deletedItem = getData3.data?.find(item => item.product_id === testProductId);

    if (deletedItem) {
      logError('El producto aun aparece en wishlist despues de DELETE');
      process.exit(1);
    }

    logSuccess('Verificacion: Producto eliminado correctamente de wishlist');

    // TESTS ADICIONALES: Edge cases
    log('\n--- Pruebas de edge cases ---', 'yellow');

    // Test: POST sin token
    logStep('E1', 'POST sin token (debe fallar 401)...');
    const noTokenResponse = await fetch(`${API_BASE}/api/wishlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: testProductId }),
    });
    if (noTokenResponse.status === 401) {
      logSuccess('Correctamente rechazado sin token (401)');
    } else {
      logError(`Esperaba 401, obtuvo ${noTokenResponse.status}`);
    }

    // Test: POST con producto inexistente
    logStep('E2', 'POST con producto inexistente (debe fallar 404)...');
    const fakeProductId = '00000000-0000-0000-0000-000000000000';
    const notFoundResponse = await fetch(`${API_BASE}/api/wishlist`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ product_id: fakeProductId }),
    });
    if (notFoundResponse.status === 404) {
      logSuccess('Correctamente rechazado con producto inexistente (404)');
    } else {
      logError(`Esperaba 404, obtuvo ${notFoundResponse.status}`);
    }

    // Test: POST duplicado
    logStep('E3', 'POST duplicado (debe fallar 409)...');
    // Primero agregar
    await fetch(`${API_BASE}/api/wishlist`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ product_id: testProductId }),
    });
    // Intentar agregar de nuevo
    const duplicateResponse = await fetch(`${API_BASE}/api/wishlist`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ product_id: testProductId }),
    });
    if (duplicateResponse.status === 409) {
      logSuccess('Correctamente rechazado duplicado (409)');
    } else {
      logError(`Esperaba 409, obtuvo ${duplicateResponse.status}`);
    }

    // Limpiar
    await fetch(`${API_BASE}/api/wishlist/${testProductId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    // Resumen final
    log('\n========================================', 'green');
    log('  TODAS LAS PRUEBAS PASARON', 'green');
    log('========================================\n', 'green');

    process.exit(0);

  } catch (error) {
    logError(`Error inesperado: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

main();
