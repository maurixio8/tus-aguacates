'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Clock, Star, CheckCircle, Truck, Shield, MessageCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

export function ConversionHero() {
    const { user, loading } = useAuth()

    // Solo mostrar para usuarios no autenticados (guests)
    if (loading || user) {
        return null
    }

    // Calcular próximo día de entrega
    const getNextDeliveryDay = () => {
        const now = new Date()
        const dayOfWeek = now.getDay()
        const hour = now.getHours()

        let daysUntilDelivery: number

        if (dayOfWeek === 0) daysUntilDelivery = 2
        else if (dayOfWeek === 1) daysUntilDelivery = 1
        else if (dayOfWeek === 2) daysUntilDelivery = hour < 20 ? 0 : 3
        else if (dayOfWeek === 3) daysUntilDelivery = 2
        else if (dayOfWeek === 4) daysUntilDelivery = 1
        else if (dayOfWeek === 5) daysUntilDelivery = hour < 20 ? 0 : 4
        else daysUntilDelivery = 3

        const deliveryDate = new Date(now)
        deliveryDate.setDate(now.getDate() + daysUntilDelivery)

        const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'short' }
        return deliveryDate.toLocaleDateString('es-CO', options)
    }

    return (
        <>
            {/* ========== MÓVIL: Imagen completa arriba, contenido abajo ========== */}
            <section className="md:hidden flex flex-col bg-verde-bosque-900">
                {/* Imagen completa sin recorte */}
                <div className="relative w-full h-[40vh]">
                    <Image
                        src="/images/hero-optimized.png"
                        fill
                        className="object-contain object-center"
                        sizes="100vw"
                        priority
                        quality={85}
                        alt="Aguacates Hass frescos del Eje Cafetero colombiano"
                    />
                </div>

                {/* Contenido debajo de la imagen */}
                <div className="bg-gradient-to-b from-verde-bosque-900 to-verde-bosque-800 px-4 py-6">
                    <div className="container mx-auto">
                        {/* Badge de urgencia */}
                        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-verde-bosque-800 px-3 py-2 rounded-full mb-4 shadow-lg text-xs">
                            <Clock className="w-4 h-4" />
                            <span className="font-semibold">
                                Entrega: Ordena antes 8PM
                            </span>
                        </div>

                        {/* Headline */}
                        <h1 className="text-4xl font-display font-bold text-white mb-3 leading-tight">
                            <span className="text-yellow-400">Aguacates Hass</span>
                            <br />
                            del Eje Cafetero
                        </h1>

                        {/* Subheadline */}
                        <p className="text-lg text-white/90 mb-4 leading-relaxed">
                            Frescos en tu mesa en <strong className="text-yellow-400">48 horas</strong> o te devolvemos tu dinero.
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
                                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-verde-aguacate to-verde-aguacate-600 text-white px-6 py-3 rounded-full text-lg font-bold shadow-xl"
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
                <div className="absolute inset-0">
                    <Image
                        src="/images/hero-optimized.png"
                        fill
                        className="object-cover"
                        style={{ objectPosition: '50% 40%' }}
                        sizes="100vw"
                        priority
                        quality={85}
                        alt="Aguacates Hass frescos del Eje Cafetero colombiano"
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
                                Próxima entrega: {getNextDeliveryDay()} • Ordena antes 8PM
                            </span>
                        </div>

                        {/* Headline */}
                        <h1 className="text-5xl lg:text-7xl font-display font-bold text-white mb-4 leading-tight">
                            <span className="text-yellow-400">Aguacates Hass</span>
                            <br />
                            del Eje Cafetero
                        </h1>

                        {/* Subheadline */}
                        <p className="text-2xl lg:text-3xl text-white/90 mb-6 leading-relaxed">
                            Frescos en tu mesa en <strong className="text-yellow-400">48 horas</strong> o te devolvemos tu dinero.
                            Directo de la finca, más fresco imposible.
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
                                className="group flex items-center justify-center gap-2 bg-gradient-to-r from-verde-aguacate to-verde-aguacate-600 hover:from-verde-aguacate-600 hover:to-verde-aguacate-700 text-white px-8 py-4 rounded-full text-xl font-bold transition-all shadow-xl hover:shadow-2xl transform hover:scale-105"
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
