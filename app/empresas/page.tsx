/**
 * Página principal de la sección B2B (Business to Business)
 * "Tus Aguacates" - E-commerce Platform
 */

import Link from 'next/link';

export default function B2BHomePage() {
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <section className="text-center mb-16 animate-fade-in">
        <h2
          className="text-5xl font-bold mb-6 text-verde-bosque animate-slide-in-from-bottom-4"
          style={{ animationDelay: '0s' }}
        >
          Venta a Empresas
        </h2>
        <p
          className="text-xl mb-8 max-w-2xl mx-auto text-gray-600 animate-slide-in-from-bottom-4"
          style={{ animationDelay: '0.2s' }}
        >
          Precios especiales por volumen para restaurantes, hoteles,
          distribuidores y todo tipo de negocios.
        </p>
        <div
          className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-in-from-bottom-4"
          style={{ animationDelay: '0.4s' }}
        >
          <Link
            href="/empresas/catalogo"
            className="text-white font-bold py-3 px-8 rounded-lg transition duration-300 hover:scale-105"
            style={{
              backgroundColor: '#E8A838',
              boxShadow: '0 4px 14px rgba(232, 168, 56, 0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#D4952C';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(232, 168, 56, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#E8A838';
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(232, 168, 56, 0.3)';
            }}
          >
            Ver Catálogo de Productos
          </Link>
        </div>
      </section>

      {/* Beneficios */}
      <section className="grid md:grid-cols-3 gap-8 mb-16">
        <div
          className="bg-white p-8 rounded-xl transition duration-300 hover:scale-105"
          style={{
            border: '1px solid #D4AF85',
            boxShadow: '0 4px 12px rgba(45, 80, 22, 0.08)',
            animation: 'slide-in-from-bottom-4 0.8s ease-out 0.6s both'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(45, 80, 22, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(45, 80, 22, 0.08)';
          }}
        >
          <div className="mb-4" style={{ color: '#6B8E23' }}>
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-3 text-verde-bosque">Precios por Volumen</h3>
          <p className="text-gray-600">
            Cuanto más compres, mejor precio. Descuentos especiales para pedidos grandes.
          </p>
        </div>

        <div
          className="bg-white p-8 rounded-xl transition duration-300 hover:scale-105"
          style={{
            border: '1px solid #D4AF85',
            boxShadow: '0 4px 12px rgba(45, 80, 22, 0.08)',
            animation: 'slide-in-from-bottom-4 0.8s ease-out 0.7s both'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(45, 80, 22, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(45, 80, 22, 0.08)';
          }}
        >
          <div className="mb-4" style={{ color: '#6B8E23' }}>
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-3 text-verde-bosque">Entrega Rápida</h3>
          <p className="text-gray-600">
            Entrega puntual para tu negocio. Coordenemos la entrega según tus necesidades.
          </p>
        </div>

        <div
          className="bg-white p-8 rounded-xl transition duration-300 hover:scale-105"
          style={{
            border: '1px solid #D4AF85',
            boxShadow: '0 4px 12px rgba(45, 80, 22, 0.08)',
            animation: 'slide-in-from-bottom-4 0.8s ease-out 0.8s both'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(45, 80, 22, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(45, 80, 22, 0.08)';
          }}
        >
          <div className="mb-4" style={{ color: '#6B8E23' }}>
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-3 text-verde-bosque">Productos Premium</h3>
          <p className="text-gray-600">
            Los mejores aguacates y productos frescos seleccionados para tu negocio.
          </p>
        </div>
      </section>

      {/* Cómo funciona */}
      <section
        className="bg-white rounded-2xl p-12 mb-16"
        style={{
          border: '1px solid #D4AF85',
          boxShadow: '0 8px 24px rgba(45, 80, 22, 0.12)',
          animation: 'slide-in-from-bottom-4 0.8s ease-out 0.9s both'
        }}
      >
        <h2 className="text-3xl font-bold mb-8 text-center text-verde-bosque">
          ¿Cómo Comprar?
        </h2>
        <div className="grid md:grid-cols-4 gap-8">
          <div className="text-center transition duration-300 hover:scale-105">
            <div
              className="text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4"
              style={{ backgroundColor: '#6B8E23' }}
            >
              1
            </div>
            <h3 className="font-bold mb-2 text-verde-bosque">Explora el Catálogo</h3>
            <p className="text-gray-600 text-sm">
              Revisa nuestros productos y precios por volumen
            </p>
          </div>
          <div className="text-center transition duration-300 hover:scale-105">
            <div
              className="text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4"
              style={{ backgroundColor: '#6B8E23' }}
            >
              2
            </div>
            <h3 className="font-bold mb-2 text-verde-bosque">Agrega al Carrito</h3>
            <p className="text-gray-600 text-sm">
              Selecciona las cantidades según tus necesidades
            </p>
          </div>
          <div className="text-center transition duration-300 hover:scale-105">
            <div
              className="text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4"
              style={{ backgroundColor: '#6B8E23' }}
            >
              3
            </div>
            <h3 className="font-bold mb-2 text-verde-bosque">Confirma tu Pedido</h3>
            <p className="text-gray-600 text-sm">
              Puedes comprar como invitado o con cuenta
            </p>
          </div>
          <div className="text-center transition duration-300 hover:scale-105">
            <div
              className="text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4"
              style={{ backgroundColor: '#6B8E23' }}
            >
              4
            </div>
            <h3 className="font-bold mb-2 text-verde-bosque">¡Recibe tu Pedido!</h3>
            <p className="text-gray-600 text-sm">
              Entrega rápida en tu establecimiento
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section
        className="text-center text-white rounded-2xl p-12 transition duration-300 hover:scale-105"
        style={{
          background: 'linear-gradient(135deg, #E8A838 0%, #C1440E 100%)',
          boxShadow: '0 8px 32px rgba(232, 168, 56, 0.25)',
          animation: 'slide-in-from-bottom-4 0.8s ease-out 1s both'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 12px 40px rgba(232, 168, 56, 0.35)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(232, 168, 56, 0.25)';
        }}
      >
        <h2 className="text-3xl font-bold mb-4">
          ¿Listo para empezar a comprar al por mayor?
        </h2>
        <p className="text-xl mb-8" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
          Compra como invitado o crea tu cuenta para acceder a precios exclusivos para empresas
        </p>
        <Link
          href="/empresas/catalogo"
          className="inline-block font-bold py-4 px-10 rounded-lg transition duration-300"
          style={{
            backgroundColor: '#FFFFFF',
            color: '#2D5016',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#FFFEF5';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#FFFFFF';
            e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.1)';
          }}
        >
          Ver Catálogo de Productos
        </Link>
      </section>
    </div>
  );
}
