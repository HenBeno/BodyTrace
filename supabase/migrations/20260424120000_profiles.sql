-- BodyTrace user profile (linked to auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null,
  last_name text not null,
  weight_kg numeric not null,
  height_cm numeric not null,
  target_weight_kg numeric not null,
  cardio_sessions_per_week integer,
  strength_sessions_per_week integer,
  circumferences_json jsonb,
  body_fat_percent numeric,
  onboarding_completed boolean not null default false,
  updated_at timestamptz default now()
);

create index if not exists profiles_onboarding_idx on public.profiles (onboarding_completed);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
on public.profiles
for select
using (auth.uid() = id);

create policy "profiles_insert_own"
on public.profiles
for insert
with check (auth.uid() = id);

create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);
