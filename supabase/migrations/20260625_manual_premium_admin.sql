-- 20260625_manual_premium_admin.sql
-- Concessão manual de acesso premium para usuários administradores.

update public.profiles as p
set
  is_premium = true,
  updated_at = now()
from auth.users as u
where p.id = u.id
  and (
    lower(u.email) = 'admin@ascend.com'
    or lower(u.email) = 'admin@system.com'
    or lower(u.email) = 'admin@admin.com'
    or lower(u.email) like 'admin@%'
  );
