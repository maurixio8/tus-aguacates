'use client';

import { useState, FormEvent } from 'react';
import { Loader2, CheckCircle, ArrowRight, Phone, Mail } from 'lucide-react';

interface B2BLeadFormProps {
  variant?: 'modal' | 'section';
  onSuccess?: () => void;
}

export function B2BLeadForm({ variant = 'section', onSuccess }: B2BLeadFormProps) {
  const [empresa, setEmpresa] = useState('');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [tipo, setTipo] = useState<'cotizar' | 'llamada'>('cotizar');
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/b2b/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empresa, nombre, telefono, email, tipo, mensaje }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al enviar solicitud');
      }

      setSuccess(true);
      onSuccess?.();

      // Reset después de 3 segundos
      setTimeout(() => {
        setSuccess(false);
        setEmpresa('');
        setNombre('');
        setTelefono('');
        setEmail('');
        setMensaje('');
      }, 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-12 px-6">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-dorado to-yellow-500 flex items-center justify-center shadow-lg shadow-dorado/20">
          <CheckCircle className="w-10 h-10 text-[#07180f]" />
        </div>
        <h3 className="text-2xl font-display font-bold text-white mb-3">
          ¡Solicitud enviada!
        </h3>
        <p className="text-white/70 text-lg max-w-md mx-auto">
          Gracias, {nombre}. Te contactaremos pronto para coordinar los detalles de tu pedido mayorista.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Empresa */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-white/80 mb-1.5">
            Empresa <span className="text-dorado">*</span>
          </label>
          <input
            type="text"
            value={empresa}
            onChange={(e) => setEmpresa(e.target.value)}
            required
            placeholder="Nombre de tu empresa o negocio"
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:border-dorado focus:ring-2 focus:ring-dorado/20 outline-none transition-all"
          />
        </div>

        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium text-white/80 mb-1.5">
            Tu nombre <span className="text-dorado">*</span>
          </label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            placeholder="Nombre completo"
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:border-dorado focus:ring-2 focus:ring-dorado/20 outline-none transition-all"
          />
        </div>

        {/* Teléfono */}
        <div>
          <label className="block text-sm font-medium text-white/80 mb-1.5">
            Teléfono <span className="text-dorado">*</span>
          </label>
          <input
            type="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            required
            placeholder="+57 300 000 0000"
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:border-dorado focus:ring-2 focus:ring-dorado/20 outline-none transition-all"
          />
        </div>

        {/* Email */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-white/80 mb-1.5">
            Correo electrónico
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="correo@empresa.com"
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:border-dorado focus:ring-2 focus:ring-dorado/20 outline-none transition-all"
          />
        </div>
      </div>

      {/* Tipo de solicitud */}
      <div>
        <label className="block text-sm font-medium text-white/80 mb-3">
          ¿Qué prefieres?
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setTipo('cotizar')}
            className={`relative px-6 py-4 rounded-xl border-2 transition-all text-left ${
              tipo === 'cotizar'
                ? 'border-dorado bg-dorado/10 text-dorado'
                : 'border-white/20 bg-white/5 text-white/70 hover:border-white/40'
            }`}
          >
            <div className="font-semibold text-lg">Cotizar</div>
            <div className="text-sm opacity-70 mt-0.5">
              Quiero precios y disponibilidad
            </div>
          </button>
          <button
            type="button"
            onClick={() => setTipo('llamada')}
            className={`relative px-6 py-4 rounded-xl border-2 transition-all text-left ${
              tipo === 'llamada'
                ? 'border-dorado bg-dorado/10 text-dorado'
                : 'border-white/20 bg-white/5 text-white/70 hover:border-white/40'
            }`}
          >
            <div className="font-semibold text-lg">Que me llamen</div>
            <div className="text-sm opacity-70 mt-0.5">
              Prefiero hablar con el equipo
            </div>
          </button>
        </div>
      </div>

      {/* Mensaje */}
      <div>
        <label className="block text-sm font-medium text-white/80 mb-1.5">
          Mensaje o productos de interés
        </label>
        <textarea
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          rows={3}
          placeholder="Ej: Aguacate Hass, cantidad aproximada, frecuencia..."
          className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:border-dorado focus:ring-2 focus:ring-dorado/20 outline-none transition-all resize-none"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-dorado to-yellow-500 hover:from-dorado/90 hover:to-yellow-500/90 text-[#07180f] font-bold px-8 py-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-dorado/30 transform hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Enviando...
          </>
        ) : tipo === 'cotizar' ? (
          <>
            <ArrowRight className="w-5 h-5" />
            Solicitar Cotización
          </>
        ) : (
          <>
            <Phone className="w-5 h-5" />
            Solicitar Llamada
          </>
        )}
      </button>

      <p className="text-center text-white/40 text-xs">
        Te contactaremos en menos de 24 horas. Sin compromiso.
      </p>
    </form>
  );
}
