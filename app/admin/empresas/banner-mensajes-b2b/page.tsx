'use client';

import { useEffect, useState } from 'react';
import {
  MessageSquare,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Loader2,
} from 'lucide-react';

interface BannerMessage {
  id: string;
  message: string;
  message_type: 'info' | 'warning' | 'success' | 'error' | 'urgency' | 'promotion';
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  created_at: string;
}

const messageTypeConfig: Record<string, { label: string; color: string }> = {
  info: { label: 'Info', color: 'bg-blue-100 text-blue-700' },
  warning: { label: 'Advertencia', color: 'bg-yellow-100 text-yellow-700' },
  success: { label: 'Éxito', color: 'bg-green-100 text-green-700' },
  error: { label: 'Error', color: 'bg-red-100 text-red-700' },
  urgency: { label: 'Urgencia', color: 'bg-orange-100 text-orange-700' },
  promotion: { label: 'Promoción', color: 'bg-purple-100 text-purple-700' },
};

export default function B2BBannerMessagesPage() {
  const [messages, setMessages] = useState<BannerMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMessage, setEditingMessage] = useState<BannerMessage | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/b2b/banner-messages?_t=' + Date.now(), {
        credentials: 'include',
        cache: 'no-store',
      });

      const data = await response.json();

      if (data.success) {
        setMessages(data.data || []);
      } else {
        showToast('Error al cargar mensajes', 'error');
      }
    } catch (error) {
      console.error('Error cargando mensajes:', error);
      showToast('Error de conexión', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMessage = async () => {
    if (!editingMessage) return;
    setSaving(true);

    try {
      const isEditing = !!editingMessage.id;
      const url = isEditing
        ? `/api/admin/b2b/banner-messages?id=${editingMessage.id}`
        : '/api/admin/b2b/banner-messages';
      const method = isEditing ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          message: editingMessage.message,
          message_type: editingMessage.message_type,
          is_active: editingMessage.is_active,
          start_date: editingMessage.start_date || null,
          end_date: editingMessage.end_date || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setEditingMessage(null);
        loadMessages();
        showToast(isEditing ? 'Mensaje actualizado' : 'Mensaje creado', 'success');
      } else {
        showToast(data.error?.message || 'Error al guardar', 'error');
      }
    } catch (error) {
      console.error('Error guardando mensaje:', error);
      showToast('Error al guardar el mensaje', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('¿Estás seguro de eliminar este mensaje?')) return;

    try {
      const response = await fetch(`/api/admin/b2b/banner-messages?id=${messageId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        showToast('Mensaje eliminado correctamente', 'success');
        loadMessages();
      } else {
        showToast('Error al eliminar mensaje', 'error');
      }
    } catch (error) {
      console.error('Error eliminando mensaje:', error);
      showToast('Error de conexión', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Banner Mensajes B2B</h1>
          <p className="text-gray-600 mt-1">Mensajes emergentes para la sección empresas</p>
        </div>
        <button
          onClick={() => setEditingMessage({
            id: '',
            message: '',
            message_type: 'info',
            is_active: true,
            created_at: '',
          })}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nuevo Mensaje
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
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No hay mensajes de banner</p>
            <p className="text-sm text-gray-500 mt-1">Crea mensajes para mostrar en la sección B2B</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Mensaje</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Vigencia</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {messages.map((msg) => (
                  <tr key={msg.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-900 max-w-md truncate">{msg.message}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        messageTypeConfig[msg.message_type]?.color
                      }`}>
                        {messageTypeConfig[msg.message_type]?.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {msg.start_date && new Date(msg.start_date).toLocaleDateString()}
                      {msg.start_date && msg.end_date && ' - '}
                      {msg.end_date && new Date(msg.end_date).toLocaleDateString()}
                      {!msg.start_date && !msg.end_date && 'Sin límite'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        msg.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {msg.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingMessage(msg)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editingMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingMessage.id ? 'Editar Mensaje' : 'Nuevo Mensaje'}
              </h2>
              <button onClick={() => setEditingMessage(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje</label>
                <textarea
                  value={editingMessage.message}
                  onChange={(e) => setEditingMessage({ ...editingMessage, message: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Puedes usar variables como {{product}}, {{discount}}, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  value={editingMessage.message_type}
                  onChange={(e) => setEditingMessage({ ...editingMessage, message_type: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  {Object.entries(messageTypeConfig).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio (opcional)</label>
                  <input
                    type="datetime-local"
                    value={editingMessage.start_date || ''}
                    onChange={(e) => setEditingMessage({ ...editingMessage, start_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin (opcional)</label>
                  <input
                    type="datetime-local"
                    value={editingMessage.end_date || ''}
                    onChange={(e) => setEditingMessage({ ...editingMessage, end_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingMessage.is_active}
                  onChange={(e) => setEditingMessage({ ...editingMessage, is_active: e.target.checked })}
                  className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                />
                <span className="text-sm text-gray-700">Mensaje activo</span>
              </label>
            </div>

            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={() => setEditingMessage(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100">
                Cancelar
              </button>
              <button onClick={handleSaveMessage} disabled={saving} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
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
