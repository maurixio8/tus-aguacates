'use client'

import { Star, CheckCircle, Users } from 'lucide-react'
import Image from 'next/image'

const testimonials = [
    {
        name: "María González",
        location: "Chapinero, Bogotá",
        rating: 5,
        text: "Los aguacates más cremosos que he probado. Llegaron perfectos y súper frescos! Ya no compro en supermercado.",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria&backgroundColor=b6e3f4",
        verified: true
    },
    {
        name: "Carlos Ramírez",
        location: "Usaquén, Bogotá",
        rating: 5,
        text: "Compro cada semana desde hace 3 meses. La calidad es constante y el servicio excelente. 100% recomendados.",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos&backgroundColor=c0aede",
        verified: true
    },
    {
        name: "Ana Sofía Torres",
        location: "Suba, Bogotá",
        rating: 5,
        text: "Apoyo local y recibo productos frescos del campo. Win-win! Los aguacates duran toda la semana perfectos.",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=AnaSofia&backgroundColor=ffd5dc",
        verified: true
    }
]

export function Testimonials() {
    return (
        <section className="bg-gradient-to-b from-white to-verde-aguacate-50 py-16">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 bg-verde-aguacate-100 px-4 py-2 rounded-full mb-4">
                        <Users className="w-5 h-5 text-verde-aguacate" />
                        <span className="text-verde-aguacate font-semibold">
                            Lo que dicen nuestros clientes
                        </span>
                    </div>

                    <h2 className="font-display font-bold text-3xl md:text-4xl mb-4">
                        Más de 500 Familias Satisfechas
                    </h2>

                    {/* Rating general */}
                    <div className="flex justify-center items-center gap-2 mb-2">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                        ))}
                        <span className="text-xl font-bold ml-2">4.8/5</span>
                    </div>
                    <p className="text-gray-600">Basado en 234 reseñas verificadas</p>
                </div>

                {/* Testimonios Grid */}
                <div className="grid md:grid-cols-3 gap-6 md:gap-8">
                    {testimonials.map((testimonial, i) => (
                        <div
                            key={i}
                            className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow relative border border-gray-100"
                        >
                            {/* Badge verificado */}
                            {testimonial.verified && (
                                <div className="absolute top-4 right-4 flex items-center gap-1 text-verde-aguacate text-sm">
                                    <CheckCircle className="w-4 h-4" />
                                    <span className="hidden sm:inline">Verificado</span>
                                </div>
                            )}

                            {/* Estrellas */}
                            <div className="flex mb-4">
                                {[...Array(testimonial.rating)].map((_, j) => (
                                    <Star key={j} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                ))}
                            </div>

                            {/* Texto del testimonio */}
                            <p className="text-gray-700 mb-6 leading-relaxed">
                                &ldquo;{testimonial.text}&rdquo;
                            </p>

                            {/* Avatar y nombre */}
                            <div className="flex items-center gap-3">
                                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-100">
                                    <Image
                                        src={testimonial.avatar}
                                        fill
                                        className="object-cover"
                                        alt={testimonial.name}
                                        unoptimized // SVG de dicebear no necesita optimización
                                    />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                                    <p className="text-sm text-gray-600">{testimonial.location}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* CTA adicional */}
                <div className="text-center mt-10">
                    <p className="text-gray-600 mb-4">
                        ¿Ya probaste nuestros aguacates?
                    </p>
                    <a
                        href="https://wa.me/573042582777?text=Hola!%20Quiero%20dejar%20mi%20reseña%20🥑"
                        className="inline-flex items-center gap-2 text-verde-aguacate hover:text-verde-aguacate-600 font-semibold transition-colors"
                    >
                        💬 Cuéntanos tu experiencia
                    </a>
                </div>
            </div>
        </section>
    )
}
