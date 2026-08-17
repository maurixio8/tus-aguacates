'use client';

import { useEffect, useState } from 'react';
import { Store, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    // En Android/iOS la API de Credential Management puede lanzar
    // NotSupportedError síncrono y romper el render de Next.js
    // ("Application error: a client-side exception has occurred").
    // En móvil la omitimos por completo.
    const isMobile = typeof navigator !== 'undefined' &&
      /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');

    const restoreSavedCredential = async () => {
      try {
        if (isMobile) return;

        const credentialsApi = navigator.credentials as unknown as
          | {
              get?: (options?: unknown) => Promise<unknown>;
            }
          | undefined;
        if (!credentialsApi?.get) {
          return;
        }

        const credential = await credentialsApi.get({
          password: true,
          mediation: 'optional',
        } as CredentialRequestOptions & { password: boolean; mediation: CredentialMediationRequirement });

        if (cancelled || !credential) {
          return;
        }

        const passwordCredential = credential as Credential & { id?: string; password?: string };
        if (typeof passwordCredential.id === 'string' && passwordCredential.id) {
          setEmail((current) => current || passwordCredential.id || '');
        }
        if (typeof passwordCredential.password === 'string' && passwordCredential.password) {
          setPassword((current) => current || passwordCredential.password || '');
        }
      } catch (credentialError) {
        console.warn('No fue posible restaurar credenciales guardadas:', credentialError);
      }
    };

    void restoreSavedCredential();

    return () => {
      cancelled = true;
    };
  }, []);

  const persistCredential = async () => {
    try {
      const isMobile = typeof navigator !== 'undefined' &&
        /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');
      if (isMobile) return;

        const credentialsApi = navigator.credentials as unknown as
          | {
              store?: (credential: Credential) => Promise<void>;
            }
          | undefined;
      const PasswordCredentialCtor = (window as Window & {
        PasswordCredential?: new (init: {
          id: string;
          password: string;
          name?: string;
          iconURL?: string;
        }) => Credential;
      }).PasswordCredential;

      if (!credentialsApi?.store || !PasswordCredentialCtor || !email.trim() || !password) {
        return;
      }

      const credential = new PasswordCredentialCtor({
        id: email.trim(),
        password,
        name: 'Tus Aguacates Admin',
        iconURL: `${window.location.origin}/favicon.ico`,
      });

      await credentialsApi.store(credential);
    } catch (credentialError) {
      console.warn('No fue posible guardar la contraseña en el navegador:', credentialError);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // IMPORTANTE: NO usar trailing slash para evitar redirect 308 que pierde el body
      const response = await fetch('/api/auth/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success && data.user) {
        // Guardar datos del admin en localStorage
        localStorage.setItem('admin', JSON.stringify(data.user));
        await persistCredential();
        // Pequeño delay para asegurar que localStorage se sincroniza
        await new Promise(resolve => setTimeout(resolve, 100));
        // Usar window.location para forzar recarga completa
        window.location.href = '/admin';
        return;
      } else {
        setError(data.error || 'Error al iniciar sesión');
      }
    } catch (err) {
      console.error('Error de login:', err);
      setError('Error de conexión. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 px-4">
      <div className="w-full max-w-md">
        {/* Logo y título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-2xl shadow-lg mb-4">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Tus Aguacates</h1>
          <p className="text-gray-600 mt-1">Panel de Administración</p>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Iniciar Sesión</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" autoComplete="on" method="post">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                placeholder="correo@empresa.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all pr-12"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>

          {/* Mensaje de seguridad */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 text-center">
              <strong>Acceso restringido:</strong><br />
              Usa una cuenta administrativa autorizada.
            </p>
          </div>
        </div>

        {/* Link a la tienda */}
        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-sm text-gray-600 hover:text-green-600 transition-colors"
          >
            ← Volver a la tienda
          </a>
        </div>
      </div>
    </div>
  );
}
