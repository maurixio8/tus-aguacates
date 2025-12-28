'use client';

import { ChefHat, X } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

interface AuthRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthRequiredModal({ isOpen, onClose }: AuthRequiredModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative animate-in fade-in slide-in-from-bottom-4 duration-300">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-verde-aguacate to-verde-bosque rounded-full mb-4">
            <ChefHat className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            ¡Regístrate para Guardar tus Recetas!
          </h2>
          <p className="text-gray-600 text-sm">
            Crea una cuenta gratuita para guardar las recetas que generes con nuestro Chef Virtual y poder verlas cuando quieras.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/auth/login?redirectTo=/chef-virtual"
            onClick={onClose}
            className="block w-full bg-gradient-to-r from-verde-aguacate to-verde-bosque text-white text-center font-semibold py-3 rounded-xl hover:shadow-lg transition-all"
          >
            Iniciar Sesión
          </Link>
          <Link
            href="/auth/signup?redirectTo=/chef-virtual"
            onClick={onClose}
            className="block w-full border-2 border-verde-aguacate text-verde-bosque text-center font-semibold py-3 rounded-xl hover:bg-verde-aguacate/10 transition-all"
          >
            Crear Cuenta Gratis
          </Link>
        </div>

        <p className="mt-4 text-center text-xs text-gray-500">
          Solo toma 30 segundos y es completamente gratis
        </p>
      </div>
    </div>
  );
}
