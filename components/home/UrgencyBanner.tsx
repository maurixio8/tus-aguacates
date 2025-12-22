'use client'

import { useState, useEffect } from 'react'
import { Clock, Package, TrendingUp } from 'lucide-react'
import { defaultScheduler, DeliverySchedule } from '@/lib/services/delivery-scheduler'
import { defaultMessageEngine, RenderedMessage } from '@/lib/services/banner-message-engine'

export function UrgencyBanner() {
    const [deliverySchedule, setDeliverySchedule] = useState<DeliverySchedule | null>(null)
    const [viewing, setViewing] = useState(0)
    const [dynamicMessage, setDynamicMessage] = useState<RenderedMessage | null>(null)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)

        // Actualizar schedule de entregas
        const updateDeliverySchedule = () => {
            const schedule = defaultScheduler.getTimeRemaining()
            setDeliverySchedule(schedule)
        }

        updateDeliverySchedule()
        const deliveryTimer = setInterval(updateDeliverySchedule, 60000) // Actualizar cada minuto

        // Simular viewers activos (15-45 personas)
        const updateViewers = () => {
            setViewing(Math.floor(Math.random() * 30) + 15)
        }
        updateViewers()
        const viewTimer = setInterval(updateViewers, 5000)

        // Iniciar rotación de mensajes dinámicos
        const startMessageRotation = async () => {
            try {
                await defaultMessageEngine.startRotation((message: RenderedMessage) => {
                    setDynamicMessage(message)
                })
            } catch (error) {
                console.error('Error starting message rotation:', error)
                // Mensaje fallback en caso de error
                setDynamicMessage({
                    id: 'fallback',
                    text: 'Solo 23 cajas de aguacates disponibles hoy',
                    type: 'stock',
                    priority: 0,
                    variables: { stock: 23, product: 'aguacates' }
                })
            }
        }

        startMessageRotation()

        return () => {
            clearInterval(deliveryTimer)
            clearInterval(viewTimer)
        }
    }, [])

    // Formatear la fecha de entrega
    const formatDeliveryDate = () => {
        if (!deliverySchedule) return ''
        return defaultScheduler.formatDeliveryDate(deliverySchedule.nextDeliveryDate)
    }

    if (!mounted || !deliverySchedule || !dynamicMessage) {
        return (
            <div className="bg-gradient-to-r from-red-600 to-orange-500 text-white">
                <div className="container mx-auto px-4 py-3">
                    <div className="flex items-center justify-center">
                        <span>Cargando...</span>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-gradient-to-r from-red-600 to-orange-500 text-white">
            <div className="container mx-auto px-4 py-3">
                <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 text-sm md:text-base">
                    {/* Timer urgencia - Actualizado con nuevo scheduler */}
                    <div className="flex items-center gap-2">
                        <Clock className={`w-5 h-5 ${deliverySchedule.isUrgent ? 'animate-pulse' : ''}`} />
                        <span>
                            <strong>Ordena en {deliverySchedule.timeLeft}</strong> para entrega el {formatDeliveryDate()}
                        </span>
                    </div>

                    {/* Mensaje dinámico - Reemplaza "Solo 23 cajas disponibles" */}
                    <div className="hidden md:flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        <span>
                            <span dangerouslySetInnerHTML={{ __html: dynamicMessage.text.replace(/<strong>(.*?)<\/strong>/g, '<strong>$1</strong>') }} />
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
