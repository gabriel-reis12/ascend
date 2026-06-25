-- 20260624_manual_premium_diego.sql
-- Concessão manual de acesso premium solicitada para usuário específico.

update public.profiles as p
set
  is_premium = true,
  updated_at = now()
from auth.users as u
where p.id = u.id
  and lower(u.email) = 'diegoseleguini@gmail.com';
