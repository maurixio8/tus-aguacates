# Buyer purchase pilot activation

## Order of operations

1. Provision the canonical additive migration `20261115_create_purchase_offline_canonical.sql` after the existing business schema. Do not apply either removed legacy purchase migration.
2. Configure `BUYER_JWT_SECRET` in the deployment secret store; never commit it. Issue short-lived HS256 JWTs with `sub` set to the Supabase Auth user id and `role=buyer`.
3. Create pilot users only through Supabase Auth, setting `user_metadata.role=buyer` (and a display name if needed). This pilot does not create users or touch production data.
4. Exchange the JWT once at `POST /api/auth/buyer/session` with `Authorization: Bearer <token>`. The server sets the 15-minute, httpOnly, same-site `buyer-session` cookie. Open `/admin/compras`; the page reads only `/api/buyer/purchase-data`.
5. Confirm the buyer can read only their scoped order projection and receives 401/403 from admin APIs and other admin surfaces. Keep the existing admin cookie/login path unchanged.

## Rollback

Revert the feature commit and remove the buyer session cookie. Do not drop business tables or alter `orders`/`products`; the migration is additive. If the migration was applied, leave the new tables intact for audit or remove them only through a separately reviewed rollback migration.
