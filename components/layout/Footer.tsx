import Link from 'next/link';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-verde-bosque-800 text-white mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Sobre Nosotros */}
          <div>
            <h3 className="font-display font-bold text-xl mb-4">Tus Aguacates</h3>
            <p className="text-sm text-gray-300 mb-4">
              Frutas y verduras frescas del Eje Cafetero directo a tu mesa. 
              Apoyamos a los agricultores locales y garantizamos la mejor calidad.
            </p>
            <div className="flex space-x-3">
              <a href="#" className="hover:text-verde-aguacate-200 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-verde-aguacate-200 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-verde-aguacate-200 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Enlaces Rápidos */}
          <div>
            <h3 className="font-display font-bold text-lg mb-4">Enlaces Rápidos</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/tienda/todos" className="hover:text-verde-aguacate-200 transition-colors">
                  Todos los Productos
                </Link>
              </li>
              <li>
                <Link href="/sobre-nosotros" className="hover:text-verde-aguacate-200 transition-colors">
                  Sobre Nosotros
                </Link>
              </li>
              <li>
                <Link href="/contacto" className="hover:text-verde-aguacate-200 transition-colors">
                  Contacto
                </Link>
              </li>
            </ul>
          </div>

          {/* Atención al Cliente */}
          <div>
            <h3 className="font-display font-bold text-lg mb-4">Atención al Cliente</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/perfil/mis-pedidos" className="hover:text-verde-aguacate-200 transition-colors">
                  Mis Pedidos
                </Link>
              </li>
              <li>
                <Link href="/politicas" className="hover:text-verde-aguacate-200 transition-colors">
                  Políticas de Envío
                </Link>
              </li>
              <li>
                <Link href="/devoluciones" className="hover:text-verde-aguacate-200 transition-colors">
                  Devoluciones
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-verde-aguacate-200 transition-colors">
                  Preguntas Frecuentes
                </Link>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h3 className="font-display font-bold text-lg mb-4">Contacto</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                <span>Eje Cafetero, Colombia</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span>+57 300 123 4567</span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span>info@tusaguacates.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-verde-bosque-600 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>2025 Tus Aguacates. Todos los derechos reservados.</p>
          <p className="mt-2">
            <Link href="/terminos" className="hover:text-verde-aguacate-200 transition-colors">
              Términos y Condiciones
            </Link>
            {' '}{' '}{' '}
            <Link href="/privacidad" className="hover:text-verde-aguacate-200 transition-colors">
              Política de Privacidad
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
