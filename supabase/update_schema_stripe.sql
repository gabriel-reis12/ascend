-- SQL para adicionar suporte a pagamentos do Stripe na tabela profiles
-- Por favor, execute este script no SQL Editor do Supabase se necessário, ou ele já foi aplicado via automação

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Comentários das colunas para documentação
COMMENT ON COLUMN profiles.is_premium IS 'Indica se o caçador possui uma assinatura premium ativa.';
COMMENT ON COLUMN profiles.stripe_customer_id IS 'ID do cliente do Stripe associado ao caçador.';
COMMENT ON COLUMN profiles.stripe_subscription_id IS 'ID da assinatura recorrente do Stripe associada ao caçador.';
