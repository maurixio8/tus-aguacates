'use client';

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Términos y Condiciones
          </h1>

          <div className="prose prose-lg max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Aceptación de los Términos
              </h2>
              <p className="text-gray-600">
                Al utilizar el sitio web de Tus Aguacates, aceptas estos términos y condiciones
                en su totalidad. Si no estás de acuerdo con estos términos, no debes utilizar
                nuestro sitio web o servicios.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Productos y Servicios
              </h2>
              <p className="text-gray-600">
                Nos esforzamos por mostrar con precisión los colores y diseños de nuestros
                productos en este sitio web. Sin embargo, el color real que veas puede depender
                de tu monitor y no podemos garantizar que tu monitor muestre los colores con
                precisión.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Precios y Pagos
              </h2>
              <p className="text-gray-600">
                Los precios de nuestros productos están sujetos a cambio sin previo aviso.
                Todos los precios se muestran en pesos colombianos (COP) e incluyen impuestos
                aplicables.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Entrega y Envío
              </h2>
              <p className="text-gray-600">
                Realizamos entregas en las áreas especificadas. Los tiempos de entrega son
                estimados y pueden variar según la disponibilidad y ubicación.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Devoluciones y Reembolsos
              </h2>
              <p className="text-gray-600">
                Aceptamos devoluciones en un plazo de 3 días hábiles si el producto llega en
                mal estado o no corresponde con lo solicitado.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Propiedad Intelectual
              </h2>
              <p className="text-gray-600">
                Todo el contenido de este sitio web, incluyendo imágenes, textos y diseños,
                está protegido por derechos de autor y otros derechos de propiedad intelectual.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Contacto
              </h2>
              <p className="text-gray-600">
                Si tienes preguntas sobre estos términos y condiciones, contáctanos en:
                <br />
                Email: info@tusaguacates.com
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