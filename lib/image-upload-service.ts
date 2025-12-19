/**
 * Servicio de carga de imágenes optimizadas a Supabase Storage
 * Maneja:
 * - Validación de formato y tamaño
 * - Optimización/compresión de imagen
 * - Carga a Supabase Storage
 * - Generación de URLs públicas
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

// Configuración para productos
const UPLOAD_CONFIG = {
  BUCKET_NAME: 'product-images',
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_FORMATS: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
  COMPRESSION_QUALITY: 0.8,
  MAX_WIDTH: 1200,
  MAX_HEIGHT: 1200,
};

// Configuración para categorías
const CATEGORY_UPLOAD_CONFIG = {
  BUCKET_NAME: 'category-images',
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_FORMATS: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
  COMPRESSION_QUALITY: 0.85, // Calidad ligeramente superior para categorías
  MAX_WIDTH: 400, // Categorías más pequeñas
  MAX_HEIGHT: 400,
};

/**
 * Valida que el archivo sea una imagen válida
 */
export function validateImage(file: File): { valid: boolean; error?: string } {
  // Validar tipo
  if (!UPLOAD_CONFIG.ALLOWED_FORMATS.includes(file.type)) {
    return {
      valid: false,
      error: `Formato no permitido. Usa: ${UPLOAD_CONFIG.ALLOWED_EXTENSIONS.join(', ')}`
    };
  }

  // Validar extensión
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!UPLOAD_CONFIG.ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `Extensión no permitida: ${ext}`
    };
  }

  // Validar tamaño
  if (file.size > UPLOAD_CONFIG.MAX_SIZE) {
    const maxSizeMB = UPLOAD_CONFIG.MAX_SIZE / (1024 * 1024);
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
  quality: number = UPLOAD_CONFIG.COMPRESSION_QUALITY,
  maxWidth: number = UPLOAD_CONFIG.MAX_WIDTH,
  maxHeight: number = UPLOAD_CONFIG.MAX_HEIGHT
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
 * Sube una imagen a Supabase Storage
 * @param file - Archivo de imagen
 * @param productId - ID del producto
 * @param onProgress - Callback de progreso
 * @returns Resultado del upload
 */
export async function uploadProductImage(
  file: File,
  productId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  try {
    console.log('📸 Iniciando validación de imagen...');

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

    // 2. Comprimir imagen
    console.log('⚙️ Comprimiendo imagen...');
    const compressedBlob = await compressImage(file);
    const compressedSize = (compressedBlob.size / (1024 * 1024)).toFixed(2);
    const originalSize = (file.size / (1024 * 1024)).toFixed(2);
    console.log(`✅ Imagen comprimida: ${originalSize}MB → ${compressedSize}MB`);

    // Reportar progreso de compresión
    if (onProgress) {
      onProgress({
        loaded: compressedBlob.size,
        total: compressedBlob.size,
        percentage: 50
      });
    }

    // 3. Crear archivo con nombre único
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const filename = `${productId}-${timestamp}-${randomStr}.jpg`;
    const storagePath = `products/${productId}/${filename}`;

    console.log(`📤 Subiendo a Supabase Storage: ${storagePath}`);

    // 4. Subir a Supabase Storage
    const { data, error } = await supabase.storage
      .from(UPLOAD_CONFIG.BUCKET_NAME)
      .upload(storagePath, compressedBlob, {
        contentType: 'image/jpeg',
        upsert: false,
        cacheControl: '3600' // 1 hora de caché en navegador
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
        loaded: compressedBlob.size,
        total: compressedBlob.size,
        percentage: 100
      });
    }

    // 5. Obtener URL pública
    const { data: publicUrlData } = supabase.storage
      .from(UPLOAD_CONFIG.BUCKET_NAME)
      .getPublicUrl(storagePath);

    const publicUrl = publicUrlData.publicUrl;
    console.log('✅ URL pública generada:', publicUrl);

    return {
      success: true,
      publicUrl,
      storagePath,
      message: 'Imagen subida exitosamente'
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    console.error('❌ Error durante upload:', errorMessage);
    return {
      success: false,
      error: `Error: ${errorMessage}`
    };
  }
}

/**
 * Reemplaza una imagen anterior con una nueva
 * @param newFile - Nuevo archivo de imagen
 * @param productId - ID del producto
 * @param oldStoragePath - Ruta de la imagen anterior (opcional)
 * @param onProgress - Callback de progreso
 */
export async function replaceProductImage(
  newFile: File,
  productId: string,
  oldStoragePath?: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  try {
    // 1. Subir nueva imagen
    const uploadResult = await uploadProductImage(newFile, productId, onProgress);

    if (!uploadResult.success) {
      return uploadResult;
    }

    // 2. Eliminar imagen anterior si existe
    if (oldStoragePath) {
      console.log(`🗑️ Eliminando imagen anterior: ${oldStoragePath}`);
      const { error: deleteError } = await supabase.storage
        .from(UPLOAD_CONFIG.BUCKET_NAME)
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
    console.error('❌ Error durante reemplazo:', errorMessage);
    return {
      success: false,
      error: `Error: ${errorMessage}`
    };
  }
}

/**
 * Obtiene la URL pública de una imagen almacenada
 */
export function getProductImageUrl(storagePath: string): string {
  const { data } = supabase.storage
    .from(UPLOAD_CONFIG.BUCKET_NAME)
    .getPublicUrl(storagePath);

  return data.publicUrl;
}

/**
 * Elimina una imagen del storage
 */
export async function deleteProductImage(storagePath: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(UPLOAD_CONFIG.BUCKET_NAME)
      .remove([storagePath]);

    if (error) {
      console.error('Error eliminando imagen:', error);
      return false;
    }

    console.log('✅ Imagen eliminada:', storagePath);
    return true;
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
}

/**
 * Comprueba si el bucket existe y es accesible
 */
export async function checkStorageAccess(): Promise<boolean> {
  try {
    // Intentar listar un archivo del bucket
    const { data, error } = await supabase.storage
      .from(UPLOAD_CONFIG.BUCKET_NAME)
      .list('');

    if (error) {
      console.warn('⚠️ No hay acceso al bucket:', error.message);
      return false;
    }

    console.log('✅ Acceso a Storage confirmado');
    return true;
  } catch (error) {
    console.error('Error comprobando Storage:', error);
    return false;
  }
}

// ==================== FUNCIONES PARA CATEGORÍAS ====================

/**
 * Sube una imagen de categoría a Supabase Storage
 * @param file - Archivo de imagen
 * @param categorySlug - Slug de la categoría
 * @param onProgress - Callback de progreso
 * @returns Resultado del upload
 */
export async function uploadCategoryImage(
  file: File,
  categorySlug: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  try {
    console.log('📸 [Categoría] Iniciando validación de imagen...');

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
      console.log('⚙️ Comprimiendo imagen de categoría...');
      const compressedBlob = await compressImage(
        file,
        CATEGORY_UPLOAD_CONFIG.COMPRESSION_QUALITY,
        CATEGORY_UPLOAD_CONFIG.MAX_WIDTH,
        CATEGORY_UPLOAD_CONFIG.MAX_HEIGHT
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
    const filename = `${categorySlug}-${timestamp}-${randomStr}.${extension}`;
    const storagePath = `categories/${categorySlug}/${filename}`;

    console.log(`📤 Subiendo a Supabase Storage: ${storagePath}`);

    // 4. Subir a Supabase Storage
    const { data, error } = await supabase.storage
      .from(CATEGORY_UPLOAD_CONFIG.BUCKET_NAME)
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
      .from(CATEGORY_UPLOAD_CONFIG.BUCKET_NAME)
      .getPublicUrl(storagePath);

    const publicUrl = publicUrlData.publicUrl;
    console.log('✅ URL pública generada:', publicUrl);

    return {
      success: true,
      publicUrl,
      storagePath,
      message: 'Imagen de categoría subida exitosamente'
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    console.error('❌ Error durante upload de categoría:', errorMessage);
    return {
      success: false,
      error: `Error: ${errorMessage}`
    };
  }
}

/**
 * Reemplaza una imagen de categoría
 * @param newFile - Nuevo archivo de imagen
 * @param categorySlug - Slug de la categoría
 * @param oldStoragePath - Ruta de la imagen anterior (opcional)
 * @param onProgress - Callback de progreso
 */
export async function replaceCategoryImage(
  newFile: File,
  categorySlug: string,
  oldStoragePath?: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  try {
    // 1. Subir nueva imagen
    const uploadResult = await uploadCategoryImage(newFile, categorySlug, onProgress);

    if (!uploadResult.success) {
      return uploadResult;
    }

    // 2. Eliminar imagen anterior si existe
    if (oldStoragePath) {
      console.log(`🗑️ Eliminando imagen anterior de categoría: ${oldStoragePath}`);
      const { error: deleteError } = await supabase.storage
        .from(CATEGORY_UPLOAD_CONFIG.BUCKET_NAME)
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
    console.error('❌ Error durante reemplazo de categoría:', errorMessage);
    return {
      success: false,
      error: `Error: ${errorMessage}`
    };
  }
}

/**
 * Elimina una imagen de categoría del storage
 */
export async function deleteCategoryImage(storagePath: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(CATEGORY_UPLOAD_CONFIG.BUCKET_NAME)
      .remove([storagePath]);

    if (error) {
      console.error('Error eliminando imagen de categoría:', error);
      return false;
    }

    console.log('✅ Imagen de categoría eliminada:', storagePath);
    return true;
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
}

/**
 * Obtiene la URL pública de una imagen de categoría
 */
export function getCategoryImageUrl(storagePath: string): string {
  const { data } = supabase.storage
    .from(CATEGORY_UPLOAD_CONFIG.BUCKET_NAME)
    .getPublicUrl(storagePath);

  return data.publicUrl;
}
