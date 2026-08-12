-- Adds height (needed for Navy body-fat % method and dashboard projections).
-- Run this in the Supabase SQL Editor after 001_initial_schema.sql.

alter table public.user_settings
  add column if not exists height_cm numeric(5,1);

alter table public.user_settings
  add column if not exists trip_date date;

comment on column public.user_settings.height_cm is 'Used for Navy body-fat % estimate (neck+waist+height) and dashboard projections.';
comment on column public.user_settings.trip_date is 'Target date (e.g. upcoming trip) shown as a countdown on the Progress dashboard.';
