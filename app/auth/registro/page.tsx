'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { UserPlus, Mail, Lock, User, AlertCircle, CheckCircle, Check, X } from 'lucide-react';
import Link from 'next/link';

export default function RegistroPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Estados para validación en tiempo real
  const [nameValid, setNameValid] = useState<boolean | null>(null);
  const [emailValid, setEmailValid] = useState<boolean | null>(null);
  const [passwordValid, setPasswordValid] = useState<boolean | null>(null);
  const [confirmPasswordValid, setConfirmPasswordValid] = useState<boolean | null>(null);
  const [nameTouched, setNameTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);

  // Validación de nombre en tiempo real
  useEffect(() => {
    if (!nameTouched) return;
    
    if (formData.fullName === '') {
      setNameValid(null);
    } else if (formData.fullName.length >= 3) {
      setNameValid(true);
    } else {
      setNameValid(false);
    }
  }, [formData.fullName, nameTouched]);

  // Validación de email en tiempo real
  useEffect(() => {
    if (!emailTouched) return;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email === '') {
      setEmailValid(null);
    } else if (emailRegex.test(formData.email)) {
      setEmailValid(true);
    } else {
      setEmailValid(false);
    }
  }, [formData.email, emailTouched]);

  // Validación de contraseña en tiempo real
  useEffect(() => {
    if (!passwordTouched) return;
    
    if (formData.password === '') {
      setPasswordValid(null);
    } else if (formData.password.length >= 6) {
      setPasswordValid(true);
    } else {
      setPasswordValid(false);
    }
  }, [formData.password, passwordTouched]);

  // Validación de confirmación de contraseña en tiempo real
  useEffect(() => {
    if (!confirmPasswordTouched) return;
    
    if (formData.confirmPassword === '') {
      setConfirmPasswordValid(null);
    } else if (formData.confirmPassword === formData.password && formData.password.length >= 6) {
      setConfirmPasswordValid(true);
    } else {
      setConfirmPasswordValid(false);
    }
  }, [formData.confirmPassword, formData.password, confirmPasswordTouched]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validaciones completas
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (formData.fullName.length < 3) {
      setError('El nombre debe tener al menos 3 caracteres');
      setLoading(false);
      return;
    }

    if (!emailRegex.test(formData.email)) {
      setError('Por favor, ingresa un correo electrónico válido');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    try {
      await signUp(formData.email, formData.password, formData.fullName);
      setSuccess(true);
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Error al registrar usuario');
    } finally {
      setLoading(false);
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    
    // Marcar como tocado el campo correspondiente
    switch (field) {
      case 'fullName':
        if (!nameTouched) setNameTouched(true);
        break;
      case 'email':
        if (!emailTouched) setEmailTouched(true);
        break;
      case 'password':
        if (!passwordTouched) setPasswordTouched(true);
        break;
      case 'confirmPassword':
        if (!confirmPasswordTouched) setConfirmPasswordTouched(true);
        break;
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-crema via-white to-verde-aguacate-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="font-display font-bold text-2xl text-gray-900 mb-2">
              ¡Registro Exitoso!
            </h2>
            <p className="text-gray-600 mb-4">
              Tu cuenta ha sido creada. Revisa tu correo para verificar tu cuenta.
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
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-display font-bold text-3xl text-gray-900 mb-2">
              Crear Cuenta
            </h1>
            <p className="text-gray-600">
              Únete a Tus Aguacates y disfruta de productos frescos
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
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-2">
                Nombre Completo
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <div className="relative">
                  <input
                    id="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    onBlur={() => setNameTouched(true)}
                    required
                    autoComplete="name"
                    className={`w-full pl-11 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-verde-bosque focus:border-transparent transition-all ${
                      nameValid === true
                        ? 'border-green-500 bg-green-50'
                        : nameValid === false
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-300'
                    }`}
                    placeholder="Juan Pérez"
                  />
                  {nameTouched && nameValid !== null && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {nameValid ? (
                        <Check className="w-5 h-5 text-green-600" />
                      ) : (
                        <X className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                  )}
                </div>
                {nameTouched && nameValid === false && (
                  <p className="mt-1 text-sm text-red-600">El nombre debe tener al menos 3 caracteres</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    onBlur={() => setEmailTouched(true)}
                    required
                    autoComplete="email"
                    className={`w-full pl-11 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-verde-bosque focus:border-transparent transition-all ${
                      emailValid === true
                        ? 'border-green-500 bg-green-50'
                        : emailValid === false
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-300'
                    }`}
                    placeholder="tu@ejemplo.com"
                  />
                  {emailTouched && emailValid !== null && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {emailValid ? (
                        <Check className="w-5 h-5 text-green-600" />
                      ) : (
                        <X className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                  )}
                </div>
                {emailTouched && emailValid === false && (
                  <p className="mt-1 text-sm text-red-600">Por favor, ingresa un correo electrónico válido</p>
                )}
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <div className="relative">
                  <input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    onBlur={() => setPasswordTouched(true)}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className={`w-full pl-11 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-verde-bosque focus:border-transparent transition-all ${
                      passwordValid === true
                        ? 'border-green-500 bg-green-50'
                        : passwordValid === false
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-300'
                    }`}
                    placeholder="••••••••"
                  />
                  {passwordTouched && passwordValid !== null && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {passwordValid ? (
                        <Check className="w-5 h-5 text-green-600" />
                      ) : (
                        <X className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                  )}
                </div>
                {passwordTouched && passwordValid === false && (
                  <p className="mt-1 text-sm text-red-600">La contraseña debe tener al menos 6 caracteres</p>
                )}
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    onBlur={() => setConfirmPasswordTouched(true)}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className={`w-full pl-11 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-verde-bosque focus:border-transparent transition-all ${
                      confirmPasswordValid === true
                        ? 'border-green-500 bg-green-50'
                        : confirmPasswordValid === false
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-300'
                    }`}
                    placeholder="••••••••"
                  />
                  {confirmPasswordTouched && confirmPasswordValid !== null && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {confirmPasswordValid ? (
                        <Check className="w-5 h-5 text-green-600" />
                      ) : (
                        <X className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                  )}
                </div>
                {confirmPasswordTouched && confirmPasswordValid === false && (
                  <p className="mt-1 text-sm text-red-600">
                    {formData.password.length >= 6 ? 'Las contraseñas no coinciden' : 'La contraseña debe tener al menos 6 caracteres'}
                  </p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-verde-bosque hover:bg-verde-bosque-600 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Creando cuenta...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Crear Cuenta
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-gray-600">
            ¿Ya tienes cuenta?{' '}
            <Link href="/auth/login" className="text-verde-bosque font-semibold hover:underline">
              Inicia sesión aquí
            </Link>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-gray-600 hover:text-verde-bosque transition-colors">
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
