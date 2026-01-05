'use client';

import { useEffect, useState } from 'react';
import {
  ImageIcon,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Loader2,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

interface Slide {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  link?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export default function B2BSlidesPage() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSlide, setEditingSlide] = useState<Slide | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    loadSlides();
  }, []);

  const loadSlides = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/b2b/slides?_t=' + Date.now(), {
        credentials: 'include',
        cache: 'no-store',
      });

      const data = await response.json();

      if (data.success) {
        setSlides(data.data || []);
      } else {
        showToast('Error al cargar slides', 'error');
      }
    } catch (error) {
      console.error('Error cargando slides:', error);
      showToast('Error de conexión', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSlide = async () => {
    if (!editingSlide) return;
    setSaving(true);

    try {
      const isEditing = !!editingSlide.id;
      const url = isEditing
        ? `/api/admin/b2b/slides?id=${editingSlide.id}`
        : '/api/admin/b2b/slides';
      const method = isEditing ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: editingSlide.title,
          description: editingSlide.description,
          image_url: editingSlide.image_url,
          link: editingSlide.link,
          sort_order: editingSlide.sort_order,
          is_active: editingSlide.is_active,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setEditingSlide(null);
        loadSlides();
        showToast(isEditing ? 'Slide actualizado' : 'Slide creado', 'success');
      } else {
        showToast(data.error?.message || 'Error al guardar', 'error');
      }
    } catch (error) {
      console.error('Error guardando slide:', error);
      showToast('Error al guardar el slide', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSlide = async (slideId: string) => {
    if (!confirm('¿Estás seguro de eliminar este slide?')) return;

    try {
      const response = await fetch(`/api/admin/b2b/slides?id=${slideId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        showToast('Slide eliminado correctamente', 'success');
        loadSlides();
      } else {
        showToast('Error al eliminar slide', 'error');
      }
    } catch (error) {
      console.error('Error eliminando slide:', error);
      showToast('Error de conexión', 'error');
    }
  };

  const handleMoveSlide = async (slideId: string, direction: 'up' | 'down') => {
    const slideIndex = slides.findIndex(s => s.id === slideId);
    const newIndex = direction === 'up' ? slideIndex - 1 : slideIndex + 1;

    if (newIndex < 0 || newIndex >= slides.length) return;

    const updatedSlides = [...slides];
    const temp = updatedSlides[slideIndex].sort_order;
    updatedSlides[slideIndex].sort_order = updatedSlides[newIndex].sort_order;
    updatedSlides[newIndex].sort_order = temp;

    setSlides(updatedSlides);

    // Guardar cambios
    try {
      await fetch(`/api/admin/b2b/slides?id=${slideId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ sort_order: updatedSlides[slideIndex].sort_order }),
      });

      await fetch(`/api/admin/b2b/slides?id=${updatedSlides[newIndex].id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ sort_order: updatedSlides[newIndex].sort_order }),
      });

      loadSlides();
    } catch (error) {
      console.error('Error reordenando slides:', error);
      loadSlides(); // Recargar para revertir cambios
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Slides B2B</h1>
          <p className="text-gray-600 mt-1">Carrusel de imágenes para la sección empresas</p>
        </div>
        <button
          onClick={() => setEditingSlide({
            id: '',
            title: '',
            description: '',
            image_url: '',
            link: '',
            sort_order: slides.length,
            is_active: true,
            created_at: '',
          })}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nuevo Slide
        </button>
      </div>

      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
          </div>
        ) : slides.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No hay slides B2B</p>
            <p className="text-sm text-gray-500 mt-1">Crea slides para el carrusel de empresas</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {slides.map((slide) => (
              <div key={slide.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="relative aspect-[3/1] bg-gray-100">
                  <img
                    src={slide.image_url}
                    alt={slide.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button
                      onClick={() => handleMoveSlide(slide.id, 'up')}
                      disabled={slides.indexOf(slide) === 0}
                      className="p-1 bg-white rounded shadow hover:bg-gray-50 disabled:opacity-50"
                      title="Mover arriba"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMoveSlide(slide.id, 'down')}
                      disabled={slides.indexOf(slide) === slides.length - 1}
                      className="p-1 bg-white rounded shadow hover:bg-gray-50 disabled:opacity-50"
                      title="Mover abajo"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                  {!slide.is_active && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <EyeOff className="w-8 h-8 text-white" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-gray-900">{slide.title}</h3>
                  {slide.description && (
                    <p className="text-sm text-gray-500 truncate">{slide.description}</p>
                  )}
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-gray-500">Orden: {slide.sort_order}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setEditingSlide(slide)}
                        className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSlide(slide.id)}
                        className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingSlide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingSlide.id ? 'Editar Slide' : 'Nuevo Slide'}
              </h2>
              <button
                onClick={() => setEditingSlide(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                <input
                  type="text"
                  value={editingSlide.title}
                  onChange={(e) => setEditingSlide({ ...editingSlide, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={editingSlide.description || ''}
                  onChange={(e) => setEditingSlide({ ...editingSlide, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL de imagen</label>
                <input
                  type="text"
                  value={editingSlide.image_url}
                  onChange={(e) => setEditingSlide({ ...editingSlide, image_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">Recomendado: 1200x400px (ratio 3:1)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Enlace (opcional)</label>
                <input
                  type="text"
                  value={editingSlide.link || ''}
                  onChange={(e) => setEditingSlide({ ...editingSlide, link: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingSlide.is_active}
                  onChange={(e) => setEditingSlide({ ...editingSlide, is_active: e.target.checked })}
                  className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                />
                <span className="text-sm text-gray-700">Slide activo</span>
              </label>
            </div>

            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setEditingSlide(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveSlide}
                disabled={saving}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
