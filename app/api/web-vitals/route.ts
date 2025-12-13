import { NextRequest, NextResponse } from 'next/server';

interface WebVitalMetric {
  name: string;
  value: number;
  id: string;
  url: string;
  userAgent: string;
  timestamp: number;
}

export async function POST(request: NextRequest) {
  try {
    const metrics: WebVitalMetric = await request.json();

    // Validar datos básicos
    if (!metrics.name || !metrics.value || !metrics.id) {
      return NextResponse.json(
        { error: 'Datos inválidos' },
        { status: 400 }
      );
    }

    // Agregar timestamp
    metrics.timestamp = Date.now();

    // En desarrollo, solo loguear
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Web Vitals:', metrics);
      return NextResponse.json({ success: true });
    }

    // En producción, guardar en Supabase o servicio de analítica
    // Aquí podrías guardar en una tabla de métricas en Supabase
    // o enviar a servicios como Google Analytics, Vercel Analytics, etc.

    // Ejemplo de cómo guardar en Supabase (descomentar si tienes la tabla)
    /*
    const { data, error } = await supabase
      .from('web_vitals')
      .insert([{
        name: metrics.name,
        value: metrics.value,
        rating: getRating(metrics.name, metrics.value),
        url: metrics.url,
        user_agent: metrics.userAgent,
        created_at: new Date().toISOString()
      }]);

    if (error) {
      console.error('Error guardando Web Vitals:', error);
    }
    */

    // Evaluar rendimiento según los estándares
    const rating = getRating(metrics.name, metrics.value);

    // Si hay métricas malas, podrías enviar notificaciones
    if (rating === 'poor') {
      console.warn(`⚠️ Métrica de rendimiento pobre: ${metrics.name} = ${metrics.value}`);
    }

    return NextResponse.json({
      success: true,
      rating
    });

  } catch (error) {
    console.error('Error procesando Web Vitals:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Función para calificar las métricas según los estándares
function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  switch (name) {
    case 'LCP': // Largest Contentful Paint
      if (value <= 2500) return 'good';
      if (value <= 4000) return 'needs-improvement';
      return 'poor';

    case 'FID': // First Input Delay
      if (value <= 100) return 'good';
      if (value <= 300) return 'needs-improvement';
      return 'poor';

    case 'CLS': // Cumulative Layout Shift
      if (value <= 0.1) return 'good';
      if (value <= 0.25) return 'needs-improvement';
      return 'poor';

    case 'FCP': // First Contentful Paint
      if (value <= 1800) return 'good';
      if (value <= 3000) return 'needs-improvement';
      return 'poor';

    case 'TTFB': // Time to First Byte
      if (value <= 800) return 'good';
      if (value <= 1800) return 'needs-improvement';
      return 'poor';

    default:
      return 'needs-improvement';
  }
}

// GET endpoint para obtener métricas agregadas (opcional)
export async function GET() {
  try {
    // Aquí podrías obtener métricas guardadas en Supabase
    // y retornar estadísticas

    return NextResponse.json({
      message: 'Web Vitals API está funcionando',
      docs: {
        POST: 'Enviar métricas de rendimiento',
        GET: 'Obtener estadísticas de rendimiento'
      }
    });

  } catch (error) {
    console.error('Error obteniendo Web Vitals:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}