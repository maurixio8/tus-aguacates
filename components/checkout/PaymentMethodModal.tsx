'use client';

import { useState } from 'react';
import Image from 'next/image';

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMethod: (method: string) => void;
  total: number;
}

export default function PaymentMethodModal({ isOpen, onClose, onSelectMethod, total }: PaymentMethodModalProps) {
  const [selected, setSelected] = useState<string | null>(null);

  if (!isOpen) return null;

  const methods = [
    {
      id: 'efectivo',
      name: 'Efectivo contra entrega',
      icon: '💵',
      description: 'Pagas cuando recibes tu pedido',
      fee: 0,
      feeDisplay: 'Sin cargo'
    },
    {
      id: 'daviplata',
      name: 'Daviplata',
      icon: '📱',
      description: 'Transferencia desde tu celular',
      fee: 0,
      feeDisplay: 'Sin cargo'
    },
    {
      id: 'nequi',
      name: 'Nequi',
      icon: '📲',
      description: 'Transferencia desde Nequi',
      fee: 0,
      feeDisplay: 'Sin cargo'
    },
    {
      id: 'tarjeta',
      name: 'Tarjeta Débito/Crédito',
      icon: '💳',
      description: 'Visa, Mastercard, etc. (PSE)',
      fee: Math.round(total * 0.04),
      feeDisplay: '+4% ($' + Math.round(total * 0.04).toLocaleString('es-CO') + ')'
    }
  ];

  const handleSelect = () => {
    if (selected) {
      onSelectMethod(selected);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-green-600 px-6 py-4">
          <h2 className="text-xl font-bold text-white text-center">
            💳 ¿Cómo quieres pagar?
          </h2>
          <p className="text-green-100 text-center text-sm mt-1">
            Selecciona el método de pago
          </p>
        </div>

        {/* Methods */}
        <div className="p-4 space-y-3 overflow-y-auto max-h-[60vh]">
          {methods.map((method) => (
            <button
              key={method.id}
              onClick={() => setSelected(method.id)}
              className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 text-left
                ${selected === method.id 
                  ? 'border-green-500 bg-green-50 shadow-md' 
                  : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                }`}
            >
              <span className="text-3xl">{method.icon}</span>
              <div className="flex-1">
                <div className="font-semibold text-gray-900">{method.name}</div>
                <div className="text-sm text-gray-500">{method.description}</div>
              </div>
              <div className={`font-bold ${method.fee > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                {method.feeDisplay}
              </div>
            </button>
          ))}
        </div>

        {/* Warning for card payments */}
        {selected === 'tarjeta' && (
          <div className="px-4 pb-2">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-800">
              ⚠️ <strong>Nota:</strong> El 4% adicional es requerido por la plataforma de pago y se suma al total de tu pedido.
            </div>
          </div>
        )}

        {/* Total Preview */}
        <div className="px-6 py-4 bg-gray-50 border-t">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Total sin cargo:</span>
            <span className="font-medium">${total.toLocaleString('es-CO')}</span>
          </div>
          {selected === 'tarjeta' && (
            <div className="flex justify-between items-center mb-2 text-orange-600">
              <span>Cargo 4% plataforma:</span>
              <span className="font-medium">+${Math.round(total * 0.04).toLocaleString('es-CO')}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-lg font-bold text-green-700">
            <span>Total a pagar:</span>
            <span>${(total + (selected === 'tarjeta' ? Math.round(total * 0.04) : 0)).toLocaleString('es-CO')}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSelect}
            disabled={!selected}
            className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-colors
              ${selected 
                ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
}