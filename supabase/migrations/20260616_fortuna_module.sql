-- Migration: Módulo Fortuna (Finanças & Gestão de Recursos)
-- Data: 2026-06-16

-- 1. Criar a tabela de registros financeiros
create table if not exists public.financial_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    description text not null,
    amount numeric not null,
    type text not null check (type in ('income', 'expense', 'investment')),
    category text not null,
    date date not null default current_date,
    created_at timestamptz default now()
);

-- 2. Habilitar Security em Nível de Linha (RLS)
alter table public.financial_logs enable row level security;

-- 3. Criar Políticas RLS de Acesso Isolado por Usuário
create policy "Users can view their own financial logs"
    on public.financial_logs for select
    using (auth.uid() = user_id);

create policy "Users can insert their own financial logs"
    on public.financial_logs for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own financial logs"
    on public.financial_logs for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete their own financial logs"
    on public.financial_logs for delete
    using (auth.uid() = user_id);
