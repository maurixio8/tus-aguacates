'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Clock, Star, CheckCircle, Truck, Shield, MessageCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { defaultScheduler } from '@/lib/services/delivery-scheduler'

// Placeholder blur data URL para carga instantánea
const HERO_BLUR = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAoHBwgHBgoICAgLCgoLDhgQDg0NDh0VFhEYIx8lJCIfIiEmKzcvJik0KSEiMEExNDk7Pj4+JS5ESUM8SDc9Pjv/2wBDAQoLCw4NDhwQEBw7KCIoOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozv/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAUH/8QAIhAAAgEDAwUBAAAAAAAAAAAAAQIDAAQRBRIhBhMxQVFh/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAYEQEBAQEBAAAAAAAAAAAAAAAAARExQf/aAAwDAQACEQMRAD8A1a3s7c28beyCysAQSPVWKKKcsl//2Q=="

export function ConversionHero() {
    const { user, loading } = useAuth()

    // Solo mostrar para usuarios no autenticados (guests)
    if (loading || user) {
        return null
    }

    // Obtener próximo día de entrega usando el scheduler centralizado
    const getNextDeliveryDay = () => {
        return defaultScheduler.formatDeliveryDate()
    }

    return (
        <>
            {/* ========== MÓVIL: Imagen completa arriba, contenido abajo ========== */}
            <section className="md:hidden flex flex-col bg-verde-bosque-900">
                {/* Imagen completa sin recorte - optimizada */}
                <div className="relative w-full h-[40vh] bg-verde-bosque-800">
                    <Image
                        src="/images/hero-optimized.png"
                        alt="Sabores auténticos de Colombia"
                        fill
                        sizes="100vw"
                        priority
                        quality={75}
                        placeholder="blur"
                        blurDataURL={HERO_BLUR}
                        className="object-contain object-center"
                    />
                </div>

                {/* Contenido debajo de la imagen */}
                <div className="bg-gradient-to-b from-verde-bosque-900 to-verde-bosque-800 px-4 py-6">
                    <div className="container mx-auto">
                        {/* Botón de Ofertas - Solo móvil */}
                        <Link
                            href="/tienda?categoria=ofertas"
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-2 rounded-full mb-4 shadow-lg text-sm font-bold animate-pulse hover:animate-none hover:scale-105 transition-transform"
                        >
                            🔥 Ver Ofertas
                        </Link>

                        {/* Headline */}
                        <h1 className="text-4xl font-display font-bold text-white mb-3 leading-tight">
                            <span className="text-yellow-400">Sabores Auténticos</span>
                            <br />
                            de Colombia
                        </h1>

                        {/* Subheadline */}
                        <p className="text-lg text-white/90 mb-4 leading-relaxed">
                            Aguacates, frutas exóticas, aromáticas, especias y más. <strong className="text-yellow-400">Del campo a tu cocina</strong>.
                        </p>

                        {/* Social proof */}
                        <div className="flex items-center gap-2 text-white/90 mb-6">
                            <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                ))}
                            </div>
                            <span className="text-sm font-medium">4.8/5 • 500+ clientes</span>
                        </div>

                        {/* CTAs */}
                        <div className="flex flex-col gap-3 mb-6">
                            <Link
                                href="/tienda"
                                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-verde-bosque-700 px-6 py-3 rounded-full text-lg font-bold shadow-xl transition-all transform hover:scale-105 border-2 border-verde-aguacate"
                            >
                                🛒 Ver Productos
                            </Link>

                            <a
                                href="https://wa.me/573042582777?text=Hola!%20Quiero%20hacer%20un%20pedido%20🥑"
                                className="w-full flex items-center justify-center gap-2 bg-white/95 text-verde-bosque-700 px-6 py-3 rounded-full text-lg font-bold shadow-xl"
                            >
                                <MessageCircle className="w-5 h-5 text-green-600" />
                                WhatsApp
                            </a>
                        </div>

                        {/* Trust badges */}
                        <div className="flex flex-wrap gap-2 text-white/90 text-sm">
                            <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg">
                                <CheckCircle className="w-4 h-4 text-green-400" />
                                <span>Cosechado hoy</span>
                            </div>
                            <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg">
                                <Truck className="w-4 h-4 text-green-400" />
                                <span>Entrega 48h</span>
                            </div>
                            <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg">
                                <Shield className="w-4 h-4 text-green-400" />
                                <span>Garantizado</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========== DESKTOP: Imagen de fondo que llena, contenido encima ========== */}
            <section className="hidden md:flex relative min-h-[90vh] items-center">
                {/* Imagen de fondo - llena el espacio */}
                <div className="absolute inset-0 bg-verde-bosque-800">
                    <Image
                        src="/images/hero-optimized.png"
                        alt="Sabores auténticos de Colombia"
                        fill
                        sizes="100vw"
                        priority
                        quality={80}
                        placeholder="blur"
                        blurDataURL={HERO_BLUR}
                        className="object-cover"
                    />
                    {/* Overlay para legibilidad del texto */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
                </div>

                {/* Contenido sobre la imagen */}
                <div className="relative z-10 container mx-auto px-4 py-12">
                    <div className="max-w-2xl">
                        {/* Badge de urgencia */}
                        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-verde-bosque-800 px-4 py-2 rounded-full mb-6 shadow-lg">
                            <Clock className="w-5 h-5" />
                            <span className="font-semibold">
                                Próxima entrega: {getNextDeliveryDay()} • Ordena antes 10AM
                            </span>
                        </div>

                        {/* Headline */}
                        <h1 className="text-5xl lg:text-7xl font-display font-bold text-white mb-4 leading-tight">
                            <span className="text-yellow-400">Sabores Auténticos</span>
                            <br />
                            de Colombia
                        </h1>

                        {/* Subheadline */}
                        <p className="text-2xl lg:text-3xl text-white/90 mb-6 leading-relaxed">
                            Aguacates, frutas exóticas, hierbas aromáticas, especias y más.
                            Del campo colombiano a tu cocina.
                        </p>

                        {/* Social proof */}
                        <div className="flex items-center gap-3 text-white/90 mb-8">
                            <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                ))}
                            </div>
                            <span className="text-lg font-medium">4.8/5 • 500+ familias en Bogotá</span>
                        </div>

                        {/* CTAs */}
                        <div className="flex gap-4 mb-8">
                            <Link
                                href="/tienda"
                                className="group flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-verde-bosque-700 px-8 py-4 rounded-full text-xl font-bold transition-all shadow-xl hover:shadow-2xl transform hover:scale-105 border-2 border-verde-aguacate"
                            >
                                🛒 Ver Productos
                            </Link>

                            <a
                                href="https://wa.me/573042582777?text=Hola!%20Quiero%20hacer%20un%20pedido%20🥑"
                                className="group flex items-center justify-center gap-2 bg-white/95 hover:bg-white text-verde-bosque-700 px-8 py-4 rounded-full text-xl font-bold transition-all shadow-xl hover:shadow-2xl transform hover:scale-105"
                            >
                                <MessageCircle className="w-6 h-6 text-green-600" />
                                WhatsApp
                            </a>
                        </div>

                        {/* Trust badges */}
                        <div className="flex flex-wrap gap-4 text-white/90">
                            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                                <CheckCircle className="w-5 h-5 text-green-400" />
                                <span>Cosechado hoy</span>
                            </div>
                            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                                <Truck className="w-5 h-5 text-green-400" />
                                <span>Entrega en 48h</span>
                            </div>
                            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                                <Shield className="w-5 h-5 text-green-400" />
                                <span>100% garantizado</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}
