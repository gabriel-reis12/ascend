-- 20260616_nutrition_daily_scoring.sql
-- Pontuacao diaria de nutricao baseada em TMB + objetivo.

alter table profiles add column if not exists nutrition_goal text default 'maintain';

create table if not exists nutrition_daily_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  goal text not null default 'maintain',
  bmr numeric,
  target_calories numeric not null default 0,
  tolerance_calories numeric not null default 150,
  total_calories numeric not null default 0,
  success boolean not null default false,
  xp_awarded integer not null default 0,
  stat_awarded integer not null default 0,
  evaluated_at timestamptz default now(),
  created_at timestamptz default now(),
  unique(user_id, date)
);

alter table nutrition_daily_scores enable row level security;

drop policy if exists "Users can manage their own nutrition daily scores" on nutrition_daily_scores;
create policy "Users can manage their own nutrition daily scores" on nutrition_daily_scores
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
