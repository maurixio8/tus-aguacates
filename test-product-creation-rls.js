const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.production') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Testing Supabase Connection...');
console.log('URL:', supabaseUrl);
console.log('Key (truncated):', supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'MISSING');

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase configuration. Make sure .env.production is accessible.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl.trim(), supabaseKey.trim());

async function testInsert() {
    console.log('Attempting to insert a test product...');
    const testProduct = {
        name: 'Test Product ' + Date.now(),
        description: 'This is a test product created by diagnostic script',
        price: 1000,
        category_id: 'cce91d25-cbac-4d8d-bde9-488443508159', // Using a category ID from catalog_final.sql
        stock: 10,
        slug: 'test-product-' + Date.now(),
        is_active: true,
        unit: 'unit',
        sku: 'TEST-' + Date.now(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
        .from('products')
        .insert(testProduct)
        .select();

    if (error) {
        console.error('❌ Error inserting product:', error);
        if (error.code === '42501') {
            console.log('🚨 CONFIRMED: RLS is blocking the insert. This means the key used is NOT a Service Role Key or doesn\'t have bypass RLS permissions.');
        }
    } else {
        console.log('✅ Success! Product created:', data);
        // Cleanup
        const { error: deleteError } = await supabase
            .from('products')
            .delete()
            .eq('id', data[0].id);
        if (deleteError) console.error('Error cleaning up:', deleteError);
        else console.log('🗑️ Test product cleaned up.');
    }
}

testInsert();
