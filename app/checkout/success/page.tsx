'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle, XCircle, Clock, Home, Phone, ArrowRight } from 'lucide-react';

type PaymentStatus = 'approved' | 'rejected' | 'pending' | 'unknown';

function CheckoutSuccessContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [status, setStatus] = useState<PaymentStatus>('pending');
    const [orderId, setOrderId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Bold redirige con parámetros en la URL
        const boldOrderId = searchParams.get('bold-order-id') || searchParams.get('order_id') || searchParams.get('orderId');
        const boldStatus = searchParams.get('bold-tx-status') || searchParams.get('status');

        if (boldOrderId) {
            setOrderId(boldOrderId);
        }

        // Mapear el estado de Bold
        if (boldStatus) {
            const statusLower = boldStatus.toLowerCase();
            if (statusLower === 'approved' || statusLower === 'pagado') {
                setStatus('approved');
            } else if (statusLower === 'rejected' || statusLower === 'fallido') {
                setStatus('rejected');
            } else {
                setStatus('pending');
            }
        } else {
            // Si no hay status en URL, asumimos que el pago fue procesado
            setStatus('approved');
        }

        setIsLoading(false);
    }, [searchParams]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            {/* Header con logo */}
            <div className="bg-white border-b border-gray-200 py-4">
                <div className="max-w-md mx-auto flex justify-center">
                    <Link href="/">
                        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-4">
                            <Image
                                src="https://i.ibb.co/WWj50Qdy/logo.png"
                                alt="Tus Aguacates - Logo"
                                width={180}
                                height={60}
                                priority
                                className="object-contain"
                            />
                        </div>
                    </Link>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12">
                <div className="max-w-lg mx-auto">
                    {/* Estado del pago */}
                    {status === 'approved' && (
                        <div className="text-center space-y-6">
                            <div className="w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-16 h-16 text-green-600" />
                            </div>

                            <div>
                                <h1 className="text-3xl font-bold text-green-800 mb-2">
                                    ¡Pago Exitoso! 🥑
                                </h1>
                                <p className="text-gray-600">
                                    Tu pedido ha sido confirmado y pagado correctamente.
                                </p>
                            </div>

                            {orderId && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <p className="text-sm text-green-700">
                                        <span className="font-medium">Número de pedido:</span> #{orderId.slice(-8)}
                                    </p>
                                </div>
                            )}

                            <div className="bg-white border border-gray-200 rounded-lg p-6 text-left space-y-4">
                                <h3 className="font-semibold text-lg">¿Qué sigue?</h3>

                                <div className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <span className="text-green-600 text-sm font-bold">1</span>
                                        </div>
                                        <p className="text-gray-600">
                                            Recibirás un mensaje de WhatsApp confirmando tu pedido.
                                        </p>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <span className="text-green-600 text-sm font-bold">2</span>
                                        </div>
                                        <p className="text-gray-600">
                                            Prepararemos tu pedido con los productos más frescos.
                                        </p>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <span className="text-green-600 text-sm font-bold">3</span>
                                        </div>
                                        <p className="text-gray-600">
                                            Entregaremos en tu dirección en el próximo día de reparto.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {status === 'rejected' && (
                        <div className="text-center space-y-6">
                            <div className="w-24 h-24 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                                <XCircle className="w-16 h-16 text-red-600" />
                            </div>

                            <div>
                                <h1 className="text-3xl font-bold text-red-800 mb-2">
                                    Pago no procesado
                                </h1>
                                <p className="text-gray-600">
                                    Hubo un problema al procesar tu pago. Por favor intenta de nuevo.
                                </p>
                            </div>

                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <p className="text-sm text-red-700">
                                    Tu pedido no ha sido cobrado. Puedes intentar con otro método de pago.
                                </p>
                            </div>
                        </div>
                    )}

                    {status === 'pending' && (
                        <div className="text-center space-y-6">
                            <div className="w-24 h-24 mx-auto bg-yellow-100 rounded-full flex items-center justify-center">
                                <Clock className="w-16 h-16 text-yellow-600" />
                            </div>

                            <div>
                                <h1 className="text-3xl font-bold text-yellow-800 mb-2">
                                    Procesando pago...
                                </h1>
                                <p className="text-gray-600">
                                    Tu pago está siendo verificado. Te notificaremos cuando esté confirmado.
                                </p>
                            </div>

                            {orderId && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                    <p className="text-sm text-yellow-700">
                                        <span className="font-medium">Número de pedido:</span> #{orderId.slice(-8)}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Botones de acción */}
                    <div className="mt-8 space-y-3">
                        <Link
                            href="/"
                            className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-green-600 to-green-700 text-white font-bold py-4 px-6 rounded-lg hover:from-green-700 hover:to-green-800 transition-all"
                        >
                            <Home className="w-5 h-5" />
                            Volver al inicio
                        </Link>

                        {status === 'rejected' && (
                            <Link
                                href="/checkout"
                                className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-verde-bosque-700 font-bold py-4 px-6 rounded-lg hover:from-yellow-500 hover:to-yellow-700 transition-all border-2 border-verde-aguacate"
                            >
                                <ArrowRight className="w-5 h-5" />
                                Intentar de nuevo
                            </Link>
                        )}

                        <a
                            href="https://wa.me/573042582777"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full bg-white text-gray-700 border border-gray-300 font-medium py-3 px-6 rounded-lg hover:bg-gray-50 transition-all"
                        >
                            <Phone className="w-5 h-5" />
                            Contactar por WhatsApp
                        </a>
                    </div>

                    {/* Información de entrega */}
                    <div className="mt-8 text-center">
                        <p className="text-sm text-gray-500">
                            🚚 Entregas: Martes y Viernes en Bogotá
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                            ¿Tienes preguntas? Escríbenos al WhatsApp 304 258 2777
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function CheckoutSuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        }>
            <CheckoutSuccessContent />
        </Suspense>
    );
}
