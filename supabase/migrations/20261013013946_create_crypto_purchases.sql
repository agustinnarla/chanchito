-- Spec 010: bitcoin purchases, to follow a long-term investment.

create table public.crypto_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- Only bitcoin for now.
  asset text not null default 'BTC',
  -- Satoshis (1 BTC = 100.000.000): an integer, like cents.
  quantity bigint not null,
  -- What was paid, in cents.
  cost bigint not null,
  cost_currency public.currency not null default 'ARS',
  platform text not null default 'Binance',
  occurred_on date not null,
  created_at timestamptz not null default now(),

  constraint crypto_purchases_asset_btc check (asset = 'BTC'),
  constraint crypto_purchases_quantity_positive check (quantity > 0),
  constraint crypto_purchases_cost_positive check (cost > 0),
  -- Number.MAX_SAFE_INTEGER: values must stay exact in JavaScript.
  constraint crypto_purchases_quantity_safe check (quantity <= 9007199254740991),
  constraint crypto_purchases_cost_safe check (cost <= 9007199254740991),
  -- Same normalization as packages/core: no surrounding spaces, no repeated inner whitespace.
  constraint crypto_purchases_platform_normalized
    check (platform = regexp_replace(btrim(platform), '\s+', ' ', 'g')),
  constraint crypto_purchases_platform_length check (char_length(platform) between 1 and 30)
);

comment on table public.crypto_purchases is
  'Bitcoin purchases: quantity in satoshis and cost in cents.';

-- Listing by date for one user.
create index crypto_purchases_user_date_idx on public.crypto_purchases (user_id, occurred_on);

alter table public.crypto_purchases enable row level security;

create policy "Users can read their crypto purchases"
  on public.crypto_purchases for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their crypto purchases"
  on public.crypto_purchases for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their crypto purchases"
  on public.crypto_purchases for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their crypto purchases"
  on public.crypto_purchases for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Explicit privileges: anon gets nothing; the asset and the cost's currency can't change.
revoke all on table public.crypto_purchases from anon, authenticated;
grant select, delete on table public.crypto_purchases to authenticated;
grant insert (quantity, cost, cost_currency, platform, occurred_on)
  on table public.crypto_purchases to authenticated;
grant update (quantity, cost, platform, occurred_on)
  on table public.crypto_purchases to authenticated;
