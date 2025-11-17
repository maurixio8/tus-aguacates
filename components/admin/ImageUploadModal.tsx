'use client';

import { useState } from 'react';
import { Upload, CheckCircle, AlertCircle, FileImage } from 'lucide-react';
import { uploadProductImage, validateImage } from '@/lib/image-upload-service';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  main_image_url?: string;
  category?: string;
}

interface ImageUploadModalProps {
  product: Product;
  onUpload: (imageUrl: string) => void;
  onClose: () => void;
}

interface UploadProgress {
  percentage: number;
  loaded: number;
  total: number;
  status: 'validating' | 'compressing' | 'uploading' | 'complete' | 'error';
  message: string;
}

export default function ImageUploadModal({ product, onUpload, onClose }: ImageUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [sizeInfo, setSizeInfo] = useState({ original: 0, optimized: 0 });
  const [dragActive, setDragActive] = useState(false);
  const [uploadMode, setUploadMode] = useState<'supabase' | 'base64'>('supabase');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validar que sea una imagen
    if (!selectedFile.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido (JPG, PNG, WebP, GIF)');
      return;
    }

    // Validar tamaño máximo (10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      alert('El archivo es demasiado grande. Máximo permitido: 10MB');
      return;
    }

    setFile(selectedFile);

    // Crear preview
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setPreview(result);

      // Calcular tamaño optimizado estimado (60% del original)
      const optimizedSize = Math.round((selectedFile.size / 1024) * 0.6);
      setSizeInfo({
        original: Math.round(selectedFile.size / 1024),
        optimized: optimizedSize
      });
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const mockEvent = {
        target: { files: [files[0]] }
      } as any;
      handleFileSelect(mockEvent);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Por favor selecciona una imagen primero');
      return;
    }

    setLoading(true);
    setProgress(null);

    try {
      // 1. Validar imagen
      console.log('🔍 Validando imagen:', file.name);
      setProgress({
        percentage: 10,
        loaded: 0,
        total: file.size,
        status: 'validating',
        message: 'Validando imagen...'
      });

      const validation = validateImage(file);
      if (!validation.valid) {
        throw new Error(validation.error || 'Imagen inválida');
      }

      // 2. Comprimir y subir a Supabase Storage
      console.log('🚀 Iniciando upload a Supabase Storage:', file.name);
      setProgress({
        percentage: 30,
        loaded: 0,
        total: file.size,
        status: 'compressing',
        message: 'Comprimiendo imagen...'
      });

      const result = await uploadProductImage(file, product.id, (prog) => {
        // Actualizar progreso durante la subida
        setProgress({
          percentage: Math.min(95, 30 + (prog.percentage * 0.65)), // De 30% a 95%
          loaded: prog.loaded,
          total: prog.total,
          status: 'uploading',
          message: `Subiendo a Supabase Storage... ${prog.percentage}%`
        });
      });

      if (!result.success) {
        throw new Error(result.error || 'Error desconocido al subir imagen');
      }

      if (!result.publicUrl) {
        throw new Error('No se obtuvo URL pública de la imagen');
      }

      // 3. Éxito
      console.log('✅ Imagen subida exitosamente a Supabase Storage');
      setProgress({
        percentage: 100,
        loaded: file.size,
        total: file.size,
        status: 'complete',
        message: 'Imagen subida exitosamente'
      });

      // Esperar a que se muestre la animación de completado
      setTimeout(() => {
        onUpload(result.publicUrl!); // Pasar URL de Supabase Storage
        alert(`✅ Imagen actualizada para ${product.name}\n📦 Guardada en Supabase Storage\n🔗 ${result.publicUrl}`);
      }, 500);

    } catch (error) {
      console.error('❌ Error subiendo imagen:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

      setProgress({
        percentage: 0,
        loaded: 0,
        total: 100,
        status: 'error',
        message: `Error: ${errorMessage}`
      });

      alert(`❌ Error subiendo imagen:\n${errorMessage}`);
    } finally {
      setLoading(false);
      // Limpiar progreso después de 3 segundos
      setTimeout(() => {
        if (!progress || progress.status !== 'complete') {
          setProgress(null);
        }
      }, 3000);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setPreview('');
    setSizeInfo({ original: 0, optimized: 0 });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            🖼️ Cambiar Imagen - {product.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Área de arrastrar y soltar */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {!file ? (
            <>
              <div className="text-4xl mb-4">📁</div>
              <p className="text-lg font-medium text-gray-700 mb-2">
                Arrastra una imagen aquí o haz clic para seleccionar
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Formatos: JPG, PNG, WebP, GIF (máximo 10MB)
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 cursor-pointer inline-block"
              >
                Seleccionar Archivo
              </label>
            </>
          ) : (
            <div>
              <div className="text-4xl mb-4">✅</div>
              <p className="text-lg font-medium text-green-600 mb-2">
                Archivo seleccionado: {file.name}
              </p>
              <button
                onClick={handleRemoveFile}
                className="text-red-600 hover:text-red-700 text-sm underline"
              >
                Quitar archivo
              </button>
            </div>
          )}
        </div>

        {/* Preview */}
        {preview && (
          <div className="mt-6">
            <p className="text-sm font-medium text-gray-700 mb-3">Vista previa:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-2">Original:</h4>
                <img
                  src={preview}
                  alt="Preview original"
                  className="w-full h-48 object-cover rounded border border-gray-300"
                />
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-2">Optimizado:</h4>
                <div className="w-full h-48 bg-gray-100 rounded border border-gray-300 flex items-center justify-center">
                  <span className="text-gray-500">Se optimizará al guardar</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info de archivo */}
        {file && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">📊 Información del archivo:</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Nombre:</span>
                <p className="font-medium">{file.name}</p>
              </div>
              <div>
                <span className="text-gray-600">Tipo:</span>
                <p className="font-medium">{file.type}</p>
              </div>
              <div>
                <span className="text-gray-600">Tamaño original:</span>
                <p className="font-medium">{sizeInfo.original} KB</p>
              </div>
              <div>
                <span className="text-gray-600">Tamaño estimado:</span>
                <p className="font-medium">~{sizeInfo.optimized} KB</p>
              </div>
            </div>
            {sizeInfo.original > 0 && (
              <div className="mt-2 pt-2 border-t border-blue-200">
                <span className="text-green-700 font-medium">
                  ✅ Compresión estimada: {Math.round((1 - sizeInfo.optimized / sizeInfo.original) * 100)}%
                </span>
              </div>
            )}
          </div>
        )}

        {/* Product info */}
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-700 mb-2">📦 Producto a actualizar:</h4>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🥑</span>
            </div>
            <div>
              <p className="font-medium">{product.name}</p>
              <p className="text-sm text-gray-600">{product.category}</p>
              <p className="text-green-600 font-bold">${product.price.toLocaleString('es-CO')}</p>
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        {progress && (
          <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              {progress.status === 'validating' && (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                  <span className="font-medium text-blue-900">🔍 Validando imagen...</span>
                </>
              )}
              {progress.status === 'compressing' && (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                  <span className="font-medium text-blue-900">⚙️ Comprimiendo imagen...</span>
                </>
              )}
              {progress.status === 'uploading' && (
                <>
                  <Upload className="w-4 h-4 text-blue-600 animate-bounce" />
                  <span className="font-medium text-blue-900">📤 Subiendo a Supabase...</span>
                </>
              )}
              {progress.status === 'complete' && (
                <>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-900">✅ Completado</span>
                </>
              )}
              {progress.status === 'error' && (
                <>
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="font-medium text-red-900">❌ Error</span>
                </>
              )}
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-white rounded-full h-2 overflow-hidden border border-blue-200">
              <div
                className={`h-full transition-all duration-300 ${
                  progress.status === 'error'
                    ? 'bg-red-500'
                    : progress.status === 'complete'
                    ? 'bg-green-500'
                    : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                }`}
                style={{ width: `${progress.percentage}%` }}
              ></div>
            </div>

            {/* Progress Percentage and Message */}
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-gray-700">{progress.message}</span>
              <span className="text-sm font-bold text-blue-900">{progress.percentage}%</span>
            </div>

            {/* Upload Stats */}
            {progress.total > 0 && (
              <div className="mt-2 text-xs text-gray-600">
                <span>
                  {Math.round(progress.loaded / 1024)} KB / {Math.round(progress.total / 1024)} KB
                </span>
              </div>
            )}
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                {progress?.status === 'validating' ? 'Validando...' : progress?.status === 'compressing' ? 'Comprimiendo...' : 'Subiendo...'}
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Guardar Imagen
              </>
            )}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 bg-gray-400 text-white py-3 rounded-lg hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            ✖️ Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}