'use client';

import { useState, useEffect, useRef } from 'react';
import { ShoppingCart, X, ChevronRight, Sparkles, ArrowRight, CheckCircle, Package } from 'lucide-react';
import { useCartStore } from '@/lib/cart-store';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

type AssistantStep = 'idle' | 'browsing' | 'has_items' | 'ready_to_pay';

export function CartAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenDismissed, setHasBeenDismissed] = useState(false);
  const [pulseCount, setPulseCount] = useState(0);
  const router = useRouter();
  const { items, getSubtotal, getTotals } = useCartStore();
  const subtotal = getSubtotal();
  const totals = getTotals();

  // Detectar paso actual del asistente
  const getStep = (): AssistantStep => {
    if (items.length === 0) return 'browsing';
    if (items.length > 0 && subtotal > 0) return 'has_items';
    return 'browsing';
  };

  const step = getStep();

  // Mostrar el asistente después de un delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Pulse cuando se agrega un item nuevo
  useEffect(() => {
    if (items.length > 0 && !isOpen) {
      setPulseCount(prev => prev + 1);
    }
  }, [items.length]);

  // Mensaje según el estado
  const getMessage = () => {
    if (step === 'browsing') {
      return {
        title: '¿Necesitas ayuda? 🥑',
        text: 'Estoy aquí para ayudarte a completar tu pedido.',
        action: null,
      };
    }
    if (items.length === 1) {
      return {
        title: '¡Buen comienzo! ✨',
        text: `Tienes ${items.length} producto ($${subtotal.toLocaleString('es-CO')}). ¿Quieres agregar más o ya vas a pedir?`,
        action: 'Ir a pagar' as const,
      };
    }
    if (items.length >= 2 && items.length <= 4) {
      return {
        title: '¡Tu pedido va bien! 🛒',
        text: `Llevas ${items.length} productos ($${subtotal.toLocaleString('es-CO')}). Cuando estés listo...`,
        action: 'Finalizar pedido' as const,
      };
    }
    return {
      title: '¡Gran pedido! 🎉',
      text: `${items.length} productos — $${subtotal.toLocaleString('es-CO')}. ¿Listo para confirmar?`,
      action: 'Ir a pagar' as const,
    };
  };

  const msg = getMessage();

  // Progreso visual
  const getProgress = () => {
    const steps = [
      { label: 'Elige productos', done: items.length > 0, icon: <Package className="w-3.5 h-3.5" /> },
      { label: 'Completa datos', done: false, icon: <ShoppingCart className="w-3.5 h-3.5" /> },
      { label: 'Paga', done: false, icon: <CheckCircle className="w-3.5 h-3.5" /> },
    ];
    return steps;
  };

  const handleAction = () => {
    router.push('/checkout');
  };

  // No mostrar si se cerró
  if (!isVisible) return null;

  return (
    <>
      {/* Tooltip/burbuja cuando está cerrado y tiene items */}
      {!isOpen && !hasBeenDismissed && step === 'has_items' && (
        <div 
          className="fixed bottom-32 right-4 md:bottom-20 md:right-6 z-40 max-w-[280px] animate-in slide-in-from-bottom-4 fade-in duration-500 cursor-pointer"
          onClick={() => setIsOpen(true)}
        >
          <div className="bg-white rounded-2xl shadow-xl border border-green-200 p-4 relative">
            <button
              onClick={(e) => { e.stopPropagation(); setHasBeenDismissed(true); }}
              className="absolute -top-2 -right-2 bg-gray-100 hover:bg-gray-200 rounded-full w-6 h-6 flex items-center justify-center text-gray-400 text-xs"
            >
              <X className="w-3 h-3" />
            </button>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-green-800 text-sm">{msg.title}</p>
                <p className="text-xs text-gray-600 mt-1">{msg.text}</p>
                {msg.action && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleAction(); }}
                    className="mt-2 text-xs font-bold text-green-600 hover:text-green-800 flex items-center gap-1"
                  >
                    {msg.action} <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Botón flotante principal */}
      <button
        onClick={() => { setIsOpen(!isOpen); setHasBeenDismissed(false); }}
        className={`fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 rounded-full p-4 shadow-xl transition-all hover:scale-110 flex items-center justify-center group
          ${isOpen 
            ? 'bg-gray-600 hover:bg-gray-700 text-white' 
            : items.length > 0 
              ? 'bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
              : 'bg-naranja-frutal hover:bg-orange-600 text-white'
          }
          ${pulseCount > 0 && !isOpen ? 'animate-bounce' : ''}
        `}
        style={{ animationIterationCount: pulseCount > 0 && !isOpen ? 2 : 1 }}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <>
            <ShoppingCart className="w-6 h-6" />
            {items.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {items.length}
              </span>
            )}
          </>
        )}
      </button>

      {/* Panel expandido */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 animate-in slide-in-from-bottom-10 fade-in duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Image
                  src="https://i.ibb.co/WWj50Qdy/logo.png"
                  alt="Tus Aguacates"
                  width={30}
                  height={30}
                  className="object-contain"
                />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Asistente de Compra</h3>
                <p className="text-green-100 text-xs">Te ayudo a completar tu pedido</p>
              </div>
            </div>
          </div>

          {/* Progreso */}
          <div className="px-4 py-3 bg-green-50 border-b border-green-100">
            <div className="flex items-center justify-between gap-2">
              {getProgress().map((s, i) => (
                <div key={i} className="flex items-center gap-1">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs
                    ${s.done ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'}`}
                  >
                    {s.done ? <CheckCircle className="w-3.5 h-3.5" /> : <span>{i + 1}</span>}
                  </div>
                  <span className={`text-xs hidden sm:inline ${s.done ? 'text-green-700 font-medium' : 'text-gray-400'}`}>
                    {s.label}
                  </span>
                  {i < 2 && <ChevronRight className="w-3 h-3 text-gray-300 hidden sm:block" />}
                </div>
              ))}
            </div>
          </div>

          {/* Contenido principal */}
          <div className="p-4 flex-1">
            {step === 'browsing' ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Package className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="font-bold text-gray-800">¡Explora nuestra tienda!</h4>
                <p className="text-sm text-gray-500 mt-2">
                  Agrega productos al carrito y te iré ayudando a completar tu pedido.
                </p>
                <button 
                  onClick={() => router.push('/tienda')}
                  className="mt-4 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-xl transition-all text-sm"
                >
                  Ver productos
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Resumen del carrito */}
                <div className="bg-green-50 rounded-xl p-3">
                  <p className="font-bold text-green-800 text-sm">{msg.title}</p>
                  <p className="text-xs text-gray-600 mt-1">{msg.text}</p>
                </div>

                {/* Items en carrito */}
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {items.slice(0, 4).map((item, i) => (
                    <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                      <span className="text-lg">{getProductEmoji(item.product.name)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-800 truncate">{item.product.name}</p>
                        <p className="text-xs text-gray-500">{item.quantity}x ${item.price.toLocaleString('es-CO')}</p>
                      </div>
                    </div>
                  ))}
                  {items.length > 4 && (
                    <p className="text-xs text-gray-400 text-center">+{items.length - 4} productos más</p>
                  )}
                </div>

                {/* Total y botón */}
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm text-gray-600">Total:</span>
                    <span className="font-bold text-green-700 text-lg">${totals.total.toLocaleString('es-CO')}</span>
                  </div>
                  <button
                    onClick={handleAction}
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Finalizar Mi Pedido
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
            <p className="text-[10px] text-gray-400 text-center">
              🥑 Tus Aguacates — Frutas y verduras frescas a tu puerta
            </p>
          </div>
        </div>
      )}
    </>
  );
}

