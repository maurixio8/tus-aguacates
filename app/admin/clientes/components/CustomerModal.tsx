'use client';

import { useState, useEffect } from 'react';
import { Customer, CustomerAddress, CreateCustomerInput } from '@/lib/types/customer';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: CreateCustomerInput) => Promise<void>;
  customer?: Customer | null;
}

export default function CustomerModal({ isOpen, onClose, onSave, customer }: CustomerModalProps) {
  const [formData, setFormData] = useState<CreateCustomerInput>({
    name: '',
    email: '',
    phone: '',
    addresses: [],
    notes: ''
  });

  const [newAddress, setNewAddress] = useState('');
  const [newAddressLabel, setNewAddressLabel] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name,
        email: customer.email || '',
        phone: customer.phone,
        addresses: customer.addresses || [],
        notes: customer.notes || ''
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        addresses: [],
        notes: ''
      });
    }
  }, [customer, isOpen]);

  const handleAddAddress = () => {
    if (!newAddress.trim()) return;

    const address: CustomerAddress = {
      address: newAddress.trim(),
      label: newAddressLabel.trim() || undefined,
      isDefault: formData.addresses.length === 0 // Primera dirección es default
    };

    setFormData({
      ...formData,
      addresses: [...formData.addresses, address]
    });

    setNewAddress('');
    setNewAddressLabel('');
  };

  const handleRemoveAddress = (index: number) => {
    const newAddresses = formData.addresses.filter((_, i) => i !== index);

    // Si eliminamos la dirección default, hacer la primera como default
    if (newAddresses.length > 0 && formData.addresses[index].isDefault) {
      newAddresses[0].isDefault = true;
    }

    setFormData({
      ...formData,
      addresses: newAddresses
    });
  };

  const handleSetDefaultAddress = (index: number) => {
    const newAddresses = formData.addresses.map((addr, i) => ({
      ...addr,
      isDefault: i === index
    }));

    setFormData({
      ...formData,
      addresses: newAddresses
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.phone.trim()) {
      alert('Por favor completa los campos requeridos: Nombre y Teléfono');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error al guardar cliente:', error);
      alert('Error al guardar el cliente. Por favor intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {customer ? 'Editar Cliente' : 'Nuevo Cliente'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Nombre completo del cliente"
                required
              />
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="+57 300 123 4567"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email (opcional)
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="email@ejemplo.com"
              />
            </div>

            {/* Direcciones */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Direcciones
              </label>

              {/* Lista de direcciones */}
              {formData.addresses.length > 0 && (
                <div className="space-y-2 mb-3">
                  {formData.addresses.map((addr, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-md border ${
                        addr.isDefault ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          {addr.label && (
                            <span className="text-xs font-semibold text-gray-600 uppercase">
                              {addr.label}
                            </span>
                          )}
                          <p className="text-sm text-gray-800">{addr.address}</p>
                          {addr.isDefault && (
                            <span className="text-xs text-green-600 font-medium">
                              ✓ Dirección predeterminada
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2 ml-3">
                          {!addr.isDefault && (
                            <button
                              type="button"
                              onClick={() => handleSetDefaultAddress(index)}
                              className="text-xs text-green-600 hover:text-green-700"
                            >
                              Predeterminar
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveAddress(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Agregar nueva dirección */}
              <div className="space-y-2 p-3 border-2 border-dashed border-gray-300 rounded-md">
                <input
                  type="text"
                  value={newAddressLabel}
                  onChange={(e) => setNewAddressLabel(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Etiqueta (Casa, Oficina, Finca...)"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Dirección completa"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAddress())}
                  />
                  <button
                    type="button"
                    onClick={handleAddAddress}
                    className="px-4 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                  >
                    Agregar
                  </button>
                </div>
              </div>
            </div>

            {/* Notas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas (opcional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Preferencias, alergias, instrucciones especiales..."
              />
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                disabled={isSaving}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
              >
                {isSaving ? 'Guardando...' : 'Guardar Cliente'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
