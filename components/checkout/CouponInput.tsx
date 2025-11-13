'use client';

import { useState } from 'react';
import { Ticket, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useCartStore } from '@/lib/cart-store';

interface CouponInputProps {
  userEmail?: string;
}

export default function CouponInput({ userEmail }: CouponInputProps) {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const { appliedCoupon, applyCoupon, removeCoupon, getSubtotal } = useCartStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim()) {
      setMessage({ type: 'error', text: 'Por favor ingresa un código de cupón' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    const success = await applyCoupon(code.trim().toUpperCase(), userEmail);

    if (success) {
      setCode('');
      setMessage({ type: 'success', text: '¡Cupón aplicado exitosamente!' });
    } else {
      setMessage({ type: 'error', text: 'Cupón inválido o no disponible' });
    }

    setIsLoading(false);
  };

  const handleRemove = () => {
    removeCoupon();
    setCode('');
    setMessage({ type: 'info', text: 'Cupón eliminado' });
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

  return (
    <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
      <div className="flex items-start gap-3 mb-4">
        <Ticket className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">Cupón de Descuento</h3>
          <p className="text-sm text-gray-600">
            {appliedCoupon
              ? 'Cupón aplicado correctamente'
              : '¿Tienes un código de descuento?'
            }
          </p>
        </div>
      </div>

      {!appliedCoupon ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={code}
              onChange={handleInputChange}
              placeholder="Código del cupón"
              disabled={isLoading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde-aguacate focus:border-transparent disabled:opacity-50 font-mono uppercase"
              maxLength={20}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-yellow-600" />
              ) : (
                <Ticket className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={!code.trim() || isLoading}
              className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 disabled:from-gray-400 disabled:to-gray-500 text-verde-bosque-700 font-bold px-6 py-3 rounded-lg transition-all disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Aplicando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Aplicar Cupón
                </>
              )}
            </button>
          </div>

          <div className="text-xs text-gray-500">
            Puedes usar un cupón por pedido. Los descuentos no son acumulables.
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-lg p-4 border border-green-300">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-mono font-bold text-lg text-green-800">
                    {appliedCoupon.code}
                  </span>
                </div>
                <p className="text-sm text-gray-700">
                  {appliedCoupon.description}
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="text-sm">
                    <span className="text-gray-500">Descuento:</span>
                    <span className="font-bold text-green-600 ml-1">
                      {appliedCoupon.discount_type === 'percentage'
                        ? `${appliedCoupon.discount_value}%`
                        : formatCurrency(appliedCoupon.discount_amount)
                      }
                    </span>
                  </div>
                  {appliedCoupon.min_purchase > 0 && (
                    <div className="text-sm">
                      <span className="text-gray-500">Mínimo:</span>
                      <span className="font-bold text-gray-800 ml-1">
                        {formatCurrency(appliedCoupon.min_purchase)}
                      </span>
                    </div>
                  )}
                  {appliedCoupon.free_shipping && (
                    <div className="text-sm">
                      <span className="text-green-600 font-medium">🚚 Envío gratis incluido</span>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={handleRemove}
                className="text-gray-500 hover:text-red-600 p-1"
                title="Eliminar cupón"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <button
            onClick={handleRemove}
            className="w-full text-red-600 hover:text-red-700 font-medium py-2 text-sm rounded-lg transition-colors"
          >
            Eliminar Cupón
          </button>

          <div className="text-xs text-gray-500">
            El cupón será eliminado y ya no estará disponible
          </div>
        </div>
      )}

      {/* Message Display */}
      {message && (
        <div
          className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-green-100 text-green-800 border border-green-200'
              : message.type === 'error'
              ? 'bg-red-100 text-red-800 border border-red-200'
              : 'bg-blue-100 text-blue-800 border border-blue-200'
          }`}
        >
          {message.type === 'success' && <CheckCircle className="w-4 h-4" />}
          {message.type === 'error' && <AlertCircle className="w-4 h-4" />}
          {message.type === 'info' && <X className="w-4 h-4" />}
          <span className="flex-1">{message.text}</span>
        </div>
      )}
    </div>
  );
}