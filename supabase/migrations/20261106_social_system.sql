-- ==============================================================================
-- ASCEND SOCIAL SYSTEM v1
-- Migração local idempotente para amigos, perfis públicos e ranking competitivo.
-- ==============================================================================

-- 1. Ampliação da tabela profiles com metadados sociais e visibilidade
alter table profiles add column if not exists hunter_tag text unique;
alter table profiles add column if not exists is_public boolean default true;
alter table profiles add column if not exists allow_friend_requests boolean default true;
alter table profiles add column if not exists include_in_global_leaderboard boolean default true;
alter table profiles add column if not exists featured_achievements text[] default '{}';
alter table profiles add column if not exists bio text;

-- Índice para busca rápida e insensível a maiúsculas por hunter_tag e username
create index if not exists idx_profiles_hunter_tag on profiles (lower(hunter_tag));
create index if not exists idx_profiles_username on profiles (lower(username));

-- 2. Tabela de Amizades e Conexões entre Caçadores
create table if not exists friendships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  friend_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'blocked')),
  action_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint unique_friendship_pair unique(user_id, friend_id),
  constraint no_self_friendship check (user_id <> friend_id)
);

create index if not exists idx_friendships_user_status on friendships (user_id, status);
create index if not exists idx_friendships_friend_status on friendships (friend_id, status);

-- 3. Tabela de Pontuações Competitivas da Temporada (Rankings Verificáveis)
create table if not exists leaderboard_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  period_type text not null check (period_type in ('weekly', 'monthly')),
  period_key text not null, -- ex: '2026-W45' ou '2026-11'
  score integer not null default 0 check (score >= 0),
  workouts_count integer not null default 0 check (workouts_count >= 0),
  habits_count integer not null default 0 check (habits_count >= 0),
  boss_damage_score integer not null default 0 check (boss_damage_score >= 0),
  streak_bonus integer not null default 0 check (streak_bonus >= 0),
  updated_at timestamptz default now(),
  constraint unique_user_leaderboard_period unique (user_id, period_type, period_key)
);

create index if not exists idx_leaderboard_period_score on leaderboard_scores (period_type, period_key, score desc);

-- ==============================================================================
-- 4. POLÍTICAS DE ROW LEVEL SECURITY (RLS)
-- ==============================================================================

alter table friendships enable row level security;
alter table leaderboard_scores enable row level security;

-- Friendships: Caçador só vê e gerencia amizades nas quais participa
drop policy if exists "Users can view their own friendships" on friendships;
create policy "Users can view their own friendships"
  on friendships for select
  using (auth.uid() = user_id or auth.uid() = friend_id);

drop policy if exists "Users can insert their own friend requests" on friendships;
create policy "Users can insert their own friend requests"
  on friendships for insert
  with check (auth.uid() = user_id and auth.uid() = action_user_id);

drop policy if exists "Users can update their friendships" on friendships;
create policy "Users can update their friendships"
  on friendships for update
  using (auth.uid() = user_id or auth.uid() = friend_id);

drop policy if exists "Users can delete their friendships" on friendships;
create policy "Users can delete their friendships"
  on friendships for delete
  using (auth.uid() = user_id or auth.uid() = friend_id);

-- Leaderboard: Pontuações são públicas para caçadores participantes
drop policy if exists "Users can view leaderboard scores" on leaderboard_scores;
create policy "Users can view leaderboard scores"
  on leaderboard_scores for select
  using (true);

drop policy if exists "Users can manage their own leaderboard scores" on leaderboard_scores;
create policy "Users can manage their own leaderboard scores"
  on leaderboard_scores for all
  using (auth.uid() = user_id);

