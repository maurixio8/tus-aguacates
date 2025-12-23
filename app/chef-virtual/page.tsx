import { Metadata } from 'next';
import { ChefHat, Sparkles, Wand2, Clock, UtensilsCrossed } from 'lucide-react';
import { ChefVirtualGenerator } from './generator';
import { isChefVirtualAvailable } from '@/lib/gemini-recipe-service';

export const metadata: Metadata = {
  title: 'Chef Virtual | Tus Aguacates',
  description: 'El Chef Virtual genera recetas personalizadas basadas en los ingredientes que tienes en casa. ¡Dile qué ingredientes tienes y obtén una receta única!',
  openGraph: {
    title: 'Chef Virtual | Tus Aguacates',
    description: 'Genera recetas personalizadas con IA usando los ingredientes que tienes en casa.',
    type: 'website',
  },
};

export default async function ChefVirtualPage() {
  const isAvailable = isChefVirtualAvailable();

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-emerald-50/20">
      {/* Hero Section con animaciones */}
      <section className="relative bg-gradient-to-br from-verde-bosque via-verde-aguacate to-emerald-600 text-white py-16 md:py-20 overflow-hidden">
        {/* Decoración de fondo animada */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-300 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-48 h-48 bg-green-300 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex items-center justify-center gap-3 mb-6 animate-bounce">
              <ChefHat className="w-14 h-14 md:w-20 md:h-20 drop-shadow-2xl" />
              <h1 className="text-4xl md:text-6xl font-bold drop-shadow-lg">Chef Virtual</h1>
            </div>
            <p className="text-xl md:text-2xl text-white/95 mb-6 leading-relaxed">
              Tu chef personal con IA. Dile qué ingredientes tienes y generará una receta única para ti.
            </p>
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/20 backdrop-blur-sm rounded-full border-2 border-white/30 shadow-xl">
              <Sparkles className="w-6 h-6 text-yellow-300 animate-spin-slow" />
              <span className="font-semibold">IA de Tus Aguacates</span>
            </div>

            {/* Stats animados */}
            <div className="mt-10 grid grid-cols-3 gap-4 max-w-lg mx-auto">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 border border-white/30">
                <div className="text-3xl font-bold">∞</div>
                <div className="text-xs text-white/80">Recetas posibles</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 border border-white/30">
                <div className="text-3xl font-bold">2</div>
                <div className="text-xs text-white/80">Gratis al día</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 border border-white/30">
                <div className="text-3xl font-bold">30s</div>
                <div className="text-xs text-white/80">Tiempo promedio</div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave SVG divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="url(#gradient0)"/>
            <defs>
              <linearGradient id="gradient0" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(249,250,251,0)" />
                <stop offset="100%" stopColor="#f9fafb" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8 md:py-12 -mt-4 relative z-10">
        <div className="container mx-auto px-4">
          {!isAvailable ? (
            <div className="max-w-md mx-auto bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-8 text-center shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
              <ChefHat className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-yellow-900 mb-3">
                Chef Virtual no disponible
              </h2>
              <p className="text-yellow-800">
                El servicio de Chef Virtual no está configurado. Por favor contacta al administrador.
              </p>
            </div>
          ) : (
            <ChefVirtualGenerator />
          )}
        </div>
      </section>

      {/* How it works - Con animaciones */}
      <section className="py-16 bg-white relative overflow-hidden">
        {/* Decoración de fondo */}
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
          <div className="absolute top-20 left-20 w-40 h-40 bg-verde-aguacate rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-60 h-60 bg-naranja-frutal rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
            ¿Cómo funciona?
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Es muy fácil generar recetas deliciosas con nuestra inteligencia artificial
          </p>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Paso 1 */}
            <div className="group text-center p-6 rounded-3xl hover:bg-gradient-to-br hover:from-verde-aguacate/5 hover:to-emerald-50 transition-all duration-500 hover:shadow-xl hover:-translate-y-2">
              <div className="w-20 h-20 bg-gradient-to-br from-verde-aguacate/20 to-verde-bosque/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                <span className="text-5xl group-hover:scale-110 transition-transform duration-300">🥑</span>
              </div>
              <div className="w-10 h-10 bg-verde-aguacate text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg shadow-lg">
                1
              </div>
              <h3 className="font-bold text-gray-900 mb-3 text-xl">Ingresa tus ingredientes</h3>
              <p className="text-gray-600 leading-relaxed">
                Selecciona los ingredientes que tienes en casa. Puedes elegir de nuestra lista o escribir los tuyos.
              </p>
            </div>

            {/* Paso 2 */}
            <div className="group text-center p-6 rounded-3xl hover:bg-gradient-to-br hover:from-verde-aguacate/5 hover:to-emerald-50 transition-all duration-500 hover:shadow-xl hover:-translate-y-2">
              <div className="w-20 h-20 bg-gradient-to-br from-verde-aguacate/20 to-verde-bosque/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                <span className="text-5xl group-hover:scale-110 transition-transform duration-300">✨</span>
              </div>
              <div className="w-10 h-10 bg-verde-aguacate text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg shadow-lg">
                2
              </div>
              <h3 className="font-bold text-gray-900 mb-3 text-xl">La IA crea tu receta</h3>
              <p className="text-gray-600 leading-relaxed">
                Nuestro Chef Virtual genera una receta personalizada y única al instante con todos los pasos.
              </p>
            </div>

            {/* Paso 3 */}
            <div className="group text-center p-6 rounded-3xl hover:bg-gradient-to-br hover:from-verde-aguacate/5 hover:to-emerald-50 transition-all duration-500 hover:shadow-xl hover:-translate-y-2">
              <div className="w-20 h-20 bg-gradient-to-br from-verde-aguacate/20 to-verde-bosque/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                <span className="text-5xl group-hover:scale-110 transition-transform duration-300">🍽️</span>
              </div>
              <div className="w-10 h-10 bg-verde-aguacate text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg shadow-lg">
                3
              </div>
              <h3 className="font-bold text-gray-900 mb-3 text-xl">¡A cocinar!</h3>
              <p className="text-gray-600 leading-relaxed">
                Sigue los pasos detallados, disfruta tu receta única y compártela con tus amigos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features section */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-green-50/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            ¿Por qué usar nuestro Chef Virtual?
          </h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-gray-100 hover:border-verde-aguacate/50 transition-all duration-300 hover:shadow-xl">
              <Wand2 className="w-12 h-12 text-verde-aguacate mb-4" />
              <h3 className="font-bold text-gray-900 mb-2 text-lg">100% Personalizado</h3>
              <p className="text-gray-600 text-sm">
                Cada receta se crea específicamente para los ingredientes que tienes en casa.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-gray-100 hover:border-verde-aguacate/50 transition-all duration-300 hover:shadow-xl">
              <Clock className="w-12 h-12 text-verde-aguacate mb-4" />
              <h3 className="font-bold text-gray-900 mb-2 text-lg">Rápido y Fácil</h3>
              <p className="text-gray-600 text-sm">
                Recetas listas en segundos, optimizadas para prepararse en 30 minutos o menos.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-gray-100 hover:border-verde-aguacate/50 transition-all duration-300 hover:shadow-xl">
              <UtensilsCrossed className="w-12 h-12 text-verde-aguacate mb-4" />
              <h3 className="font-bold text-gray-900 mb-2 text-lg">Recetas Deliciosas</h3>
              <p className="text-gray-600 text-sm">
                Nuestra IA está entrenada para crear recetas colombinas y latinoamericanas deliciosas.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
