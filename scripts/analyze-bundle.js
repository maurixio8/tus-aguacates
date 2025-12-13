const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Analizando el bundle del proyecto...\n');

// 1. Analizar tamaño de dependencias
console.log('📦 Top 20 dependencias más pesadas:');
try {
  const output = execSync('npm ls --depth=0 --json', { encoding: 'utf8' });
  const data = JSON.parse(output);
  const deps = data.dependencies || {};

  // Obtener tamaño de node_modules
  const sizeOutput = execSync('du -sh node_modules 2>/dev/null || echo "N/A"', {
    encoding: 'utf8',
    shell: true
  }).trim();
  console.log(`   Tamaño total de node_modules: ${sizeOutput}\n`);

  // Dependencias potencialmente pesadas
  const heavyDeps = [
    '@react-google-maps/api',
    'puppeteer',
    'swiper',
    '@tanstack/react-query',
    'supabase'
  ];

  heavyDeps.forEach(dep => {
    if (deps[dep]) {
      try {
        const depSize = execSync(`du -sh node_modules/${dep} 2>/dev/null || echo "N/A"`, {
          encoding: 'utf8',
          shell: true
        }).trim();
        console.log(`   ${dep}: ${depSize}`);
      } catch (e) {
        console.log(`   ${dep}: No encontrado`);
      }
    }
  });
} catch (error) {
  console.error('Error analizando dependencias:', error.message);
}

// 2. Analizar chunks del build
console.log('\n📊 Analizando chunks del build...');
try {
  const buildPath = '.next/static/chunks';
  if (fs.existsSync(buildPath)) {
    const chunks = fs.readdirSync(buildPath)
      .filter(file => file.endsWith('.js'))
      .map(file => {
        const filePath = path.join(buildPath, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          size: stats.size,
          sizeKB: Math.round(stats.size / 1024)
        };
      })
      .sort((a, b) => b.size - a.size);

    console.log('   Top 10 chunks más grandes:');
    chunks.slice(0, 10).forEach((chunk, index) => {
      const bar = '█'.repeat(Math.min(Math.floor(chunk.sizeKB / 20), 20));
      console.log(`   ${index + 1}. ${chunk.name}: ${chunk.sizeKB}KB ${bar}`);
    });

    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
    console.log(`\n   Tamaño total del bundle: ${Math.round(totalSize / 1024)}KB`);
  } else {
    console.log('   No se encontró el directorio del build. Ejecuta npm run build primero.');
  }
} catch (error) {
  console.error('Error analizando chunks:', error.message);
}

// 3. Recomendaciones de optimización
console.log('\n💡 Recomendaciones de optimización:');
console.log('   1. Mover puppeteer a devDependencies (solo para desarrollo/testing)');
console.log('   2. Implementar lazy loading para Google Maps');
console.log('   3. Considerar swiper lighter alternatives (splide.js, embla-carousel)');
console.log('   4. Optimizar imágenes con next/image');
console.log('   5. Implementar code splitting para rutas admin');
console.log('   6. Usar tree shaking para lucide-react');

// 4. Verificar imports problemáticos
console.log('\n🔎 Buscando imports problemáticos...');
const filesToCheck = [
  'app/page.tsx',
  'components/layout/ClientLayout.tsx',
  'components/home/'
];

filesToCheck.forEach(file => {
  try {
    const filePath = path.resolve(file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');

      // Buscar imports de librerías pesadas
      if (content.includes('@react-google-maps')) {
        console.log(`   ⚠️  ${file}: Import de Google Maps encontrado`);
      }
      if (content.includes('swiper')) {
        console.log(`   ⚠️  ${file}: Import de Swiper encontrado`);
      }
      if (content.includes('puppeteer')) {
        console.log(`   🚨 ${file}: Import de Puppeteer encontrado (DEBERÍA ESTAR SOLO EN SERVER!)`);
      }
    }
  } catch (error) {
    // Ignorar archivos que no existen
  }
});

console.log('\n✅ Análisis completado!');