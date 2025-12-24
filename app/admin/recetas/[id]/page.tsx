'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Loader2,
  Plus,
  Trash2,
  GripVertical,
  Clock,
  Users,
  ChefHat,
  Wand2,
  Image as ImageIcon,
  Video,
  Play,
  Sparkles,
  Eye,
  Globe,
  Instagram,
  Youtube
} from 'lucide-react';
import type {
  Recipe,
  RecipeIngredient,
  RecipeStep,
  RecipeDifficulty,
  RecipeCategory,
  VideoStyle,
  AnimationType
} from '@/lib/types/recipes';
import {
  difficultyLabels,
  categoryLabels,
  animationLabels,
  statusLabels
} from '@/lib/types/recipes';

// Video styles with descriptions
const videoStyles: { value: VideoStyle; label: string; description: string }[] = [
  { value: 'frame_elegante', label: 'Frame Elegante', description: 'Borde dorado elegante con logo' },
  { value: 'sutil', label: 'Sutil', description: 'Mini logo en esquina' },
  { value: 'organico', label: 'Orgánico', description: 'Elementos naturales integrados' }
];

interface FormIngredient {
  id?: string;
  product_id?: string;
  name_es: string;
  name_en: string;
  quantity: number;
  unit_es: string;
  unit_en: string;
  is_optional: boolean;
  notes_es: string;
  notes_en: string;
}

interface FormStep {
  id?: string;
  instruction_es: string;
  instruction_en: string;
  subtitle_es: string;
  subtitle_en: string;
  image_prompt: string;
  image_url?: string;
  animation_type: AnimationType;
  animation_duration_seconds: number;
}

