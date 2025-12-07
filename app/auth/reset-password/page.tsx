'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2, Check, X } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

// Logger para debug del flujo de recuperación
const logger = {
  log: (message: string, data?: any) => {
    console.log(`[RESET-PASSWORD DEBUG] ${message}`, data || '');
  },
  error: (message: string, error?: any) => {
    console.error(`[RESET-PASSWORD ERROR] ${message}`, error || '');
  },
  warn: (message: string, data?: any) => {
    console.warn(`[RESET-PASSWORD WARN] ${message}`, data || '');
  }
};

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [sessionInfo, setSessionInfo] = useState<any>(null);

  // Estados para validación en tiempo real
  const [passwordValid, setPasswordValid] = useState<boolean | null>(null);
  const [confirmPasswordValid, setConfirmPasswordValid] = useState<boolean | null>(null);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);

  // Prevenir doble ejecución en React StrictMode
  const isCheckingSession = useRef(false);

  // Validación de contraseña en tiempo real
  useEffect(() => {
    if (!passwordTouched) return;
    
    if (password === '') {
      setPasswordValid(null);
    } else if (password.length >= 6) {
      setPasswordValid(true);
    } else {
      setPasswordValid(false);
    }
  }, [password, passwordTouched]);

  // Validación de confirmación de contraseña en tiempo real
  useEffect(() => {
    if (!confirmPasswordTouched) return;
    
    if (confirmPassword === '') {
      setConfirmPasswordValid(null);
    } else if (confirmPassword === password && password.length >= 6) {
      setConfirmPasswordValid(true);
    } else {
      setConfirmPasswordValid(false);
    }
  }, [confirmPassword, password, confirmPasswordTouched]);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (!passwordTouched) setPasswordTouched(true);
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    if (!confirmPasswordTouched) setConfirmPasswordTouched(true);
  };

  useEffect(() => {
    // Prevenir doble ejecución en React StrictMode
    if (isCheckingSession.current) {
      logger.warn('useEffect ya se está ejecutando, previniendo doble ejecución');
      return;
    }

    isCheckingSession.current = true;
    logger.log('Iniciando verificación de sesión de recuperación de contraseña');

    async function checkSession() {
      try {
        // Log de la URL actual para debug
        const currentUrl = window.location.href;
        logger.log('URL actual:', currentUrl);

        // Verificar parámetros en la URL
        const token = searchParams.get('token');
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        logger.log('Parámetros URL:', { token, code, error, errorDescription });

        // Si hay error en los parámetros, mostrarlo
        if (error) {
          logger.error('Error detectado en parámetros URL:', { error, errorDescription });
          setError(`Error: ${errorDescription || error}`);
          setTokenValid(false);
          return;
        }

        // Verificar sesión actual con Supabase
        logger.log('Verificando sesión con Supabase...');
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          logger.error('Error al obtener sesión:', sessionError);
          setError('Error al verificar sesión de recuperación');
          setTokenValid(false);
          return;
        }

        logger.log('Datos de sesión obtenidos:', {
          hasSession: !!sessionData.session,
          user: sessionData.session?.user?.email,
          expiresAt: sessionData.session?.expires_at
        });

        setSessionInfo(sessionData.session);

        // Con PKCE, Supabase procesa automáticamente el token y establece sesión temporal
        if (sessionData.session) {
          logger.log('Sesión temporal detectada correctamente');
          setTokenValid(true);
        } else {
          // Si no hay sesión, verificar si hay token en URL (fallback para compatibilidad)
          if (token || code) {
            logger.log('No hay sesión activa pero hay token/código en URL, intentando procesar...');
            
            // Intentar verificar OTP si hay código
            if (code) {
              logger.log('Intentando verificar OTP con código...');
              // Para recuperación de contraseña con PKCE, no necesitamos verificar manualmente
              // Supabase maneja esto automáticamente cuando detectSessionInUrl está activado
              logger.warn('Con PKCE, el token debe ser procesado automáticamente por Supabase');
              logger.log('Esperando que Supabase procese el token automáticamente...');
              
              // Esperar un momento y verificar nuevamente la sesión
              setTimeout(async () => {
                const { data: retrySession } = await supabase.auth.getSession();
                if (retrySession.session) {
                  logger.log('Sesión establecida después del procesamiento automático');
                  setTokenValid(true);
                } else {
                  logger.error('No se pudo establecer sesión después del procesamiento');
                  setError('Enlace de recuperación inválido o expirado');
                  setTokenValid(false);
                }
              }, 2000);
            } else {
              logger.warn('No se pudo procesar el token - no hay sesión activa ni código válido');
              setError('Enlace de recuperación inválido o expirado');
              setTokenValid(false);
            }
          } else {
            logger.error('No hay token ni sesión válida');
            setError('Enlace de recuperación inválido o expirado');
            setTokenValid(false);
          }
        }
      } catch (err) {
        logger.error('Error inesperado en checkSession:', err);
        setError('Error inesperado al verificar enlace de recuperación');
        setTokenValid(false);
      } finally {
        isCheckingSession.current = false;
      }
    }

    checkSession();
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    logger.log('Iniciando proceso de actualización de contraseña');

    // Validaciones
    if (password !== confirmPassword) {
      logger.warn('Las contraseñas no coinciden');
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      logger.warn('Contraseña demasiado corta');
      setError('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      // Verificar nuevamente que tenemos una sesión activa
      logger.log('Verificando sesión antes de actualizar contraseña...');
      const { data: currentSession, error: sessionCheckError } = await supabase.auth.getSession();

      if (sessionCheckError) {
        logger.error('Error al verificar sesión actual:', sessionCheckError);
        throw sessionCheckError;
      }

      if (!currentSession.session) {
        logger.error('No hay sesión activa para actualizar contraseña');
        throw new Error('Tu sesión ha expirado. Por favor, solicita un nuevo enlace de recuperación.');
      }

      logger.log('Sesión verificada, actualizando contraseña...', {
        userEmail: currentSession.session.user.email,
        sessionExpiresAt: currentSession.session.expires_at
      });

      // Actualizar contraseña
      const { data: updateData, error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        logger.error('Error al actualizar contraseña:', updateError);
        throw updateError;
      }

      logger.log('Contraseña actualizada exitosamente:', {
        user: updateData.user?.email,
        timestamp: new Date().toISOString()
      });

      setSuccess(true);
      
      // Esperar 3 segundos antes de redirigir
      setTimeout(() => {
        logger.log('Redirigiendo a login...');
        router.push('/auth/login');
      }, 3000);
    } catch (err: any) {
      logger.error('Error en handleSubmit:', err);
      setError(err.message || 'Error al restablecer contraseña');
    } finally {
      setLoading(false);
    }
  }

  if (tokenValid === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-crema via-white to-verde-aguacate-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <Loader2 className="w-8 h-8 text-verde-bosque animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Verificando enlace de recuperación...</p>
          </div>
        </div>
      </div>
    );
  }

  if (tokenValid === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-crema via-white to-verde-aguacate-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="font-display font-bold text-2xl text-gray-900 mb-2">
              Enlace Inválido
            </h2>
            <p className="text-gray-600 mb-6">
              {error || 'El enlace de recuperación ha expirado o no es válido.'}
            </p>
            <div className="space-y-3">
              <Link
                href="/auth/forgot-password"
                className="block w-full bg-verde-bosque hover:bg-verde-bosque-600 text-white font-semibold py-3 rounded-lg transition-all text-center"
              >
                Solicitar nuevo enlace
              </Link>
              <Link
                href="/auth/login"
                className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg transition-all text-center"
              >
                Volver al inicio de sesión
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-crema via-white to-verde-aguacate-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="font-display font-bold text-2xl text-gray-900 mb-2">
              ¡Contraseña Restablecida!
            </h2>
            <p className="text-gray-600 mb-4">
              Tu contraseña ha sido actualizada exitosamente.
            </p>
            <p className="text-sm text-gray-500">
              Redirigiendo al inicio de sesión...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-crema via-white to-verde-aguacate-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-verde-bosque rounded-full mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-display font-bold text-3xl text-gray-900 mb-2">
              Nueva Contraseña
            </h1>
            <p className="text-gray-600">
              Establece tu nueva contraseña
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Nueva Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handlePasswordChange}
                  onBlur={() => setPasswordTouched(true)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className={`w-full pl-11 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-verde-bosque focus:border-transparent transition-all ${
                    passwordValid === true
                      ? 'border-green-500 bg-green-50'
                      : passwordValid === false
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300'
                  }`}
                  placeholder="••••••••"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {passwordTouched && passwordValid !== null && (
                    passwordValid ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <X className="w-5 h-5 text-red-600" />
                    )
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              {passwordTouched && passwordValid === false && (
                <p className="mt-1 text-sm text-red-600">La contraseña debe tener al menos 6 caracteres</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  onBlur={() => setConfirmPasswordTouched(true)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className={`w-full pl-11 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-verde-bosque focus:border-transparent transition-all ${
                    confirmPasswordValid === true
                      ? 'border-green-500 bg-green-50'
                      : confirmPasswordValid === false
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300'
                  }`}
                  placeholder="••••••••"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {confirmPasswordTouched && confirmPasswordValid !== null && (
                    confirmPasswordValid ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <X className="w-5 h-5 text-red-600" />
                    )
                  )}
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              {confirmPasswordTouched && confirmPasswordValid === false && (
                <p className="mt-1 text-sm text-red-600">
                  {password.length >= 6 ? 'Las contraseñas no coinciden' : 'La contraseña debe tener al menos 6 caracteres'}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-verde-bosque hover:bg-verde-bosque-600 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Actualizando contraseña...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  Restablecer Contraseña
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-gray-600">
            ¿Recordaste tu contraseña?{' '}
            <Link href="/auth/login" className="text-verde-bosque font-semibold hover:underline">
              Inicia sesión aquí
            </Link>
          </div>
        </div>

        {/* Back to Login */}
        <div className="mt-6 text-center">
          <Link href="/auth/login" className="text-gray-600 hover:text-verde-bosque transition-colors">
            ← Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-crema via-white to-verde-aguacate-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <Loader2 className="w-8 h-8 text-verde-bosque animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Cargando...</p>
          </div>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}