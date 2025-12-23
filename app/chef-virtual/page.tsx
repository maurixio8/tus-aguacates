import { Metadata } from 'next';
import { ChefHat, Sparkles } from 'lucide-react';
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
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-verde-bosque via-verde-aguacate to-emerald-600 text-white py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <ChefHat className="w-12 h-12 md:w-16 md:h-16" />
              <h1 className="text-3xl md:text-5xl font-bold">Chef Virtual</h1>
            </div>
            <p className="text-lg md:text-xl text-white/90 mb-4">
              Tu chef personal con IA. Dile qué ingredientes tienes y generará una receta única para ti.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm md:text-base text-white/80">
              <Sparkles className="w-5 h-5" />
              <span>Powered by DeepSeek AI</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          {!isAvailable ? (
            <div className="max-w-md mx-auto bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
              <ChefHat className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-yellow-900 mb-2">
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

      {/* How it works */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-8">
            ¿Cómo funciona?
          </h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-verde-aguacate/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🥑</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">1. Ingresa tus ingredientes</h3>
              <p className="text-gray-600 text-sm">
                Escribe o selecciona los ingredientes que tienes en casa
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-verde-aguacate/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✨</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">2. La IA crea tu receta</h3>
              <p className="text-gray-600 text-sm">
                Nuestro Chef Virtual genera una receta personalizada al instante
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-verde-aguacate/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🍽️</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">3. ¡A cocinar!</h3>
              <p className="text-gray-600 text-sm">
                Sigue los pasos y disfruta tu receta única
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
