-- Preserve the order/customer address text while allowing an admin correction
-- to be reviewed and confirmed separately.
alter table public.delivery_location_resolutions
  add column if not exists corrected_address text,
  add column if not exists customer_id uuid;

create index if not exists delivery_location_resolutions_customer_idx
  on public.delivery_location_resolutions(customer_id);
