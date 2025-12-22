'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Eye, EyeOff, Save, X, RefreshCw, AlertCircle } from 'lucide-react'
import { BannerMessage, DisplayConditions } from '@/lib/types/banner'
import { defaultMessageEngine } from '@/lib/services/banner-message-engine'
import { supabase } from '@/lib/supabase'

export function BannerMessagesAdmin() {
  const [messages, setMessages] = useState<BannerMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [editingMessage, setEditingMessage] = useState<BannerMessage | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [previewMessage, setPreviewMessage] = useState<string>('')
  const [testVariables, setTestVariables] = useState<{ [key: string]: string }>({
    stock: '23',
    product: 'aguacates',
    category: 'frutas tropicales',
    discount: '20'
  })
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' })

  useEffect(() => {
    loadMessages()
  }, [])

  const loadMessages = async () => {
    try {
      setLoading(true)
      const data = await defaultMessageEngine.getAllMessages()
      setMessages(data)
    } catch (error) {
      console.error('Error loading messages:', error)
      setSaveStatus({ type: 'error', message: 'Error al cargar los mensajes' })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingMessage) return

    try {
      setSaveStatus({ type: null, message: '' })

      const { error } = editingMessage.id
        ? await supabase
            .from('banner_messages')
            .update({
              message_type: editingMessage.message_type,
              template_text: editingMessage.template_text,
              is_active: editingMessage.is_active,
              priority: editingMessage.priority,
              display_conditions: editingMessage.display_conditions,
              updated_at: new Date().toISOString()
            })
            .eq('id', editingMessage.id)
        : await supabase
            .from('banner_messages')
            .insert([{
              message_type: editingMessage.message_type,
              template_text: editingMessage.template_text,
              is_active: editingMessage.is_active,
              priority: editingMessage.priority,
              display_conditions: editingMessage.display_conditions,
            }])

      if (error) throw error

      setSaveStatus({ type: 'success', message: editingMessage.id ? 'Mensaje actualizado exitosamente' : 'Mensaje creado exitosamente' })
      setShowForm(false)
      setEditingMessage(null)
      await loadMessages()
      defaultMessageEngine.clearCache() // Limpiar caché para refrescar

    } catch (error) {
      console.error('Error saving message:', error)
      setSaveStatus({ type: 'error', message: 'Error al guardar el mensaje' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este mensaje?')) return

    try {
      const { error } = await supabase
        .from('banner_messages')
        .delete()
        .eq('id', id)

      if (error) throw error

      setSaveStatus({ type: 'success', message: 'Mensaje eliminado exitosamente' })
      await loadMessages()
      defaultMessageEngine.clearCache()

    } catch (error) {
      console.error('Error deleting message:', error)
      setSaveStatus({ type: 'error', message: 'Error al eliminar el mensaje' })
    }
  }

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('banner_messages')
        .update({ is_active: isActive })
        .eq('id', id)

      if (error) throw error

      await loadMessages()
      defaultMessageEngine.clearCache()

    } catch (error) {
      console.error('Error toggling message:', error)
      setSaveStatus({ type: 'error', message: 'Error al cambiar estado del mensaje' })
    }
  }

  const previewTemplate = (template: string) => {
    let preview = template
    Object.entries(testVariables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      preview = preview.replace(regex, `<strong>${value}</strong>`)
    })
    return preview
  }

  const startEdit = (message?: BannerMessage) => {
    setEditingMessage(message || {
      id: '',
      message_type: 'stock',
      template_text: '',
      is_active: true,
      priority: 10,
      display_conditions: {},
      created_at: '',
      updated_at: ''
    })
    setShowForm(true)
    setSaveStatus({ type: null, message: '' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        <span>Cargando mensajes...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mensajes del Banner</h2>
          <p className="text-gray-600 mt-1">Administra los mensajes dinámicos que aparecen en el banner principal</p>
        </div>
        <button
          onClick={() => startEdit()}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nuevo Mensaje
        </button>
      </div>

      {/* Status Messages */}
      {saveStatus.type && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          saveStatus.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {saveStatus.type === 'success' ? (
            <AlertCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          {saveStatus.message}
        </div>
      )}

      {/* Messages List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mensaje</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prioridad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {messages.map((message) => (
                <tr key={message.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {message.message_type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-md">
                      <div className="text-sm text-gray-900 truncate">{message.template_text}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Vista previa: <span dangerouslySetInnerHTML={{
                          __html: previewTemplate(message.template_text).substring(0, 60) + '...'
                        }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{message.priority}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleActive(message.id, !message.is_active)}
                      className={`p-1 rounded ${message.is_active ? 'text-green-600 hover:text-green-800' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      {message.is_active ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => startEdit(message)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(message.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Form Modal */}
      {showForm && editingMessage && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-lg bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingMessage.id ? 'Editar Mensaje' : 'Nuevo Mensaje'}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Tipo de Mensaje</label>
                <select
                  value={editingMessage.message_type}
                  onChange={(e) => setEditingMessage({...editingMessage, message_type: e.target.value as BannerMessage['message_type']})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="stock">Stock</option>
                  <option value="offer">Oferta</option>
                  <option value="urgency">Urgencia</option>
                  <option value="promotion">Promoción</option>
                  <option value="freshness">Frescura</option>
                  <option value="seasonal">Temporada</option>
                  <option value="quality">Calidad</option>
                  <option value="combo">Combo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Template del Mensaje</label>
                <textarea
                  value={editingMessage.template_text}
                  onChange={(e) => setEditingMessage({...editingMessage, template_text: e.target.value})}
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: Solo {{stock}} cajas de {{product}} disponibles hoy"
                />
                <div className="mt-2 text-xs text-gray-500">
                  Usa variables como: {'{{stock}}'}, {'{{product}}'}, {'{{category}}'}, {'{{discount}}'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Vista Previa</label>
                <div className="mt-1 p-3 bg-gray-50 rounded-md">
                  <span dangerouslySetInnerHTML={{
                    __html: previewTemplate(editingMessage.template_text) || 'Sin vista previa'
                  }} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Variables de Prueba</label>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={testVariables.stock}
                    onChange={(e) => setTestVariables({...testVariables, stock: e.target.value})}
                    placeholder="Stock (ej: 23)"
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <input
                    type="text"
                    value={testVariables.product}
                    onChange={(e) => setTestVariables({...testVariables, product: e.target.value})}
                    placeholder="Producto (ej: aguacates)"
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <input
                    type="text"
                    value={testVariables.category}
                    onChange={(e) => setTestVariables({...testVariables, category: e.target.value})}
                    placeholder="Categoría (ej: frutas tropicales)"
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <input
                    type="text"
                    value={testVariables.discount}
                    onChange={(e) => setTestVariables({...testVariables, discount: e.target.value})}
                    placeholder="Descuento (ej: 20)"
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Prioridad</label>
                  <input
                    type="number"
                    value={editingMessage.priority}
                    onChange={(e) => setEditingMessage({...editingMessage, priority: parseInt(e.target.value) || 0})}
                    min="0"
                    max="100"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <div className="mt-1 text-xs text-gray-500">Mayor número = mayor prioridad</div>
                </div>

                <div>
                  <label className="flex items-center pt-7">
                    <input
                      type="checkbox"
                      checked={editingMessage.is_active}
                      onChange={(e) => setEditingMessage({...editingMessage, is_active: e.target.checked})}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Mensaje Activo</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}