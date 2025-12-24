'use client';

import { useState } from 'react';
import { X, User, Mail, Phone, Check, Loader2 } from 'lucide-react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: { full_name: string; preferred_name: string; phone: string } | null;
  email: string;
  onSave: (data: { full_name: string; preferred_name: string; phone: string }) => Promise<void>;
}

export function EditProfileModal({
  isOpen,
  onClose,
  profile,
  email,
  onSave
}: EditProfileModalProps) {
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    preferred_name: profile?.preferred_name || '',
    phone: profile?.phone || ''
  });
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50 transition-opacity" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <User className="w-5 h-5 text-verde-aguacate" />
                Editar Perfil
              </h2>
              <button
                onClick={onClose}
                disabled={isSaving}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
              {/* Email (no editable) */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <Mail className="w-4 h-4 text-gray-400" />
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">El correo no se puede cambiar</p>
              </div>

              {/* Nombre Completo */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <User className="w-4 h-4 text-gray-400" />
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Tu nombre completo"
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-verde-aguacate focus:ring-2 focus:ring-verde-aguacate/20 outline-none transition-all"
                  required
                />
              </div>

              {/* Nombre Preferido */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <User className="w-4 h-4 text-gray-400" />
                  Cómo prefieres que te llamemos
                </label>
                <input
                  type="text"
                  value={formData.preferred_name}
                  onChange={(e) => setFormData({ ...formData, preferred_name: e.target.value })}
                  placeholder="Nombre corto o apodo"
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-verde-aguacate focus:ring-2 focus:ring-verde-aguacate/20 outline-none transition-all"
                />
                <p className="text-xs text-gray-500 mt-1">Este es el nombre que verás en tu perfil</p>
              </div>

              {/* Teléfono */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <Phone className="w-4 h-4 text-gray-400" />
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Tu número de teléfono"
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-verde-aguacate focus:ring-2 focus:ring-verde-aguacate/20 outline-none transition-all"
                />
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSaving}
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-verde-aguacate to-verde-bosque hover:from-verde-aguacate/90 hover:to-verde-bosque/90 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Guardar Cambios
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
