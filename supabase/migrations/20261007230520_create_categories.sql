-- Spec 002: categories for movements (spec 003) and budgets (spec 005).

create type public.category_kind as enum ('income', 'expense');

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  kind public.category_kind not null,
  created_at timestamptz not null default now(),

  -- Same normalization as packages/core: no surrounding spaces, no repeated inner whitespace.
  constraint categories_name_normalized check (name = regexp_replace(btrim(name), '\s+', ' ', 'g')),
  constraint categories_name_length check (char_length(name) between 1 and 50)
);

comment on table public.categories is 'User categories for income and expense movements.';

-- Unique name per user and kind, ignoring case ("Comida" and "comida" clash; accents still count).
create unique index categories_user_kind_name_key
  on public.categories (user_id, kind, lower(name));

-- Row Level Security: each user only sees and changes their own rows.
alter table public.categories enable row level security;

create policy "Users can read their categories"
  on public.categories for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their categories"
  on public.categories for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their categories"
  on public.categories for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their categories"
  on public.categories for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Explicit privileges instead of the defaults:
-- - anon gets nothing.
-- - authenticated can only set name and kind on insert (id, user_id and created_at come from defaults),
--   and only change name on update, so kind and user_id are immutable.
revoke all on table public.categories from anon, authenticated;
grant select, delete on table public.categories to authenticated;
grant insert (name, kind) on table public.categories to authenticated;
grant update (name) on table public.categories to authenticated;
