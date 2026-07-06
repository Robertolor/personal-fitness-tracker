# Fitness Tracker

Personal fitness tracker for daily check-ins, workout logging (sets/reps/weight/RIR), body measurements, progression charts, and a training journal. Built with **Vite + React** and **Supabase** (no custom backend for v1).

- **Supabase project:** `fitness-app-dev` · ref `yrihprcinsramxebvilf` · Frankfurt
- **Deploy target:** Vercel (SPA)
- **Default calorie target:** 1750 kcal (editable in Settings)
- **Program:** 6-day split (Push A/B, Pull A/B, Legs A/B) with Rest on Sunday, starting 2026-06-01

## Features

- Daily wellness check-in (weight, body fat %, sleep, energy, hunger, stress, fatigue, steps, nutrition)
- Body measurements (waist priority) with overlay charts (weight + BF% + waist)
- Workout logging with per-exercise progression (est. 1RM via Epley)
- Swimming plan per workout day
- Fitness journal
- Mobile bottom nav + desktop top navigation
- Dark athletic UI (slate/zinc + emerald accents)

## Setup

### 1. Supabase database

1. Open the [Supabase SQL Editor](https://supabase.com/dashboard/project/yrihprcinsramxebvilf/sql) for project `fitness-app-dev`.
2. Run the full migration:

   ```
   supabase/migrations/001_initial_schema.sql
   ```

3. Enable Email auth under **Authentication → Providers** if not already enabled.

### 2. Frontend environment

```bash
cd frontend
cp .env.example .env
```

Edit `.env`:

```env
VITE_SUPABASE_URL=https://yrihprcinsramxebvilf.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

Find keys in Supabase **Project Settings → API**.

### 3. Run locally

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 — sign up, then sign in. Routines and swimming plans are seeded automatically on first login.

### 4. Deploy to Vercel

1. Import the repo (or connect the `frontend` folder as root).
2. Set environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy. `vercel.json` includes SPA rewrites.

## Import historical Excel data (optional)

To import weeks 1–4 from `Roberto_Fitness_Tracker_v2.xlsx`:

```bash
pip install openpyxl supabase

set SUPABASE_URL=https://yrihprcinsramxebvilf.supabase.co
set SUPABASE_SERVICE_KEY=<service-role-key>   # NEVER use in frontend

python scripts/import_excel.py --user-id <your-auth-user-uuid> --excel "C:\Users\User\Downloads\Roberto_Fitness_Tracker_v2.xlsx"
```

**Warning:** The service role key bypasses RLS. Keep it server-side / local only.

## Project structure

```
frontend/           Vite React SPA
  src/
    data/           Default routines, schedule, swimming plans
    lib/            Supabase client, schedule, seed, workout utils
    context/        Auth provider
    components/     Charts, layout, nav
    pages/          Today, Progress, Workout, Check-in, Settings, Journal
supabase/
  migrations/       SQL schema + RLS
scripts/
  import_excel.py   Historical data import
```

## Weekly schedule (default)

| Day       | Workout |
|-----------|---------|
| Sunday    | Rest    |
| Monday    | Push A  |
| Tuesday   | Pull A  |
| Wednesday | Legs A  |
| Thursday  | Push B  |
| Friday    | Pull B  |
| Saturday  | Legs B  |

Schedule and all macro targets are editable in **Settings**.

## Build

```bash
cd frontend
npm run build
```

Output in `frontend/dist`.
