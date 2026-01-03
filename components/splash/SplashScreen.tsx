'use client';

import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
  variant: 'tienda' | 'empresas';
}

export function SplashScreen({ onComplete, variant }: SplashScreenProps) {
  const [mounted, setMounted] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Timeout automático máximo 3 segundos
    const timeout = setTimeout(() => {
      handleComplete();
    }, 3000);

    return () => clearTimeout(timeout);
  }, []);

  const handleComplete = () => {
    setFadeOut(true);
    setTimeout(() => {
      onComplete();
    }, 500); // Wait for fade out animation
  };

  // Configuración según variante
  const isTienda = variant === 'tienda';
  const gradientFrom = isTienda ? 'from-verde-bosque' : 'from-verde-bosque';
  const gradientTo = isTienda ? 'to-verde-aguacate' : 'to-naranja-frutal';

  // Elementos flotantes según variante
  const floatingElements = isTienda
    ? ['🥑', '🍋', '🍊', '🍓', '🥝', '🥕']
    : ['🥑', '🥑', '🥑', '🥑', '🥑', '🥑'];

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br ${gradientFrom} ${gradientTo} transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '30px 30px',
        }}
      />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4">
        {/* Logo animado */}
        <div className={`mb-16 ${mounted ? 'animate-logo-appear' : 'opacity-0'}`}>
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-white/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '2s' }} />

            {/* Logo container - Logo más grande */}
            <div className="relative w-64 h-64 md:w-80 md:h-80">
              <img
                src="https://i.ibb.co/WWj50Qdy/logo.png"
                alt="Tus Aguacates"
                className="w-full h-full object-contain drop-shadow-2xl"
              />
            </div>

            {/* Icono de variantes */}
            {mounted && (
              <div className="absolute -bottom-4 -right-4 md:-bottom-6 md:-right-6 text-4xl md:text-6xl animate-float-in">
                {isTienda ? '🍃' : '🏢'}
              </div>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className={`w-64 md:w-80 ${mounted ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.7s' }}>
          <div className="h-1 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-naranja-frutal via-dorado to-naranja-frutal animate-progress-bar rounded-full" />
          </div>
        </div>
      </div>

      {/* Floating elements */}
      {mounted && floatingElements.map((emoji, index) => (
        <div
          key={index}
          className="absolute text-4xl md:text-6xl animate-float-splash opacity-40"
          style={{
            top: `${10 + Math.random() * 80}%`,
            left: `${5 + Math.random() * 90}%`,
            animationDuration: `${2 + Math.random() * 2}s`,
            animationDelay: `${Math.random() * 1}s`,
            animationIterationCount: 'infinite',
          }}
        >
          {emoji}
        </div>
      ))}

      {/* Custom animations */}
      <style jsx>{`
        @keyframes logo-appear {
          0% {
            opacity: 0;
            transform: scale(0.3) rotate(-15deg);
          }
          60% {
            opacity: 1;
            transform: scale(1.1) rotate(2deg);
          }
          100% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
        }

        @keyframes fade-in-up {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float-in {
          0% {
            opacity: 0;
            transform: scale(0) rotate(-180deg);
          }
          60% {
            transform: scale(1.2) rotate(10deg);
          }
          100% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
        }

        @keyframes progress-bar {
          0% {
            width: 0%;
          }
          100% {
            width: 100%;
          }
        }

        @keyframes float-splash {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(5deg);
          }
        }

        .animate-logo-appear {
          animation: logo-appear 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }

        .animate-float-in {
          animation: float-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .animate-progress-bar {
          animation: progress-bar 2.5s ease-out forwards;
        }

        .animate-float-splash {
          animation: float-splash ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
