'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, useInView } from 'framer-motion'
import { Clock, Star, CheckCircle, Truck, Shield, ChefHat } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { defaultScheduler } from '@/lib/services/delivery-scheduler'

// Placeholder blur data URL para carga instantánea
const HERO_BLUR = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAoHBwgHBgoICAgLCgoLDhgQDg0NDh0VFhEYIx8lJCIfIiEmKzcvJik0KSEiMEExNDk7Pj4+JS5ESUM8SDc9Pjv/2wBDAQoLCw4NDhwQEBw7KCIoOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozv/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAUH/8QAIhAAAgEDAwUBAAAAAAAAAAAAAQIDAAQRBRIhBhMxQVFh/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAYEQEBAQEBAAAAAAAAAAAAAAAAARExQf/aAAwDAQACEQMRAD8A1a3s7c28beyCysAQSPVWKKKcsl//2Q=="

/* ─── Typewriter Hook ─── */
function useTypewriter(text: string, speed = 45, start = true) {
    const [displayed, setDisplayed] = useState('')
    const [done, setDone] = useState(false)

    useEffect(() => {
        if (!start) return
        setDisplayed('')
        setDone(false)
        let i = 0
        const interval = setInterval(() => {
            i++
            setDisplayed(text.slice(0, i))
            if (i >= text.length) {
                clearInterval(interval)
                setDone(true)
            }
        }, speed)
        return () => clearInterval(interval)
    }, [text, speed, start])

    return { displayed, done }
}

/* ─── Blinking Cursor ─── */
function Cursor({ show }: { show: boolean }) {
    if (!show) return null
    return (
        <motion.span
            className="text-yellow-400 inline-block ml-[2px]"
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
        >
            |
        </motion.span>
    )
}

/* ─── Sparkle Star ─── */
function Sparkle({ className, delay = 0 }: { className: string; delay?: number }) {
    return (
        <motion.span
            className={`absolute text-yellow-400/30 select-none pointer-events-none ${className}`}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
                opacity: [0, 0.7, 0],
                scale: [0.5, 1.2, 0.5],
                rotate: [0, 180],
            }}
            transition={{
                duration: 3,
                repeat: Infinity,
                repeatDelay: 1,
                delay,
                ease: 'easeInOut',
            }}
        >
            ✦
        </motion.span>
    )
}

/* ─── Animated CTA Button with Glow ─── */
function GlowButton({ href, children, mobile = false }: { href: string; children: React.ReactNode; mobile?: boolean }) {
    const baseClasses = mobile
        ? "w-full flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-verde-bosque-700 px-6 py-3 rounded-full text-lg font-bold transition-all transform hover:scale-105 border-2 border-verde-aguacate animate-glow-pulse hover:shadow-2xl relative overflow-visible"
        : "group flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-verde-bosque-700 px-8 py-4 rounded-full text-xl font-bold transition-all shadow-xl hover:shadow-2xl transform hover:scale-105 border-2 border-verde-aguacate animate-glow-pulse relative overflow-visible"

    return (
        <Link href={href} className={baseClasses}>
            {/* Glow ring effect */}
            <span className="absolute inset-0 rounded-full border-2 border-yellow-400/50 animate-glow-ring pointer-events-none" />
            <span className="absolute inset-0 rounded-full border-2 border-yellow-400/30 animate-glow-ring pointer-events-none" style={{ animationDelay: '0.6s' }} />
            <span className="relative z-10">{children}</span>
        </Link>
    )
}

