-- 20261105_boss_raid_lifecycle.sql
-- ASCEND: Expansão do ciclo de vida das Raids Semanais de Chefes
-- Suporte a prazos persistentes (expires_at), estados formais da batalha (status) e encerramento (ended_at).
-- Idempotente: pode ser executado no SQL Editor do Supabase sem risco de perda de dados.

-- 1. Adicionar coluna expires_at para prazo persistente
alter table boss_battles add column if not exists expires_at timestamptz;

-- 2. Adicionar coluna status para rastrear ciclo de vida ('active', 'defeated', 'expired')
alter table boss_battles add column if not exists status text default 'active';

-- 3. Adicionar coluna ended_at para auditoria de término
alter table boss_battles add column if not exists ended_at timestamptz;

-- 4. Constraint segura para status
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'boss_battles_status_check'
  ) then
    alter table boss_battles 
      add constraint boss_battles_status_check 
      check (status in ('active', 'defeated', 'expired'));
  end if;
end $$;

-- 5. Backfill de integridade para registros existentes:
-- Se o chefe já estava derrotado, marcar status como 'defeated' e ended_at como defeated_at
update boss_battles
set 
  status = 'defeated',
  ended_at = coalesce(ended_at, defeated_at, now())
where defeated = true and (status is null or status = 'active');

-- Se o chefe tem started_at mas expires_at está nulo, inicializar expires_at com started_at + 7 dias
update boss_battles
set expires_at = started_at + interval '7 days'
where expires_at is null and started_at is not null;

-- 6. Índice de alta performance para busca da batalha ativa do usuário
create index if not exists idx_boss_battles_user_status_started 
on boss_battles(user_id, status, started_at desc);

