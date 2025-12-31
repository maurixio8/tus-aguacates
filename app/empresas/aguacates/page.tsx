'use client';

import { ChevronLeft, Phone, Package, Scale, Truck } from 'lucide-react';
import Link from 'next/link';
import { AguacateConfigurator } from '@/components/b2b/AguacateConfigurator';
import { AGUACATES_CONFIG, MADUREZ_INFO, VOLUMENES_DESCUENTO } from '@/lib/b2b/aguacates-config';

export default function EmpresasAguacatesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <div className="relative bg-gradient-to-r from-verde-bosque via-verde-aguacate to-verde-bosque text-white py-12 md:py-16">
        <div className="container mx-auto px-4">
          {/* Boton volver */}
          <Link
            href="/empresas"
            className="inline-flex items-center gap-1 text-white/80 hover:text-white mb-6 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Volver al Catalogo
          </Link>

          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-5xl">🥑</span>
              <div>
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold">
                  Venta Mayorista
                </span>
              </div>
            </div>

            <h1 className="font-display font-bold text-3xl md:text-5xl mb-4">
              Aguacates para Empresas
            </h1>

            <p className="text-lg text-white/80 max-w-2xl mb-6">
              Configura tu pedido seleccionando variedad, calibre y estado de madurez.
              Precios por volumen con descuentos automaticos.
            </p>

            {/* Stats rapidos */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                <Package className="w-5 h-5" />
                <span>4 Variedades</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                <Scale className="w-5 h-5" />
                <span>3 Calibres</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                <Truck className="w-5 h-5" />
                <span>Envio gratis +$100k</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna principal: Configurador */}
          <div className="lg:col-span-2">
            <AguacateConfigurator />
          </div>

          {/* Sidebar: Info adicional */}
          <div className="space-y-6">
            {/* Guia de variedades */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <span>🥑</span>
                Guia de Variedades
              </h3>
              <div className="space-y-4">
                {Object.values(AGUACATES_CONFIG).map((v) => (
                  <div key={v.id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                    <div className="font-semibold">{v.nombre}</div>
                    <p className="text-sm text-gray-600">{v.descripcion}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Guia de madurez */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <span>⏱️</span>
                Estados de Madurez
              </h3>
              <div className="space-y-3">
                {Object.entries(MADUREZ_INFO).map(([key, info]) => (
                  <div key={key} className="flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-full ${info.colorBg}`}></span>
                    <div>
                      <div className="font-medium">{info.nombre}</div>
                      <div className="text-sm text-gray-500">{info.diasParaConsumo}</div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-4">
                * El precio aumenta segun el estado de madurez debido a la perdida de peso por deshidratacion.
              </p>
            </div>

            {/* Descuentos por volumen */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Scale className="w-5 h-5 text-verde-bosque" />
                Descuentos por Volumen
              </h3>
              <div className="space-y-2">
                {VOLUMENES_DESCUENTO.map((vol) => (
                  <div
                    key={vol.nombre}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="font-medium">{vol.nombre}</span>
                    <span className={`font-semibold ${vol.descuento > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                      {vol.descuento === 0 ? 'Precio base' : `-${vol.descuento}%`}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Contacto directo */}
            <div className="bg-gradient-to-br from-verde-bosque to-verde-aguacate text-white rounded-xl shadow-lg p-6">
              <h3 className="font-semibold text-lg mb-3">¿Necesitas ayuda?</h3>
              <p className="text-white/80 text-sm mb-4">
                Contactanos directamente para pedidos especiales o consultas.
              </p>
              <a
                href="https://wa.me/573042582777?text=Hola,%20quiero%20cotizar%20aguacates%20para%20mi%20empresa"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-white text-verde-bosque font-semibold py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span>💬</span>
                WhatsApp Empresas
              </a>
              <a
                href="tel:+573042582777"
                className="flex items-center justify-center gap-2 mt-3 text-white/90 hover:text-white transition-colors"
              >
                <Phone className="w-4 h-4" />
                +57 304 258 2777
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Informacion adicional */}
      <div className="bg-white border-t">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-display font-bold text-2xl mb-4">
              ¿Por que elegirnos para tu negocio?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="p-6">
                <div className="text-4xl mb-3">🚚</div>
                <h3 className="font-semibold mb-2">Entrega Rapida</h3>
                <p className="text-sm text-gray-600">
                  Coordinamos entregas segun las necesidades de tu operacion.
                </p>
              </div>
              <div className="p-6">
                <div className="text-4xl mb-3">🌿</div>
                <h3 className="font-semibold mb-2">Frescura Garantizada</h3>
                <p className="text-sm text-gray-600">
                  Directo del Eje Cafetero a tu cocina, sin intermediarios.
                </p>
              </div>
              <div className="p-6">
                <div className="text-4xl mb-3">💰</div>
                <h3 className="font-semibold mb-2">Precios Competitivos</h3>
                <p className="text-sm text-gray-600">
                  Descuentos por volumen y precios actualizados semanalmente.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
