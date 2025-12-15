'use client'

import { useState, useEffect } from 'react'
import { Clock, Package, TrendingUp } from 'lucide-react'

export function UrgencyBanner() {
    const [timeLeft, setTimeLeft] = useState('')
    const [viewing, setViewing] = useState(0)

    useEffect(() => {
        // Timer para 8PM (hora de corte de pedidos)
        const updateTimer = () => {
            const now = new Date()
            const deadline = new Date()
            deadline.setHours(20, 0, 0, 0)

            if (now > deadline) {
                deadline.setDate(deadline.getDate() + 1)
            }

            const diff = deadline.getTime() - now.getTime()
            const hours = Math.floor(diff / (1000 * 60 * 60))
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

            setTimeLeft(`${hours}h ${minutes}m`)
        }

        updateTimer()
        const timer = setInterval(updateTimer, 60000) // Actualizar cada minuto

        // Simular viewers activos (15-45 personas)
        const updateViewers = () => {
            setViewing(Math.floor(Math.random() * 30) + 15)
        }
        updateViewers()
        const viewTimer = setInterval(updateViewers, 5000)

        return () => {
            clearInterval(timer)
            clearInterval(viewTimer)
        }
    }, [])

    // Calcular próximo día de entrega (martes o viernes)
    const getNextDeliveryDay = () => {
        const now = new Date()
        const dayOfWeek = now.getDay()
        const hour = now.getHours()

        // Martes = 2, Viernes = 5
        let daysUntilDelivery: number

        if (dayOfWeek === 0) { // Domingo
            daysUntilDelivery = 2 // Martes
        } else if (dayOfWeek === 1) { // Lunes
            daysUntilDelivery = 1 // Martes
        } else if (dayOfWeek === 2) { // Martes
            daysUntilDelivery = hour < 20 ? 0 : 3 // Hoy o viernes
        } else if (dayOfWeek === 3) { // Miércoles
            daysUntilDelivery = 2 // Viernes
        } else if (dayOfWeek === 4) { // Jueves
            daysUntilDelivery = 1 // Viernes
        } else if (dayOfWeek === 5) { // Viernes
            daysUntilDelivery = hour < 20 ? 0 : 4 // Hoy o martes
        } else { // Sábado
            daysUntilDelivery = 3 // Martes
        }

        const deliveryDate = new Date(now)
        deliveryDate.setDate(now.getDate() + daysUntilDelivery)

        const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'short' }
        return deliveryDate.toLocaleDateString('es-CO', options)
    }

    return (
        <div className="bg-gradient-to-r from-red-600 to-orange-500 text-white">
            <div className="container mx-auto px-4 py-3">
                <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 text-sm md:text-base">
                    {/* Timer urgencia */}
                    <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 animate-pulse" />
                        <span>
                            <strong>Ordena en {timeLeft}</strong> para entrega el {getNextDeliveryDay()}
                        </span>
                    </div>

                    {/* Stock limitado - Solo desktop */}
                    <div className="hidden md:flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        <span>
                            Solo <strong>23 cajas</strong> disponibles hoy
                        </span>
                    </div>

                    {/* Viewers activos - Solo desktop */}
                    <div className="hidden lg:flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        <span>
                            <strong>{viewing} personas</strong> viendo ahora
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}
