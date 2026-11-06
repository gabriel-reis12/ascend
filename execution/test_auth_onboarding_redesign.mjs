import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('ASCEND — Etapa 03.11: Redesign e Resiliência de Login, Registro e Onboarding', async (t) => {
  const loginPage = fs.readFileSync('src/pages/auth/LoginPage.tsx', 'utf8');
  const registerPage = fs.readFileSync('src/pages/auth/RegisterPage.tsx', 'utf8');
  const hunterLogin = fs.readFileSync('src/components/ui/hunter-login.tsx', 'utf8');
  const onboarding = fs.readFileSync('src/pages/Onboarding.tsx', 'utf8');

  await t.test('1. Rotas /login e /register redirecionam usuários já autenticados sem travar no formulário', () => {
    // LoginPage redirect check
    assert.ok(
      loginPage.includes('user && !authLoading'),
      'LoginPage deve verificar se há usuário com authLoading finalizado'
    );
    assert.ok(
      loginPage.includes("navigate('/', { replace: true })") &&
      loginPage.includes("navigate('/onboarding', { replace: true })"),
      'LoginPage deve redirecionar para / se perfil completo ou /onboarding se incompleto'
    );

    // RegisterPage redirect check
    assert.ok(
      registerPage.includes('user && !authLoading'),
      'RegisterPage deve verificar se há usuário com authLoading finalizado'
    );
    assert.ok(
      registerPage.includes("navigate('/', { replace: true })") &&
      registerPage.includes("navigate('/onboarding', { replace: true })"),
      'RegisterPage deve redirecionar para / se perfil completo ou /onboarding se incompleto'
    );
    assert.ok(
      registerPage.includes('confirmPassword'),
      'RegisterPage deve validar confirmação de senha'
    );
  });

  await t.test('2. Onboarding.tsx redireciona imediatamente perfis completos sem delay artificial nem flash', () => {
    assert.ok(
      onboarding.includes('hunterClass') && onboarding.includes("navigate('/', { replace: true })"),
      'Onboarding deve redirecionar perfis com hunterClass para / com replace'
    );
    // Verificar que não há mais timeouts artificiais de 1200ms ou 1500ms para loading
    assert.ok(
      !onboarding.includes('1500') && !onboarding.includes('1200'),
      'Onboarding não deve ter os timers artificiais de 1200ms e 1500ms no carregamento'
    );
  });

  await t.test('3. Onboarding.tsx realiza preenchimento com dados existentes e restaura a etapa correta', () => {
    // Pre-população
    assert.ok(
      onboarding.includes('hunterStore.fullName') &&
      onboarding.includes('hunterStore.gender') &&
      onboarding.includes('hunterStore.birthday'),
      'Onboarding deve inicializar campos do formulário com dados existentes de hunterStore'
    );
    // Retomada inteligente de etapa
    assert.ok(
      onboarding.includes("setStep('architect-intro')") &&
      onboarding.includes("setStep('experience-level')") &&
      onboarding.includes("setStep('main-goal')") &&
      onboarding.includes("setStep('physical-profile')"),
      'Onboarding deve restaurar a etapa mais avançada já respondida pelo caçador'
    );
  });

  await t.test('4. Onboarding.tsx oferece navegação bidirecional ("Voltar") em todas as etapas', () => {
    // Botões de voltar
    assert.ok(
      onboarding.includes('handlePrevQuestion'),
      'Onboarding deve permitir voltar dentro das perguntas do quiz até o início'
    );
    assert.ok(
      onboarding.includes("onClick={() => setStep('basic-info')}") &&
      onboarding.includes("onClick={() => setStep('physical-profile')}") &&
      onboarding.includes("onClick={() => setStep('main-goal')}") &&
      onboarding.includes("onClick={() => setStep('experience-level')}"),
      'Onboarding deve permitir voltar entre as etapas do formulário de perfil'
    );
    assert.ok(
      onboarding.includes("setStep('class-quiz')"),
      'Onboarding deve permitir voltar da tela de seleção de classe para o quiz'
    );
    assert.ok(
      onboarding.includes('l(\'Voltar\', \'Back\')'),
      'Onboarding deve ter rótulo bilíngue para o botão Voltar'
    );
  });

  await t.test('5. Validação rigorosa de dados de entrada e ergonomia de teclado mobile', () => {
    // Validação de nome min 2 chars
    assert.ok(
      onboarding.includes('form.fullName.trim().length < 2'),
      'Onboarding deve validar que o nome tenha pelo menos 2 caracteres'
    );
    // Validação de gênero
    assert.ok(
      onboarding.includes('form.gender'),
      'Onboarding deve validar obrigatoriedade de seleção de gênero'
    );
    // Validação de data de nascimento
    assert.ok(
      onboarding.includes('birthDate > now') && onboarding.includes('birthDate.getFullYear() < 1900'),
      'Onboarding deve validar que a data de nascimento não é futura nem anterior a 1900'
    );
    // Validação de limites numéricos (altura e peso)
    assert.ok(
      onboarding.includes('h < 50 || h > 260'),
      'Onboarding deve validar limites fisiológicos para altura (50-260 cm)'
    );
    assert.ok(
      onboarding.includes('wc < 20 || wc > 350'),
      'Onboarding deve validar limites fisiológicos para peso (20-350 kg)'
    );
    // Ergonomia mobile inputMode
    assert.ok(
      onboarding.includes('inputMode="decimal"') || onboarding.includes("inputMode='decimal'"),
      'Onboarding deve utilizar inputMode="decimal" para altura e peso'
    );
  });

  await t.test('6. Persistência de rascunho do quiz em localStorage contra recargas acidentais', () => {
    assert.ok(
      onboarding.includes('ascend_onboarding_quiz_'),
      'Onboarding deve persistir respostas do quiz em localStorage indexado por userId'
    );
    assert.ok(
      onboarding.includes('localStorage.removeItem(`ascend_onboarding_quiz_${user.id}`)'),
      'Onboarding deve limpar rascunho temporário do quiz após o despertar com sucesso'
    );
  });

  await t.test('7. Diferenciação explícita de estados de autenticação e recuperação de falha', () => {
    // Tratamento de loading
    assert.ok(
      onboarding.includes('profileLoading'),
      'Onboarding deve verificar explicitamente profileLoading'
    );
    // Tratamento de erro de rede / RLS
    assert.ok(
      onboarding.includes('profileError') && onboarding.includes('loadProfile'),
      'Onboarding deve apresentar estado de erro com botão de reintento sem zerar perfil'
    );
    // Opção de deslogar em caso de bloqueio
    assert.ok(
      onboarding.includes('signOut'),
      'Onboarding deve disponibilizar botão de encerramento de sessão (signOut)'
    );
  });

  await t.test('8. Ergonomia Mobile e HUD v2 em HunterLogin e Onboarding', () => {
    // HunterLogin sem título gigante nem stats bloqueando o teclado em mobile
    assert.ok(
      hunterLogin.includes('text-2xl sm:text-3xl'),
      'HunterLogin deve ter título responsivo adequado para mobile'
    );
    assert.ok(
      hunterLogin.includes('hidden sm:grid'),
      'HunterLogin deve ocultar preview decorativo de atributos em telas estreitas para não obstruir teclado'
    );
    // HUD v2 components
    assert.ok(
      onboarding.includes('HudCard') && onboarding.includes('TacticalButton'),
      'Onboarding deve utilizar componentes oficiais HudCard e TacticalButton'
    );
    assert.ok(
      onboarding.includes('NeonProgressBar'),
      'Onboarding deve utilizar NeonProgressBar para visualização do progresso das etapas'
    );
  });
});
