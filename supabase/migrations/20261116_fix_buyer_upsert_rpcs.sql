begin;

create or replace function public.upsert_buyer_purchase_item(
  p_buyer_id uuid,
  p_session_id uuid,
  p_item_id text default null,
  p_projected_key text default null,
  p_source_order_id uuid default null,
  p_source_order_line_id uuid default null,
  p_product_id uuid default null,
  p_product_name text default null,
  p_variant_id uuid default null,
  p_variant_name text default null,
  p_variant_value text default null,
  p_requested_qty numeric default 0,
  p_purchased_qty numeric default 0,
  p_weight_kg numeric default null,
  p_blind_price numeric default null,
  p_actual_total_paid numeric default null,
  p_supplier_id text default null,
  p_sub_location_hint text default null,
  p_ripeness_note_snapshot text default null,
  p_is_promo_gift boolean default false,
  p_unit text default 'unit',
  p_mutation_id text default null,
  p_operational_expenses jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, purchase_offline
as $$
declare
  v_session purchase_offline.purchase_sessions%rowtype;
  v_item purchase_offline.purchase_items%rowtype;
  v_item_uuid uuid;
  v_observation_exists boolean := false;
  v_item_found boolean := false;
  v_total numeric := coalesce(p_actual_total_paid, 0);
begin
  select * into v_session
    from purchase_offline.purchase_sessions
   where id = p_session_id and buyer_id = p_buyer_id;
  if not found then raise exception 'Jornada no autorizada'; end if;

  if p_item_id is not null and p_item_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    v_item_uuid := p_item_id::uuid;
    select * into v_item from purchase_offline.purchase_items
     where id = v_item_uuid and session_id = p_session_id;
    v_item_found := found;
  end if;

  if not v_item_found and p_product_name is not null then
    select * into v_item from purchase_offline.purchase_items
     where session_id = p_session_id
       and product_name = p_product_name
       and coalesce(variant_value, '') = coalesce(p_variant_value, '')
       and coalesce(supplier_id, '') = coalesce(p_supplier_id, '')
     order by updated_at desc
     limit 1;
    v_item_found := found;
  end if;

  if not v_item_found then
    insert into purchase_offline.purchase_items (
      session_id, source_order_id, source_order_line_id, product_id,
      product_name, variant_id, variant_name, variant_value,
      requested_qty, purchased_qty, weight_kg, supplier_id,
      sub_location_hint, ripeness_note_snapshot, is_promo_gift, unit
    ) values (
      p_session_id, p_source_order_id, p_source_order_line_id, p_product_id,
      coalesce(p_product_name, 'Producto'), p_variant_id, p_variant_name, p_variant_value,
      greatest(coalesce(p_requested_qty, 0), 0), greatest(coalesce(p_purchased_qty, 0), 0),
      p_weight_kg, p_supplier_id, p_sub_location_hint, p_ripeness_note_snapshot,
      coalesce(p_is_promo_gift, false), coalesce(nullif(p_unit, ''), 'unit')
    ) returning * into v_item;
  else
    update purchase_offline.purchase_items
       set source_order_id = coalesce(p_source_order_id, source_order_id),
           source_order_line_id = coalesce(p_source_order_line_id, source_order_line_id),
           product_id = coalesce(p_product_id, product_id),
           variant_id = coalesce(p_variant_id, variant_id),
           variant_name = coalesce(p_variant_name, variant_name),
           variant_value = coalesce(p_variant_value, variant_value),
           requested_qty = greatest(coalesce(p_requested_qty, requested_qty), requested_qty),
           purchased_qty = greatest(coalesce(p_purchased_qty, purchased_qty), 0),
           weight_kg = coalesce(p_weight_kg, weight_kg),
           supplier_id = coalesce(p_supplier_id, supplier_id),
           sub_location_hint = coalesce(p_sub_location_hint, sub_location_hint),
           ripeness_note_snapshot = coalesce(p_ripeness_note_snapshot, ripeness_note_snapshot),
           is_promo_gift = coalesce(p_is_promo_gift, is_promo_gift),
           unit = coalesce(nullif(p_unit, ''), unit),
           updated_at = now()
     where id = v_item.id and session_id = p_session_id
     returning * into v_item;
  end if;

  if p_mutation_id is not null then
    select exists(
      select 1 from purchase_offline.purchase_price_observations
       where session_id = p_session_id
         and notes = 'mutation_id:' || p_mutation_id
    ) into v_observation_exists;
  end if;

  if not v_observation_exists and (p_blind_price is not null or p_actual_total_paid is not null or p_weight_kg is not null) then
    insert into purchase_offline.purchase_price_observations
      (session_id, purchase_item_id, blind_price, actual_total_paid, weight_kg, notes)
    values
      (p_session_id, v_item.id, greatest(coalesce(p_blind_price, p_actual_total_paid, 0), 0),
       case when p_actual_total_paid is null then null else greatest(p_actual_total_paid, 0) end,
       p_weight_kg, 'mutation_id:' || coalesce(p_mutation_id, ''));

    update purchase_offline.purchase_sessions
       set actual_total_paid = coalesce(actual_total_paid, 0) + v_total,
           updated_at = now()
     where id = p_session_id and buyer_id = p_buyer_id;
  end if;

  if p_operational_expenses is not null then
    update purchase_offline.purchase_sessions
       set operational_expenses = p_operational_expenses,
           updated_at = now()
     where id = p_session_id and buyer_id = p_buyer_id;
  end if;

  return jsonb_build_object('success', true, 'item_id', v_item.id, 'mutation_id', p_mutation_id);
end;
$$;

create or replace function public.update_buyer_session_finances(
  p_buyer_id uuid,
  p_session_id uuid,
  p_cash_advanced numeric default null,
  p_operational_expenses jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, purchase_offline
as $$
declare
  v_session purchase_offline.purchase_sessions%rowtype;
begin
  select * into v_session from purchase_offline.purchase_sessions
   where id = p_session_id and buyer_id = p_buyer_id;
  if not found then raise exception 'Jornada no autorizada'; end if;

  update purchase_offline.purchase_sessions
     set cash_advanced = case when p_cash_advanced is null then cash_advanced else greatest(p_cash_advanced, 0) end,
         operational_expenses = case when p_operational_expenses is null then operational_expenses else p_operational_expenses end,
         updated_at = now()
   where id = p_session_id and buyer_id = p_buyer_id;

  return jsonb_build_object('success', true, 'session_id', p_session_id);
end;
$$;

create or replace function public.upsert_buyer_packing_item(
  p_buyer_id uuid,
  p_session_id uuid,
  p_item_id text default null,
  p_projected_key text default null,
  p_source_order_id uuid default null,
  p_source_order_line_id uuid default null,
  p_source_order_number text default null,
  p_customer_id uuid default null,
  p_customer_name text default null,
  p_product_id uuid default null,
  p_product_name text default null,
  p_variant_id uuid default null,
  p_variant_name text default null,
  p_variant_value text default null,
  p_requested_qty numeric default 0,
  p_picked_qty numeric default 0,
  p_ripeness_note_snapshot text default null,
  p_is_promo_gift boolean default false,
  p_status text default 'pending'
)
returns jsonb
language plpgsql
security definer
set search_path = public, purchase_offline
as $$
declare
  v_session purchase_offline.purchase_sessions%rowtype;
  v_item purchase_offline.packing_items%rowtype;
  v_item_uuid uuid;
  v_item_found boolean := false;
  v_status text := case when p_status in ('pending','picked','missing','packed') then p_status else 'pending' end;
begin
  select * into v_session from purchase_offline.purchase_sessions
   where id = p_session_id and buyer_id = p_buyer_id;
  if not found then raise exception 'Jornada no autorizada'; end if;

  if p_item_id is not null and p_item_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    v_item_uuid := p_item_id::uuid;
    select * into v_item from purchase_offline.packing_items
     where id = v_item_uuid and session_id = p_session_id;
    v_item_found := found;
  end if;

  if not v_item_found and p_product_name is not null then
    select * into v_item from purchase_offline.packing_items
     where session_id = p_session_id
       and coalesce(source_order_number, '') = coalesce(p_source_order_number, '')
       and coalesce(customer_name, '') = coalesce(p_customer_name, '')
       and product_name = p_product_name
       and coalesce(variant_value, '') = coalesce(p_variant_value, '')
       and is_promo_gift = coalesce(p_is_promo_gift, false)
     order by updated_at desc
     limit 1;
    v_item_found := found;
  end if;

  if not v_item_found then
    insert into purchase_offline.packing_items (
      session_id, source_order_id, source_order_line_id, source_order_number,
      customer_id, customer_name, product_id, product_name, variant_id,
      variant_name, variant_value, requested_qty, picked_qty,
      ripeness_note_snapshot, is_promo_gift, status
    ) values (
      p_session_id, p_source_order_id, p_source_order_line_id, p_source_order_number,
      p_customer_id, p_customer_name, p_product_id, coalesce(p_product_name, 'Producto'), p_variant_id,
      p_variant_name, p_variant_value, greatest(coalesce(p_requested_qty, 0), 0), greatest(coalesce(p_picked_qty, 0), 0),
      p_ripeness_note_snapshot, coalesce(p_is_promo_gift, false), v_status
    ) returning * into v_item;
  else
    update purchase_offline.packing_items
       set source_order_id = coalesce(p_source_order_id, source_order_id),
           source_order_line_id = coalesce(p_source_order_line_id, source_order_line_id),
           source_order_number = coalesce(p_source_order_number, source_order_number),
           customer_id = coalesce(p_customer_id, customer_id),
           customer_name = coalesce(p_customer_name, customer_name),
           product_id = coalesce(p_product_id, product_id),
           variant_id = coalesce(p_variant_id, variant_id),
           variant_name = coalesce(p_variant_name, variant_name),
           variant_value = coalesce(p_variant_value, variant_value),
           requested_qty = greatest(coalesce(p_requested_qty, requested_qty), requested_qty),
           picked_qty = greatest(coalesce(p_picked_qty, picked_qty), 0),
           ripeness_note_snapshot = coalesce(p_ripeness_note_snapshot, ripeness_note_snapshot),
           is_promo_gift = coalesce(p_is_promo_gift, is_promo_gift),
           status = v_status,
           updated_at = now()
     where id = v_item.id and session_id = p_session_id
     returning * into v_item;
  end if;

  return jsonb_build_object('success', true, 'item_id', v_item.id, 'status', v_item.status);
end;
$$;

revoke all on function public.upsert_buyer_purchase_item(uuid, uuid, text, text, uuid, uuid, uuid, text, uuid, text, text, numeric, numeric, numeric, numeric, numeric, text, text, text, boolean, text, text, jsonb) from public;
revoke all on function public.update_buyer_session_finances(uuid, uuid, numeric, jsonb) from public;
revoke all on function public.upsert_buyer_packing_item(uuid, uuid, text, text, uuid, uuid, text, uuid, text, uuid, text, uuid, text, text, numeric, numeric, text, boolean, text) from public;
grant execute on function public.upsert_buyer_purchase_item(uuid, uuid, text, text, uuid, uuid, uuid, text, uuid, text, text, numeric, numeric, numeric, numeric, numeric, text, text, text, boolean, text, text, jsonb) to anon, authenticated, service_role;
grant execute on function public.update_buyer_session_finances(uuid, uuid, numeric, jsonb) to anon, authenticated, service_role;
grant execute on function public.upsert_buyer_packing_item(uuid, uuid, text, text, uuid, uuid, text, uuid, text, uuid, text, uuid, text, text, numeric, numeric, text, boolean, text) to anon, authenticated, service_role;

commit;
