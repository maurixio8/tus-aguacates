/**
 * Servicio de carga de imágenes de categorías de recetas a Supabase Storage
 * Reutiliza la lógica de image-upload-service.ts para categorías de productos
 */

import { supabase } from './supabase';

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface UploadResult {
  success: boolean;
  publicUrl?: string;
  storagePath?: string;
  error?: string;
  message?: string;
}

// Configuración para categorías de recetas (usa el mismo bucket que categorías de productos)
const RECIPE_CATEGORY_UPLOAD_CONFIG = {
  BUCKET_NAME: 'product-images',
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_FORMATS: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
  COMPRESSION_QUALITY: 0.85,
  MAX_WIDTH: 800, // Más grande para mejor calidad en hero section
  MAX_HEIGHT: 600,
};

/**
 * Valida que el archivo sea una imagen válida
 */
function validateImage(file: File): { valid: boolean; error?: string } {
  // Validar tipo
  if (!RECIPE_CATEGORY_UPLOAD_CONFIG.ALLOWED_FORMATS.includes(file.type)) {
    return {
      valid: false,
      error: `Formato no permitido. Usa: ${RECIPE_CATEGORY_UPLOAD_CONFIG.ALLOWED_EXTENSIONS.join(', ')}`
    };
  }

  // Validar extensión
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!RECIPE_CATEGORY_UPLOAD_CONFIG.ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `Extensión no permitida: ${ext}`
    };
  }

  // Validar tamaño
  if (file.size > RECIPE_CATEGORY_UPLOAD_CONFIG.MAX_SIZE) {
    const maxSizeMB = RECIPE_CATEGORY_UPLOAD_CONFIG.MAX_SIZE / (1024 * 1024);
    return {
      valid: false,
      error: `Archivo muy grande. Máximo: ${maxSizeMB}MB, Tu archivo: ${(file.size / (1024 * 1024)).toFixed(2)}MB`
    };
  }

  return { valid: true };
}

/**
 * Comprime una imagen a través de canvas
 */
async function compressImage(
  file: File,
  quality: number = RECIPE_CATEGORY_UPLOAD_CONFIG.COMPRESSION_QUALITY,
  maxWidth: number = RECIPE_CATEGORY_UPLOAD_CONFIG.MAX_WIDTH,
  maxHeight: number = RECIPE_CATEGORY_UPLOAD_CONFIG.MAX_HEIGHT
): Promise<Blob> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Mantener aspecto mientras se limita tamaño
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
        }

        canvas.toBlob(
          (blob) => resolve(blob || new Blob()),
          file.type === 'image/png' ? 'image/png' : 'image/jpeg',
          quality
        );
      };

      img.src = event.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Sube una imagen de categoría de receta a Supabase Storage
 * @param file - Archivo de imagen
 * @param categorySlug - Slug de la categoría
 * @param onProgress - Callback de progreso
 * @returns Resultado del upload
 */
