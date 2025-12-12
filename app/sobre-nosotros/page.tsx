import { Metadata } from 'next';
import Image from 'next/image';
import { 
  Heart, 
  Users, 
  Award, 
  Truck, 
  Leaf, 
  Target,
  Eye,
  Lightbulb,
  CheckCircle
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sobre Nosotros | Tus Aguacates',
  description: 'Conoce la historia de Tus Aguacates, nuestra misión de llevar productos frescos del Eje Cafetero directamente a tu mesa.',
  keywords: 'sobre nosotros, historia, misión, visión, valores, Tus Aguacates, Eje Cafetero',
};

export default function SobreNosotrosPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-verde-bosque to-verde-aguacate text-white py-20 md:py-32">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="font-display font-bold text-4xl md:text-6xl mb-6">
              Sobre Nosotros
            </h1>
            <p className="text-xl md:text-2xl text-verde-aguacate-100 max-w-3xl mx-auto">
              Llevando el sabor auténtico del Eje Cafetero directamente a tu mesa, 
              con la frescura y calidad que mereces.
            </p>
          </div>
        </div>
      </section>

      {/* Nuestra Historia */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-display font-bold text-3xl md:text-4xl mb-6 text-verde-bosque">
                Nuestra Historia
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  Tus Aguacates nació de un sueño simple: conectar a los consumidores 
                  directamente con los agricultores del Eje Cafetero, eliminando intermediarios 
                  y garantizando la máxima frescura en cada producto.
                </p>
                <p>
                  Fundada en 2020, comenzamos como un pequeño proyecto familiar entregando 
                  aguacates de calidad excepcional a vecinos y amigos. Hoy, nos enorgullece 
                  ser el puente entre cientos de agricultores locales y miles de familias en Bogotá.
                </p>
                <p>
                  Cada producto que entregamos cuenta una historia de dedicación, trabajo duro 
                  y pasión por la tierra. No solo vendemos frutas y verduras, compartimos un 
                  pedazo del Eje Cafetero en cada hogar.
                </p>
              </div>
            </div>
            <div className="relative h-96 rounded-2xl overflow-hidden shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-verde-aguacate/20 to-verde-bosque/20"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Leaf className="w-24 h-24 text-verde-bosque mx-auto mb-4" />
                  <p className="text-2xl font-bold text-verde-bosque">Desde 2020</p>
                  <p className="text-gray-600">Llevando frescura a tu hogar</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Misión, Visión y Valores */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl md:text-4xl mb-4 text-verde-bosque">
              Nuestro Propósito
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Guiados por principios sólidos, trabajamos cada día para transformar 
              la forma en que accedes a productos frescos.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Misión */}
            <div className="text-center">
              <div className="w-20 h-20 bg-verde-aguacate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Target className="w-10 h-10 text-verde-aguacate" />
              </div>
              <h3 className="font-display font-bold text-2xl mb-4 text-verde-bosque">Misión</h3>
              <p className="text-gray-600">
                Conectar a los consumidores con productos frescos y de calidad del Eje Cafetero, 
                apoyando a los agricultores locales y garantizando la máxima satisfacción del cliente.
              </p>
            </div>

            {/* Visión */}
            <div className="text-center">
              <div className="w-20 h-20 bg-verde-aguacate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Eye className="w-10 h-10 text-verde-aguacate" />
              </div>
              <h3 className="font-display font-bold text-2xl mb-4 text-verde-bosque">Visión</h3>
              <p className="text-gray-600">
                Convertirnos en el referente nacional de distribución directa de productos 
                agrícolas, expandiendo nuestro modelo a más ciudades y categorías de productos.
              </p>
            </div>

            {/* Valores */}
            <div className="text-center">
              <div className="w-20 h-20 bg-verde-aguacate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-10 h-10 text-verde-aguacate" />
              </div>
              <h3 className="font-display font-bold text-2xl mb-4 text-verde-bosque">Valores</h3>
              <p className="text-gray-600">
                Frescura, calidad, honestidad y sostenibilidad en cada entrega. 
                Creemos en el comercio justo y en el poder de la comunidad.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Nuestros Valores en Detalle */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl md:text-4xl mb-4 text-verde-bosque">
              Los Valores que Nos Guían
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <CheckCircle className="w-12 h-12 text-verde-aguacate mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Calidad Superior</h3>
              <p className="text-gray-600 text-sm">
                Seleccionamos solo los mejores productos, garantizando frescura y sabor excepcionales.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <Users className="w-12 h-12 text-verde-aguacate mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Apoyo Local</h3>
              <p className="text-gray-600 text-sm">
                Trabajamos directamente con agricultores del Eje Cafetero, apoyando la economía local.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <Truck className="w-12 h-12 text-verde-aguacate mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Entrega Confiable</h3>
              <p className="text-gray-600 text-sm">
                Cumplimos nuestros compromisos de entrega con puntualidad y profesionalismo.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <Lightbulb className="w-12 h-12 text-verde-aguacate mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Innovación</h3>
              <p className="text-gray-600 text-sm">
                Buscamos constantemente nuevas formas de mejorar tu experiencia de compra.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Nuestro Impacto */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl md:text-4xl mb-4 text-verde-bosque">
              Nuestro Impacto
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Cada día trabajamos para generar un cambio positivo en nuestra comunidad y en el medio ambiente.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-verde-aguacate mb-2">150+</div>
              <p className="text-gray-600">Agricultores Apoyados</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-verde-aguacate mb-2">10,000+</div>
              <p className="text-gray-600">Familias Satisfechas</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-verde-aguacate mb-2">50+</div>
              <p className="text-gray-600">Productos Frescos</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-verde-aguacate mb-2">100%</div>
              <p className="text-gray-600">Garantía de Calidad</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 md:py-24 gradient-verde text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display font-bold text-3xl md:text-5xl mb-6">
            Únete a la Familia Tus Aguacates
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Descubre el sabor auténtico y la frescura inigualable de los productos 
           直接 del Eje Cafetero a tu mesa.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/tienda"
              className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-verde-bosque-700 hover:from-yellow-500 hover:to-yellow-700 font-bold px-8 py-4 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105 border-2 border-verde-aguacate"
            >
              Explorar Productos
            </a>
            <a
              href="/contacto"
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 font-bold px-8 py-4 rounded-xl transition-all border-2 border-white/50"
            >
              Contáctanos
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}