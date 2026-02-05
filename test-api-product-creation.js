const fetch = require('node-fetch');

async function testApiProductCreation() {
    const API_URL = 'http://localhost:3000/api/admin/products';
    const ADMIN_TOKEN = 'TOKEN_AQUÍ'; // El usuario debería proporcionar esto si quiere probarlo localmente

    console.log('🧪 Iniciando prueba de API de creación de productos...');

    const testProduct = {
        name: "Producto de Prueba Antigravity",
        description: "Probando nuevos campos y manejo de errores",
        price: 15000,
        stock: 20,
        category_id: "cce91d25-cbac-4d8d-bde9-488443508159", // ID de ejemplo de catalog_final.sql
        unit: "unidad",
        available_for: "both",
        is_organic: true,
        weight: 0.5,
        min_quantity: 1
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ADMIN_TOKEN}`
            },
            body: JSON.stringify(testProduct)
        });

        const result = await response.json();

        console.log('📡 Respuesta de la API (Status:', response.status, '):');
        console.log(JSON.stringify(result, null, 2));

        if (response.status === 403 && result.code === '42501') {
            console.log('✅ Manejo de error RLS detectado correctamente (403 Permission Denied)');
        } else if (response.status === 201) {
            console.log('✅ Producto creado exitosamente (la llave service_role ya fue corregida)');
        } else {
            console.log('ℹ️ Resultado inesperado o error de autenticación (falta token)');
        }

    } catch (error) {
        console.error('❌ Error ejecutando la prueba:', error.message);
        console.log('Nota: Si no tienes el servidor corriendo localmente, esta prueba fallará.');
    }
}

testApiProductCreation();
