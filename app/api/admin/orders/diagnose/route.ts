import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseClient } from '@/lib/auth-admin';

export const dynamic = 'force-dynamic';

// Configuración CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production'
    ? 'https://tus-aguacates.vercel.app'
    : 'http://localhost:3000',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Cookie, Set-Cookie',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400',
};

// Manejar solicitudes OPTIONS para CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    vercel: {
      url: process.env.VERCEL_URL,
      env: process.env.VERCEL_ENV
    },
    checks: {
      environment: { status: 'pending', details: null },
      supabase_connection: { status: 'pending', details: null },
      orders_table_structure: { status: 'pending', details: null },
      rls_policies: { status: 'pending', details: null },
      sample_product: { status: 'pending', details: null },
      test_insert: { status: 'pending', details: null }
    },
    overall: { status: 'pending', message: 'Running diagnostics...' }
  };

  try {
    console.log('🔍 Starting API diagnostics...');

    // 1. Check Environment Variables
    console.log('📋 Checking environment variables...');
    const envChecks = {
      supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabase_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      jwt_secret: !!process.env.JWT_SECRET
    };

    diagnostics.checks.environment = {
      status: Object.values(envChecks).every(v => v) ? 'pass' : 'fail',
      details: envChecks
    };

    // 2. Test Supabase Connection
    console.log('🔗 Testing Supabase connection...');
    try {
      const supabase = createSupabaseClient();
      const { data, error } = await supabase.from('products').select('count').limit(1);

      diagnostics.checks.supabase_connection = {
        status: error ? 'fail' : 'pass',
        details: {
          connected: !error,
          error: error?.message || null,
          count: data?.[0]?.count || null
        }
      };
    } catch (e) {
      diagnostics.checks.supabase_connection = {
        status: 'fail',
        details: {
          connected: false,
          error: (e as Error).message
        }
      };
    }

    // 3. Check orders table structure
    console.log('📊 Checking orders table structure...');
    try {
      const supabase = createSupabaseClient();
      const { data: columns, error } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', 'orders')
        .eq('table_schema', 'public');

      if (error) {
        // Fallback: try to describe table a different way
        const { data: testOrder, error: testError } = await supabase
          .from('orders')
          .select('*')
          .limit(0);

        diagnostics.checks.orders_table_structure = {
          status: testError ? 'fail' : 'pass',
          details: {
            error: testError?.message || null,
            has_access: !testError
          }
        };
      } else {
        const requiredColumns = [
          'customer_name', 'customer_phone', 'customer_email',
          'delivery_address', 'shipping_address', 'status',
          'total', 'total_amount', 'user_id'
        ];

        const existingColumns = columns?.map(c => c.column_name) || [];
        const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

        diagnostics.checks.orders_table_structure = {
          status: missingColumns.length === 0 ? 'pass' : 'fail',
          details: {
            existing_columns: existingColumns,
            missing_columns: missingColumns,
            column_details: columns
          }
        };
      }
    } catch (e) {
      diagnostics.checks.orders_table_structure = {
        status: 'fail',
        details: {
          error: (e as Error).message
        }
      };
    }

    // 4. Check RLS Policies
    console.log('🔐 Checking RLS policies...');
    try {
      const supabase = createSupabaseClient();
      // Try a simple insert test to check permissions
      const testData = {
        customer_name: 'TEST_DELETE_ME',
        customer_phone: '3000000000',
        delivery_address: 'Test Address',
        shipping_address: { street: 'Test', city: 'Test', state: 'Test' },
        total: 0,
        total_amount: 0,
        status: 'cancelled',
        user_id: null
      };

      const { data: insertData, error: insertError } = await supabase
        .from('orders')
        .insert(testData)
        .select('id')
        .single();

      if (insertError) {
        diagnostics.checks.rls_policies = {
          status: 'fail',
          details: {
            can_insert: false,
            error: insertError.message,
            code: insertError.code,
            hint: insertError.hint
          }
        };
      } else {
        // Delete the test record
        await supabase.from('orders').delete().eq('id', insertData.id);

        diagnostics.checks.rls_policies = {
          status: 'pass',
          details: {
            can_insert: true,
            test_passed: true
          }
        };
      }
    } catch (e) {
      diagnostics.checks.rls_policies = {
        status: 'fail',
        details: {
          can_insert: false,
          error: (e as Error).message
        }
      };
    }

    // 5. Check for sample products
    console.log('📦 Checking for sample products...');
    try {
      const supabase = createSupabaseClient();
      const { data: products, error } = await supabase
        .from('products')
        .select('id, name, price')
        .limit(3);

      diagnostics.checks.sample_product = {
        status: error ? 'fail' : (products && products.length > 0) ? 'pass' : 'fail',
        details: {
          product_count: products?.length || 0,
          sample_products: products || [],
          error: error?.message || null
        }
      };
    } catch (e) {
      diagnostics.checks.sample_product = {
        status: 'fail',
        details: {
          error: (e as Error).message
        }
      };
    }

    // 6. Full test insert with minimal data
    console.log('🧪 Running full test insert...');
    if (diagnostics.checks.sample_product.status === 'pass' &&
        diagnostics.checks.rls_policies.status === 'pass') {

      try {
        const supabase = createSupabaseClient();
        const sampleProduct = diagnostics.checks.sample_product.details.sample_products[0];

        const testOrderData = {
          customer_name: 'DIAGNOSTIC_TEST_ORDER',
          customer_phone: '3001112222',
          customer_email: 'test@diagnostic.com',
          delivery_address: 'Calle 100 #45-67, Bogotá, Cundinamarca',
          shipping_address: {
            street_address: 'Calle 100 #45-67',
            city: 'Bogotá',
            state: 'Cundinamarca',
            postal_code: null,
            additional_info: null
          },
          subtotal: sampleProduct.price,
          tax: 0,
          discount: 0,
          shipping_fee: 7400,
          total: sampleProduct.price + 7400,
          total_amount: sampleProduct.price + 7400,
          status: 'pending',
          payment_method: 'efectivo',
          payment_status: 'pending',
          user_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Insert test order
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert(testOrderData)
          .select('id')
          .single();

        if (orderError) {
          diagnostics.checks.test_insert = {
            status: 'fail',
            details: {
              order_inserted: false,
              error: orderError.message,
              code: orderError.code,
              hint: orderError.hint,
              test_data: testOrderData
            }
          };
        } else {
          // Insert test order item
          const { data: item, error: itemError } = await supabase
            .from('order_items')
            .insert({
              order_id: order.id,
              product_id: sampleProduct.id,
              quantity: 1,
              unit_price: sampleProduct.price,
              subtotal: sampleProduct.price,
              product_snapshot: {
                name: sampleProduct.name,
                variant_name: null,
                variant_value: null
              },
              created_at: new Date().toISOString()
            })
            .select('id')
            .single();

          if (itemError) {
            // Clean up order if item fails
            await supabase.from('orders').delete().eq('id', order.id);
            diagnostics.checks.test_insert = {
              status: 'fail',
              details: {
                order_inserted: true,
                item_inserted: false,
                error: itemError.message,
                code: itemError.code,
                hint: itemError.hint,
                order_id: order.id
              }
            };
          } else {
            // Clean up test data
            await supabase.from('order_items').delete().eq('id', item.id);
            await supabase.from('orders').delete().eq('id', order.id);

            diagnostics.checks.test_insert = {
              status: 'pass',
              details: {
                order_inserted: true,
                item_inserted: true,
                test_passed: true,
                cleanup_successful: true
              }
            };
          }
        }
      } catch (e) {
        diagnostics.checks.test_insert = {
          status: 'fail',
          details: {
            error: (e as Error).message
          }
        };
      }
    } else {
      diagnostics.checks.test_insert = {
        status: 'skip',
        details: {
          skipped: true,
          reason: 'Previous checks failed, skipping full test'
        }
      };
    }

    // Calculate overall status
    const allChecks = Object.values(diagnostics.checks);
    const passedChecks = allChecks.filter(c => c.status === 'pass').length;
    const failedChecks = allChecks.filter(c => c.status === 'fail').length;
    const skippedChecks = allChecks.filter(c => c.status === 'skip').length;

    let overallStatus = 'pass';
    let overallMessage = 'All systems operational';

    if (failedChecks > 0) {
      overallStatus = 'fail';
      overallMessage = `${failedChecks} check(s) failed`;
    } else if (skippedChecks > 0) {
      overallStatus = 'warning';
      overallMessage = `${skippedChecks} check(s) skipped`;
    }

    diagnostics.overall = {
      status: overallStatus,
      message: overallMessage,
      summary: {
        total: allChecks.length,
        passed: passedChecks,
        failed: failedChecks,
        skipped: skippedChecks
      }
    };

    console.log('✅ Diagnostics completed:', diagnostics.overall);

    return NextResponse.json(diagnostics, {
      status: overallStatus === 'fail' ? 500 : 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('❌ Diagnostics failed:', error);

    diagnostics.overall = {
      status: 'error',
      message: 'Diagnostics failed to run',
      error: (error as Error).message
    };

    return NextResponse.json(diagnostics, {
      status: 500,
      headers: corsHeaders
    });
  }
}