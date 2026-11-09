-- ==============================================================================
-- ASCEND — ETAPA 04.7: EXCLUSÃO DE CONTA E HARDENING DE SEGURANÇA (RLS & RPC)
-- ==============================================================================
-- Compatível com Apple App Store Guideline 5.1.1(v) e Google Play User Data Policy.
-- Idempotente: pode ser executado com segurança no SQL Editor do Supabase.
-- ==============================================================================

-- 1. Garantir política de DELETE explícita na tabela profiles para o próprio usuário autenticado
drop policy if exists "Users can delete their own profile" on public.profiles;
create policy "Users can delete their own profile"
  on public.profiles for delete
  to authenticated
  using (auth.uid() = id);

-- 2. Garantir isolamento de leitura pública de perfis sociais apenas para usuários autenticados:
-- Um usuário autenticado pode ler o próprio perfil OU perfis marcados como is_public = true.
-- O papel anon não recebe permissão de listagem de perfis.
drop policy if exists "Authenticated users can view public profiles" on public.profiles;
create policy "Authenticated users can view public profiles"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id or is_public = true);

-- 3. Garantir proteção de integridade nos7 atributos e XP na tabela profiles
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_level_bounds_check'
  ) then
    alter table public.profiles
      add constraint profiles_level_bounds_check
      check (level between 1 and 100);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'profiles_xp_non_negative_check'
  ) then
    alter table public.profiles
      add constraint profiles_xp_non_negative_check
      check (xp >= 0 and xp_gained_today >= 0);
  end if;
end $$;

-- 4. Função RPC Segura de Exclusão Definitiva da Própria Conta (`delete_own_account`)
-- Executa como SECURITY DEFINER com search_path fixo, validando estritamente `auth.uid()`.
-- Nenhuma chave service_role é exposta no frontend.
create or replace function public.delete_own_account()
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Não autenticado: operação de exclusão de conta negada.';
  end if;

  -- 4.1. Remover conexões sociais e presença em rankings públicos
  if to_regclass('public.friendships') is not null then
    delete from public.friendships
    where user_id = v_user_id or friend_id = v_user_id or action_user_id = v_user_id;
  end if;

  if to_regclass('public.leaderboard_scores') is not null then
    delete from public.leaderboard_scores
    where user_id = v_user_id;
  end if;

  -- 4.2. Remover dados de Fortuna e Descanso
  if to_regclass('public.financial_logs') is not null then
    delete from public.financial_logs where user_id = v_user_id;
  end if;

  if to_regclass('public.financial_goals') is not null then
    delete from public.financial_goals where user_id = v_user_id;
  end if;

  if to_regclass('public.rest_logs') is not null then
    delete from public.rest_logs where user_id = v_user_id;
  end if;

  -- 4.3. Remover batalhas de Bosses, conquistas e checklists
  if to_regclass('public.boss_battles') is not null then
    delete from public.boss_battles where user_id = v_user_id;
  end if;

  if to_regclass('public.achievements') is not null then
    delete from public.achievements where user_id = v_user_id;
  end if;

  if to_regclass('public.daily_checklist') is not null then
    delete from public.daily_checklist where user_id = v_user_id;
  end if;

  -- 4.4. Remover dados de Nutrição, itens de cardápio e alimentos personalizados do usuário
  if to_regclass('public.nutrition_daily_scores') is not null then
    delete from public.nutrition_daily_scores where user_id = v_user_id;
  end if;

  if to_regclass('public.food_logs') is not null then
    delete from public.food_logs where user_id = v_user_id;
  end if;

  if to_regclass('public.meal_completions') is not null then
    delete from public.meal_completions where user_id = v_user_id;
  end if;

  if to_regclass('public.meal_plan_items') is not null and to_regclass('public.meal_plans') is not null then
    delete from public.meal_plan_items
    where meal_plan_id in (select id from public.meal_plans where user_id = v_user_id);
  end if;

  if to_regclass('public.meal_plans') is not null then
    delete from public.meal_plans where user_id = v_user_id;
  end if;

  if to_regclass('public.foods') is not null then
    if to_regclass('public.meal_plan_items') is not null then
      delete from public.meal_plan_items
      where food_id in (select id from public.foods where created_by = v_user_id and is_custom = true);
    end if;
    delete from public.foods where created_by = v_user_id and is_custom = true;
    update public.foods set created_by = null where created_by = v_user_id;
  end if;

  -- 4.5. Remover dados de Treinamento, exercícios de fichas e exercícios personalizados do usuário
  if to_regclass('public.routine_completions') is not null then
    delete from public.routine_completions where user_id = v_user_id;
  end if;

  if to_regclass('public.workout_logs') is not null then
    delete from public.workout_logs where user_id = v_user_id;
  end if;

  if to_regclass('public.routine_exercises') is not null and to_regclass('public.workout_routines') is not null then
    delete from public.routine_exercises
    where routine_id in (select id from public.workout_routines where user_id = v_user_id);
  end if;

  if to_regclass('public.workout_routines') is not null then
    delete from public.workout_routines where user_id = v_user_id;
  end if;

  if to_regclass('public.exercises') is not null then
    if to_regclass('public.routine_exercises') is not null then
      delete from public.routine_exercises
      where exercise_id in (select id from public.exercises where created_by = v_user_id and is_custom = true);
    end if;
    delete from public.exercises where created_by = v_user_id and is_custom = true;
    update public.exercises set created_by = null where created_by = v_user_id;
  end if;

  -- 4.6. Remover Hábitos e Missões (Quests)
  if to_regclass('public.habit_completions') is not null then
    delete from public.habit_completions where user_id = v_user_id;
  end if;

  if to_regclass('public.habits') is not null then
    delete from public.habits where user_id = v_user_id;
  end if;

  if to_regclass('public.tasks') is not null then
    delete from public.tasks where user_id = v_user_id;
  end if;

  -- 4.7. Remover objetos em Supabase Storage vinculados ao usuário (se o schema storage existir)
  if to_regclass('storage.objects') is not null then
    delete from storage.objects where owner = v_user_id or owner_id = v_user_id::text;
  end if;

  -- 4.8. Remover perfil e identidade de autenticação (on delete cascade garante limpeza residual)
  delete from public.profiles where id = v_user_id;
  delete from auth.users where id = v_user_id;

  return true;
end;
$$;

revoke all on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;
