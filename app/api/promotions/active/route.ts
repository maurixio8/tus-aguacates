import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// Fallback promotions in case database is not available
const fallbackPromotions = [
  {
    id: '1',
    title: 'Aguacates Frescos',
    description: 'Directamente del campo a tu mesa',
    image_url: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=1200&h=400&fit=crop',
    link: '/productos?categoria=aguacates',
    sort_order: 1,
    is_active: true
  },
  {
    id: '2',
    title: 'Frutas Tropicales',
    description: 'El sabor exótico que buscas',
    image_url: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=1200&h=400&fit=crop',
    link: '/productos?categoria=frutas-tropicales',
    sort_order: 2,
    is_active: true
  },
  {
    id: '3',
    title: 'Envío Gratis',
    description: 'En pedidos mayores a $68.900',
    image_url: 'https://images.unsplash.com/photo-1604386494523-d60f124d0a65?w=1200&h=400&fit=crop',
    link: '/productos',
    sort_order: 3,
    is_active: true
  }
];

// GET - Get active promotions
export async function GET() {
  try {
    console.log('📡 API: Fetching active promotions...');

    // Get active promotions ordered by sort_order
    const { data: promotions, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    // Handle database errors gracefully
    if (error) {
      console.warn('⚠️ Database promotions not available, using fallback:', error.message);

      // Return fallback promotions if table doesn't exist or has other errors
      return NextResponse.json({
        success: true,
        promotions: fallbackPromotions,
        count: fallbackPromotions.length,
        source: 'fallback'
      });
    }

    // Filter out promotions without image_url for now
    const validPromotions = (promotions || []).filter(p => p.image_url);

    // If no valid promotions from database, use fallback
    if (validPromotions.length === 0) {
      console.log('📦 No valid promotions found, using fallback');
      return NextResponse.json({
        success: true,
        promotions: fallbackPromotions,
        count: fallbackPromotions.length,
        source: 'fallback'
      });
    }

    console.log(`✅ API: Found ${validPromotions.length} active promotions`);

    return NextResponse.json({
      success: true,
      promotions: validPromotions,
      count: validPromotions.length,
      source: 'database'
    });

  } catch (error) {
    console.error('❌ API Error:', error);

    // Always return fallback promotions instead of errors
    return NextResponse.json({
      success: true,
      promotions: fallbackPromotions,
      count: fallbackPromotions.length,
      source: 'fallback-error'
    });
  }
}