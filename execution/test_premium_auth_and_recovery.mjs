import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('ASCEND — Etapa 04.0: Refinamento Premium de Login, Registro e Recuperação', async (t) => {
  const loginPage = fs.readFileSync('src/pages/auth/LoginPage.tsx', 'utf8');
  const registerPage = fs.readFileSync('src/pages/auth/RegisterPage.tsx', 'utf8');
  const forgotPage = fs.readFileSync('src/pages/auth/ForgotPasswordPage.tsx', 'utf8');
  const forgotModal = fs.readFileSync('src/components/auth/ForgotPasswordModal.tsx', 'utf8');
  const hunterLogin = fs.readFileSync('src/components/ui/hunter-login.tsx', 'utf8');
  const appRoutes = fs.readFileSync('src/App.tsx', 'utf8');
  const authContext = fs.readFileSync('src/contexts/AuthContext.tsx', 'utf8');

  await t.test('1. Resiliência de rotas e proteção contra loops em LoginPage e RegisterPage', () => {
    // Redirecionamentos de usuários já autenticados
    assert.ok(
      loginPage.includes('user && !authLoading'),
      'LoginPage deve verificar se há usuário com authLoading finalizado'
    );
    assert.ok(
      loginPage.includes("navigate('/', { replace: true })") &&
      loginPage.includes("navigate('/onboarding', { replace: true })"),
      'LoginPage deve redirecionar para / se perfil completo ou /onboarding se incompleto'
    );
    assert.ok(
      registerPage.includes('user && !authLoading'),
      'RegisterPage deve verificar se há usuário com authLoading finalizado'
    );
    assert.ok(
      registerPage.includes("navigate('/', { replace: true })") &&
      registerPage.includes("navigate('/onboarding', { replace: true })"),
      'RegisterPage deve redirecionar para / se perfil completo ou /onboarding se incompleto'
    );
  });

  await t.test('2. Validação rigorosa e feedback amigável de erros de autenticação', () => {
    // Tratamento de mensagens amigáveis em LoginPage
    assert.ok(
      loginPage.includes('formatAuthError') &&
      loginPage.includes('invalid credentials') &&
      loginPage.includes('email not confirmed') &&
      loginPage.includes('too many requests'),
      'LoginPage deve formatar erros do Supabase em mensagens claras para o caçador'
    );
    // Validação de confirmação de senha e comprimento em RegisterPage
    assert.ok(
      registerPage.includes('confirmPassword') &&
      registerPage.includes('password !== confirmPassword') &&
      registerPage.includes('password.length < 6'),
      'RegisterPage deve validar tamanho da chave (>= 6) e coincidência entre chaves'
    );
  });

  await t.test('3. Modal e Página dedicados de Recuperação de Senha com HUD v2', () => {
    // Modal
    assert.ok(
      forgotModal.includes('resetPasswordForEmail'),
      'ForgotPasswordModal deve invocar resetPasswordForEmail de AuthContext'
    );
    assert.ok(
      forgotModal.includes('HudCard') && forgotModal.includes('corners'),
      'ForgotPasswordModal deve utilizar HudCard com cantoneiras HUD v2'
    );
    assert.ok(
      forgotModal.includes("e.key === 'Escape'"),
      'ForgotPasswordModal deve suportar fechamento com a tecla Escape'
    );
    assert.ok(
      forgotModal.includes('Sinal Transmitido') || forgotModal.includes('Signal Transmitted'),
      'ForgotPasswordModal deve apresentar feedback claro de sucesso no envio'
    );

    // Página /forgot-password
    assert.ok(
      forgotPage.includes('resetPasswordForEmail') && forgotPage.includes('HudCard'),
      'ForgotPasswordPage deve ser uma rota dedicada com HudCard'
    );
    assert.ok(
      appRoutes.includes('path="/forgot-password"') && appRoutes.includes('ForgotPasswordPage'),
      'App.tsx deve registrar a rota /forgot-password'
    );
  });

  await t.test('4. HunterLogin integra fluxo de recuperação de chave de acesso sem quebrar a tela', () => {
    assert.ok(
      hunterLogin.includes('ForgotPasswordModal'),
      'HunterLogin deve integrar ForgotPasswordModal'
    );
    assert.ok(
      hunterLogin.includes('recoveryModalOpen') || hunterLogin.includes('setRecoveryModalOpen'),
      'HunterLogin deve gerenciar o estado de abertura do modal de recuperação'
    );
    assert.ok(
      hunterLogin.includes('handleOpenRecovery') || hunterLogin.includes('onForgotPassword'),
      'HunterLogin deve acionar a recuperação a partir do botão tático'
    );
  });

  await t.test('5. Indicadores em tempo real no cadastro e orientação sobre o próximo passo', () => {
    assert.ok(
      hunterLogin.includes('Mínimo de 6 caracteres') || hunterLogin.includes('At least 6 characters'),
      'HunterLogin deve exibir indicador visual de comprimento de chave no cadastro'
    );
    assert.ok(
      hunterLogin.includes('Chaves de acesso coincidem') || hunterLogin.includes('Passwords match'),
      'HunterLogin deve exibir indicador em tempo real de correspondência de senhas'
    );
    assert.ok(
      hunterLogin.includes('Arquiteto') || hunterLogin.includes('Architect'),
      'HunterLogin deve orientar o caçador que o próximo passo é o Despertar com o Arquiteto'
    );
  });

  await t.test('6. Ergonomia Mobile, Thumb Zone e Acessibilidade (min-h 52px nos CTAs)', () => {
    assert.ok(
      hunterLogin.includes('min-h-[52px]'),
      'HunterLogin deve possuir botão CTA principal com min-h de 52px'
    );
    assert.ok(
      hunterLogin.includes('min-h-[44px]'),
      'HunterLogin deve garantir área de toque mínima de 44px para botões secundários'
    );
    assert.ok(
      hunterLogin.includes('text-2xl sm:text-3xl'),
      'HunterLogin deve manter tipografia de título adaptada para viewports móveis'
    );
    assert.ok(
      hunterLogin.includes('hidden sm:grid'),
      'HunterLogin deve ocultar blocos decorativos de stats em mobile para preservar visibilidade'
    );
    assert.ok(
      hunterLogin.includes('font-sans') || hunterLogin.includes('font-inter'),
      'HunterLogin deve usar tipografia legível para os campos de digitação de email'
    );
  });

  await t.test('7. Painel de Apoio Visual refinado Minimal Dark e Universo ASCEND', () => {
    assert.ok(
      hunterLogin.includes('/optimized/Login Screen.jpg') &&
      hunterLogin.includes('lg:block'),
      'O painel visual desktop deve exibir a arte de personagem autêntica em split-screen'
    );
    assert.ok(
      !hunterLogin.includes('Gate Calibrado') && !hunterLogin.includes('Gate Calibrated'),
      'O painel visual não deve exibir o indicador tático obsoleto Gate Calibrado'
    );
    assert.ok(
      hunterLogin.includes('Sua evolução começa aqui') ||
      hunterLogin.includes('Your evolution starts here'),
      'O painel visual deve exibir a linha editorial evocativa'
    );
  });

  await t.test('8. Garantia contra regressão: Sem IA generativa, sem Stripe, dados 100% locais', () => {
    assert.ok(!loginPage.includes('stripe') && !loginPage.includes('Stripe'), 'LoginPage não deve ter Stripe');
    assert.ok(!registerPage.includes('stripe') && !registerPage.includes('Stripe'), 'RegisterPage não deve ter Stripe');
    assert.ok(!hunterLogin.includes('openai') && !hunterLogin.includes('claude'), 'HunterLogin não deve ter chamadas a IA externa');
    assert.ok(!forgotModal.includes('openai') && !forgotModal.includes('stripe'), 'ForgotPasswordModal não deve ter IA nem Stripe');
  });
});

