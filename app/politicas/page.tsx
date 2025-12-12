import Link from 'next/link';

export default function PoliticasPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <Link href="/" className="text-green-600 hover:text-green-700 mb-4 inline-block">
            ← Volver al inicio
          </Link>
          <h1 className="text-3xl font-bold mb-2">Políticas de Servicio</h1>
          <p className="text-gray-600">Términos y condiciones de Tus Aguacates</p>
        </div>

        <div className="space-y-6">
          {/* Términos y Condiciones */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4 text-green-800">Términos y Condiciones</h2>
            
            <div className="space-y-4 text-gray-700">
              <div>
                <h3 className="font-semibold mb-2">1. Aceptación de términos</h3>
                <p>Al utilizar nuestros servicios, aceptas cumplir con estos términos y condiciones. Si no estás de acuerdo, por favor no utilices nuestra plataforma.</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">2. Descripción del servicio</h3>
                <p>Tus Aguacates es una plataforma de comercio electrónico que facilita la venta de productos frescos y orgánicos directamente de productores locales a consumidores.</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">3. Registro y cuenta de usuario</h3>
                <p>Para realizar compras, debes crear una cuenta con información veraz y actualizada. Eres responsable de mantener la confidencialidad de tu contraseña.</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">4. Precios y pagos</h3>
                <p>Los precios están expresados en pesos colombianos e incluyen IVA. Nos reservamos el derecho de modificar los precios sin previo aviso.</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">5. Propiedad intelectual</h3>
                <p>Todo el contenido de este sitio web está protegido por derechos de autor y otras leyes de propiedad intelectual.</p>
              </div>
            </div>
          </div>

          {/* Política de Privacidad */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4 text-green-800">Política de Privacidad</h2>
            
            <div className="space-y-4 text-gray-700">
              <div>
                <h3 className="font-semibold mb-2">1. Información que recopilamos</h3>
                <p>Recopilamos información personal como nombre, correo electrónico, dirección de envío y datos de pago necesarios para procesar tus pedidos.</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">2. Uso de la información</h3>
                <p>Utilizamos tu información para procesar pedidos, mejorar nuestros servicios y comunicarnos contigo sobre promociones y novedades.</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">3. Compartir información</h3>
                <p>No vendemos ni compartimos tu información personal con terceros, excepto cuando es necesario para procesar tu pedido o cumplir con la ley.</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">4. Seguridad</h3>
                <p>Implementamos medidas de seguridad adecuadas para proteger tu información personal contra acceso no autorizado o pérdida.</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">5. Cookies</h3>
                <p>Utilizamos cookies para mejorar tu experiencia en nuestro sitio web. Puedes configurar tu navegador para rechazar cookies.</p>
              </div>
            </div>
          </div>

          {/* Política de Envíos */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4 text-green-800">Política de Envíos</h2>
            
            <div className="space-y-4 text-gray-700">
              <div>
                <h3 className="font-semibold mb-2">1. Áreas de cobertura</h3>
                <p>Realizamos envíos a Bogotá y áreas metropolitanas. Pronto扩展remos nuestra cobertura a otras ciudades.</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">2. Tiempos de entrega</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Bogotá: 24-48 horas</li>
                  <li>Áreas metropolitanas: 48-72 horas</li>
                  <li>Pedidos realizados antes de las 12:00 pm se procesan el mismo día</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">3. Costos de envío</h3>
                <p>Los costos de envío varían según la ubicación y el monto del pedido. Pedidos superiores a $50.000 tienen envío gratuito en Bogotá.</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">4. Seguimiento del pedido</h3>
                <p>Recibirás un código de seguimiento por correo electrónico para monitorear el estado de tu entrega.</p>
              </div>
            </div>
          </div>

          {/* Garantía de Calidad */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4 text-green-800">Garantía de Calidad</h2>
            
            <div className="space-y-4 text-gray-700">
              <div>
                <h3 className="font-semibold mb-2">1. Selección de productos</h3>
                <p>Nuestros productos son seleccionados cuidadosamente por expertos para garantizar máxima frescura y calidad.</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">2. Origen verificable</h3>
                <p>Trabajamos directamente con productores locales certificados que cumplen con los más altos estándares de calidad.</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">3. Satisfacción garantizada</h3>
                <p>Si no estás completamente satisfecho con tu compra, te ofrecemos reemplazo o reembolso completo según nuestras políticas de devolución.</p>
              </div>
            </div>
          </div>

          {/* Contacto para consultas */}
          <div className="bg-green-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-3 text-green-800">¿Tienes preguntas?</h2>
            <p className="text-gray-700 mb-4">
              Si tienes alguna duda sobre nuestras políticas, no dudes en contactarnos. Estaremos encantados de ayudarte.
            </p>
            <div className="space-x-4">
              <Link 
                href="/contacto" 
                className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Contactar
              </Link>
              <Link 
                href="/faq" 
                className="inline-block border border-green-600 text-green-600 px-6 py-2 rounded-lg hover:bg-green-50 transition-colors"
              >
                Ver FAQ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}