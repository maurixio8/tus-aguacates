'use client';

/**
 * Formulario de Información para Cliente Guest B2B
 * "Tus Aguacates" - E-commerce Platform
 */

import { useState } from 'react';
import type { GuestContactInfo, Address } from '@/lib/b2b/b2b-types';

interface GuestInfoFormProps {
  onSubmit: (info: GuestContactInfo & { shipping_address: Address }) => void;
  initialData?: Partial<GuestContactInfo>;
}

export function GuestInfoForm({ onSubmit, initialData }: GuestInfoFormProps) {
  const [formData, setFormData] = useState<GuestContactInfo & {
    shipping_address: Address;
  }>({
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    company_name: initialData?.company_name || '',
    shipping_address: {
      street_address: '',
      city: '',
      state: 'Cundinamarca',
      postal_code: '',
      country: 'Colombia',
      additional_info: '',
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleAddressChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      shipping_address: {
        ...prev.shipping_address,
        [name]: value,
      },
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido';
    }
    if (!formData.company_name.trim()) {
      newErrors.company_name = 'El nombre de la empresa es requerido';
    }

    // Validar dirección
    if (!formData.shipping_address.street_address.trim()) {
      newErrors.street_address = 'La dirección es requerida';
    }
    if (!formData.shipping_address.city.trim()) {
      newErrors.city = 'La ciudad es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-800">
        Información de Contacto
      </h3>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Nombre */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre Completo *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
        </div>

        {/* Nombre de la empresa */}
        <div>
          <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre de la Empresa *
          </label>
          <input
            type="text"
            id="company_name"
            name="company_name"
            value={formData.company_name}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 ${
              errors.company_name ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.company_name && <p className="text-red-600 text-sm mt-1">{errors.company_name}</p>}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
        </div>

        {/* Teléfono */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Teléfono *
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+57 300 123 4567"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 ${
              errors.phone ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone}</p>}
        </div>
      </div>

      <h3 className="text-xl font-semibold text-gray-800 pt-4">
        Dirección de Envío
      </h3>

      <div>
        <label htmlFor="street_address" className="block text-sm font-medium text-gray-700 mb-1">
          Dirección *
        </label>
        <input
          type="text"
          id="street_address"
          name="street_address"
          value={formData.shipping_address.street_address}
          onChange={handleAddressChange}
          placeholder="Calle 123 # 45-67"
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 ${
            errors.street_address ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.street_address && <p className="text-red-600 text-sm mt-1">{errors.street_address}</p>}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Ciudad */}
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
            Ciudad *
          </label>
          <input
            type="text"
            id="city"
            name="city"
            value={formData.shipping_address.city}
            onChange={handleAddressChange}
            placeholder="Bogotá"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 ${
              errors.city ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.city && <p className="text-red-600 text-sm mt-1">{errors.city}</p>}
        </div>

        {/* Departamento/Estado */}
        <div>
          <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
            Departamento
          </label>
          <input
            type="text"
            id="state"
            name="state"
            value={formData.shipping_address.state}
            onChange={handleAddressChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Código Postal */}
        <div>
          <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700 mb-1">
            Código Postal
          </label>
          <input
            type="text"
            id="postal_code"
            name="postal_code"
            value={formData.shipping_address.postal_code}
            onChange={handleAddressChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* País */}
        <div>
          <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
            País
          </label>
          <input
            type="text"
            id="country"
            name="country"
            value={formData.shipping_address.country}
            onChange={handleAddressChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Información adicional */}
      <div>
        <label htmlFor="additional_info" className="block text-sm font-medium text-gray-700 mb-1">
          Referencias o Instrucciones de Entrega
        </label>
        <textarea
          id="additional_info"
          name="additional_info"
          value={formData.shipping_address.additional_info || ''}
          onChange={handleAddressChange}
          rows={2}
          placeholder="Apartamento 201, timbre dañado, llamar antes de llegar, etc."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
        />
      </div>

      {/* Botón */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 text-white font-bold py-3 px-6 rounded-lg transition"
      >
        {isSubmitting ? 'Procesando...' : 'Continuar'}
      </button>
    </form>
  );
}
