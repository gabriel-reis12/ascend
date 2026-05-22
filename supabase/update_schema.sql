-- SQL para adicionar a coluna scheduled_days na tabela workout_routines
-- Por favor, execute este script no SQL Editor do Supabase

ALTER TABLE workout_routines
ADD COLUMN IF NOT EXISTS scheduled_days integer[] DEFAULT '{}';

-- Comentário da coluna para documentação
COMMENT ON COLUMN workout_routines.scheduled_days IS 'Array de inteiros representando os dias da semana (0=Domingo, 1=Segunda, ..., 6=Sábado) em que a rotina está programada.';
