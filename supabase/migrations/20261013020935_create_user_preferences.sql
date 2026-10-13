-- Spec 011: the user's preferences that follow them to every device (for now, the accent color).

create table public.user_preferences (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  accent text not null default 'verde',
  updated_at timestamptz not null default now(),

  -- Same list as ACCENTS in packages/core.
  constraint user_preferences_accent_known
    check (accent in ('verde', 'azul', 'violeta', 'rosa', 'naranja', 'turquesa'))
);

comment on table public.user_preferences is
  'One row per user, created the first time they choose something; without it, the defaults apply.';

alter table public.user_preferences enable row level security;

create policy "Users can read their preferences"
  on public.user_preferences for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their preferences"
  on public.user_preferences for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their preferences"
  on public.user_preferences for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Explicit privileges: anon gets nothing; the row is saved with an upsert on user_id, so the
-- user_id column is granted for insert and update too (RLS keeps it to their own).
revoke all on table public.user_preferences from anon, authenticated;
grant select on table public.user_preferences to authenticated;
grant insert (user_id, accent, updated_at), update (user_id, accent, updated_at)
  on table public.user_preferences to authenticated;
