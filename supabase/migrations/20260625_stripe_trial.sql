-- Migration: Adicionar suporte a trial e status detalhado do Stripe
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_status TEXT;

-- Adicionar comentários explicativos
COMMENT ON COLUMN profiles.trial_ends_at IS 'Data/hora em que o período de testes (trial) expira no Stripe.';
COMMENT ON COLUMN profiles.subscription_status IS 'Status exato da assinatura no Stripe (ex: active, trialing, past_due, canceled).';
