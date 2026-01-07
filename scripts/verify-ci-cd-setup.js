#!/usr/bin/env node

/**
 * Script para verificar que la configuración de CI/CD es correcta
 * Este script verifica que las variables de entorno necesarias estén configuradas
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  step: (msg) => console.log(`\n${colors.cyan}▶${colors.reset} ${msg}`),
};

console.log('\n' + '='.repeat(60));
console.log(`${colors.cyan}🔍 Verificación de Configuración CI/CD${colors.reset}`);
console.log('='.repeat(60) + '\n');

let allChecksPassed = true;

// Verificar que el workflow existe
log.step('Verificando archivo de workflow...');
const workflowPath = path.join(__dirname, '..', '.github', 'workflows', 'deploy.yml');
if (fs.existsSync(workflowPath)) {
  log.success('✓ Workflow file encontrado: .github/workflows/deploy.yml');
} else {
  log.error('✗ Workflow file NO encontrado');
  allChecksPassed = false;
}

// Verificar que los tests existen
log.step('Verificando tests de smoke...');
const smokeTestPath = path.join(__dirname, '..', 'tests', 'smoke', 'dashboard.spec.ts');
if (fs.existsSync(smokeTestPath)) {
  log.success('✓ Smoke tests encontrados: tests/smoke/dashboard.spec.ts');
} else {
  log.warning('⚠ Smoke tests NO encontrados (opcional)');
}

// Verificar scripts en package.json
log.step('Verificando scripts en package.json...');
try {
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  const requiredScripts = ['test:e2e', 'build'];
  const optionalScripts = ['test', 'lint'];

  requiredScripts.forEach(script => {
    if (packageJson.scripts[script]) {
      log.success(`✓ Script "${script}" configurado`);
    } else {
      log.error(`✗ Script requerido "${script}" NO encontrado`);
      allChecksPassed = false;
    }
  });

  optionalScripts.forEach(script => {
    if (packageJson.scripts[script]) {
      log.success(`✓ Script opcional "${script}" configurado`);
    }
  });
} catch (error) {
  log.error('✗ Error al leer package.json: ' + error.message);
  allChecksPassed = false;
}

// Verificar configuración de Playwright
log.step('Verificando configuración de Playwright...');
const playwrightConfigPath = path.join(__dirname, '..', 'playwright.config.ts');
if (fs.existsSync(playwrightConfigPath)) {
  log.success('✓ Playwright config encontrado');
} else {
  log.warning('⚠ Playwright config NO encontrado (se usará config por defecto)');
}

// Verificar archivos importantes
log.step('Verificando archivos del proyecto...');
const importantFiles = [
  { path: 'next.config.ts', name: 'Next.js config' },
  { path: '.env.example', name: 'Environment variables example', optional: true },
  { path: 'tsconfig.json', name: 'TypeScript config' },
];

importantFiles.forEach(({ path: filePath, name, optional = false }) => {
  const fullPath = path.join(__dirname, '..', filePath);
  if (fs.existsSync(fullPath)) {
    log.success(`✓ ${name} encontrado`);
  } else if (optional) {
    log.warning(`⚠ ${name} NO encontrado (opcional)`);
  } else {
    log.error(`✗ ${name} NO encontrado`);
    allChecksPassed = false;
  }
});

// Instrucciones para GitHub Secrets
log.step('GitHub Secrets requeridos');
log.info('Los siguientes secrets deben configurarse en GitHub:');
console.log(`
${colors.cyan}1. Configurar en GitHub:${colors.reset}
   - Ve a: https://github.com/maurixio8/tus-aguacates/settings/secrets/actions

${colors.yellow}Secrets requeridos:${colors.reset}
   • VERCEL_TOKEN           - Token de autenticación de Vercel
   • VERCEL_ORG_ID          - ID de organización en Vercel
   • VERCEL_PROJECT_ID      - ID del proyecto en Vercel

${colors.yellow}Secrets opcionales (pero recomendados):${colors.reset}
   • NEXT_PUBLIC_SUPABASE_URL       - URL de Supabase
   • NEXT_PUBLIC_SUPABASE_ANON_KEY  - Clave anónima de Supabase

${colors.cyan}2. Obtener IDs de Vercel:${colors.reset}
   npx vercel link
   # Luego revisa .vercel/project.json para obtener los IDs

${colors.cyan}3. Agregar secrets a GitHub:${colors.reset}
   gh secret set VERCEL_TOKEN
   gh secret set VERCEL_ORG_ID
   gh secret set VERCEL_PROJECT_ID
`);

// Verificar si .vercel/project.json existe para extraer los IDs
log.step('Verificando configuración de Vercel...');
const vercelProjectPath = path.join(__dirname, '..', '.vercel', 'project.json');
if (fs.existsSync(vercelProjectPath)) {
  try {
    const vercelConfig = JSON.parse(fs.readFileSync(vercelProjectPath, 'utf8'));
    log.success('✓ Proyecto de Vercel configurado');
    console.log(`
${colors.cyan}IDs de Vercel encontrados:${colors.reset}
   • Org ID: ${vercelConfig.orgId}
   • Project ID: ${vercelConfig.projectId}

${colors.yellow}Usa estos valores para configurar los secrets en GitHub${colors.reset}
    `);
  } catch (error) {
    log.warning('⚠ Error al leer .vercel/project.json');
  }
} else {
  log.warning('⚠ Proyecto de Vercel NO vinculado. Ejecuta: npx vercel link');
}

// Resumen final
console.log('\n' + '='.repeat(60));
if (allChecksPassed) {
  console.log(`${colors.green}✓ Todas las verificaciones pasaron${colors.reset}`);
  console.log(`\n${colors.cyan}Siguientes pasos:${colors.reset}`);
  console.log('1. Configura los secrets de GitHub');
  console.log('2. Haz commit de los cambios: git add . && git commit -m "feat: add CI/CD pipeline"');
  console.log('3. Haz push: git push origin main');
  console.log('4. El workflow se ejecutará automáticamente en GitHub Actions');
  console.log(`\n${colors.cyan}Ver el workflow en:${colors.reset} https://github.com/maurixio8/tus-aguacates/actions`);
} else {
  console.log(`${colors.red}✗ Algunas verificaciones fallaron${colors.reset}`);
  console.log(`${colors.yellow}Por favor corrige los errores antes de continuar${colors.reset}\n`);
}
console.log('='.repeat(60) + '\n');

process.exit(allChecksPassed ? 0 : 1);
