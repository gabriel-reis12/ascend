import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  generateHunterTag,
  sanitizePublicProfile,
  calculateCompetitiveScore,
  getCurrentSeasonPeriod,
} from '../src/lib/socialScore.ts';

test('ASCEND — Etapa 04.4: Social System — Amigos, Perfis Públicos e Leaderboards', async (t) => {
  const bottomNavSource = fs.readFileSync('src/components/layout/BottomNav.tsx', 'utf8');
  const appSource = fs.readFileSync('src/App.tsx', 'utf8');
  const layoutSource = fs.readFileSync('src/components/layout/RPGLayout.tsx', 'utf8');
  const socialStoreSource = fs.readFileSync('src/stores/useSocialStore.ts', 'utf8');
  const migrationSource = fs.readFileSync('supabase/migrations/20261106_social_system.sql', 'utf8');

  await t.test('1. Geração determinística e unicidade de Hunter Tags', () => {
    const tag1 = generateHunterTag('sung', 'user-uuid-1234');
    const tag2 = generateHunterTag('sung', 'user-uuid-5678');
    const tag3 = generateHunterTag('sung', 'user-uuid-1234');

    assert.ok(tag1.startsWith('sung#'), 'A tag deve começar com o username em minúsculo e #');
    assert.equal(tag1, tag3, 'A mesma combinação de usuário e ID deve gerar a mesma tag determinística');
    assert.notEqual(tag1, tag2, 'IDs diferentes com mesmo username devem gerar tags distintas');
    assert.match(tag1, /^[a-z0-9]+#\d{4}$/, 'A tag deve respeitar o formato alfanumérico com 4 dígitos numéricos');
  });

  await t.test('2. Proteção estrita de privacidade: Sanitização de dados do Perfil Público', () => {
    const sensitiveRawData = {
      id: 'uuid-hunter-secret',
      username: 'ShadowLord',
      hunter_tag: 'shadow#7777',
      class: 'Warrior',
      rank: 'S',
      level: 85,
      title: 'Monarca da Fenda',
      streak_current: 21,
      featured_achievements: ['Muralha de Ferro', 'Execução Perfeita'],
      is_public: true,
      allow_friend_requests: true,
      include_in_global_leaderboard: true,
      bio: 'Treinando sem descanso.',
      // Campos privados que NUNCA devem ser expostos:
      email: 'secret_hunter@private.com',
      birthday: '1995-05-12',
      gender: 'male',
      height: 182,
      weight_current: 82.5,
      weight_target: 80.0,
      nutrition_goal: 'lose',
      main_goal: 'hypertrophy',
      stripe_customer_id: 'cus_1234',
    };

    const publicProfile = sanitizePublicProfile(sensitiveRawData);

    // Campos públicos autorizados
    assert.equal(publicProfile.userId, 'uuid-hunter-secret');
    assert.equal(publicProfile.username, 'ShadowLord');
    assert.equal(publicProfile.hunterTag, 'shadow#7777');
    assert.equal(publicProfile.rank, 'S');
    assert.equal(publicProfile.level, 85);
    assert.equal(publicProfile.activeTitle, 'Monarca da Fenda');
    assert.equal(publicProfile.streakCurrent, 21);
    assert.deepEqual(publicProfile.featuredAchievements, ['Muralha de Ferro', 'Execução Perfeita']);
    assert.equal(publicProfile.bio, 'Treinando sem descanso.');

    // NUNCA pode vazar campos privados sensíveis
    assert.equal(publicProfile.email, undefined, 'E-mail não pode existir no perfil público');
    assert.equal(publicProfile.birthday, undefined, 'Data de nascimento não pode existir');
    assert.equal(publicProfile.gender, undefined, 'Gênero não pode existir');
    assert.equal(publicProfile.height, undefined, 'Altura não pode existir');
    assert.equal(publicProfile.weight_current, undefined, 'Peso atual não pode existir');
    assert.equal(publicProfile.weight_target, undefined, 'Peso meta não pode existir');
    assert.equal(publicProfile.nutrition_goal, undefined, 'Meta de nutrição não pode existir');
  });

  await t.test('3. Pontuação Competitiva Determinística: Tetos de anti-spam e integridade', () => {
    // Cenário de spam: Usuário tenta cadastrar 10 treinos no mesmo dia e 50 hábitos
    const scoreSpamAttempt = calculateCompetitiveScore({
      workoutDates: [
        '2026-11-06', '2026-11-06', '2026-11-06', // 3 treinos no mesmo dia
      ],
      habitsPerDay: {
        '2026-11-06': 50, // 50 hábitos em 1 dia
      },
      bossRaidActive: true,
      bossDefeatedInPeriod: true,
      streakDaysInPeriod: 7,
      periodType: 'weekly',
    });

    // Treinos: 1 único dia de treino = 100 pts (e não 300 pts)
    assert.equal(scoreSpamAttempt.workoutsCount, 1);
    assert.equal(scoreSpamAttempt.workoutsScore, 100);

    // Hábitos: Limitado a 5 hábitos por dia (Cap = 100 pts, e não 1000 pts)
    assert.equal(scoreSpamAttempt.habitsCount, 5);
    assert.equal(scoreSpamAttempt.habitsScore, 100);

    // Boss Raid: 50 ativação + 150 derrotado = 200 pts
    assert.equal(scoreSpamAttempt.bossScore, 200);

    // Streak: 7 dias x 10 pts = 70 pts
    assert.equal(scoreSpamAttempt.streakScore, 70);

    // Total protegido: 100 + 100 + 200 + 70 = 470
    assert.equal(scoreSpamAttempt.score, 470);
  });

  await t.test('4. Períodos competitivos ISO: Ciclos semanais e temporadas mensais', () => {
    const weeklyPeriod = getCurrentSeasonPeriod('weekly', new Date('2026-11-06T12:00:00Z'));
    assert.match(weeklyPeriod.key, /^2026-W\d{2}$/, 'Chave semanal deve seguir formato YYYY-Www');
    assert.ok(weeklyPeriod.daysRemaining >= 0 && weeklyPeriod.daysRemaining <= 7);

    const monthlyPeriod = getCurrentSeasonPeriod('monthly', new Date('2026-11-06T12:00:00Z'));
    assert.equal(monthlyPeriod.key, '2026-11');
    assert.ok(monthlyPeriod.daysRemaining >= 1 && monthlyPeriod.daysRemaining <= 31);
  });

  await t.test('5. Contratos de segurança em useSocialStore (Anti-abuso e amigos)', () => {
    assert.ok(
      socialStoreSource.includes('targetHunter.userId === currentUserId'),
      'Store deve impedir solicitação de amizade para o próprio usuário'
    );
    assert.ok(
      socialStoreSource.includes('!targetHunter.allowFriendRequests'),
      'Store deve respeitar a privacidade se allowFriendRequests for false'
    );
    assert.ok(
      socialStoreSource.includes('outgoingRequests.length >= 20'),
      'Store deve impor limite contra spam de solicitações ativas'
    );
  });

  await t.test('6. Auditoria de Ergonomia Mobile: Bottom Navigation mantém 5 abas sem 6ª aba forçada', () => {
    // Contagem de itens no array BOTTOM_NAV_ITEMS
    const matches = bottomNavSource.match(/\{ path: ['"][^'"]+['"], labelKey: /g);
    assert.equal(matches?.length, 5, 'BottomNav DEVE conter estritamente 5 abas oficiais');

    // BottomNav não deve ter /social
    assert.ok(
      !bottomNavSource.includes("path: '/social'"),
      'BottomNav NÃO deve ter a rota /social para não apertar o menu inferior'
    );

    // RPGLayout e App.tsx registram /social como rota interna e na navegação de menu
    assert.ok(
      appSource.includes('path="social"') && appSource.includes('element={<Social />}'),
      'App.tsx deve registrar a rota /social protegida'
    );
    assert.ok(
      layoutSource.includes("path: '/social'"),
      'RPGLayout deve disponibilizar acesso na navegação secundária / sidebar'
    );
  });

  await t.test('7. Estruturas e RLS da migração local supabase/migrations/20261106_social_system.sql', () => {
    assert.ok(migrationSource.includes('create table if not exists friendships'), 'Migration deve criar friendships');
    assert.ok(migrationSource.includes('create table if not exists leaderboard_scores'), 'Migration deve criar leaderboard_scores');
    assert.ok(migrationSource.includes('alter table friendships enable row level security'), 'RLS deve estar habilitada em friendships');
    assert.ok(migrationSource.includes('auth.uid() = user_id or auth.uid() = friend_id'), 'RLS deve restringir amizades aos próprios participantes');
  });

  await t.test('8. Garantia contra regressão: Sem IA generativa, sem Stripe, dados 100% locais', () => {
    assert.ok(!socialStoreSource.includes('openai') && !socialStoreSource.includes('claude'), 'SocialStore não deve usar IA');
    assert.ok(!socialStoreSource.includes('stripe') && !socialStoreSource.includes('Stripe'), 'SocialStore não deve usar Stripe');
  });
});
