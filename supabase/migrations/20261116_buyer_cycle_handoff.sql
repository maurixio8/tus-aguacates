-- Ensure a separate isolated purchase session exists for each buyer and delivery cycle.
-- This does not touch orders, products, order_items, or public.purchase_items.
create or replace function public.ensure_buyer_purchase_session(
  p_buyer_id uuid,
  p_delivery_date date
)
returns uuid
language plpgsql
security definer
set search_path = public, purchase_offline
as $$
declare
  v_session_id uuid;
begin
  if p_buyer_id is null or p_delivery_date is null then
    raise exception 'buyer_id y delivery_date son obligatorios';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_buyer_id::text || '|' || p_delivery_date::text, 0));

  select id into v_session_id
    from purchase_offline.purchase_sessions
   where buyer_id = p_buyer_id
     and delivery_date = p_delivery_date
   order by created_at asc
   limit 1;

  if v_session_id is null then
    insert into purchase_offline.purchase_sessions (
      buyer_id,
      delivery_date,
      status,
      cash_advanced,
      operational_expenses,
      actual_total_paid,
      promo_gift_enabled,
      promo_gift_qty_per_trigger
    ) values (
      p_buyer_id,
      p_delivery_date,
      'draft',
      0,
      '{}'::jsonb,
      0,
      true,
      5
    ) returning id into v_session_id;
  end if;

  return v_session_id;
end;
$$;

revoke all on function public.ensure_buyer_purchase_session(uuid, date) from public, anon, authenticated;
grant execute on function public.ensure_buyer_purchase_session(uuid, date) to service_role;
