'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, Check, Info, Scale, Calendar, Package } from 'lucide-react';
import {
  AGUACATES_CONFIG,
  MADUREZ_INFO,
  VOLUMENES_DESCUENTO,
  getCalibresDisponibles,
  calcularPrecioTotal,
  formatearRangoPeso,
  type AguacateVariedad,
  type AguacateCalibre,
  type AguacateMadurez,
} from '@/lib/b2b/aguacates-config';
import { useBusinessCartStore } from '@/lib/business-cart-store';
import { formatPrice } from '@/lib/utils';

interface AguacateConfiguratorProps {
  onAddToCart?: () => void;
}

export function AguacateConfigurator({ onAddToCart }: AguacateConfiguratorProps) {
  // Estado de seleccion
  const [variedad, setVariedad] = useState<AguacateVariedad | null>(null);
  const [calibre, setCalibre] = useState<AguacateCalibre | null>(null);
  const [madurez, setMadurez] = useState<AguacateMadurez>('verde');
  const [cantidad, setCantidad] = useState<number>(5);
  const [agregado, setAgregado] = useState(false);

  const { addItem } = useBusinessCartStore();

  // Calibres disponibles para la variedad seleccionada
  const calibresDisponibles = variedad ? getCalibresDisponibles(variedad) : [];

  // Reset calibre cuando cambia la variedad
  useEffect(() => {
    if (variedad) {
      const calibres = getCalibresDisponibles(variedad);
      // Seleccionar "primera" por defecto si esta disponible
      if (calibres.includes('primera')) {
        setCalibre('primera');
      } else if (calibres.length > 0) {
        setCalibre(calibres[0]);
      } else {
        setCalibre(null);
      }
    }
  }, [variedad]);

  // Calcular precio
  const precioCalculado = variedad && calibre
    ? calcularPrecioTotal(variedad, calibre, madurez, cantidad)
    : null;

  // Obtener info del calibre seleccionado
  const calibreInfo = variedad && calibre
    ? AGUACATES_CONFIG[variedad].calibres[calibre]
    : null;

  // Manejar agregar al carrito
  const handleAgregarCarrito = () => {
    if (!variedad || !calibre || !precioCalculado) return;

    const config = AGUACATES_CONFIG[variedad];
    const calibreConfig = config.calibres[calibre];

    // Crear producto para el carrito
    const producto = {
      id: `aguacate-${variedad}-${calibre}-${madurez}`,
      name: `${config.nombreCompleto} ${calibreConfig?.nombre} ${MADUREZ_INFO[madurez].nombre}`,
      slug: `aguacate-${variedad}-${calibre}-${madurez}`,
      price: precioCalculado.precioKgConDescuento,
      category: 'Aguacates B2B',
      image: config.imagen || '/categories/aguacates.jpg',
      description: `${config.descripcion} - Calibre ${calibreConfig?.nombre}`,
      unit: 'kg',
    };

    addItem(producto as any, cantidad, 'kg');

    setAgregado(true);
    setTimeout(() => setAgregado(false), 2000);

    if (onAddToCart) {
      onAddToCart();
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-verde-bosque text-white p-6">
        <h2 className="font-display font-bold text-2xl flex items-center gap-2">
          <span>🥑</span>
          Configurador de Aguacates B2B
        </h2>
        <p className="text-white/80 mt-1">
          Selecciona variedad, calibre y madurez para tu pedido mayorista
        </p>
      </div>

      <div className="p-6 space-y-8">
        {/* PASO 1: Variedad */}
        <div>
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-verde-bosque text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
            Variedad de Aguacate
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.values(AGUACATES_CONFIG).map((v) => (
              <button
                key={v.id}
                onClick={() => setVariedad(v.id)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  variedad === v.id
                    ? 'border-verde-bosque bg-verde-bosque/5 shadow-md'
                    : 'border-gray-200 hover:border-verde-bosque/50 hover:bg-gray-50'
                }`}
              >
                <div className="text-2xl mb-2">🥑</div>
                <div className="font-semibold">{v.nombre}</div>
                <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                  {v.descripcion}
                </div>
                {variedad === v.id && (
                  <div className="mt-2">
                    <Check className="w-5 h-5 text-verde-bosque" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* PASO 2: Calibre/Calidad */}
        {variedad && (
          <div className="animate-fadeIn">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-verde-bosque text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
              Calibre (Calidad)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {calibresDisponibles.map((cal) => {
                const calInfo = AGUACATES_CONFIG[variedad].calibres[cal];
                if (!calInfo) return null;

                return (
                  <button
                    key={cal}
                    onClick={() => setCalibre(cal)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      calibre === cal
                        ? 'border-verde-bosque bg-verde-bosque/5 shadow-md'
                        : 'border-gray-200 hover:border-verde-bosque/50 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-lg">{calInfo.nombre}</span>
                      {calibre === cal && <Check className="w-5 h-5 text-verde-bosque" />}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <Scale className="w-4 h-4" />
                      <span>{formatearRangoPeso(calInfo)}</span>
                    </div>
                    <p className="text-xs text-gray-500">{calInfo.descripcion}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* PASO 3: Madurez */}
        {variedad && calibre && (
          <div className="animate-fadeIn">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-verde-bosque text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
              Estado de Madurez
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(Object.keys(MADUREZ_INFO) as AguacateMadurez[]).map((m) => {
                const info = MADUREZ_INFO[m];
                const precio = calibreInfo?.precios[m];

                return (
                  <button
                    key={m}
                    onClick={() => setMadurez(m)}
                    disabled={!precio?.disponible}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      madurez === m
                        ? 'border-verde-bosque bg-verde-bosque/5 shadow-md'
                        : precio?.disponible
                          ? 'border-gray-200 hover:border-verde-bosque/50 hover:bg-gray-50'
                          : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-1 rounded-full text-sm font-medium ${info.colorBg} ${info.color}`}>
                        {info.nombre}
                      </span>
                      {madurez === m && <Check className="w-5 h-5 text-verde-bosque" />}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <Calendar className="w-4 h-4" />
                      <span>{info.diasParaConsumo}</span>
                    </div>
                    <p className="text-xs text-gray-500">{info.descripcion}</p>
                    {precio?.disponible && (
                      <div className="mt-2 text-verde-bosque font-semibold">
                        {formatPrice(precio.precioKg)}/kg
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* PASO 4: Cantidad */}
        {variedad && calibre && (
          <div className="animate-fadeIn">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-verde-bosque text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
              Cantidad (kg)
            </h3>

            {/* Selector de cantidad */}
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => setCantidad(Math.max(5, cantidad - 5))}
                className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xl font-bold transition-colors"
              >
                -
              </button>
              <input
                type="number"
                value={cantidad}
                onChange={(e) => setCantidad(Math.max(5, parseInt(e.target.value) || 5))}
                min={5}
                max={300}
                className="w-24 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl p-2 focus:border-verde-bosque focus:outline-none"
              />
              <span className="text-xl text-gray-500">kg</span>
              <button
                onClick={() => setCantidad(Math.min(300, cantidad + 5))}
                className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xl font-bold transition-colors"
              >
                +
              </button>
            </div>

            {/* Niveles de volumen */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
                <Info className="w-4 h-4" />
                <span>Descuentos por volumen:</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {VOLUMENES_DESCUENTO.map((vol) => (
                  <div
                    key={vol.nombre}
                    className={`p-3 rounded-lg text-center transition-all ${
                      cantidad >= vol.minKg && cantidad <= vol.maxKg
                        ? 'bg-verde-bosque text-white'
                        : 'bg-white border border-gray-200'
                    }`}
                  >
                    <div className="font-semibold">{vol.nombre}</div>
                    <div className="text-sm">
                      {vol.descuento === 0 ? 'Precio base' : `-${vol.descuento}%`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* RESUMEN Y BOTON */}
        {precioCalculado && (
          <div className="animate-fadeIn border-t pt-6">
            <div className="bg-gradient-to-r from-verde-bosque/5 to-verde-aguacate/5 rounded-xl p-6">
              <h3 className="font-semibold text-lg mb-4">Resumen de tu Pedido</h3>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Producto:</span>
                  <span className="font-medium">
                    {AGUACATES_CONFIG[variedad!].nombreCompleto} {calibreInfo?.nombre} {MADUREZ_INFO[madurez].nombre}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cantidad:</span>
                  <span className="font-medium">{cantidad} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Precio/kg:</span>
                  <span className="font-medium">{formatPrice(precioCalculado.precioKg)}</span>
                </div>
                {precioCalculado.descuento > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Descuento volumen:</span>
                    <span className="font-medium">-{precioCalculado.descuento}%</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Precio/kg final:</span>
                  <span className="font-medium text-verde-bosque">
                    {formatPrice(precioCalculado.precioKgConDescuento)}
                  </span>
                </div>
              </div>

              <div className="border-t pt-4 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-2xl font-bold text-verde-bosque">
                    {formatPrice(precioCalculado.total)}
                  </span>
                </div>
              </div>

              <button
                onClick={handleAgregarCarrito}
                disabled={agregado}
                className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                  agregado
                    ? 'bg-green-500 text-white'
                    : 'bg-verde-bosque hover:bg-verde-bosque/90 text-white'
                }`}
              >
                {agregado ? (
                  <>
                    <Check className="w-6 h-6" />
                    Agregado al Carrito
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-6 h-6" />
                    Agregar al Carrito
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
