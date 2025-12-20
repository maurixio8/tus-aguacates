'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Plus,
    Pencil,
    Trash2,
    Save,
    X,
    Image as ImageIcon,
    ArrowUp,
    ArrowDown,
    Eye,
    EyeOff,
    Loader2,
    Upload,
    Link as LinkIcon,
    GripVertical
} from 'lucide-react';

interface Promotion {
    id: string;
    title: string;
    description: string | null;
    image_url: string;
    link: string | null;
    sort_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface PromotionForm {
    title: string;
    description: string;
    image_url: string;
    link: string;
    is_active: boolean;
}

const emptyForm: PromotionForm = {
    title: '',
    description: '',
    image_url: '',
    link: '',
    is_active: true
};

export default function AdminPromocionesPage() {
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<PromotionForm>(emptyForm);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [imagePreview, setImagePreview] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadPromotions();
    }, []);

    async function loadPromotions() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('promotions')
                .select('*')
                .order('sort_order', { ascending: true });

            if (error) {
                console.error('Error cargando promociones:', error);
                // La tabla puede no existir todavía
                if (error.code === '42P01') {
                    alert('⚠️ La tabla "promotions" no existe aún.\n\nPor favor ejecuta el SQL en Supabase:\nsupabase/migrations/20241215_create_promotions_table.sql');
                }
                return;
            }

            setPromotions(data || []);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validar tipo
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            alert('⚠️ Solo se permiten imágenes JPG, PNG o WebP');
            return;
        }

        // Validar tamaño (5MB máx)
        if (file.size > 5 * 1024 * 1024) {
            alert('⚠️ La imagen no puede ser mayor a 5MB');
            return;
        }

        setUploadingImage(true);

        try {
            // Generar nombre único
            const timestamp = Date.now();
            const ext = file.name.split('.').pop();
            const fileName = `promotions/slide-${timestamp}.${ext}`;

            // Subir a Supabase Storage (usamos el bucket product-images)
            const { data, error } = await supabase.storage
                .from('product-images')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) {
                console.error('Error subiendo imagen:', error);
                alert(`❌ Error subiendo imagen: ${error.message}`);
                return;
            }

            // Obtener URL pública
            const { data: urlData } = supabase.storage
                .from('product-images')
                .getPublicUrl(fileName);

            const imageUrl = urlData.publicUrl;
            setForm({ ...form, image_url: imageUrl });
            setImagePreview(imageUrl);

            console.log('✅ Imagen subida:', imageUrl);
        } catch (error) {
            console.error('Error:', error);
            alert('❌ Error al procesar la imagen');
        } finally {
            setUploadingImage(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!form.title.trim()) {
            alert('⚠️ El título es requerido');
            return;
        }

        if (!form.image_url.trim()) {
            alert('⚠️ La imagen es requerida');
            return;
        }

        setSaving(true);

        try {
            if (editingId) {
                // Actualizar
                const { error } = await supabase
                    .from('promotions')
                    .update({
                        title: form.title,
                        description: form.description || null,
                        image_url: form.image_url,
                        link: form.link || null,
                        is_active: form.is_active,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', editingId);

                if (error) throw error;
                console.log('✅ Promoción actualizada');
            } else {
                // Crear nueva
                const maxOrder = promotions.length > 0
                    ? Math.max(...promotions.map(p => p.sort_order))
                    : 0;

                const { error } = await supabase
                    .from('promotions')
                    .insert({
                        title: form.title,
                        description: form.description || null,
                        image_url: form.image_url,
                        link: form.link || null,
                        is_active: form.is_active,
                        sort_order: maxOrder + 1
                    });

                if (error) throw error;
                console.log('✅ Promoción creada');
            }

            // Limpiar y recargar
            setForm(emptyForm);
            setEditingId(null);
            setShowForm(false);
            setImagePreview('');
            await loadPromotions();
        } catch (error: any) {
            console.error('Error guardando:', error);
            alert(`❌ Error: ${error.message}`);
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('¿Estás seguro de eliminar esta promoción?')) return;

        try {
            const { error } = await supabase
                .from('promotions')
                .delete()
                .eq('id', id);

            if (error) throw error;
            await loadPromotions();
        } catch (error: any) {
            console.error('Error eliminando:', error);
            alert(`❌ Error: ${error.message}`);
        }
    }

    async function handleToggleActive(id: string, currentActive: boolean) {
        try {
            const { error } = await supabase
                .from('promotions')
                .update({ is_active: !currentActive })
                .eq('id', id);

            if (error) throw error;
            await loadPromotions();
        } catch (error: any) {
            console.error('Error:', error);
        }
    }

    async function handleMoveOrder(id: string, direction: 'up' | 'down') {
        const index = promotions.findIndex(p => p.id === id);
        if (index === -1) return;

        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= promotions.length) return;

        const currentPromo = promotions[index];
        const swapPromo = promotions[newIndex];

        try {
            // Intercambiar sort_order
            await supabase
                .from('promotions')
                .update({ sort_order: swapPromo.sort_order })
                .eq('id', currentPromo.id);

            await supabase
                .from('promotions')
                .update({ sort_order: currentPromo.sort_order })
                .eq('id', swapPromo.id);

            await loadPromotions();
        } catch (error) {
            console.error('Error reordenando:', error);
        }
    }

    function handleEdit(promo: Promotion) {
        setForm({
            title: promo.title,
            description: promo.description || '',
            image_url: promo.image_url,
            link: promo.link || '',
            is_active: promo.is_active
        });
        setImagePreview(promo.image_url);
        setEditingId(promo.id);
        setShowForm(true);
    }

    function handleCancelEdit() {
        setForm(emptyForm);
        setEditingId(null);
        setShowForm(false);
        setImagePreview('');
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-verde-bosque" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Slides / Banners</h1>
                    <p className="text-gray-600 text-sm mt-1">
                        Gestiona los slides de la página principal
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 bg-verde-bosque text-white px-4 py-2 rounded-lg hover:bg-verde-bosque/90 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Nuevo Slide
                </button>
            </div>

            {/* Info de tamaño recomendado */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                <p className="font-medium text-blue-800 mb-1">📐 Tamaño recomendado de imagen:</p>
                <p className="text-blue-700">
                    <strong>1200 x 400 píxeles</strong> (ratio 3:1) • Formato: WebP, JPG o PNG • Máximo: 5MB
                </p>
                <p className="text-blue-600 mt-1 text-xs">
                    Las imágenes se muestran en móvil y desktop, asegúrate de que el contenido importante esté centrado.
                </p>
            </div>

            {/* Formulario */}
            {showForm && (
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h2 className="text-lg font-semibold mb-4">
                        {editingId ? 'Editar Slide' : 'Nuevo Slide'}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Título */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Título *
                            </label>
                            <input
                                type="text"
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-verde-bosque focus:border-verde-bosque"
                                placeholder="Ej: Aguacates Frescos"
                                maxLength={255}
                            />
                        </div>

                        {/* Descripción */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Descripción (opcional)
                            </label>
                            <textarea
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-verde-bosque focus:border-verde-bosque"
                                placeholder="Ej: Directamente del campo a tu mesa"
                                rows={2}
                            />
                        </div>

                        {/* Imagen */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Imagen *
                            </label>

                            {/* Preview */}
                            {(imagePreview || form.image_url) && (
                                <div className="mb-3 relative rounded-lg overflow-hidden bg-gray-100" style={{ aspectRatio: '3/1' }}>
                                    <img
                                        src={imagePreview || form.image_url}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}

                            <div className="flex gap-3">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageUpload}
                                    accept="image/jpeg,image/png,image/webp"
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploadingImage}
                                    className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                                >
                                    {uploadingImage ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Upload className="w-4 h-4" />
                                    )}
                                    {uploadingImage ? 'Subiendo...' : 'Subir imagen'}
                                </button>

                                <span className="text-gray-400 self-center">o</span>

                                <input
                                    type="url"
                                    value={form.image_url}
                                    onChange={(e) => {
                                        setForm({ ...form, image_url: e.target.value });
                                        setImagePreview(e.target.value);
                                    }}
                                    className="flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-verde-bosque text-sm"
                                    placeholder="https://..."
                                />
                            </div>
                        </div>

                        {/* Link */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <LinkIcon className="w-4 h-4 inline mr-1" />
                                Enlace (opcional)
                            </label>
                            <input
                                type="text"
                                value={form.link}
                                onChange={(e) => setForm({ ...form, link: e.target.value })}
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-verde-bosque focus:border-verde-bosque"
                                placeholder="Ej: /tienda/aguacates"
                            />
                            <p className="text-xs text-gray-500 mt-1">A dónde redirige cuando hacen clic en el slide</p>
                        </div>

                        {/* Estado */}
                        <div className="flex items-center gap-3">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.is_active}
                                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-verde-bosque peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                            </label>
                            <span className="text-sm text-gray-700">Visible en la página</span>
                        </div>

                        {/* Botones */}
                        <div className="flex gap-3 pt-4">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex items-center gap-2 bg-verde-bosque text-white px-6 py-2 rounded-lg hover:bg-verde-bosque/90 transition-colors disabled:opacity-50"
                            >
                                {saving ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                {saving ? 'Guardando...' : 'Guardar'}
                            </button>
                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="flex items-center gap-2 bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                <X className="w-4 h-4" />
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Lista de promociones */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                {promotions.length === 0 ? (
                    <div className="text-center py-12 px-6">
                        <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600 mb-2">No hay slides configurados</p>
                        <p className="text-sm text-gray-500">
                            Los slides de la página principal se mostrarán desde datos de respaldo
                        </p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {promotions.map((promo, index) => (
                            <div
                                key={promo.id}
                                className={`p-4 ${!promo.is_active ? 'bg-gray-50 opacity-60' : ''}`}
                            >
                                {/* Layout móvil */}
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                    {/* Orden + Imagen */}
                                    <div className="flex items-center gap-3">
                                        {/* Orden */}
                                        <div className="flex flex-col gap-1">
                                            <button
                                                onClick={() => handleMoveOrder(promo.id, 'up')}
                                                disabled={index === 0}
                                                className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                                            >
                                                <ArrowUp className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleMoveOrder(promo.id, 'down')}
                                                disabled={index === promotions.length - 1}
                                                className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                                            >
                                                <ArrowDown className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* Imagen thumbnail */}
                                        <div className="w-24 sm:w-32 h-12 sm:h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                            <img
                                                src={promo.image_url}
                                                alt={promo.title}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-900 truncate">{promo.title}</h3>
                                        {promo.description && (
                                            <p className="text-sm text-gray-500 truncate">{promo.description}</p>
                                        )}
                                        {promo.link && (
                                            <p className="text-xs text-blue-600 truncate mt-1">
                                                <LinkIcon className="w-3 h-3 inline mr-1" />
                                                {promo.link}
                                            </p>
                                        )}
                                    </div>

                                    {/* Acciones */}
                                    <div className="flex items-center gap-2 self-end sm:self-center">
                                        <button
                                            onClick={() => handleToggleActive(promo.id, promo.is_active)}
                                            className={`p-2 rounded-lg transition-colors ${promo.is_active
                                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                }`}
                                            title={promo.is_active ? 'Visible' : 'Oculto'}
                                        >
                                            {promo.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                        </button>
                                        <button
                                            onClick={() => handleEdit(promo)}
                                            className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(promo.id)}
                                            className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
