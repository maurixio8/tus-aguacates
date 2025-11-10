'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verificando tu cuenta...');

  useEffect(() => {
    async function handleCallback() {
      try {
        // Obtener el hash fragment de la URL
        const hashFragment = window.location.hash;

        if (hashFragment && hashFragment.length > 0) {
          // Intercambiar el código por una sesión
          const { data, error } = await supabase.auth.exchangeCodeForSession(hashFragment);

          if (error) {
            throw error;
          }

          if (data.session) {
            setStatus('success');
            setMessage('¡Cuenta verificada exitosamente!');
            
            // Redirigir después de 2 segundos
            setTimeout(() => {
              router.push('/cuenta');
            }, 2000);
            return;
          }
        }

        // Si llegamos aquí, algo salió mal
        throw new Error('No se encontró sesión');
      } catch (error: any) {
        console.error('Error en callback:', error);
        setStatus('error');
        setMessage(error.message || 'Error al verificar la cuenta');
        
        // Redirigir al login después de 3 segundos
        setTimeout(() => {
          router.push('/auth/login?error=' + encodeURIComponent(error.message));
        }, 3000);
      }
    }

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-crema via-white to-verde-aguacate-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {status === 'loading' && (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-verde-aguacate-100 rounded-full mb-4">
                <Loader2 className="w-8 h-8 text-verde-aguacate animate-spin" />
              </div>
              <h2 className="font-display font-bold text-2xl text-gray-900 mb-2">
                Verificando...
              </h2>
              <p className="text-gray-600">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="font-display font-bold text-2xl text-gray-900 mb-2">
                ¡Verificación Exitosa!
              </h2>
              <p className="text-gray-600 mb-4">{message}</p>
              <p className="text-sm text-gray-500">
                Redirigiendo a tu cuenta...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="font-display font-bold text-2xl text-gray-900 mb-2">
                Error de Verificación
              </h2>
              <p className="text-gray-600 mb-4">{message}</p>
              <p className="text-sm text-gray-500">
                Redirigiendo al inicio de sesión...
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