function getProductEmoji(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('aguacate') || n.includes('palta')) return '🥑';
  if (n.includes('manzana')) return '🍎';
  if (n.includes('pera')) return '🍐';
  if (n.includes('banano') || n.includes('banana') || n.includes('platano')) return '🍌';
  if (n.includes('naranja')) return '🍊';
  if (n.includes('limon')) return '🍋';
  if (n.includes('fresa') || n.includes('frutilla')) return '🍓';
  if (n.includes('uva')) return '🍇';
  if (n.includes('mango')) return '🥭';
  if (n.includes('papaya')) return '🍈';
  if (n.includes('tomate')) return '🍅';
  if (n.includes('lechuga')) return '🥬';
  if (n.includes('zanahoria')) return '🥕';
  if (n.includes('cebolla')) return '🧅';
  if (n.includes('ajo')) return '🧄';
  if (n.includes('papa') || n.includes('patata')) return '🥔';
  if (n.includes('mazorca') || n.includes('maiz')) return '🌽';
  if (n.includes('pimenton')) return '🫑';
  if (n.includes('brocoli')) return '🥦';
  if (n.includes('espinaca')) return '🥬';
  if (n.includes('jugo') || n.includes('zumo')) return '🧃';
  return '🛒';
}

export default CartAssistant;
