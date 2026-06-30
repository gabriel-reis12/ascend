-- 20260630_manual_premium_gabroreis.sql
-- Concessão manual de acesso premium para o usuário gabroreis@gmail.com.

update public.profiles as p
set
  is_premium = true,
  updated_at = now()
from auth.users as u
where p.id = u.id
  and lower(u.email) = 'gabroreis@gmail.com';
