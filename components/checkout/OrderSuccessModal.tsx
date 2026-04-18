import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/lib/cart-store';

interface OrderSuccessModalProps {
    isOpen: boolean;
    orderId: string;
    customerName: string;
    total: number;
    paymentMethod: string;
    whatsappUrl: string;
    onClose: () => void;
}

export default function OrderSuccessModal({
    isOpen,
    orderId,
    customerName,
    total,
    paymentMethod,
    whatsappUrl,
    onClose
}: OrderSuccessModalProps) {
    if (!isOpen) return null;

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
                    {/* Header Branding */}
                    <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-yellow-400/20 rounded-full -ml-12 -mb-12 blur-xl" />

                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                            className="w-20 h-20 bg-white rounded-full mx-auto flex items-center justify-center shadow-lg mb-4"
                        >
                            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </motion.div>

                        <h2 className="text-2xl font-bold text-white mb-1">¡Pedido Confirmado!</h2>
                        <p className="text-green-100 text-sm">Tu pedido ya está en nuestro sistema, {customerName.split(' ')[0]}</p>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-6">
                        <div className="text-center space-y-2">
                            <p className="text-gray-600">
                                Tu pedido <span className="font-bold text-gray-900">#{orderId.slice(-8)}</span> ha sido registrado correctamente.
                            </p>
                        </div>

                        {/* Order Summary Box */}
                        <div className="bg-green-50 rounded-xl p-4 border border-green-100 space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600">Total a pagar:</span>
                                <span className="text-lg font-bold text-green-700">${total.toLocaleString('es-CO')}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600">Método de pago:</span>
                                <span className="font-medium text-gray-900">
                                    {paymentMethod === 'efectivo' ? 'Efectivo contra entrega' :
                                        paymentMethod === 'daviplata' ? 'Daviplata' :
                                            paymentMethod === 'nequi' ? 'Nequi' : 'Tarjeta/PSE'}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <p className="text-sm text-center text-gray-600 font-medium">
                                Si deseas enviar el pedido a nuestro departamento de entregas para agilizar tu entrega, envía este mensaje por WhatsApp.
                            </p>

                            <Button
                                onClick={() => {
                                    // Limpiar carrito antes de ir a WhatsApp
                                    useCartStore.getState().clearCart();
                                    window.location.href = whatsappUrl;
                                }}
                                className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                            >
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                </svg>
                                Enviar mensaje por WhatsApp
                            </Button>

                            <button
                                onClick={onClose}
                                className="w-full text-center text-sm text-gray-500 hover:text-gray-700 py-2 font-medium"
                            >
                                Salir (pedido ya confirmado)
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
