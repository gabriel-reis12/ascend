-- RESET COMPLETO DO SCHEMA PARA SOLO LEVELING (ASCEND)
-- ATENÇÃO: Isso remove as tabelas antigas!

-- Drop existing tables if they exist
DROP TABLE IF EXISTS workout_logs CASCADE;
DROP TABLE IF EXISTS food_logs CASCADE;
DROP TABLE IF EXISTS daily_checklist CASCADE;
DROP TABLE IF EXISTS exercises CASCADE;
DROP TABLE IF EXISTS foods CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;

-- 1. PROFILES (Hunter Stats)
-- Nota: A tabela auth.users já existe no Supabase.
-- Esta tabela 'profiles' estende os dados do usuário.
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  rank TEXT DEFAULT 'E', -- E, D, C, B, A, S, National, Monarch
  class TEXT, -- Warrior, Scholar, Monk, Titan (escolhido no onboarding)
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  xp_required INTEGER DEFAULT 100,
  
  -- Core Stats (Solo Leveling Style)
  strength INTEGER DEFAULT 10,
  intelligence INTEGER DEFAULT 10,
  endurance INTEGER DEFAULT 10,
  vitality INTEGER DEFAULT 10,
  discipline INTEGER DEFAULT 10,
  
  -- Streaks
  streak_current INTEGER DEFAULT 0,
  streak_best INTEGER DEFAULT 0,
  last_check_in TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. EXERCISES (Biblioteca Global + Custom)
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  muscle_group TEXT NOT NULL, -- Peito, Costas, Pernas, etc.
  category TEXT NOT NULL, -- Força, Cardio, Flexibilidade
  calories_per_minute INTEGER DEFAULT 5,
  is_custom BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. FOODS (Biblioteca Global + Custom)
CREATE TABLE foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  calories_per_100g INTEGER NOT NULL,
  protein_per_100g FLOAT DEFAULT 0,
  carbs_per_100g FLOAT DEFAULT 0,
  fat_per_100g FLOAT DEFAULT 0,
  category TEXT, -- Proteína, Carboidrato, Fruta, etc.
  is_custom BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. DAILY CHECKLIST (System Missions)
CREATE TABLE daily_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  
  -- Missions (Solo Leveling Daily Quest)
  workout_done BOOLEAN DEFAULT FALSE,
  water_done BOOLEAN DEFAULT FALSE,
  diet_done BOOLEAN DEFAULT FALSE,
  reading_done BOOLEAN DEFAULT FALSE,
  study_done BOOLEAN DEFAULT FALSE,
  sleep_done BOOLEAN DEFAULT FALSE,
  
  xp_earned INTEGER DEFAULT 0,
  UNIQUE(user_id, date)
);

-- 5. WORKOUT LOGS
CREATE TABLE workout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  sets INTEGER,
  reps INTEGER,
  weight_kg FLOAT,
  duration_min INTEGER,
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. FOOD LOGS
CREATE TABLE food_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  food_id UUID REFERENCES foods(id) ON DELETE CASCADE,
  quantity_grams FLOAT NOT NULL,
  meal_type TEXT, -- Breakfast, Lunch, Dinner, Snack
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. ACHIEVEMENTS
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Basic public read for global items, private for user data)

-- Profiles
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Exercises
CREATE POLICY "Everyone can view non-custom exercises" ON exercises FOR SELECT USING (is_custom = FALSE OR auth.uid() = created_by);
CREATE POLICY "Users can create custom exercises" ON exercises FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Foods
CREATE POLICY "Everyone can view non-custom foods" ON foods FOR SELECT USING (is_custom = FALSE OR auth.uid() = created_by);
CREATE POLICY "Users can create custom foods" ON foods FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Daily Checklist
CREATE POLICY "Users can view/update their own daily checklist" ON daily_checklist 
  FOR ALL USING (auth.uid() = user_id);

-- Logs
CREATE POLICY "Users can view/create their own logs" ON workout_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view/create their own logs" ON food_logs FOR ALL USING (auth.uid() = user_id);

-- PRÉ-POPULAÇÃO DE DADOS (EXEMPLO)

-- Inserir alguns exercícios
INSERT INTO exercises (name, muscle_group, category) VALUES
('Supino Reto', 'Peito', 'Força'),
('Agachamento Livre', 'Pernas', 'Força'),
('Puxada Frontal', 'Costas', 'Força'),
('Desenvolvimento Militar', 'Ombros', 'Força'),
('Rosca Direta', 'Bíceps', 'Força'),
('Tríceps Testa', 'Tríceps', 'Força'),
('Prancha Abdominal', 'Core', 'Força'),
('Corrida (30 min)', 'Cardio', 'Cardio');

-- Inserir alguns alimentos
INSERT INTO foods (name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, category) VALUES
('Frango Grelhado', 165, 31, 0, 3.6, 'Proteína'),
('Arroz Branco', 130, 2.7, 28, 0.3, 'Carboidrato'),
('Batata Doce', 86, 1.6, 20, 0.1, 'Carboidrato'),
('Ovo Cozido', 155, 13, 1.1, 11, 'Proteína'),
('Banana', 89, 1.1, 23, 0.3, 'Fruta'),
('Brócolis', 34, 2.8, 7, 0.4, 'Vegetal'),
('Aveia', 389, 16.9, 66, 6.9, 'Carboidrato'),
('Whey Protein', 400, 80, 5, 5, 'Proteína');
