-- Spec 013: weekly budgets, a limit for every week (Monday to Sunday) of a category's expenses.

create table public.weekly_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category_id uuid not null,
  -- Always 'expense': part of the foreign key, so the category must be an expense one.
  category_kind public.category_kind not null default 'expense',
  -- Cents, always positive; the same every week.
  amount bigint not null,
  currency public.currency not null,
  created_at timestamptz not null default now(),

  -- The category must belong to the same user (RLS is not applied to foreign key checks) and be
  -- an expense one, like monthly budgets (spec 005). Deleting it deletes its weekly budgets.
  constraint weekly_budgets_category_fkey foreign key (category_id, user_id, category_kind)
    references public.categories (id, user_id, kind) on delete cascade,
  constraint weekly_budgets_expense_only check (category_kind = 'expense'),
  constraint weekly_budgets_amount_positive check (amount > 0),
  -- Number.MAX_SAFE_INTEGER: amounts must stay exact in JavaScript.
  constraint weekly_budgets_amount_safe check (amount <= 9007199254740991),
  -- One weekly budget per category and currency; a monthly one can exist alongside.
  constraint weekly_budgets_category_currency_key unique (user_id, category_id, currency)
);

comment on table public.weekly_budgets is
  'Weekly spending limits per expense category and currency, in cents; they repeat every week.';

-- Foreign key lookups when deleting a category.
create index weekly_budgets_category_id_idx on public.weekly_budgets (category_id);

alter table public.weekly_budgets enable row level security;

create policy "Users can read their weekly budgets"
  on public.weekly_budgets for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their weekly budgets"
  on public.weekly_budgets for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their weekly budgets"
  on public.weekly_budgets for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their weekly budgets"
  on public.weekly_budgets for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Explicit privileges: anon gets nothing. Only the amount can change after creating one.
revoke all on table public.weekly_budgets from anon, authenticated;
grant select, delete on table public.weekly_budgets to authenticated;
grant insert (category_id, amount, currency) on table public.weekly_budgets to authenticated;
grant update (amount) on table public.weekly_budgets to authenticated;
