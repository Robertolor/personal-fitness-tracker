-- Fitness Tracker initial schema
-- Project: fitness-app-dev (yrihprcinsramxebvilf)

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  start_date date not null default '2026-06-01',
  calorie_target integer not null default 1750,
  protein_target_g integer not null default 180,
  fat_target_g integer not null default 65,
  carb_target_g integer not null default 225,
  body_weight_start_kg numeric(5,2) default 80,
  goal_body_fat_pct numeric(4,3) default 0.15,
  schedule jsonb not null default '["Rest","Push A","Pull A","Legs A","Push B","Pull B","Legs B"]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.routine_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique(user_id, name)
);

create table if not exists public.routine_exercises (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.routine_templates(id) on delete cascade,
  name text not null,
  target_sets text,
  rep_range text,
  primary_muscle text,
  notes text,
  sort_order integer not null default 0
);

create table if not exists public.daily_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  checkin_date date not null,
  weight_kg numeric(5,2),
  body_fat_pct numeric(4,2),
  sleep smallint check (sleep between 1 and 5),
  energy smallint check (energy between 1 and 5),
  hunger smallint check (hunger between 1 and 5),
  stress smallint check (stress between 1 and 5),
  muscle_fatigue smallint check (muscle_fatigue between 1 and 5),
  steps integer,
  calories_consumed integer,
  protein_g integer,
  nutrition_adherence smallint check (nutrition_adherence between 1 and 5),
  workout_completed boolean default false,
  swimming_completed boolean default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, checkin_date)
);

create table if not exists public.body_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  measured_date date not null,
  waist_cm numeric(5,2),
  chest_cm numeric(5,2),
  hips_cm numeric(5,2),
  left_arm_cm numeric(5,2),
  right_arm_cm numeric(5,2),
  left_thigh_cm numeric(5,2),
  right_thigh_cm numeric(5,2),
  neck_cm numeric(5,2),
  notes text,
  created_at timestamptz not null default now(),
  unique(user_id, measured_date)
);

create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  routine_id uuid references public.routine_templates(id) on delete set null,
  routine_name text not null,
  session_date date not null,
  week_number integer,
  notes text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(user_id, session_date, routine_name)
);

create table if not exists public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions(id) on delete cascade,
  exercise_id uuid references public.routine_exercises(id) on delete set null,
  exercise_name text not null,
  set_number integer not null,
  weight_kg numeric(6,2),
  reps integer,
  rir numeric(3,1),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.swimming_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_day text not null,
  goal text,
  minutes text,
  style_mix text,
  intensity text,
  structure text,
  recovery_concern text,
  unique(user_id, workout_day)
);

create table if not exists public.fitness_journal (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null default current_date,
  title text,
  content text not null,
  mood text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.progress_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  photo_date date not null default current_date,
  storage_path text not null,
  caption text,
  created_at timestamptz not null default now()
);

create index if not exists idx_checkins_user_date on public.daily_checkins(user_id, checkin_date desc);
create index if not exists idx_measurements_user_date on public.body_measurements(user_id, measured_date desc);
create index if not exists idx_sessions_user_date on public.workout_sessions(user_id, session_date desc);
create index if not exists idx_sets_session on public.workout_sets(session_id);
create index if not exists idx_journal_user_date on public.fitness_journal(user_id, entry_date desc);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists user_settings_updated_at on public.user_settings;
create trigger user_settings_updated_at before update on public.user_settings
  for each row execute function public.set_updated_at();

drop trigger if exists daily_checkins_updated_at on public.daily_checkins;
create trigger daily_checkins_updated_at before update on public.daily_checkins
  for each row execute function public.set_updated_at();

