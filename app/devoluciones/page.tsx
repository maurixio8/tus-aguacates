import Link from 'next/link';

export default function DevolucionesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <Link href="/" className="text-green-600 hover:text-green-700 mb-4 inline-block">
            ← Volver al inicio
          </Link>
          <h1 className="text-3xl font-bold mb-2">Política de Devoluciones</h1>
          <p className="text-gray-600">Conoce nuestras políticas para devoluciones y reembolsos</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-green-800">Política de Devoluciones</h2>
          
          <div className="space-y-4 text-gray-700">
            <div>
              <h3 className="font-semibold mb-2">Plazo de devolución</h3>
              <p>Tienes hasta 24 horas después de recibir tu pedido para solicitar una devolución por cualquier motivo.</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Condiciones para devolución</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>El producto debe estar en su estado original y sin abrir</li>
                <li>El empaque original debe estar intacto</li>
                <li>Debes presentar la factura o comprobante de compra</li>
                <li>El producto no debe mostrar signos de deterioro por mal manejo</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Productos no elegibles para devolución</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Productos perecederos que hayan sido abiertos</li>
                <li>Productos con signos de mal uso o manipulación inadecuada</li>
                <li>Productos devueltos después del plazo de 24 horas</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Proceso de devolución</h3>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Contáctanos a través de nuestro formulario de contacto o WhatsApp</li>
                <li>Proporciona tu número de pedido y motivo de la devolución</li>
                <li>Nuestro equipo evaluará tu solicitud dentro de 24 horas</li>
                <li>Si es aprobada, coordinaremos la recolección del producto</li>
                <li>Una vez recibido y verificado, procesaremos tu reembolso</li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Reembolsos</h3>
              <p>Los reembolsos se procesarán dentro de 3-5 días hábiles después de aprobar la devolución. El dinero será devuelto por el mismo método de pago que utilizaste originalmente.</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Productos dañados o incorrectos</h3>
              <p>Si recibes productos dañados o incorrectos, contáctanos inmediatamente. Nos haremos cargo del reemplazo sin costo adicional y procesaremos el reembolso si es necesario.</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-3 text-green-800">¿Cómo solicitar una devolución?</h2>
          <div className="space-y-3 text-gray-700">
            <p>Para iniciar el proceso de devolución, tienes las siguientes opciones:</p>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Por WhatsApp</h3>
                <p className="text-sm">Envíanos un mensaje al +57 300 258 2777 con tu número de pedido.</p>
              </div>

              <div className="bg-white p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Por correo electrónico</h3>
                <p className="text-sm">Escríbenos a tusaguacates.com@gmail.com con los detalles de tu pedido.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-3 text-yellow-800">Información importante</h2>
          <ul className="space-y-2 text-gray-700">
            <li>• Los costos de envío para devoluciones no aprobadas correrán por cuenta del cliente</li>
            <li>• Nos reservamos el derecho de rechazar devoluciones que no cumplan con nuestras políticas</li>
            <li>• En caso de disputas, nos comprometemos a encontrar una solución satisfactoria para ambas partes</li>
          </ul>
        </div>

        <div className="mt-8 text-center">
          <Link 
            href="/contacto" 
            className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors mr-4"
          >
            Contactar Soporte
          </Link>
          <Link 
            href="/tienda" 
            className="inline-block border border-green-600 text-green-600 px-6 py-2 rounded-lg hover:bg-green-50 transition-colors"
          >
            Seguir Comprando
          </Link>
        </div>
      </div>
    </div>
  );
}