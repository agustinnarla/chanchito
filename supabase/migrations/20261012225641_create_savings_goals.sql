-- Spec 009: savings goals and the money put into them (or taken out).

-- Goals -----------------------------------------------------------------------

create table public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  emoji text not null default 'package',
  -- What it costs, in cents; can be in another currency than the savings ("US$ 800").
  target_amount bigint not null,
  target_currency public.currency not null,
  -- The currency the money is saved in. Can't change: contributions are in it.
  saving_currency public.currency not null,
  archived boolean not null default false,
  created_at timestamptz not null default now(),

  -- Same normalization as packages/core: no surrounding spaces, no repeated inner whitespace.
  constraint savings_goals_name_normalized check (name = regexp_replace(btrim(name), '\s+', ' ', 'g')),
  constraint savings_goals_name_length check (char_length(name) between 1 and 40),
  -- A key from the curated list in packages/core (spec 006); the list itself is checked there.
  constraint savings_goals_emoji_format check (emoji ~ '^[a-z0-9_]{1,40}$'),
  constraint savings_goals_target_positive check (target_amount > 0),
  -- Number.MAX_SAFE_INTEGER: amounts must stay exact in JavaScript.
  constraint savings_goals_target_safe check (target_amount <= 9007199254740991),
  -- Target of the composite foreign key below: contributions go in the goal's saving currency.
  constraint savings_goals_id_user_id_currency_key unique (id, user_id, saving_currency)
);

comment on table public.savings_goals is 'Money set aside for something concrete, with its target.';

-- Unique name per user, ignoring case, like categories.
create unique index savings_goals_user_name_key on public.savings_goals (user_id, lower(name));

alter table public.savings_goals enable row level security;

create policy "Users can read their savings goals"
  on public.savings_goals for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their savings goals"
  on public.savings_goals for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their savings goals"
  on public.savings_goals for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their savings goals"
  on public.savings_goals for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Explicit privileges: anon gets nothing; the saving currency can't change after creating it.
revoke all on table public.savings_goals from anon, authenticated;
grant select, delete on table public.savings_goals to authenticated;
grant insert (name, emoji, target_amount, target_currency, saving_currency)
  on table public.savings_goals to authenticated;
grant update (name, emoji, target_amount, target_currency, archived)
  on table public.savings_goals to authenticated;

-- Contributions ---------------------------------------------------------------

create table public.savings_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  goal_id uuid not null,
  -- Cents: positive puts money in, negative takes it out. Never zero.
  amount bigint not null,
  currency public.currency not null,
  occurred_on date not null,
  created_at timestamptz not null default now(),

  -- The goal must belong to the same user (RLS is not applied to foreign key checks) and the
  -- contribution be in its saving currency. Deleting the goal deletes its contributions.
  constraint savings_contributions_goal_fkey foreign key (goal_id, user_id, currency)
    references public.savings_goals (id, user_id, saving_currency) on delete cascade,
  constraint savings_contributions_amount_not_zero check (amount <> 0),
  constraint savings_contributions_amount_safe
    check (amount between -9007199254740991 and 9007199254740991)
);

comment on table public.savings_contributions is
  'Money put into a savings goal (positive) or taken out (negative), in cents.';

-- Listing by date for one user, and foreign key lookups when deleting a goal.
create index savings_contributions_user_date_idx
  on public.savings_contributions (user_id, occurred_on);
create index savings_contributions_goal_id_idx on public.savings_contributions (goal_id);

alter table public.savings_contributions enable row level security;

create policy "Users can read their contributions"
  on public.savings_contributions for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their contributions"
  on public.savings_contributions for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their contributions"
  on public.savings_contributions for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their contributions"
  on public.savings_contributions for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Explicit privileges: anon gets nothing; a contribution can't move to another goal or currency.
revoke all on table public.savings_contributions from anon, authenticated;
grant select, delete on table public.savings_contributions to authenticated;
grant insert (goal_id, amount, currency, occurred_on)
  on table public.savings_contributions to authenticated;
grant update (amount, occurred_on) on table public.savings_contributions to authenticated;
