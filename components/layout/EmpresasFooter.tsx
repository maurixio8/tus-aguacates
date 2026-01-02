import Link from 'next/link';
import { Instagram, Mail, Phone, MapPin, Building2 } from 'lucide-react';

export function EmpresasFooter() {
  return (
    <footer className="bg-verde-bosque-800 text-white mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Sobre Nosotros - Empresas */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-6 h-6 text-naranja-frutal" />
              <h3 className="font-display font-bold text-xl">Tus Aguacates</h3>
            </div>
            <p className="text-sm text-gray-300 mb-4">
              Venta mayorista para restaurantes, hoteles y negocios.
              Productos frescos del Eje Cafetero con precios por volumen.
            </p>
            <div className="flex space-x-3">
              <a href="https://www.instagram.com/tusaguacates/" target="_blank" rel="noopener noreferrer" className="hover:text-naranja-frutal transition-colors" aria-label="Instagram">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Enlaces Empresas */}
          <div>
            <h3 className="font-display font-bold text-lg mb-4">Empresas</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/empresas" className="hover:text-naranja-frutal transition-colors">
                  Inicio Empresas
                </Link>
              </li>
              <li>
                <Link href="/empresas/aguacates" className="hover:text-naranja-frutal transition-colors">
                  Catálogo de Aguacates
                </Link>
              </li>
              <li>
                <Link href="/empresas#beneficios" className="hover:text-naranja-frutal transition-colors">
                  Beneficios
                </Link>
              </li>
              <li>
                <Link href="/empresas#contacto" className="hover:text-naranja-frutal transition-colors">
                  Contacto
                </Link>
              </li>
            </ul>
          </div>

          {/* Contacto Directo */}
          <div>
            <h3 className="font-display font-bold text-lg mb-4">Contacto Mayorista</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 mt-1 flex-shrink-0 text-naranja-frutal" />
                <span>Eje Cafetero, Colombia</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="w-4 h-4 flex-shrink-0 text-naranja-frutal" />
                <span>304 258 2777</span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="w-4 h-4 flex-shrink-0 text-naranja-frutal" />
                <span>empresas@tusaguacates.com</span>
              </li>
              <li className="pt-2">
                <a
                  href="https://wa.me/573042582777?text=Hola,%20quiero%20información%20sobre%20pedidos%20mayoristas"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                  💬 WhatsApp Directo
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-verde-bosque-600 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>2025 Tus Aguacates. Canal Empresarial.</p>
          <p className="mt-2">
            <Link href="/terminos" className="hover:text-naranja-frutal transition-colors">
              Términos y Condiciones
            </Link>
            {' '}•{' '}
            <Link href="/privacidad" className="hover:text-naranja-frutal transition-colors">
              Política de Privacidad
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
