'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { getCheckoutRecoveryCopy, getCheckoutRecoveryState } from '@/lib/checkout-order-state';

interface DuplicateOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    existingOrderId: string;
    existingOrderTime: string;
    customerName: string;
    existingOrderStatus?: string;
    existingPaymentMethod?: string;
    existingCheckoutState?: string;
    paymentAttemptedAt?: string | null;
    paymentFailedAt?: string | null;
}

export default function DuplicateOrderModal({
    isOpen,
    onClose,
    existingOrderId,
    existingOrderTime,
    customerName,
    existingOrderStatus,
    existingPaymentMethod,
    existingCheckoutState,
    paymentAttemptedAt,
    paymentFailedAt,
}: DuplicateOrderModalProps) {
    const router = useRouter();
    if (!isOpen) return null;

    const firstName = customerName.split(' ')[0] || 'amigo';
    const state = getCheckoutRecoveryState({
        status: existingOrderStatus,
        paymentMethod: existingPaymentMethod,
        checkoutState: existingCheckoutState,
        paymentAttemptedAt,
        paymentFailedAt,
    });
    const copy = getCheckoutRecoveryCopy(state, firstName);
    const isPendingMethod = state === 'payment_method_pending';
    const isPaymentFailed = state === 'payment_failed';
    const deferredLabel = existingPaymentMethod === 'nequi' ? 'Nequi al recibir' : 'Efectivo contra entrega';

    const handleContinue = () => {
        sessionStorage.setItem('retry_order_id', existingOrderId);
        sessionStorage.removeItem('retry_payment_method');
        onClose();
        router.push('/checkout');
    };

    const whatsappMessage = isPaymentFailed
        ? `Hola, intenté pagar mi pedido #${existingOrderId.slice(-8)} pero no se completó. Necesito ayuda.`
        : `Hola, tengo una duda sobre mi pedido #${existingOrderId.slice(-8)}.`;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
                    onClick={onClose}
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: 24 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: 24 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                    className="relative z-10 w-full max-w-md overflow-hidden rounded-[2rem] bg-white shadow-2xl"
                >
                    <div className={`relative overflow-hidden px-6 pb-7 pt-8 text-center ${isPendingMethod ? 'bg-gradient-to-br from-emerald-950 via-green-800 to-emerald-600' : isPaymentFailed ? 'bg-gradient-to-br from-amber-950 via-amber-800 to-orange-600' : 'bg-gradient-to-br from-green-950 via-green-800 to-green-600'}`}>
                        <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
                        <div className="pointer-events-none absolute -bottom-16 -left-12 h-40 w-40 rounded-full bg-yellow-300/20 blur-2xl" />
                        <motion.div
                            initial={{ scale: 0, rotate: -12 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 220, damping: 14 }}
                            className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-xl"
                        >
                            <span className="text-5xl">{isPendingMethod ? '🥑' : isPaymentFailed ? '💳' : '🎉'}</span>
                        </motion.div>
                        <h2 className="text-2xl font-black tracking-tight text-white">{copy.title}</h2>
                        <p className="mt-1 text-sm font-medium text-green-100">{copy.subtitle}</p>
                        {isPendingMethod && <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-yellow-200">¡Vas muy bien!</p>}
                    </div>

                    <div className="space-y-5 p-6">
                        <p className="text-center text-[15px] leading-6 text-slate-600">{copy.body}</p>
                        <div className="rounded-2xl border border-green-100 bg-gradient-to-br from-green-50 to-emerald-50 p-4">
                            <p className="mb-3 text-xs font-black uppercase tracking-[0.14em] text-green-700">Tu pedido está guardado</p>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between gap-3"><span className="text-slate-500">Número</span><span className="font-mono font-bold text-slate-900">#{existingOrderId.slice(-8)}</span></div>
                                <div className="flex items-center justify-between gap-3"><span className="text-slate-500">Hora</span><span className="font-semibold text-slate-900">{existingOrderTime}</span></div>
                                <div className="flex items-center justify-between gap-3"><span className="text-slate-500">Estado</span><span className={`text-right font-bold ${isPaymentFailed ? 'text-amber-700' : 'text-green-700'}`}>{copy.status}</span></div>
                                {state === 'deferred_payment' && <div className="flex items-center justify-between gap-3"><span className="text-slate-500">Pago</span><span className="font-bold text-slate-900">{deferredLabel}</span></div>}
                            </div>
                        </div>
                        <div className="space-y-3">
                            {(isPendingMethod || isPaymentFailed) && <Button onClick={handleContinue} className={`w-full rounded-2xl py-6 text-base font-black text-white shadow-lg transition-all hover:-translate-y-0.5 ${isPendingMethod ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'}`}>
                                <span className="mr-2">{isPendingMethod ? '✨' : '🔄'}</span>{copy.primary}
                            </Button>}
                            <Button onClick={() => { window.location.href = `https://wa.me/573042582777?text=${encodeURIComponent(whatsappMessage)}`; }} className="w-full rounded-2xl bg-[#25D366] py-6 text-base font-black text-white shadow-lg hover:bg-[#128C7E]">
                                <span className="mr-2">💬</span>Consultar por WhatsApp
                            </Button>
                            <button onClick={onClose} className="w-full rounded-xl py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-700">Volver a la tienda</button>
                        </div>
                        <p className="text-center text-xs leading-5 text-slate-400">{copy.footer}</p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
