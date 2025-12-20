import { Metadata } from 'next';
import ContactForm from '@/components/contact/ContactForm';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contacto | Tus Aguacates',
  description: 'Contacta con Tus Aguacates para resolver tus dudas, realizar pedidos o conocer más sobre nuestros productos frescos del Eje Cafetero.',
  keywords: 'contacto, teléfono, email, ubicación, Tus Aguacates, Eje Cafetero',
};

export default function ContactoPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 md:py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-display font-bold text-3xl md:text-4xl mb-4 text-verde-bosque">
            Contacto
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Estamos aquí para ayudarte. Contáctanos por cualquier duda sobre nuestros productos, 
            pedidos o para conocer más sobre Tus Aguacates.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Información de Contacto */}
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
              <h2 className="font-display font-bold text-2xl mb-6 text-verde-bosque">
                Información de Contacto
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-verde-aguacate-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-verde-aguacate" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Teléfono</h3>
                    <p className="text-gray-600 mb-2">+57 300 258 2777</p>
                    <p className="text-sm text-gray-500">
                      Lunes a viernes: 8:00 AM - 6:00 PM<br />
                      Sábados: 9:00 AM - 1:00 PM
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-verde-aguacate-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-verde-aguacate" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                    <p className="text-gray-600 mb-2">tusaguacates.com@gmail.com</p>
                    <p className="text-sm text-gray-500">
                      Respuesta en menos de 24 horas hábiles
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-verde-aguacate-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-verde-aguacate" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Ubicación</h3>
                    <p className="text-gray-600 mb-2">Eje Cafetero y Bogotá, Colombia</p>
                    <p className="text-sm text-gray-500">
                      Nuestros productos se cultivan en el Eje Cafetero y realizamos
                      entregas en Bogotá, garantizando la máxima frescura y calidad.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-verde-aguacate-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-verde-aguacate" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Horario de Entregas</h3>
                    <p className="text-gray-600 mb-2">Bogotá: Martes y Viernes</p>
                    <p className="text-sm text-gray-500">
                      Entregas entre 2:00 PM y 8:00 PM<br />
                      Realiza tu pedido antes de las 10:00 AM del día de entrega
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Preguntas Frecuentes */}
            <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
              <h2 className="font-display font-bold text-2xl mb-6 text-verde-bosque">
                Preguntas Frecuentes
              </h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    ¿Cómo realizo un pedido?
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Puedes realizar tu pedido a través de nuestra página web, seleccionando los productos 
                    que deseas y completando el proceso de checkout. También puedes contactarnos por teléfono.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    ¿Cuál es el tiempo de entrega?
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Realizamos entregas en Bogotá los días martes y viernes. Los pedidos deben realizarse 
                    antes de las 10:00 AM del día de entrega.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    ¿Ofrecen garantía de calidad?
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Sí, ofrecemos 100% satisfacción garantizada. Si no estás contento con la calidad 
                    de nuestros productos, te reembolsamos tu dinero.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Formulario de Contacto */}
          <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
            <h2 className="font-display font-bold text-2xl mb-6 text-verde-bosque">
              Envíanos un Mensaje
            </h2>
            
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}