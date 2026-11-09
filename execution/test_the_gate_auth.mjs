import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('ASCEND — MINIMAL DARK: Redesign Completo da Experiência de Autenticação', async (t) => {
  const hunterLogin = fs.readFileSync('src/components/ui/hunter-login.tsx', 'utf8');
  const loginPage = fs.readFileSync('src/pages/auth/LoginPage.tsx', 'utf8');
  const registerPage = fs.readFileSync('src/pages/auth/RegisterPage.tsx', 'utf8');
  const forgotPage = fs.readFileSync('src/pages/auth/ForgotPasswordPage.tsx', 'utf8');

  await t.test('1. Remoção estrita de elementos decorativos desnecessários, badges falsos e THE GATE', () => {
    // Não deve conter cards falsos de Rank C, Level 12, Streak 18d nem boss da fenda
    assert.ok(!hunterLogin.includes("value: '12'"), 'Não deve conter card falso de Nível 12');
    assert.ok(!hunterLogin.includes("value: 'C'"), 'Não deve conter card falso de Rank C');
    assert.ok(!hunterLogin.includes("value: '18d'"), 'Não deve conter card falso de Streak 18d');
    assert.ok(!hunterLogin.includes('Mente de Ferro'), 'Não deve exibir boss falso para usuário não autenticado');
    assert.ok(!hunterLogin.includes('Shadow Striker'), 'Não deve exibir classe falsa para usuário não autenticado');
    assert.ok(!hunterLogin.includes('Metabolismo Basal'), 'Não deve exibir stats de nutrição não autenticados');

    // Remoção dos badges e elementos de THE GATE
    assert.ok(!hunterLogin.includes('GATE CALIBRATED') && !hunterLogin.includes('Gate Calibrado'), 'Não deve conter GATE CALIBRATED');
    assert.ok(!hunterLogin.includes('ENTRY PROTOCOL') && !hunterLogin.includes('Protocolo de Entrada'), 'Não deve conter ENTRY PROTOCOL');
  });

  await t.test('2. Conceito MINIMAL DARK e hierarquia de comunicação editorial', () => {
    assert.ok(
      hunterLogin.includes('Bem-vindo de volta') || hunterLogin.includes('Welcome back'),
      'Deve conter a headline de boas-vindas'
    );
    assert.ok(
      hunterLogin.includes('Sua evolução começa aqui') || hunterLogin.includes('Your evolution starts here'),
      'Deve conter a linha evocativa editorial'
    );
    assert.ok(
      hunterLogin.includes('Entrar no ASCEND') || hunterLogin.includes('Enter ASCEND'),
      'Deve conter o CTA principal com texto claro'
    );
  });

  await t.test('3. Campos de entrada com acessibilidade, autocomplete e compatibilidade com gerenciadores', () => {
    assert.ok(hunterLogin.includes('autoComplete="email"'), 'Campo de e-mail deve ter autoComplete="email"');
    assert.ok(
      hunterLogin.includes('autoComplete="current-password"') || hunterLogin.includes('current-password'),
      'Campo de senha deve suportar current-password para login'
    );
    assert.ok(
      hunterLogin.includes('autoComplete="new-password"') || hunterLogin.includes('new-password'),
      'Campo de cadastro deve suportar new-password'
    );
    assert.ok(
      hunterLogin.includes('htmlFor={inputId}') || hunterLogin.includes('htmlFor={name}'),
      'Inputs devem ter labels associadas via htmlFor'
    );
  });

  await t.test('4. Ergonomia Mobile e Thumb Zone com acesso imediato ao formulário', () => {
    assert.ok(hunterLogin.includes('min-h-[52px]'), 'Botão principal deve possuir altura mínima de 52px');
    assert.ok(hunterLogin.includes('min-h-[44px]'), 'Botões secundários e toggles devem ter área de toque >= 44px');
    assert.ok(
      !hunterLogin.includes('h-44 sm:h-52'),
      'Não deve possuir banner intrusivo que empurra o formulário para baixo da dobra'
    );
    assert.ok(
      hunterLogin.includes('LanguageSwitcher'),
      'Deve incluir seletor de idioma acessível'
    );
  });

  await t.test('5. Consistência em Registro e Recuperação de Senha', () => {
    assert.ok(registerPage.includes('HunterLogin'), 'RegisterPage deve reutilizar HunterLogin');
    assert.ok(forgotPage.includes('min-h-[52px]'), 'ForgotPasswordPage deve ter CTA com min-h 52px');
    assert.ok(forgotPage.includes('resetPasswordForEmail'), 'ForgotPasswordPage deve manter integração de auth');
  });

  await t.test('6. Salvaguardas anti-regressão: Zero dependências proibidas', () => {
    assert.ok(!hunterLogin.includes('openai'), 'Zero chamadas à OpenAI');
    assert.ok(!hunterLogin.includes('stripe'), 'Zero dependências de Stripe');
    assert.ok(!loginPage.includes('stripe'), 'LoginPage limpa de Stripe');
    assert.ok(!registerPage.includes('stripe'), 'RegisterPage limpa de Stripe');
    assert.ok(!forgotPage.includes('stripe'), 'ForgotPasswordPage limpa de Stripe');
  });
});
