-- 20260616_repair_app_contract.sql
-- Contrato completo entre o frontend ASCEND e o Supabase.
-- Idempotente: pode ser executado no SQL Editor mesmo em projetos com parte das tabelas existentes.

create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  full_name text,
  avatar_url text,
  rank text default 'E',
  class text,
  level integer default 1,
  xp integer default 0,
  xp_to_next_level integer default 100,
  strength integer default 10,
  intelligence integer default 10,
  endurance integer default 10,
  vitality integer default 10,
  discipline integer default 10,
  wisdom integer default 10,
  balance integer default 10,
  streak_current integer default 0,
  streak_best integer default 0,
  last_check_in timestamptz,
  xp_gained_today integer default 0,
  streak_milestones_claimed text[] default '{}',
  title text default 'Iniciante',
  birthday date,
  gender text,
  height numeric,
  weight_current numeric,
  weight_target numeric,
  training_focus text,
  main_goal text,
  nutrition_goal text default 'maintain',
  experience_level text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table profiles add column if not exists username text unique;
alter table profiles add column if not exists full_name text;
alter table profiles add column if not exists avatar_url text;
alter table profiles add column if not exists rank text default 'E';
alter table profiles add column if not exists class text;
alter table profiles add column if not exists level integer default 1;
alter table profiles add column if not exists xp integer default 0;
alter table profiles add column if not exists xp_to_next_level integer default 100;
alter table profiles add column if not exists strength integer default 10;
alter table profiles add column if not exists intelligence integer default 10;
alter table profiles add column if not exists endurance integer default 10;
alter table profiles add column if not exists vitality integer default 10;
alter table profiles add column if not exists discipline integer default 10;
alter table profiles add column if not exists wisdom integer default 10;
alter table profiles add column if not exists balance integer default 10;
alter table profiles add column if not exists streak_current integer default 0;
alter table profiles add column if not exists streak_best integer default 0;
alter table profiles add column if not exists last_check_in timestamptz;
alter table profiles add column if not exists xp_gained_today integer default 0;
alter table profiles add column if not exists streak_milestones_claimed text[] default '{}';
alter table profiles add column if not exists title text default 'Iniciante';
alter table profiles add column if not exists birthday date;
alter table profiles add column if not exists gender text;
alter table profiles add column if not exists height numeric;
alter table profiles add column if not exists weight_current numeric;
alter table profiles add column if not exists weight_target numeric;
alter table profiles add column if not exists training_focus text;
alter table profiles add column if not exists main_goal text;
alter table profiles add column if not exists nutrition_goal text default 'maintain';
alter table profiles add column if not exists experience_level text;
alter table profiles add column if not exists created_at timestamptz default now();
alter table profiles add column if not exists updated_at timestamptz default now();

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text not null default 'Rotina',
  category_color text not null default '#7C3AED',
  xp_reward integer not null default 15,
  stat_target text,
  stat_reward integer not null default 0,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text not null default 'Rotina',
  category_color text not null default '#7C3AED',
  xp_reward integer not null default 25,
  stat_target text,
  stat_reward integer not null default 0,
  active boolean not null default true,
  is_optional boolean not null default false,
  scheduled_time time,
  scheduled_end_time time,
  scheduled_days integer[] default '{0,1,2,3,4,5,6}',
  created_at timestamptz default now()
);

create table if not exists habit_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid not null references habits(id) on delete cascade,
  completed_date date not null default current_date,
  created_at timestamptz default now(),
  unique(user_id, habit_id, completed_date)
);

create table if not exists exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  muscle_group text not null default 'Geral',
  category text not null default 'Força',
  calories_per_minute integer default 5,
  is_custom boolean default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

alter table exercises add column if not exists muscle_group text not null default 'Geral';
alter table exercises add column if not exists category text not null default 'Força';
alter table exercises add column if not exists calories_per_minute integer default 5;
alter table exercises add column if not exists is_custom boolean default false;
alter table exercises add column if not exists created_by uuid references auth.users(id) on delete set null;
alter table exercises add column if not exists created_at timestamptz default now();

