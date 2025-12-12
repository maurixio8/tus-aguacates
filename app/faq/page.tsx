import Link from 'next/link';

const faqData = [
  {
    question: "¿Cómo realizo un pedido en Tus Aguacates?",
    answer: "Es muy sencillo. Navega por nuestra tienda, selecciona los productos que deseas, agrégalos al carrito y sigue el proceso de checkout. Podrás pagar de forma segura y recibirás tu pedido en la dirección que indiques."
  },
  {
    question: "¿Cuáles son los métodos de pago disponibles?",
    answer: "Aceptamos Daviplata y pago en efectivo contra entrega. Elige el método que más te convenga durante el proceso de checkout."
  },
  {
    question: "¿Cuánto tarda la entrega?",
    answer: "Los tiempos de entrega varían según tu ubicación. Generalmente, las entregas en Bogotá y áreas metropolitanas se realizan en 24-48 horas. Para otras ciudades, el tiempo puede ser de 2-3 días hábiles."
  },
  {
    question: "¿Los productos son frescos?",
    answer: "Sí, todos nuestros productos son seleccionados cuidadosamente para garantizar máxima frescura. Trabajamos directamente con productores locales para ofrecerte productos de la más alta calidad."
  },
  {
    question: "¿Puedo cancelar mi pedido?",
    answer: "Puedes cancelar tu pedido siempre y cuando aún no haya sido procesado para envío. Una vez enviado, no se podrá cancelar. Contáctanos lo antes posible si necesitas hacer cambios."
  },
  {
    question: "¿Qué hago si recibo un producto dañado?",
    answer: "Si recibes algún producto en mal estado, contáctanos inmediatamente. Te ofreceremos un reemplazo o un reembolso completo según tu preferencia."
  },
  {
    question: "¿Ofrecen suscripciones?",
    answer: "Sí, tenemos un sistema de suscripciones donde puedes recibir productos regularmente con descuentos especiales. Puedes configurar la frecuencia y productos que deseas recibir."
  },
  {
    question: "¿Cómo funcionan las devoluciones?",
    answer: "Si no estás satisfecho con tu compra, puedes solicitar una devolución dentro de las primeras 24 horas. El producto debe estar en su estado original. Contáctanos para iniciar el proceso."
  }
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <Link href="/" className="text-green-600 hover:text-green-700 mb-4 inline-block">
            ← Volver al inicio
          </Link>
          <h1 className="text-3xl font-bold mb-2">Preguntas Frecuentes</h1>
          <p className="text-gray-600">Resuelve tus dudas sobre nuestros productos y servicios</p>
        </div>

        <div className="space-y-4">
          {faqData.map((faq, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-3 text-green-800">
                {faq.question}
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-green-50 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold mb-3 text-green-800">
            ¿No encontraste lo que buscabas?
          </h2>
          <p className="text-gray-700 mb-4">
            Estamos aquí para ayudarte. Contáctanos directamente y resolveremos todas tus dudas.
          </p>
          <div className="space-x-4">
            <Link 
              href="/contacto" 
              className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Contactar
            </Link>
            <Link 
              href="/tienda" 
              className="inline-block border border-green-600 text-green-600 px-6 py-2 rounded-lg hover:bg-green-50 transition-colors"
            >
              Ir a la tienda
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}