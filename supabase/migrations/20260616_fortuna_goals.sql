-- Migration: Metas Financeiras (Módulo Fortuna)
-- Data: 2026-06-16

-- 1. Criar a tabela de metas financeiras
create table if not exists public.financial_goals (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    title text not null,
    target_amount numeric not null,
    current_amount numeric not null default 0,
    type text not null check (type in ('one_time', 'recurring_monthly')),
    completed boolean not null default false,
    created_at timestamptz default now()
);

-- 2. Habilitar Security em Nível de Linha (RLS)
alter table public.financial_goals enable row level security;

-- 3. Criar Políticas RLS de Acesso Isolado por Usuário
create policy "Users can view their own financial goals"
    on public.financial_goals for select
    using (auth.uid() = user_id);

create policy "Users can insert their own financial goals"
    on public.financial_goals for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own financial goals"
    on public.financial_goals for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete their own financial goals"
    on public.financial_goals for delete
    using (auth.uid() = user_id);
