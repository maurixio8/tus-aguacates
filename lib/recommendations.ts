import { supabase } from './supabase';
import type { Product } from './supabase';

export interface UserPurchaseHistory {
  productId: string;
  productName: string;
  categoryId: string;
  quantity: number;
  totalSpent: number;
  lastPurchaseDate: string;
}

export interface RecommendationScore {
  product: Product;
  score: number;
  reason: string;
}

/**
 * Get user's purchase history from orders
 */
export async function getUserPurchaseHistory(userId: string): Promise<UserPurchaseHistory[]> {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('order_data, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const purchaseMap = new Map<string, UserPurchaseHistory>();

    orders?.forEach((order) => {
      const items = order.order_data?.items || [];
      items.forEach((item: any) => {
        const productId = item.productId;
        if (!productId) return;

        const existing = purchaseMap.get(productId);
        if (existing) {
          existing.quantity += item.quantity || 1;
          existing.totalSpent += item.price || 0;
          // Keep most recent purchase date
          if (new Date(order.created_at) > new Date(existing.lastPurchaseDate)) {
            existing.lastPurchaseDate = order.created_at;
          }
        } else {
          purchaseMap.set(productId, {
            productId,
            productName: item.productName,
            categoryId: '', // Will be filled later
            quantity: item.quantity || 1,
            totalSpent: item.price || 0,
            lastPurchaseDate: order.created_at,
          });
        }
      });
    });

    return Array.from(purchaseMap.values());
  } catch (error) {
    console.error('Error getting purchase history:', error);
    return [];
  }
}

/**
 * Calculate recommendation scores for products
 */
export async function getRecommendedProducts(
  userId: string,
  limit: number = 6
): Promise<Product[]> {
  try {
    // 1. Get user's purchase history
    const history = await getUserPurchaseHistory(userId);

    // 2. Get all active products
    const { data: allProducts, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .gt('stock', 0);

    if (error) throw error;
    if (!allProducts) return [];

    // 3. Extract purchased product IDs and category preferences
    const purchasedProductIds = new Set(history.map(h => h.productId));
    const categoryFrequency = new Map<string, number>();

    history.forEach(item => {
      const product = allProducts.find(p => p.id === item.productId);
      if (product) {
        const count = categoryFrequency.get(product.category_id) || 0;
        categoryFrequency.set(product.category_id, count + item.quantity);
      }
    });

    // 4. Score products
    const scores: RecommendationScore[] = allProducts
      .filter(product => !purchasedProductIds.has(product.id)) // Exclude already purchased
      .map(product => {
        let score = 0;
        let reason = '';

        // Factor 1: Same category as frequently purchased (weight: 3)
        const categoryScore = categoryFrequency.get(product.category_id) || 0;
        if (categoryScore > 0) {
          score += categoryScore * 3;
          reason = 'Categoría que te gusta';
        }

        // Factor 2: Featured products (weight: 2)
        if (product.is_featured) {
          score += 2;
          if (!reason) reason = 'Producto destacado';
        }

        // Factor 3: Has discount (weight: 1.5)
        if (product.discount_price && product.discount_price < product.price) {
          score += 1.5;
          if (!reason) reason = 'En oferta';
        }

        // Factor 4: High rating (weight: 1)
        if (product.rating >= 4.5) {
          score += product.rating / 5;
          if (!reason) reason = 'Muy bien valorado';
        }

        // Factor 5: New products (created in last 30 days, weight: 1)
        const createdDate = new Date(product.created_at);
        const daysSinceCreated = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceCreated <= 30) {
          score += 1;
          if (!reason) reason = 'Producto nuevo';
        }

        return { product, score, reason };
      })
      .filter(item => item.score > 0); // Only products with some relevance

    // 5. Sort by score and return top N
    scores.sort((a, b) => b.score - a.score);

    return scores.slice(0, limit).map(item => item.product);

  } catch (error) {
    console.error('Error getting recommendations:', error);
    // Fallback: return featured products
    return getFallbackRecommendations(limit);
  }
}

/**
 * Fallback recommendations for new users or errors
 */
async function getFallbackRecommendations(limit: number = 6): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .eq('is_featured', true)
      .gt('stock', 0)
      .order('rating', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting fallback recommendations:', error);
    return [];
  }
}

/**
 * Get user statistics for display
 */
export async function getUserStats(userId: string) {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('total_amount, created_at, status, order_data')
      .eq('user_id', userId);

    if (error) throw error;

    const totalOrders = orders?.length || 0;
    const totalSpent = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

    const completedOrders = orders?.filter(o =>
      o.status === 'completado' || o.status === 'entregado' || o.status === 'pagado'
    ).length || 0;

    // Calculate favorite category
    const categoryCount = new Map<string, number>();
    orders?.forEach(order => {
      const items = order.order_data?.items || [];
      items.forEach((item: any) => {
        const category = item.productName?.split(' ')[0] || 'Otros'; // Simple heuristic
        categoryCount.set(category, (categoryCount.get(category) || 0) + 1);
      });
    });

    let favoriteCategory = 'Ninguna';
    let maxCount = 0;
    categoryCount.forEach((count, category) => {
      if (count > maxCount) {
        maxCount = count;
        favoriteCategory = category;
      }
    });

    // Get most recent order date
    const lastOrderDate = orders && orders.length > 0
      ? new Date(Math.max(...orders.map(o => new Date(o.created_at).getTime())))
      : null;

    return {
      totalOrders,
      completedOrders,
      totalSpent,
      favoriteCategory,
      lastOrderDate: lastOrderDate ? lastOrderDate.toISOString() : null,
      averageOrderValue: totalOrders > 0 ? Math.round(totalSpent / totalOrders) : 0,
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    return {
      totalOrders: 0,
      completedOrders: 0,
      totalSpent: 0,
      favoriteCategory: 'Ninguna',
      lastOrderDate: null,
      averageOrderValue: 0,
    };
  }
}

/**
 * Get last order details for user
 */
export async function getLastOrder(userId: string) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting last order:', error);
    return null;
  }
}
