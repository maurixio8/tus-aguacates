import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Evitar redirects automáticos que causan problemas con CORS
  const url = request.nextUrl.clone();
  
  // Si la URL termina sin slash y es una ruta de API, mantenerla sin slash
  if (url.pathname.startsWith('/api/') && !url.pathname.endsWith('/')) {
    // No hacer redirect, permitir que la ruta se maneje directamente
    return NextResponse.next();
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
  ],
};