drop trigger if exists fitness_journal_updated_at on public.fitness_journal;
create trigger fitness_journal_updated_at before update on public.fitness_journal
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  insert into public.user_settings (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.routine_templates enable row level security;
alter table public.routine_exercises enable row level security;
alter table public.daily_checkins enable row level security;
alter table public.body_measurements enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.workout_sets enable row level security;
alter table public.swimming_plans enable row level security;
alter table public.fitness_journal enable row level security;
alter table public.progress_photos enable row level security;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

create policy "settings_select_own" on public.user_settings for select using (auth.uid() = user_id);
create policy "settings_insert_own" on public.user_settings for insert with check (auth.uid() = user_id);
create policy "settings_update_own" on public.user_settings for update using (auth.uid() = user_id);

create policy "routines_select_own" on public.routine_templates for select using (auth.uid() = user_id);
create policy "routines_insert_own" on public.routine_templates for insert with check (auth.uid() = user_id);
create policy "routines_update_own" on public.routine_templates for update using (auth.uid() = user_id);
create policy "routines_delete_own" on public.routine_templates for delete using (auth.uid() = user_id);

create policy "exercises_select_own" on public.routine_exercises for select using (
  exists (select 1 from public.routine_templates r where r.id = routine_id and r.user_id = auth.uid())
);
create policy "exercises_insert_own" on public.routine_exercises for insert with check (
  exists (select 1 from public.routine_templates r where r.id = routine_id and r.user_id = auth.uid())
);
create policy "exercises_update_own" on public.routine_exercises for update using (
  exists (select 1 from public.routine_templates r where r.id = routine_id and r.user_id = auth.uid())
);
create policy "exercises_delete_own" on public.routine_exercises for delete using (
  exists (select 1 from public.routine_templates r where r.id = routine_id and r.user_id = auth.uid())
);

create policy "checkins_select_own" on public.daily_checkins for select using (auth.uid() = user_id);
create policy "checkins_insert_own" on public.daily_checkins for insert with check (auth.uid() = user_id);
create policy "checkins_update_own" on public.daily_checkins for update using (auth.uid() = user_id);
create policy "checkins_delete_own" on public.daily_checkins for delete using (auth.uid() = user_id);

create policy "measurements_select_own" on public.body_measurements for select using (auth.uid() = user_id);
create policy "measurements_insert_own" on public.body_measurements for insert with check (auth.uid() = user_id);
create policy "measurements_update_own" on public.body_measurements for update using (auth.uid() = user_id);
create policy "measurements_delete_own" on public.body_measurements for delete using (auth.uid() = user_id);

create policy "sessions_select_own" on public.workout_sessions for select using (auth.uid() = user_id);
create policy "sessions_insert_own" on public.workout_sessions for insert with check (auth.uid() = user_id);
create policy "sessions_update_own" on public.workout_sessions for update using (auth.uid() = user_id);
create policy "sessions_delete_own" on public.workout_sessions for delete using (auth.uid() = user_id);

create policy "sets_select_own" on public.workout_sets for select using (
  exists (select 1 from public.workout_sessions s where s.id = session_id and s.user_id = auth.uid())
);
create policy "sets_insert_own" on public.workout_sets for insert with check (
  exists (select 1 from public.workout_sessions s where s.id = session_id and s.user_id = auth.uid())
);
create policy "sets_update_own" on public.workout_sets for update using (
  exists (select 1 from public.workout_sessions s where s.id = session_id and s.user_id = auth.uid())
);
create policy "sets_delete_own" on public.workout_sets for delete using (
  exists (select 1 from public.workout_sessions s where s.id = session_id and s.user_id = auth.uid())
);

create policy "swimming_select_own" on public.swimming_plans for select using (auth.uid() = user_id);
create policy "swimming_insert_own" on public.swimming_plans for insert with check (auth.uid() = user_id);
create policy "swimming_update_own" on public.swimming_plans for update using (auth.uid() = user_id);
create policy "swimming_delete_own" on public.swimming_plans for delete using (auth.uid() = user_id);

create policy "journal_select_own" on public.fitness_journal for select using (auth.uid() = user_id);
create policy "journal_insert_own" on public.fitness_journal for insert with check (auth.uid() = user_id);
create policy "journal_update_own" on public.fitness_journal for update using (auth.uid() = user_id);
create policy "journal_delete_own" on public.fitness_journal for delete using (auth.uid() = user_id);

create policy "photos_select_own" on public.progress_photos for select using (auth.uid() = user_id);
create policy "photos_insert_own" on public.progress_photos for insert with check (auth.uid() = user_id);
create policy "photos_update_own" on public.progress_photos for update using (auth.uid() = user_id);
create policy "photos_delete_own" on public.progress_photos for delete using (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('progress-photos', 'progress-photos', false)
on conflict (id) do nothing;

create policy "photos_storage_select" on storage.objects for select using (
  bucket_id = 'progress-photos' and auth.uid()::text = (storage.foldername(name))[1]
);
create policy "photos_storage_insert" on storage.objects for insert with check (
  bucket_id = 'progress-photos' and auth.uid()::text = (storage.foldername(name))[1]
);
create policy "photos_storage_update" on storage.objects for update using (
  bucket_id = 'progress-photos' and auth.uid()::text = (storage.foldername(name))[1]
);
create policy "photos_storage_delete" on storage.objects for delete using (
  bucket_id = 'progress-photos' and auth.uid()::text = (storage.foldername(name))[1]
);
