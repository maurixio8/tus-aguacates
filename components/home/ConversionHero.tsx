'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Clock, Star, CheckCircle, Truck, Shield, MessageCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

export function ConversionHero() {
    const { user, loading } = useAuth()

    // Solo mostrar para usuarios no autenticados (guests)
    // Los usuarios autenticados ven el PersonalizedHero
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
        <section className="relative min-h-[85vh] md:min-h-[90vh] flex items-center">
            {/* Imagen de fondo */}
            <div className="absolute inset-0">
                <Image
                    src="/images/hero-optimized.png"
                    fill
                    className="object-cover"
                    priority
                    alt="Aguacates Hass frescos del Eje Cafetero colombiano"
                    sizes="100vw"
                />
                {/* Overlay gradiente para legibilidad */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/50 to-transparent" />
            </div>

            {/* Contenido */}
            <div className="relative z-10 container mx-auto px-4 py-12">
                <div className="max-w-2xl">
                    {/* Badge de urgencia */}
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-verde-bosque-800 px-4 py-2 rounded-full mb-6 shadow-lg">
                        <Clock className="w-5 h-5" />
                        <span className="font-semibold text-sm md:text-base">
                            Próxima entrega: {getNextDeliveryDay()}
                        </span>
                    </div>

                    {/* Headline principal */}
                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold text-white mb-4 leading-tight">
                        <span className="text-yellow-400">Aguacates Hass</span>
                        <br />
                        del Eje Cafetero
                    </h1>

                    {/* Subheadline con propuesta de valor */}
                    <p className="text-xl md:text-2xl text-white/90 mb-6 leading-relaxed">
                        Frescos en tu mesa en <strong className="text-yellow-400">48 horas</strong> o te devolvemos tu dinero.
                        Directo de la finca, más fresco imposible.
                    </p>

                    {/* Prueba social */}
                    <div className="flex flex-wrap items-center gap-3 text-white/90 mb-8">
                        <div className="flex">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                            ))}
                        </div>
                        <span className="text-lg font-medium">
                            4.8/5 • 500+ familias en Bogotá
                        </span>
                    </div>

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-8">
                        <Link
                            href="/tienda"
                            className="group flex items-center justify-center gap-2 bg-gradient-to-r from-verde-aguacate to-verde-aguacate-600 hover:from-verde-aguacate-600 hover:to-verde-aguacate-700 text-white px-8 py-4 rounded-full text-lg md:text-xl font-bold transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                            🛒 Ver Productos
                        </Link>

                        <a
                            href="https://wa.me/573042582777?text=Hola!%20Quiero%20hacer%20un%20pedido%20🥑"
                            className="group flex items-center justify-center gap-2 bg-white/95 hover:bg-white text-verde-bosque-700 px-8 py-4 rounded-full text-lg md:text-xl font-bold transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                            <MessageCircle className="w-6 h-6 text-green-600" />
                            WhatsApp
                        </a>
                    </div>

                    {/* Trust badges */}
                    <div className="flex flex-wrap gap-4 md:gap-6 text-white/90">
                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-green-400" />
                            <span className="text-sm md:text-base">Cosechado hoy</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg">
                            <Truck className="w-5 h-5 text-green-400" />
                            <span className="text-sm md:text-base">Entrega en 48h</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg">
                            <Shield className="w-5 h-5 text-green-400" />
                            <span className="text-sm md:text-base">100% garantizado</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
