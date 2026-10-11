-- Spec 003: income and expense movements, and archiving categories that have movements.

create type public.currency as enum ('ARS', 'USD');

-- Categories ------------------------------------------------------------------

-- Archived categories are hidden when creating movements but kept for old movements.
alter table public.categories add column archived_at timestamptz;

-- Target of the composite foreign key below: (id, user_id) pairs.
alter table public.categories
  add constraint categories_id_user_id_key unique (id, user_id);

grant update (archived_at) on table public.categories to authenticated;

-- Movements -------------------------------------------------------------------

create table public.movements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category_id uuid not null,
  -- Cents, always positive; the kind (income/expense) comes from the category.
  amount bigint not null,
  currency public.currency not null,
  occurred_on date not null,
  description text,
  created_at timestamptz not null default now(),

  -- The category must belong to the same user (RLS is not applied to foreign key checks).
  -- "no action" blocks deleting a category with movements, but still lets a user deletion
  -- cascade to both tables in the same statement (unlike "restrict", checked immediately).
  constraint movements_category_fkey foreign key (category_id, user_id)
    references public.categories (id, user_id) on delete no action,
  constraint movements_amount_positive check (amount > 0),
  -- Number.MAX_SAFE_INTEGER: amounts must stay exact in JavaScript.
  constraint movements_amount_safe check (amount <= 9007199254740991),
  -- Same normalization as packages/core; empty descriptions are stored as null.
  constraint movements_description_normalized check (
    description is null
    or (
      description = regexp_replace(btrim(description), '\s+', ' ', 'g')
      and char_length(description) between 1 and 100
    )
  )
);

comment on table public.movements is 'Income and expense movements, in cents, per currency.';

-- Listing by month for one user.
create index movements_user_occurred_on_idx on public.movements (user_id, occurred_on desc);
-- Foreign key lookups when deleting or archiving a category.
create index movements_category_id_idx on public.movements (category_id);

alter table public.movements enable row level security;

create policy "Users can read their movements"
  on public.movements for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their movements"
  on public.movements for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their movements"
  on public.movements for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their movements"
  on public.movements for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Explicit privileges: anon gets nothing; user_id, id and created_at can't be set or changed.
revoke all on table public.movements from anon, authenticated;
grant select, delete on table public.movements to authenticated;
grant insert (category_id, amount, currency, occurred_on, description)
  on table public.movements to authenticated;
grant update (category_id, amount, currency, occurred_on, description)
  on table public.movements to authenticated;
