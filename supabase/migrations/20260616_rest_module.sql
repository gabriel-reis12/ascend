-- Criação da tabela de logs de descanso e lazer (Templo do Caçador)
create table if not exists public.rest_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    type text not null check (type in ('sleep', 'meditation', 'hobby')),
    duration_min integer not null,
    quality integer check (quality >= 1 and quality <= 5),
    notes text,
    logged_at timestamptz default now()
);

-- Ativar RLS
alter table public.rest_logs enable row level security;

-- Drop de políticas antigas se houver
drop policy if exists "Users can view their own rest logs" on public.rest_logs;
drop policy if exists "Users can insert their own rest logs" on public.rest_logs;
drop policy if exists "Users can delete their own rest logs" on public.rest_logs;

-- Criar novas políticas
create policy "Users can view their own rest logs"
    on public.rest_logs for select
    using (auth.uid() = user_id);

create policy "Users can insert their own rest logs"
    on public.rest_logs for insert
    with check (auth.uid() = user_id);

create policy "Users can delete their own rest logs"
    on public.rest_logs for delete
    using (auth.uid() = user_id);
