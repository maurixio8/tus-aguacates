/**
 * Script para optimizar imagen Open Graph
 * Convierte hero-optimized.png a og-social.png con las dimensiones correctas
 */

import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const SOURCE_IMAGE = path.join(process.cwd(), 'public', 'images', 'hero-optimized.png');
const OUTPUT_IMAGE = path.join(process.cwd(), 'public', 'images', 'og-social.png');

// Dimensiones estándar para Open Graph (1200x630)
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

// Calidad para PNG (0-100, siendo 60 el óptimo para balance calidad/tamaño)
const PNG_QUALITY = 60;

async function optimizeOGImage() {
  try {
    console.log('🔍 Optimizando imagen Open Graph...');

    // Verificar que la imagen de origen existe
    if (!fs.existsSync(SOURCE_IMAGE)) {
      throw new Error(`Imagen de origen no encontrada: ${SOURCE_IMAGE}`);
    }

    // Obtener información de la imagen original
    const originalInfo = await sharp(SOURCE_IMAGE).metadata();
    console.log(`📐 Imagen original: ${originalInfo.width}x${originalInfo.height}, ${originalInfo.format}`);

    // Redimensionar y optimizar
    console.log(`📐 Redimensionando a ${OG_WIDTH}x${OG_HEIGHT}...`);

    const result = await sharp(SOURCE_IMAGE)
      .resize(OG_WIDTH, OG_HEIGHT, {
        fit: 'cover',
        position: 'center',
      })
      .png({
        quality: PNG_QUALITY,
        compressionLevel: 9, // Máxima compresión PNG
        adaptiveFiltering: true,
        palette: true,
        effort: 10, // Máximo esfuerzo de compresión
      })
      .toFile(OUTPUT_IMAGE);

    // Verificar el resultado
    const stats = fs.statSync(OUTPUT_IMAGE);
    const sizeKB = (stats.size / 1024).toFixed(2);

    console.log(`✅ Imagen optimizada exitosamente:`);
    console.log(`   - Archivo: ${OUTPUT_IMAGE}`);
    console.log(`   - Dimensiones: ${OG_WIDTH}x${OG_HEIGHT}`);
    console.log(`   - Formato: PNG (real)`);
    console.log(`   - Tamaño: ${sizeKB} KB`);

    // Verificar que el tamaño sea razonable (menos de 200KB)
    if (stats.size > 200 * 1024) {
      console.warn(`⚠️ El tamaño (${sizeKB} KB) es mayor al recomendado (<200KB)`);
      console.warn('   Puedes intentar reducir la calidad a 70 o 60');
    } else {
      console.log('✅ Tamaño óptimo para Open Graph (<200KB)');
    }

  } catch (error) {
    console.error('❌ Error optimizando imagen:', error);
    process.exit(1);
  }
}

optimizeOGImage();
