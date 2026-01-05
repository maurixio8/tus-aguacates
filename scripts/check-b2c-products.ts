import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

(async () => {
  console.log('🔍 Verificando tabla products (B2C)...');
  const { count, error } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Productos en tabla products (B2C):', count || 0);
  }

  // Obtener muestra
  const { data } = await supabase
    .from('products')
    .select('id, name, category')
    .limit(10);

  console.log('\nMuestra de productos B2C:');
  data?.forEach((p: any, i: number) => {
    console.log(`  ${i+1}. ${p.name} (cat: ${p.category})`);
  });
})();
