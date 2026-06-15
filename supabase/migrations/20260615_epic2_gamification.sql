-- 1. Adicionar rastreadores de XP diário e marcos de consistência na tabela profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS xp_gained_today INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS streak_milestones_claimed TEXT[] DEFAULT '{}';

-- 2. Habilitar RLS na tabela de conquistas (achievements)
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- 3. Criar políticas de segurança RLS para a tabela achievements
DROP POLICY IF EXISTS "Permitir leitura de conquistas próprias" ON achievements;
CREATE POLICY "Permitir leitura de conquistas próprias" 
ON achievements FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Permitir inserção de conquistas próprias" ON achievements;
CREATE POLICY "Permitir inserção de conquistas próprias" 
ON achievements FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Permitir deleção de conquistas próprias" ON achievements;
CREATE POLICY "Permitir deleção de conquistas próprias" 
ON achievements FOR DELETE 
USING (auth.uid() = user_id);
