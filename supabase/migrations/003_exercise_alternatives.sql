-- Adds equipment-alternative suggestions per exercise (e.g. "machine is occupied,
-- do this instead"). Run in the Supabase SQL Editor after 002_height_and_calibration.sql.

alter table public.routine_exercises
  add column if not exists alternatives jsonb not null default '[]'::jsonb;

comment on column public.routine_exercises.alternatives is 'Equipment-swap options for this exercise (same muscle/movement pattern), shown when the primary machine is occupied.';
