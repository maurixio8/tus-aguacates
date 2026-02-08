import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Convert import.meta.url to __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.production to get the service role key
dotenv.config({ path: path.resolve(__dirname, '../.env.production') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
// Try to get service role key, fallback to anon key if not found (though service role needed for update)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials. Checked .env.production');
    console.log('URL:', supabaseUrl ? 'Found' : 'Missing');
    console.log('Key:', supabaseServiceKey ? 'Found' : 'Missing');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function manageCoupons() {
    console.log('🔄 Starting coupon management...');

    // 1. Deactivate all existing coupons
    console.log('1️⃣ Deactivating all active coupons...');

    // First, deactivate coupons that are NOT the new one we are about to create/update
    const { data: deactivated, error: deactivateError } = await supabase
        .from('coupons')
        .update({ is_active: false })
        .eq('is_active', true)
        .neq('code', 'NUEVO5000') // Don't deactivate our target coupon if it exists and is active
        .select();

    if (deactivateError) {
        console.error('❌ Error deactivating coupons:', deactivateError);
        // Don't exit, try to continue to create new coupon
    } else {
        console.log(`✅ Deactivated ${deactivated.length} coupons.`);
    }

    // 2. Create/Update Welcome Coupon
    console.log('2️⃣ Configuring "NUEVO5000" welcome coupon...');

    const welcomeCouponData = {
        code: 'NUEVO5000',
        description: 'Descuento de bienvenida para nuevos clientes',
        discount_type: 'fixed',
        discount_value: 5000,
        min_purchase: 0,
        usage_limit: 1,
        is_active: true,
        valid_from: new Date().toISOString(),
        // Ensure we don't overwrite created_at if updating
        updated_at: new Date().toISOString()
    };

    // Check if it exists
    const { data: existing } = await supabase
        .from('coupons')
        .select('id')
        .eq('code', 'NUEVO5000')
        .single();

    let result;
    if (existing) {
        console.log('   Coupon exists, updating...');
        result = await supabase
            .from('coupons')
            .update(welcomeCouponData)
            .eq('id', existing.id)
            .select();
    } else {
        console.log('   Creating new coupon...');
        result = await supabase
            .from('coupons')
            .insert({
                ...welcomeCouponData,
                created_at: new Date().toISOString()
            })
            .select();
    }

    if (result.error) {
        console.error('❌ Error configured welcome coupon:', result.error);
        process.exit(1);
    }

    console.log('✅ Welcome coupon "NUEVO5000" is configured and active.');
}

manageCoupons();
