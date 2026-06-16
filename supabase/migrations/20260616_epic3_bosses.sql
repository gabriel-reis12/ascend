-- 20260616_epic3_bosses.sql
-- Módulo de Chefes Finais e Batalhas de Consistência

CREATE TABLE IF NOT EXISTS boss_battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  boss_id TEXT NOT NULL, -- boss_01, boss_02, boss_03, boss_04, boss_05, boss_06, boss_07
  name TEXT NOT NULL,
  title_reward TEXT NOT NULL, -- Título concedido ao derrotar
  current_hp INTEGER NOT NULL DEFAULT 100,
  max_hp INTEGER NOT NULL DEFAULT 100,
  defeated BOOLEAN DEFAULT FALSE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_attack_at TIMESTAMP WITH TIME ZONE,
  defeated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE boss_battles ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança (RLS)
CREATE POLICY "Users can manage their own boss battles" 
ON boss_battles FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);
