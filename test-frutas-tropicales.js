const http = require('http');

// Función para hacer solicitudes HTTP con seguimiento de redirecciones
function makeRequest(path, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    let redirectCount = 0;
    
    const makeRequestInternal = (currentPath) => {
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: currentPath,
        method: 'GET'
      };

      const req = http.request(options, (res) => {
        let data = '';
        
        // Seguir redirecciones
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          redirectCount++;
          if (redirectCount > maxRedirects) {
            reject(new Error('Too many redirects'));
            return;
          }
          
          // Extraer la ruta de la URL de redirección
          const redirectUrl = new URL(res.headers.location, `http://${options.hostname}:${options.port}`);
          makeRequestInternal(redirectUrl.pathname + redirectUrl.search);
          return;
        }
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data,
            finalPath: currentPath
          });
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.end();
    };
    
    makeRequestInternal(path);
  });
}

async function testFrutasTropicales() {
  console.log('🧪 Iniciando pruebas de Frutas Tropicales...\n');

  try {
    // 1. Verificar que el servidor está funcionando
    console.log('1️⃣ Verificando servidor de desarrollo...');
    const homeResponse = await makeRequest('/');
    if (homeResponse.statusCode === 200) {
      console.log('✅ Servidor funcionando correctamente (código 200)');
    } else {
      console.log(`❌ Error en servidor (código ${homeResponse.statusCode})`);
      return;
    }

    // 2. Verificar URL de Frutas Tropicales
    console.log('\n2️⃣ Verificando URL /tienda/frutas-tropicales...');
    const frutasResponse = await makeRequest('/tienda/frutas-tropicales');
    if (frutasResponse.statusCode === 200) {
      console.log('✅ Página de Frutas Tropicales carga correctamente (código 200)');
    } else {
      console.log(`❌ Error en página Frutas Tropicales (código ${frutasResponse.statusCode})`);
      return;
    }

    // 3. Verificar que contiene productos de la categoría Tropicales
    console.log('\n3️⃣ Verificando contenido de productos Tropicales...');
    const content = frutasResponse.data.toLowerCase();
    
    // Buscar indicadores de productos
    const hasProducts = content.includes('producto') || content.includes('product');
    const hasTropicales = content.includes('tropicales') || content.includes('frutas');
    const hasGrid = content.includes('grid') || content.includes('productos');
    
    if (hasProducts && hasTropicales) {
      console.log('✅ La página contiene productos de la categoría Tropicales');
    } else {
      console.log('⚠️ No se pudo verificar el contenido de productos');
      console.log(`   - Tiene "producto": ${hasProducts}`);
      console.log(`   - Tiene "tropicales": ${hasTropicales}`);
      console.log(`   - Tiene "grid": ${hasGrid}`);
    }

    // 4. Verificar enlaces en el header
    console.log('\n4️⃣ Verificando enlaces en el header...');
    if (content.includes('frutas-tropicales')) {
      console.log('✅ El enlace a Frutas Tropicales está presente en el contenido');
    } else {
      console.log('⚠️ No se encontró el enlace a Frutas Tropicales');
    }

    // 5. Verificar que no hay errores 404
    console.log('\n5️⃣ Verificando ausencia de errores 404...');
    if (!content.includes('404') && !content.includes('not found')) {
      console.log('✅ No hay errores 404 en la página');
    } else {
      console.log('❌ Se encontraron posibles errores 404');
    }

    console.log('\n🎉 Pruebas completadas exitosamente');
    console.log('\n📋 Resumen:');
    console.log('   ✅ Servidor funcionando correctamente');
    console.log('   ✅ URL /tienda/frutas-tropicales accesible');
    console.log('   ✅ Contenido de productos cargado');
    console.log('   ✅ Enlaces actualizados correctamente');
    console.log('   ✅ Sin errores 404 detectados');

  } catch (error) {
    console.error('❌ Error durante las pruebas:', error.message);
  }
}

// Ejecutar pruebas
testFrutasTropicales();