export default function RecipeEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const isNew = resolvedParams.id === 'nueva';
  const router = useRouter();

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'ingredients' | 'steps' | 'video'>('info');

  // Form state
  const [formData, setFormData] = useState({
    title_es: '',
    title_en: '',
    description_es: '',
    description_en: '',
    prep_time_minutes: 10,
    cook_time_minutes: 0,
    servings: 2,
    difficulty: 'facil' as RecipeDifficulty,
    category: 'general' as RecipeCategory,
    tags: [] as string[],
    video_style: 'frame_elegante' as VideoStyle,
    video_status: 'draft' as Recipe['video_status'],
    featured: false,
    instagram_url: '',
    tiktok_url: '',
    youtube_url: ''
  });

  const [ingredients, setIngredients] = useState<FormIngredient[]>([]);
  const [steps, setSteps] = useState<FormStep[]>([]);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (!isNew) {
      fetchRecipe();
    }
  }, [isNew, resolvedParams.id]);

  const fetchRecipe = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/recipes/${resolvedParams.id}`, {
        credentials: 'include'
      });
      const data = await response.json();

      if (data.success && data.recipe) {
        const recipe = data.recipe;
        setFormData({
          title_es: recipe.title_es || '',
          title_en: recipe.title_en || '',
          description_es: recipe.description_es || '',
          description_en: recipe.description_en || '',
          prep_time_minutes: recipe.prep_time_minutes || 10,
          cook_time_minutes: recipe.cook_time_minutes || 0,
          servings: recipe.servings || 2,
          difficulty: recipe.difficulty || 'facil',
          category: recipe.category || 'general',
          tags: recipe.tags || [],
          video_style: recipe.video_style || 'frame_elegante',
          video_status: recipe.video_status || 'draft',
          featured: recipe.featured || false,
          instagram_url: recipe.instagram_url || '',
          tiktok_url: recipe.tiktok_url || '',
          youtube_url: recipe.youtube_url || ''
        });

        if (recipe.ingredients) {
          setIngredients(recipe.ingredients.map((ing: RecipeIngredient) => ({
            id: ing.id,
            product_id: ing.product_id,
            name_es: ing.name_es,
            name_en: ing.name_en || '',
            quantity: ing.quantity,
            unit_es: ing.unit_es,
            unit_en: ing.unit_en || '',
            is_optional: ing.is_optional,
            notes_es: ing.notes_es || '',
            notes_en: ing.notes_en || ''
          })));
        }

        if (recipe.steps) {
          setSteps(recipe.steps.map((step: RecipeStep) => ({
            id: step.id,
            instruction_es: step.instruction_es,
            instruction_en: step.instruction_en || '',
            subtitle_es: step.subtitle_es || '',
            subtitle_en: step.subtitle_en || '',
            image_prompt: step.image_prompt || '',
            image_url: step.image_url,
            animation_type: step.animation_type,
            animation_duration_seconds: step.animation_duration_seconds
          })));
        }
      } else {
        alert('Receta no encontrada');
        router.push('/admin/recetas');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al cargar receta');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title_es) {
      alert('El título en español es requerido');
      return;
    }

    try {
      setSaving(true);

      const body = {
        ...formData,
        ingredients: ingredients.map(ing => ({
          product_id: ing.product_id,
          name_es: ing.name_es,
          name_en: ing.name_en,
          quantity: ing.quantity,
          unit_es: ing.unit_es,
          unit_en: ing.unit_en,
          is_optional: ing.is_optional,
          notes_es: ing.notes_es,
          notes_en: ing.notes_en
        })),
        steps: steps.map(step => ({
          instruction_es: step.instruction_es,
          instruction_en: step.instruction_en,
          subtitle_es: step.subtitle_es,
          subtitle_en: step.subtitle_en,
          image_prompt: step.image_prompt,
          image_url: step.image_url,
          animation_type: step.animation_type,
          animation_duration_seconds: step.animation_duration_seconds
        }))
      };

      const url = isNew ? '/api/admin/recipes' : `/api/admin/recipes/${resolvedParams.id}`;
      const method = isNew ? 'POST' : 'PATCH';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (data.success) {
        if (isNew && data.recipe?.id) {
          router.push(`/admin/recetas/${data.recipe.id}`);
        } else {
          alert('Receta guardada exitosamente');
        }
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar receta');
    } finally {
      setSaving(false);
    }
  };

  // Ingredient helpers
  const addIngredient = () => {
    setIngredients([...ingredients, {
      name_es: '',
      name_en: '',
      quantity: 1,
      unit_es: 'unidad',
      unit_en: 'unit',
      is_optional: false,
      notes_es: '',
      notes_en: ''
    }]);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: keyof FormIngredient, value: any) => {
    setIngredients(ingredients.map((ing, i) =>
      i === index ? { ...ing, [field]: value } : ing
    ));
  };

  // Step helpers
  const addStep = () => {
    setSteps([...steps, {
      instruction_es: '',
      instruction_en: '',
      subtitle_es: '',
      subtitle_en: '',
      image_prompt: '',
      animation_type: 'smooth_motion',
      animation_duration_seconds: 5
    }]);
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, field: keyof FormStep, value: any) => {
    setSteps(steps.map((step, i) =>
      i === index ? { ...step, [field]: value } : step
    ));
  };

  // Generate prompt helper
  const generatePrompt = (step: FormStep, index: number) => {
    const basePrompt = `Professional food photography, POV first-person view, dark green gradient background (#2D5016), wooden cutting board with golden edge, warm natural lighting, high-end culinary magazine style`;
    const actionPrompt = step.instruction_es
      ? `, hands ${step.instruction_es.toLowerCase()}`
      : '';
    return `${basePrompt}${actionPrompt}`;
  };

  // Tag helpers
  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-verde-aguacate" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin/recetas')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {isNew ? 'Nueva Receta' : 'Editar Receta'}
                </h1>
                <p className="text-sm text-gray-500">
                  {formData.title_es || 'Sin título'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Status badge */}
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                formData.video_status === 'published' ? 'bg-green-100 text-green-800' :
                formData.video_status === 'ready' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {statusLabels[formData.video_status]}
              </span>

              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-verde-aguacate text-white px-4 py-2 rounded-lg hover:bg-verde-bosque transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Guardar
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4 -mb-px">
            {[
              { id: 'info', label: 'Información', icon: ChefHat },
              { id: 'ingredients', label: 'Ingredientes', icon: Plus },
              { id: 'steps', label: 'Pasos', icon: Wand2 },
              { id: 'video', label: 'Video', icon: Video }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'bg-gray-50 text-verde-aguacate border-t border-x border-gray-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Tab: Info */}
        {activeTab === 'info' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left column */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título (Español) *
                  </label>
                  <input
                    type="text"
                    value={formData.title_es}
                    onChange={(e) => setFormData({ ...formData, title_es: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde-aguacate"
                    placeholder="Guacamole Clásico"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título (English)
                  </label>
                  <input
                    type="text"
                    value={formData.title_en}
                    onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde-aguacate"
                    placeholder="Classic Guacamole"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción (Español)
                  </label>
                  <textarea
                    value={formData.description_es}
                    onChange={(e) => setFormData({ ...formData, description_es: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde-aguacate"
                    placeholder="Deliciosa receta tradicional..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción (English)
                  </label>
                  <textarea
                    value={formData.description_en}
                    onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde-aguacate"
                    placeholder="Delicious traditional recipe..."
                  />
                </div>
              </div>

              {/* Right column */}
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Preparación (min)
                    </label>
                    <input
                      type="number"
                      value={formData.prep_time_minutes}
                      onChange={(e) => setFormData({ ...formData, prep_time_minutes: parseInt(e.target.value) || 0 })}
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde-aguacate"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Cocción (min)
                    </label>
                    <input
                      type="number"
                      value={formData.cook_time_minutes}
                      onChange={(e) => setFormData({ ...formData, cook_time_minutes: parseInt(e.target.value) || 0 })}
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde-aguacate"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Users className="w-4 h-4 inline mr-1" />
                      Porciones
                    </label>
                    <input
                      type="number"
                      value={formData.servings}
                      onChange={(e) => setFormData({ ...formData, servings: parseInt(e.target.value) || 1 })}
                      min="1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde-aguacate"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dificultad
                    </label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as RecipeDifficulty })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde-aguacate"
                    >
                      {Object.entries(difficultyLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as RecipeCategory })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde-aguacate"
                  >
                    {Object.entries(categoryLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Etiquetas
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-verde-aguacate/10 text-verde-aguacate rounded-full text-sm"
                      >
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="hover:text-red-600"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      placeholder="Agregar etiqueta..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde-aguacate"
                    />
                    <button
                      onClick={addTag}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
                    >
                      Agregar
                    </button>
                  </div>
                </div>

                {/* Featured checkbox */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="w-5 h-5 text-verde-aguacate focus:ring-verde-aguacate border-gray-300 rounded"
                  />
                  <label htmlFor="featured" className="text-sm font-medium text-gray-700">
                    Receta destacada
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Ingredients */}
        {activeTab === 'ingredients' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Ingredientes ({ingredients.length})</h2>
              <button
                onClick={addIngredient}
                className="flex items-center gap-2 bg-verde-aguacate text-white px-4 py-2 rounded-lg hover:bg-verde-bosque"
              >
                <Plus className="w-4 h-4" />
                Agregar Ingrediente
              </button>
            </div>

            {ingredients.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <Plus className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No hay ingredientes. Agrega el primero.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {ingredients.map((ing, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-sm p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex items-center gap-2 pt-2">
                        <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
                        <span className="w-8 h-8 bg-verde-aguacate/10 text-verde-aguacate rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </span>
                      </div>

                      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-xs text-gray-500 mb-1">Nombre (ES)</label>
                          <input
                            type="text"
                            value={ing.name_es}
                            onChange={(e) => updateIngredient(index, 'name_es', e.target.value)}
                            placeholder="Aguacate"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-verde-aguacate"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Cantidad</label>
                          <input
                            type="number"
                            value={ing.quantity}
                            onChange={(e) => updateIngredient(index, 'quantity', parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.5"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-verde-aguacate"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Unidad (ES)</label>
                          <input
                            type="text"
                            value={ing.unit_es}
                            onChange={(e) => updateIngredient(index, 'unit_es', e.target.value)}
                            placeholder="unidad"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-verde-aguacate"
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => removeIngredient(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* English row */}
                    <div className="mt-3 ml-16 grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-xs text-gray-500 mb-1">Name (EN)</label>
                        <input
                          type="text"
                          value={ing.name_en}
                          onChange={(e) => updateIngredient(index, 'name_en', e.target.value)}
                          placeholder="Avocado"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-verde-aguacate"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Unit (EN)</label>
                        <input
                          type="text"
                          value={ing.unit_en}
                          onChange={(e) => updateIngredient(index, 'unit_en', e.target.value)}
                          placeholder="unit"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-verde-aguacate"
                        />
                      </div>
                      <div className="flex items-end">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={ing.is_optional}
                            onChange={(e) => updateIngredient(index, 'is_optional', e.target.checked)}
                            className="w-4 h-4 text-verde-aguacate border-gray-300 rounded"
                          />
                          Opcional
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Steps */}
        {activeTab === 'steps' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Pasos de la Receta ({steps.length})</h2>
              <button
                onClick={addStep}
                className="flex items-center gap-2 bg-verde-aguacate text-white px-4 py-2 rounded-lg hover:bg-verde-bosque"
              >
                <Plus className="w-4 h-4" />
                Agregar Paso
              </button>
            </div>

            {steps.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <Wand2 className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No hay pasos. Agrega el primero.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {steps.map((step, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-b">
                      <div className="flex items-center gap-3">
                        <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
                        <span className="w-8 h-8 bg-verde-aguacate text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </span>
                        <span className="font-medium text-gray-700">Paso {index + 1}</span>
                      </div>
                      <button
                        onClick={() => removeStep(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="p-4 space-y-4">
                      {/* Instructions */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Instrucción (Español) *
                          </label>
                          <textarea
                            value={step.instruction_es}
                            onChange={(e) => updateStep(index, 'instruction_es', e.target.value)}
                            rows={2}
                            placeholder="Corta el aguacate por la mitad..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-verde-aguacate"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Instruction (English)
                          </label>
                          <textarea
                            value={step.instruction_en}
                            onChange={(e) => updateStep(index, 'instruction_en', e.target.value)}
                            rows={2}
                            placeholder="Cut the avocado in half..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-verde-aguacate"
                          />
                        </div>
                      </div>

                      {/* Subtitles */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Subtítulo video (ES)
                          </label>
                          <input
                            type="text"
                            value={step.subtitle_es}
                            onChange={(e) => updateStep(index, 'subtitle_es', e.target.value)}
                            placeholder="Corta el aguacate"
                            maxLength={100}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-verde-aguacate"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Subtitle video (EN)
                          </label>
                          <input
                            type="text"
                            value={step.subtitle_en}
                            onChange={(e) => updateStep(index, 'subtitle_en', e.target.value)}
                            placeholder="Cut the avocado"
                            maxLength={100}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-verde-aguacate"
                          />
                        </div>
                      </div>

                      {/* Image prompt */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-sm font-medium text-gray-700">
                            <Sparkles className="w-4 h-4 inline mr-1 text-dorado" />
                            Prompt para imagen IA
                          </label>
                          <button
                            onClick={() => updateStep(index, 'image_prompt', generatePrompt(step, index))}
                            className="text-xs text-verde-aguacate hover:underline"
                          >
                            Generar automático
                          </button>
                        </div>
                        <textarea
                          value={step.image_prompt}
                          onChange={(e) => updateStep(index, 'image_prompt', e.target.value)}
                          rows={3}
                          placeholder="Professional food photography, POV first-person view..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-verde-aguacate"
                        />
                      </div>

                      {/* Animation settings */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tipo de animación
                          </label>
                          <select
                            value={step.animation_type}
                            onChange={(e) => updateStep(index, 'animation_type', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-verde-aguacate"
                          >
                            {Object.entries(animationLabels).map(([value, label]) => (
                              <option key={value} value={value}>{label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Duración (segundos)
                          </label>
                          <input
                            type="number"
                            value={step.animation_duration_seconds}
                            onChange={(e) => updateStep(index, 'animation_duration_seconds', parseInt(e.target.value) || 5)}
                            min="3"
                            max="10"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-verde-aguacate"
                          />
                        </div>
                        <div>
                          {step.image_url ? (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Preview</label>
                              <img
                                src={step.image_url}
                                alt={`Paso ${index + 1}`}
                                className="w-full h-20 object-cover rounded-lg"
                              />
                            </div>
                          ) : (
                            <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                              <span className="text-xs text-gray-400">Sin imagen</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Total duration */}
            {steps.length > 0 && (
              <div className="bg-verde-aguacate/10 rounded-lg p-4 flex items-center justify-between">
                <span className="font-medium text-verde-bosque">Duración total estimada del video:</span>
                <span className="text-lg font-bold text-verde-aguacate">
                  {steps.reduce((acc, step) => acc + step.animation_duration_seconds, 0) + 6} segundos
                  <span className="text-sm font-normal text-gray-500 ml-2">(+6s intro/outro)</span>
                </span>
              </div>
            )}
          </div>
        )}

        {/* Tab: Video */}
        {activeTab === 'video' && (
          <div className="space-y-6">
            {/* Video Style Selection */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-dorado" />
                Estilo del Video
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {videoStyles.map(style => (
                  <button
                    key={style.value}
                    onClick={() => setFormData({ ...formData, video_style: style.value })}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      formData.video_style === style.value
                        ? 'border-verde-aguacate bg-verde-aguacate/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-gray-900">{style.label}</div>
                    <div className="text-sm text-gray-500">{style.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Social Media URLs */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-500" />
                Enlaces de Redes Sociales
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Agrega los enlaces después de subir los videos a cada plataforma
              </p>
              <div className="space-y-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                    <Instagram className="w-4 h-4" />
                    Instagram Reels URL
                  </label>
                  <input
                    type="url"
                    value={formData.instagram_url}
                    onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                    placeholder="https://instagram.com/reel/..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde-aguacate"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                    <Youtube className="w-4 h-4" />
                    YouTube URL
                  </label>
                  <input
                    type="url"
                    value={formData.youtube_url}
                    onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde-aguacate"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
                    </svg>
                    TikTok URL
                  </label>
                  <input
                    type="url"
                    value={formData.tiktok_url}
                    onChange={(e) => setFormData({ ...formData, tiktok_url: e.target.value })}
                    placeholder="https://tiktok.com/@user/video/..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde-aguacate"
                  />
                </div>
              </div>
            </div>

            {/* Generate Video Button (placeholder) */}
            <div className="bg-gradient-to-r from-verde-bosque to-verde-aguacate rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold mb-2">Generar Video con IA</h2>
                  <p className="text-white/80">
                    {steps.length} pasos configurados - Duración estimada: {steps.reduce((acc, step) => acc + step.animation_duration_seconds, 0) + 6}s
                  </p>
                </div>
                <button
                  disabled={steps.length === 0}
                  className="flex items-center gap-2 bg-white text-verde-bosque px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Wand2 className="w-5 h-5" />
                  Generar Video
                </button>
              </div>
              <p className="mt-4 text-sm text-white/60">
                * La generación de videos requiere configurar las APIs de IA (DALL-E, Runway, etc.)
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
