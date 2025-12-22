'use client';

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Política de Privacidad
          </h1>

          <div className="prose prose-lg max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Información que Recopilamos
              </h2>
              <p className="text-gray-600">
                En Tus Aguacates, nos comprometemos a proteger tu privacidad. Recopilamos información
                personal cuando creas una cuenta, realizas compras o te comunicas con nosotros.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Uso de la Información
              </h2>
              <p className="text-gray-600">
                Utilizamos tu información para procesar pedidos, mejorar nuestros servicios y
                comunicarnos contigo sobre ofertas especiales.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Protección de Datos
              </h2>
              <p className="text-gray-600">
                Implementamos medidas de seguridad apropiadas para proteger tu información
                personal contra acceso no autorizado, alteración o destrucción.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Contacto
              </h2>
              <p className="text-gray-600">
                Si tienes preguntas sobre esta política de privacidad, contáctanos en:
                <br />
                Email: privacy@tusaguacates.com
              </p>
            </section>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500 text-center">
                Última actualización: {new Date().toLocaleDateString('es-CO')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}