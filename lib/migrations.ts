import { supabase } from './supabase';

/**
 * Migrates guest orders to authenticated user orders
 * This function is called when:
 * 1. A user creates an account with an email that has previous guest orders
 * 2. A user logs in and we detect guest orders with their email
 *
 * @param userId - The authenticated user's ID
 * @param email - The user's email address
 * @returns Object with success status and migrated order count
 */
export async function migrateGuestOrders(userId: string, email: string) {
  try {
    // 1. Find all guest orders with this email that haven't been migrated
    // Usar filter con sintaxis correcta para Supabase
    const { data: guestOrders, error: fetchError } = await supabase
      .from('guest_orders')
      .select('*')
      .eq('guest_email', email)
      .filter('migrated_to_user_id', 'is', 'null'); // Only non-migrated orders

    if (fetchError) {
      console.error('Error fetching guest orders:', fetchError);
      throw fetchError;
    }

    if (!guestOrders || guestOrders.length === 0) {
      console.log('No guest orders found to migrate');
      return {
        success: true,
        migratedCount: 0,
        message: 'No orders to migrate'
      };
    }

    console.log(`Found ${guestOrders.length} guest orders to migrate for ${email}`);

    // 2. Create corresponding orders in the orders table
    const ordersToInsert = guestOrders.map(guestOrder => ({
      user_id: userId,
      order_data: guestOrder.order_data,
      total_amount: guestOrder.total_amount,
      subtotal: guestOrder.order_data?.subtotal || guestOrder.total_amount,
      discount_amount: guestOrder.order_data?.discount || 0,
      shipping_amount: guestOrder.order_data?.shipping || 0,
      status: guestOrder.status || 'completado',
      payment_status: guestOrder.payment_status || 'completado',
      payment_method: guestOrder.payment_method || 'efectivo',
      coupon_code: guestOrder.order_data?.appliedCoupon?.code || null,
      shipping_address: {
        full_name: guestOrder.guest_name,
        phone: guestOrder.guest_phone,
        street_address: guestOrder.guest_address,
        city: 'Bogotá', // Default, can be updated
        state: 'Cundinamarca',
      },
      created_from_guest: true,
      guest_order_id: guestOrder.id,
      created_at: guestOrder.created_at,
    }));

    const { data: createdOrders, error: insertError } = await supabase
      .from('orders')
      .insert(ordersToInsert)
      .select();

    if (insertError) {
      console.error('Error inserting migrated orders:', insertError);
      throw insertError;
    }

    console.log(`Successfully created ${createdOrders?.length || 0} orders`);

    // 3. Mark guest orders as migrated
    const guestOrderIds = guestOrders.map(o => o.id);

    const { error: updateError } = await supabase
      .from('guest_orders')
      .update({
        migrated_to_user_id: userId,
        migrated_at: new Date().toISOString(),
      })
      .in('id', guestOrderIds);

    if (updateError) {
      console.error('Error marking guest orders as migrated:', updateError);
      // Don't throw - orders were already created
    }

    console.log(`Migration complete: ${createdOrders?.length || 0} orders migrated`);

    return {
      success: true,
      migratedCount: createdOrders?.length || 0,
      message: `Successfully migrated ${createdOrders?.length || 0} orders`
    };

  } catch (error: any) {
    console.error('Error in migrateGuestOrders:', error);
    return {
      success: false,
      migratedCount: 0,
      error: error.message || 'Unknown error during migration',
      message: 'Failed to migrate orders'
    };
  }
}

/**
 * Check if a user has guest orders that can be migrated
 * Useful for showing a notification/prompt to the user
 *
 * @param email - The user's email address
 * @returns Number of guest orders available for migration
 */
export async function checkGuestOrdersAvailable(email: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('guest_orders')
      .select('id', { count: 'exact', head: true })
      .eq('guest_email', email)
      .filter('migrated_to_user_id', 'is', 'null');

    if (error) {
      console.error('Error checking guest orders:', error);
      return 0;
    }

    return data?.length || 0;
  } catch (error) {
    console.error('Error in checkGuestOrdersAvailable:', error);
    return 0;
  }
}

/**
 * Get details of guest orders for a specific email
 * Useful for showing user what orders will be migrated
 *
 * @param email - The user's email address
 * @returns Array of guest order summaries
 */
export async function getGuestOrdersSummary(email: string) {
  try {
    const { data: guestOrders, error } = await supabase
      .from('guest_orders')
      .select('id, total_amount, created_at, status, order_data')
      .eq('guest_email', email)
      .filter('migrated_to_user_id', 'is', 'null')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching guest orders summary:', error);
      return [];
    }

    return guestOrders?.map(order => ({
      id: order.id,
      total: order.total_amount,
      date: order.created_at,
      status: order.status,
      itemCount: order.order_data?.items?.length || 0,
    })) || [];

  } catch (error) {
    console.error('Error in getGuestOrdersSummary:', error);
    return [];
  }
}
