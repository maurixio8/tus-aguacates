import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 px-4">
      <div className="text-center">
        {/* Emoji grande */}
        <div className="text-9xl mb-6">🥑</div>

        {/* Título */}
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
          404 - Página no encontrada
        </h1>

        {/* Descripción */}
        <p className="text-lg text-gray-600 mb-8 max-w-md">
          Lo sentimos, la página que buscas no existe. Pero no te preocupes, ¡aún tenemos aguacates frescos para ti!
        </p>

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
          >
            ← Volver a la tienda
          </Link>
          <Link
            href="/admin"
            className="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition"
          >
            Ir al panel admin
          </Link>
        </div>

        {/* Información adicional */}
        <div className="mt-12 p-6 bg-white rounded-lg shadow-md max-w-md">
          <h3 className="font-semibold text-gray-900 mb-2">¿Necesitas ayuda?</h3>
          <p className="text-sm text-gray-600">
            Si crees que esto es un error, por favor{' '}
            <a href="mailto:info@tusaguacates.com" className="text-green-600 hover:underline">
              contacta con nosotros
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