create table if not exists workout_routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  scheduled_days integer[] default '{}',
  scheduled_time time,
  scheduled_end_time time,
  created_at timestamptz default now()
);

create table if not exists routine_exercises (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references workout_routines(id) on delete cascade,
  exercise_id uuid not null references exercises(id) on delete cascade,
  sets integer default 3,
  reps integer default 12,
  weight_kg numeric default 0,
  order_index integer default 0,
  created_at timestamptz default now()
);

create table if not exists workout_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id uuid references exercises(id) on delete set null,
  sets integer,
  reps integer,
  weight_kg numeric,
  duration_min integer,
  logged_at timestamptz default now()
);

create table if not exists routine_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  routine_id uuid not null references workout_routines(id) on delete cascade,
  completed_date date not null default current_date,
  xp_awarded integer default 0,
  created_at timestamptz default now(),
  unique(user_id, routine_id, completed_date)
);

create table if not exists foods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  calories_per_100g numeric not null default 0,
  protein_per_100g numeric default 0,
  carbs_per_100g numeric default 0,
  fat_per_100g numeric default 0,
  category text default 'Outros',
  is_custom boolean default false,
  created_by uuid references auth.users(id) on delete set null,
  serving_size numeric,
  serving_unit text,
  created_at timestamptz default now()
);

alter table foods add column if not exists calories_per_100g numeric not null default 0;
alter table foods add column if not exists protein_per_100g numeric default 0;
alter table foods add column if not exists carbs_per_100g numeric default 0;
alter table foods add column if not exists fat_per_100g numeric default 0;
alter table foods add column if not exists category text default 'Outros';
alter table foods add column if not exists is_custom boolean default false;
alter table foods add column if not exists created_by uuid references auth.users(id) on delete set null;
alter table foods add column if not exists serving_size numeric;
alter table foods add column if not exists serving_unit text;
alter table foods add column if not exists created_at timestamptz default now();

create table if not exists food_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  food_id uuid references foods(id) on delete set null,
  quantity_grams numeric not null,
  meal_type text,
  logged_at timestamptz default now()
);

create table if not exists meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  order_index integer default 0,
  is_active boolean default true,
  xp_reward integer default 30,
  scheduled_time time,
  scheduled_end_time time,
  created_at timestamptz default now()
);

create table if not exists meal_plan_items (
  id uuid primary key default gen_random_uuid(),
  meal_plan_id uuid not null references meal_plans(id) on delete cascade,
  food_id uuid not null references foods(id) on delete cascade,
  quantity_grams numeric not null default 100,
  created_at timestamptz default now()
);

create table if not exists meal_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  meal_plan_id uuid not null references meal_plans(id) on delete cascade,
  completed_at date not null default current_date,
  created_at timestamptz default now(),
  unique(user_id, meal_plan_id, completed_at)
);

create table if not exists achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  icon text,
  unlocked_at timestamptz default now()
);

create table if not exists daily_checklist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date default current_date,
  workout_done boolean default false,
  water_done boolean default false,
  diet_done boolean default false,
  reading_done boolean default false,
  study_done boolean default false,
  sleep_done boolean default false,
  xp_earned integer default 0,
  unique(user_id, date)
);

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

create table if not exists boss_battles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  boss_id text not null,
  name text not null,
  title_reward text not null,
  current_hp integer not null default 100,
  max_hp integer not null default 100,
  defeated boolean default false,
  started_at timestamptz default now(),
  last_attack_at timestamptz,
  defeated_at timestamptz,
  created_at timestamptz default now()
);

alter table profiles enable row level security;
alter table tasks enable row level security;
alter table habits enable row level security;
alter table habit_completions enable row level security;
alter table exercises enable row level security;
alter table workout_routines enable row level security;
alter table routine_exercises enable row level security;
alter table workout_logs enable row level security;
alter table routine_completions enable row level security;
alter table foods enable row level security;
alter table food_logs enable row level security;
alter table meal_plans enable row level security;
alter table meal_plan_items enable row level security;
alter table meal_completions enable row level security;
alter table achievements enable row level security;
alter table daily_checklist enable row level security;
alter table nutrition_daily_scores enable row level security;
alter table boss_battles enable row level security;