export async function uploadRecipeCategoryImage(
  file: File,
  categorySlug: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  try {
    console.log('📸 [Categoría Receta] Iniciando validación de imagen...');

    // 1. Validar imagen
    const validation = validateImage(file);
    if (!validation.valid) {
      console.error('❌ Validación fallida:', validation.error);
      return {
        success: false,
        error: validation.error
      };
    }

    console.log('✅ Imagen validada');

    // 2. Determinar si estamos en el servidor o cliente
    const isServer = typeof window === 'undefined';
    let uploadBlob: Blob;
    let contentType: string;

    if (isServer) {
      // En el servidor, subir el archivo directamente sin compresión
      console.log('⚙️ Modo servidor: subiendo imagen sin compresión');
      uploadBlob = file;
      contentType = file.type;
    } else {
      // En el cliente, comprimir la imagen
      console.log('⚙️ Comprimiendo imagen de categoría de receta...');
      const compressedBlob = await compressImage(
        file,
        RECIPE_CATEGORY_UPLOAD_CONFIG.COMPRESSION_QUALITY,
        RECIPE_CATEGORY_UPLOAD_CONFIG.MAX_WIDTH,
        RECIPE_CATEGORY_UPLOAD_CONFIG.MAX_HEIGHT
      );
      const compressedSize = (compressedBlob.size / (1024 * 1024)).toFixed(2);
      const originalSize = (file.size / (1024 * 1024)).toFixed(2);
      console.log(`✅ Imagen comprimida: ${originalSize}MB → ${compressedSize}MB`);
      uploadBlob = compressedBlob;
      contentType = 'image/jpeg';

      // Reportar progreso de compresión
      if (onProgress) {
        onProgress({
          loaded: compressedBlob.size,
          total: compressedBlob.size,
          percentage: 50
        });
      }
    }

    // 3. Crear archivo con nombre único
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const extension = file.type === 'image/png' ? 'png' : 'jpg';
    const filename = `recipe-${categorySlug}-${timestamp}-${randomStr}.${extension}`;
    const storagePath = `recipe-categories/${categorySlug}/${filename}`;

    console.log(`📤 Subiendo a Supabase Storage: ${storagePath}`);

    // 4. Subir a Supabase Storage
    const { data, error } = await supabase.storage
      .from(RECIPE_CATEGORY_UPLOAD_CONFIG.BUCKET_NAME)
      .upload(storagePath, uploadBlob, {
        contentType: contentType,
        upsert: false,
        cacheControl: '31536000' // 1 año de caché para categorías (cambian poco)
      });

    if (error) {
      console.error('❌ Error en Supabase Storage:', error);
      return {
        success: false,
        error: `Error al subir: ${error.message}`
      };
    }

    console.log('✅ Archivo subido:', data.path);

    // Reportar progreso de subida
    if (onProgress) {
      onProgress({
        loaded: uploadBlob.size,
        total: uploadBlob.size,
        percentage: 100
      });
    }

    // 5. Obtener URL pública
    const { data: publicUrlData } = supabase.storage
      .from(RECIPE_CATEGORY_UPLOAD_CONFIG.BUCKET_NAME)
      .getPublicUrl(storagePath);

    const publicUrl = publicUrlData.publicUrl;
    console.log('✅ URL pública generada:', publicUrl);

    return {
      success: true,
      publicUrl,
      storagePath,
      message: 'Imagen de categoría de receta subida exitosamente'
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    console.error('❌ Error durante upload de categoría de receta:', errorMessage);
    return {
      success: false,
      error: `Error: ${errorMessage}`
    };
  }
}

/**
 * Reemplaza una imagen de categoría de receta
 * @param newFile - Nuevo archivo de imagen
 * @param categorySlug - Slug de la categoría
 * @param oldStoragePath - Ruta de la imagen anterior (opcional)
 * @param onProgress - Callback de progreso
 */
export async function replaceRecipeCategoryImage(
  newFile: File,
  categorySlug: string,
  oldStoragePath?: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  try {
    // 1. Subir nueva imagen
    const uploadResult = await uploadRecipeCategoryImage(newFile, categorySlug, onProgress);

    if (!uploadResult.success) {
      return uploadResult;
    }

    // 2. Eliminar imagen anterior si existe
    if (oldStoragePath) {
      console.log(`🗑️ Eliminando imagen anterior de categoría de receta: ${oldStoragePath}`);
      const { error: deleteError } = await supabase.storage
        .from(RECIPE_CATEGORY_UPLOAD_CONFIG.BUCKET_NAME)
        .remove([oldStoragePath]);

      if (deleteError) {
        console.warn('⚠️ No se pudo eliminar imagen anterior:', deleteError);
        // No fallar el upload si no se puede eliminar la anterior
      } else {
        console.log('✅ Imagen anterior eliminada');
      }
    }

    return uploadResult;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    console.error('❌ Error durante reemplazo de categoría de receta:', errorMessage);
    return {
      success: false,
      error: `Error: ${errorMessage}`
    };
  }
}

/**
 * Elimina una imagen de categoría de receta del storage
 */
export async function deleteRecipeCategoryImage(storagePath: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(RECIPE_CATEGORY_UPLOAD_CONFIG.BUCKET_NAME)
      .remove([storagePath]);

    if (error) {
      console.error('Error eliminando imagen de categoría de receta:', error);
      return false;
    }

    console.log('✅ Imagen de categoría de receta eliminada:', storagePath);
    return true;
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
}

/**
 * Obtiene la URL pública de una imagen de categoría de receta
 */
export function getRecipeCategoryImageUrl(storagePath: string): string {
  const { data } = supabase.storage
    .from(RECIPE_CATEGORY_UPLOAD_CONFIG.BUCKET_NAME)
    .getPublicUrl(storagePath);

  return data.publicUrl;
}
