'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface DuplicateOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    existingOrderId: string;
    existingOrderTime: string;
    customerName: string;
    /** Estado del pedido existente para decidir si mostrar "Reintentar pago" */
    existingOrderStatus?: string;
    /** Método de pago del pedido existente */
    existingPaymentMethod?: string;
}

export default function DuplicateOrderModal({
    isOpen,
    onClose,
    existingOrderId,
    existingOrderTime,
    customerName,
    existingOrderStatus,
    existingPaymentMethod,
}: DuplicateOrderModalProps) {
    const router = useRouter();

    if (!isOpen) return null;

    // Mostrar "Reintentar pago" solo si el pedido está pendiente o con pago fallido
    // y fue con tarjeta (Bold) — los demás métodos requieren acción manual
    const canRetryPayment = existingOrderStatus &&
        ['pendiente', 'pago_fallido', 'confirmado'].includes(existingOrderStatus) &&
        (!existingPaymentMethod || existingPaymentMethod === 'tarjeta' || existingPaymentMethod === 'bold');

    const handleRetryPayment = () => {
        // Guardar el orderId en sessionStorage para que el checkout lo retome
        sessionStorage.setItem('retry_order_id', existingOrderId);
        if (existingPaymentMethod) {
            sessionStorage.setItem('retry_payment_method', existingPaymentMethod);
        }
        onClose();
        router.push('/checkout');
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                />

                {/* Modal Content */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden z-10"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />

                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                            className="w-20 h-20 bg-white rounded-full mx-auto flex items-center justify-center shadow-lg mb-4"
                        >
                            <span className="text-4xl">
                                {canRetryPayment ? '🔄' : '🥑'}
                            </span>
                        </motion.div>

                        <h2 className="text-xl font-bold text-white mb-1">
                            {canRetryPayment
                                ? `¡Ey ${customerName.split(' ')[0]}!`
                                : `¡Hola ${customerName.split(' ')[0]}!`
                            }
                        </h2>
                        <p className="text-blue-100 text-sm">
                            {canRetryPayment
                                ? 'Tienes un pedido pendiente por pagar'
                                : 'Ya recibimos tu pedido de hoy'
                            }
                        </p>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-6">
                        <div className="text-center space-y-2">
                            <p className="text-gray-600">
                                {canRetryPayment
                                    ? 'Parece que el pago anterior no se completó. Puedes intentar pagar de nuevo o consultarnos por WhatsApp.'
                                    : 'Para garantizar el mejor servicio, solo procesamos un pedido por día por persona.'
                                }
                            </p>

                            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 mt-4 text-left">
                                <p className="text-xs text-blue-600 font-bold uppercase mb-2">Tu pedido activo:</p>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-gray-600 text-sm">Número:</span>
                                    <span className="font-mono font-bold text-gray-900">#{existingOrderId.slice(-8)}</span>
                                </div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-gray-600 text-sm">Hora:</span>
                                    <span className="text-gray-900 font-medium">{existingOrderTime}</span>
                                </div>
                                {existingOrderStatus && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 text-sm">Estado:</span>
                                        <span className={`font-medium text-sm ${
                                            existingOrderStatus === 'pendiente' || existingOrderStatus === 'pago_fallido'
                                                ? 'text-amber-600'
                                                : 'text-green-600'
                                        }`}>
                                            {existingOrderStatus === 'pendiente' ? 'Pendiente de pago' :
                                             existingOrderStatus === 'pago_fallido' ? 'Pago fallido' :
                                             existingOrderStatus === 'confirmado' ? 'Confirmado' :
                                             existingOrderStatus}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-3">
                            {canRetryPayment && (
                                <Button
                                    onClick={handleRetryPayment}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-6 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                                >
                                    <span>🔄</span>
                                    Reintentar pago
                                </Button>
                            )}

                            <Button
                                onClick={() => {
                                    const message = canRetryPayment
                                        ? `Hola, intenté pagar mi pedido #${existingOrderId.slice(-8)} pero no se completó. Necesito ayuda.`
                                        : `Hola, tengo una duda sobre mi pedido #${existingOrderId.slice(-8)}`;
                                    window.location.href = `https://wa.me/573042582777?text=${encodeURIComponent(message)}`;
                                }}
                                className={`w-full font-bold py-6 rounded-xl shadow-lg transition-all ${
                                    canRetryPayment
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                                }`}
                            >
                                Consultar en WhatsApp
                            </Button>

                            <button
                                onClick={onClose}
                                className="w-full text-center text-sm text-gray-500 hover:text-gray-700 py-2"
                            >
                                Volver a la tienda
                            </button>
                        </div>

                        <p className="text-xs text-gray-400 text-center">
                            {canRetryPayment
                                ? 'Al hacer clic en "Reintentar pago" te llevaremos al checkout para que completes el pago.'
                                : 'Si necesitas agregar algo a tu pedido, escríbenos por WhatsApp y te ayudamos.'
                            }
                        </p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