drop policy if exists "Users can view their own profile" on profiles;
drop policy if exists "Users can insert their own profile" on profiles;
drop policy if exists "Users can update their own profile" on profiles;
create policy "Users can view their own profile" on profiles for select using (auth.uid() = id);
create policy "Users can insert their own profile" on profiles for insert with check (auth.uid() = id);
create policy "Users can update their own profile" on profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Users can manage their own tasks" on tasks;
create policy "Users can manage their own tasks" on tasks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can manage their own habits" on habits;
create policy "Users can manage their own habits" on habits for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can manage their own habit completions" on habit_completions;
create policy "Users can manage their own habit completions" on habit_completions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Everyone can view non-custom exercises" on exercises;
drop policy if exists "Users can create custom exercises" on exercises;
drop policy if exists "Users can update custom exercises" on exercises;
drop policy if exists "Users can delete custom exercises" on exercises;
create policy "Everyone can view non-custom exercises" on exercises for select using (is_custom = false or auth.uid() = created_by);
create policy "Users can create custom exercises" on exercises for insert with check (auth.uid() = created_by);
create policy "Users can update custom exercises" on exercises for update using (auth.uid() = created_by) with check (auth.uid() = created_by);
create policy "Users can delete custom exercises" on exercises for delete using (auth.uid() = created_by);

drop policy if exists "Users can manage their own workout routines" on workout_routines;
create policy "Users can manage their own workout routines" on workout_routines for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can manage routine exercises through owned routines" on routine_exercises;
create policy "Users can manage routine exercises through owned routines" on routine_exercises for all
using (exists (select 1 from workout_routines wr where wr.id = routine_exercises.routine_id and wr.user_id = auth.uid()))
with check (exists (select 1 from workout_routines wr where wr.id = routine_exercises.routine_id and wr.user_id = auth.uid()));

drop policy if exists "Users can manage their own workout logs" on workout_logs;
create policy "Users can manage their own workout logs" on workout_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can manage their own routine completions" on routine_completions;
create policy "Users can manage their own routine completions" on routine_completions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Everyone can view non-custom foods" on foods;
drop policy if exists "Users can create custom foods" on foods;
drop policy if exists "Users can update custom foods" on foods;
drop policy if exists "Users can delete custom foods" on foods;
create policy "Everyone can view non-custom foods" on foods for select using (is_custom = false or auth.uid() = created_by);
create policy "Users can create custom foods" on foods for insert with check (auth.uid() = created_by);
create policy "Users can update custom foods" on foods for update using (auth.uid() = created_by) with check (auth.uid() = created_by);
create policy "Users can delete custom foods" on foods for delete using (auth.uid() = created_by);

drop policy if exists "Users can manage their own food logs" on food_logs;
create policy "Users can manage their own food logs" on food_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can manage their own meal plans" on meal_plans;
create policy "Users can manage their own meal plans" on meal_plans for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can manage meal items through owned plans" on meal_plan_items;
create policy "Users can manage meal items through owned plans" on meal_plan_items for all
using (exists (select 1 from meal_plans mp where mp.id = meal_plan_items.meal_plan_id and mp.user_id = auth.uid()))
with check (exists (select 1 from meal_plans mp where mp.id = meal_plan_items.meal_plan_id and mp.user_id = auth.uid()));

drop policy if exists "Users can manage their own meal completions" on meal_completions;
create policy "Users can manage their own meal completions" on meal_completions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can manage their own achievements" on achievements;
drop policy if exists "Permitir leitura de conquistas próprias" on achievements;
drop policy if exists "Permitir inserção de conquistas próprias" on achievements;
drop policy if exists "Permitir deleção de conquistas próprias" on achievements;
create policy "Users can manage their own achievements" on achievements for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can view/update their own daily checklist" on daily_checklist;
create policy "Users can view/update their own daily checklist" on daily_checklist for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can manage their own nutrition daily scores" on nutrition_daily_scores;
create policy "Users can manage their own nutrition daily scores" on nutrition_daily_scores for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can manage their own boss battles" on boss_battles;
create policy "Users can manage their own boss battles" on boss_battles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
