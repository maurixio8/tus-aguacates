import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const health: any = {
    timestamp: new Date().toISOString(),
    status: 'checking',
    checks: {
      api: { status: 'pending', details: null },
      supabase: { status: 'pending', details: null },
      environment: { status: 'pending', details: null },
      orders_table: { status: 'pending', details: null }
    },
    recommendations: []
  };

  try {
    // 1. Check if API is working
    health.checks.api = {
      status: 'pass',
      details: {
        method: 'GET',
        path: '/api/health',
        working: true
      }
    };

    // 2. Check Environment Variables
    const envVars = {
      supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabase_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      jwt_secret: !!process.env.JWT_SECRET
    };

    health.checks.environment = {
      status: Object.values(envVars).every(v => v) ? 'pass' : 'fail',
      details: envVars
    };

    if (!Object.values(envVars).every(v => v)) {
      health.recommendations.push('⚠️ Faltan variables de entorno. Revisa NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET');
    }

    // 3. Check Supabase Connection
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data, error } = await supabase.from('products').select('count').limit(1);

      health.checks.supabase = {
        status: error ? 'fail' : 'pass',
        details: {
          connected: !error,
          error: error?.message || null,
          count: data?.[0]?.count || null
        }
      };

      if (error) {
        health.recommendations.push(`❌ Error conexión Supabase: ${error.message}`);
      }
    } catch (e) {
      health.checks.supabase = {
        status: 'fail',
        details: {
          connected: false,
          error: (e as Error).message
        }
      };
      health.recommendations.push(`❌ Error crítico Supabase: ${(e as Error).message}`);
    }

    // 4. Check orders table access
    if (health.checks.supabase.status === 'pass') {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Test if we can read from orders table
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('count')
          .limit(1);

        health.checks.orders_table = {
          status: ordersError ? 'fail' : 'pass',
          details: {
            can_read: !ordersError,
            error: ordersError?.message || null,
            count: ordersData?.[0]?.count || null
          }
        };

        if (ordersError) {
          health.recommendations.push(`❌ Error tabla orders: ${ordersError.message}`);

          // Try to get more specific error info
          if (ordersError.code) {
            health.recommendations.push(`🔍 Código de error: ${ordersError.code}`);
          }
          if (ordersError.hint) {
            health.recommendations.push(`💡 Sugerencia: ${ordersError.hint}`);
          }
        } else {
          health.recommendations.push('✅ Tabla orders accesible');
        }

      } catch (e) {
        health.checks.orders_table = {
          status: 'fail',
          details: {
            can_read: false,
            error: (e as Error).message
          }
        };
        health.recommendations.push(`❌ Error acceso tabla orders: ${(e as Error).message}`);
      }
    } else {
      health.checks.orders_table = {
        status: 'skip',
        details: {
          reason: 'Supabase connection failed'
        }
      };
    }

    // Calculate overall status
    const allChecks = Object.values(health.checks) as any[];
    const failedChecks = allChecks.filter((c: any) => c.status === 'fail').length;

    if (failedChecks > 0) {
      health.status = 'error';
      health.recommendations.unshift(`❌ ${failedChecks} chequeo(s) fallaron. Revisa los detalles arriba.`);
    } else {
      health.status = 'healthy';
      health.recommendations.unshift('✅ Todos los sistemas operativos correctamente.');
    }

  } catch (error) {
    health.status = 'error';
    health.recommendations.unshift(`❌ Error crítico en diagnóstico: ${(error as Error).message}`);
  }

  return NextResponse.json(health, {
    status: health.status === 'error' ? 500 : 200
  });
}

export async function POST(request: NextRequest) {
  // For POST requests, try to create a test order
  return NextResponse.json({
    message: "POST method received",
    suggestion: "Use GET method for health check or POST /api/admin/orders for order creation"
  }, { status: 200 });
}