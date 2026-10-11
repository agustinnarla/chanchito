-- Spec 005: monthly budgets per expense category and currency.

-- Categories ------------------------------------------------------------------

-- Target of the composite foreign key below: it lets budgets require an expense category.
alter table public.categories
  add constraint categories_id_user_id_kind_key unique (id, user_id, kind);

-- Budgets ---------------------------------------------------------------------

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category_id uuid not null,
  -- Always 'expense': part of the foreign key, so the category must be an expense one.
  category_kind public.category_kind not null default 'expense',
  -- First day of the month.
  month date not null,
  -- Cents, always positive.
  amount bigint not null,
  currency public.currency not null,
  created_at timestamptz not null default now(),

  -- The category must belong to the same user (RLS is not applied to foreign key checks)
  -- and be an expense one (a category's kind can't change). Deleting it deletes its budgets.
  constraint budgets_category_fkey foreign key (category_id, user_id, category_kind)
    references public.categories (id, user_id, kind) on delete cascade,
  constraint budgets_expense_only check (category_kind = 'expense'),
  constraint budgets_month_first_day check (extract(day from month) = 1),
  constraint budgets_amount_positive check (amount > 0),
  -- Number.MAX_SAFE_INTEGER: amounts must stay exact in JavaScript.
  constraint budgets_amount_safe check (amount <= 9007199254740991),
  constraint budgets_category_month_currency_key unique (user_id, category_id, month, currency)
);

comment on table public.budgets is
  'Monthly spending limits per expense category and currency, in cents.';

-- Listing by month for one user.
create index budgets_user_month_idx on public.budgets (user_id, month);
-- Foreign key lookups when deleting a category.
create index budgets_category_id_idx on public.budgets (category_id);

alter table public.budgets enable row level security;

create policy "Users can read their budgets"
  on public.budgets for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their budgets"
  on public.budgets for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their budgets"
  on public.budgets for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their budgets"
  on public.budgets for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Explicit privileges: anon gets nothing. Only the amount can change after creating a budget;
-- user_id, category_kind, id and created_at come from defaults.
revoke all on table public.budgets from anon, authenticated;
grant select, delete on table public.budgets to authenticated;
grant insert (category_id, month, amount, currency) on table public.budgets to authenticated;
grant update (amount) on table public.budgets to authenticated;