/* ─── Main Component ─── */
export function ConversionHero() {
    const { user, loading } = useAuth()
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: '-100px' })

    // Typewriter lines
    const line1 = useTypewriter('Sabores Auténticos', 45, isInView)
    const line2 = useTypewriter('de Colombia', 45, line1.done)

    // Cursor logic: show cursor on line1 while typing, then on line2, then blink and hide
    const [showCursor1, setShowCursor1] = useState(true)
    const [showCursor2, setShowCursor2] = useState(false)

    useEffect(() => {
        if (line1.done && !line2.done) {
            setShowCursor1(false)
            setShowCursor2(true)
        }
    }, [line1.done, line2.done])

    useEffect(() => {
        if (line2.done) {
            setShowCursor2(true)
            const timeout = setTimeout(() => {
                setShowCursor2(false)
            }, 2000)
            return () => clearTimeout(timeout)
        }
    }, [line2.done])

    // Solo mostrar para usuarios no autenticados (guests)
    if (loading || user) {
        return null
    }

    // Obtener próximo día de entrega usando el scheduler centralizado
    const getNextDeliveryDay = () => {
        return defaultScheduler.formatDeliveryDate()
    }

    return (
        <div ref={ref}>
            {/* ========== MÓVIL: Imagen completa arriba, contenido abajo ========== */}
            <section className="md:hidden flex flex-col bg-verde-bosque-600">
                {/* Imagen completa sin recorte - optimizada */}
                <div className="relative w-full h-[40vh] bg-verde-bosque-600">
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
                <div className="bg-gradient-to-b from-verde-bosque-600 to-verde-bosque-700 px-4 py-6">
                    <div className="container mx-auto">
                        {/* Botones pequeños - Solo móvil */}
                        <div className="flex gap-2 mb-4">
                            <Link
                                href="/tienda?categoria=ofertas"
                                className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-2 rounded-full shadow-lg text-sm font-bold animate-pulse hover:animate-none hover:scale-105 transition-transform"
                            >
                                🔥 Ver Ofertas
                            </Link>

                            <Link
                                href="/recetas"
                                className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-700 text-white px-4 py-2 rounded-full shadow-lg text-sm font-bold hover:from-green-600 hover:to-green-800 hover:scale-105 transition-transform"
                            >
                                <ChefHat className="w-4 h-4" />
                                Recetas
                            </Link>
                        </div>

                        {/* Headline con Typewriter */}
                        <h1 className="text-4xl font-display font-bold text-white mb-3 leading-tight relative">
                            <span className="text-yellow-400">
                                {line1.displayed}
                                <Cursor show={showCursor1} />
                            </span>
                            <br />
                            <span>
                                {line2.displayed}
                                <Cursor show={showCursor2} />
                            </span>

                            {/* Decorative sparkles - mobile */}
                            <Sparkle className="top-[-8px] right-4 text-sm" delay={0} />
                            <Sparkle className="top-4 right-[-8px] text-xs" delay={1.2} />
                            <Sparkle className="bottom-2 left-2 text-xs" delay={2.4} />
                        </h1>

                        {/* Subheadline */}
                        <p className="text-lg text-white/90 mb-4 leading-relaxed">
                            Aguacates, frutas exóticas, aromáticas, especias y más. <strong className="text-yellow-400">Del campo a tu casa</strong>.
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

                        {/* CTAs con glow animado */}
                        <div className="flex flex-col gap-3 mb-6">
                            <GlowButton href="/tienda" mobile>
                                🛒 Ver Productos
                            </GlowButton>
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

                        {/* Headline con Typewriter */}
                        <h1 className="text-5xl lg:text-7xl font-display font-bold text-white mb-4 leading-tight relative">
                            <span className="text-yellow-400">
                                {line1.displayed}
                                <Cursor show={showCursor1} />
                            </span>
                            <br />
                            <span>
                                {line2.displayed}
                                <Cursor show={showCursor2} />
                            </span>

                            {/* Decorative sparkles - desktop */}
                            <Sparkle className="top-[-12px] right-8 text-xl" delay={0} />
                            <Sparkle className="top-8 right-[-16px] text-base" delay={0.8} />
                            <Sparkle className="top-[60%] left-[-20px] text-base" delay={1.6} />
                            <Sparkle className="bottom-[-8px] right-16 text-sm" delay={2.4} />
                            <Sparkle className="top-2 left-4 text-xs" delay={3.2} />
                        </h1>

                        {/* Subheadline */}
                        <p className="text-2xl lg:text-3xl text-white/90 mb-6 leading-relaxed">
                            Aguacates, frutas exóticas, hierbas aromáticas, especias y más.
                            Del campo colombiano a tu casa.
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

                        {/* CTAs con glow animado */}
                        <div className="flex gap-4 mb-8">
                            <GlowButton href="/tienda">
                                🛒 Ver Productos
                            </GlowButton>

                            <Link
                                href="/recetas"
                                className="group flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white px-8 py-4 rounded-full text-xl font-bold transition-all shadow-xl hover:shadow-2xl transform hover:scale-105 border-2 border-verde-aguacate"
                            >
                                <ChefHat className="w-6 h-6 text-white" />
                                Descubre Recetas
                            </Link>
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
        </div>
    )
}