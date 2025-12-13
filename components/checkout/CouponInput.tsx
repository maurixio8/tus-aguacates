'use client';

import { useState } from 'react';
import { Ticket, X, CheckCircle, AlertCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { useCartStore } from '@/lib/cart-store';

interface CouponInputProps {
  userEmail?: string;
}

export default function CouponInput({ userEmail }: CouponInputProps) {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const { appliedCoupon, applyCoupon, removeCoupon, getSubtotal } = useCartStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim()) {
      setMessage({ type: 'error', text: 'Por favor ingresa un codigo de cupon' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    const success = await applyCoupon(code.trim().toUpperCase(), userEmail);

    if (success) {
      setCode('');
      setMessage({ type: 'success', text: 'Cupon aplicado!' });
      setIsExpanded(false);
    } else {
      setMessage({ type: 'error', text: 'Cupon invalido o no disponible' });
    }

    setIsLoading(false);
  };

  const handleRemove = () => {
    removeCoupon();
    setCode('');
    setMessage({ type: 'info', text: 'Cupon eliminado' });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(amount);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9-_]/g, '');
    setCode(value);
    if (message) {
      setMessage(null);
    }
  };

  // Si hay cupon aplicado, mostrar de forma compacta
  if (appliedCoupon) {
    return (
      <div className="bg-green-50 rounded-lg p-3 border border-green-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="font-mono font-medium text-green-800 text-sm">
              {appliedCoupon.code}
            </span>
            <span className="text-green-600 text-sm">
              -{appliedCoupon.discount_type === 'percentage'
                ? `${appliedCoupon.discount_value}%`
                : formatCurrency(appliedCoupon.discount_amount)
              }
            </span>
          </div>
          <button
            onClick={handleRemove}
            className="text-gray-400 hover:text-red-600 p-1"
            title="Eliminar cupon"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200">
      {/* Header compacto que se puede expandir */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 text-left"
      >
        <div className="flex items-center gap-2">
          <Ticket className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-700">Tengo un cupon de descuento</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {/* Formulario expandible */}
      {isExpanded && (
        <div className="px-3 pb-3">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={code}
                onChange={handleInputChange}
                placeholder="Codigo"
                disabled={isLoading}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde-aguacate focus:border-transparent disabled:opacity-50 font-mono uppercase"
                maxLength={20}
              />
            </div>
            <button
              type="submit"
              disabled={!code.trim() || isLoading}
              className="bg-verde-aguacate hover:bg-verde-bosque disabled:bg-gray-300 text-white font-medium px-4 py-2 rounded-lg transition-all disabled:cursor-not-allowed text-sm flex items-center gap-1"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Aplicar'
              )}
            </button>
          </form>

          {/* Mensaje de error/exito */}
          {message && (
            <div
              className={`flex items-center gap-2 p-2 rounded text-xs mt-2 ${
                message.type === 'success'
                  ? 'bg-green-100 text-green-700'
                  : message.type === 'error'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-blue-100 text-blue-700'
              }`}
            >
              {message.type === 'success' && <CheckCircle className="w-3 h-3" />}
              {message.type === 'error' && <AlertCircle className="w-3 h-3" />}
              <span>{message.text}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
