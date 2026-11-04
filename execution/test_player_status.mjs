import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';

describe('ASCEND Etapa 03.4 — Redesign Premium: Player Status (Dashboard.tsx & RadarChart.tsx)', () => {
  const dashboard = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');
  const radarChart = fs.readFileSync('src/components/ui/RadarChart.tsx', 'utf-8');

  it('Deve utilizar os componentes oficiais do Design System ASCEND HUD v2', () => {
    const requiredComponents = [
      'HudCard',
      'TacticalButton',
      'NeonProgressBar',
      'RankBadge',
      'RadarChart',
    ];
    for (const comp of requiredComponents) {
      assert.ok(
        dashboard.includes(`<${comp}`),
        `Componente oficial HUD v2 <${comp}> não encontrado em src/pages/Dashboard.tsx`
      );
    }
  });

  it('Deve consumir dados reais do personagem (useHunterStore, useHabits, progression.ts, Supabase) sem valores fictícios fixos', () => {
    assert.ok(dashboard.includes('useHunterStore'), 'useHunterStore ausente');
    assert.ok(dashboard.includes('useHabits'), 'useHabits ausente');
    assert.ok(dashboard.includes('state.level'), 'state.level ausente');
    assert.ok(dashboard.includes('state.rank'), 'state.rank ausente');
    assert.ok(dashboard.includes('state.xp'), 'state.xp ausente');
    assert.ok(dashboard.includes('state.xpRequired'), 'state.xpRequired ausente');
    assert.ok(dashboard.includes('RANK_PROMOTION_LEVELS'), 'RANK_PROMOTION_LEVELS ausente');
    assert.ok(dashboard.includes('DAILY_COMMON_XP_EFFECTIVE_MAX'), 'DAILY_COMMON_XP_EFFECTIVE_MAX ausente');
    assert.ok(dashboard.includes('WEEKLY_BONUS_XP_CAP'), 'WEEKLY_BONUS_XP_CAP ausente');
  });

  it('Deve exibir o Rank apenas uma vez dentro do RankBadge hexagonal (showLabel={false}) ao lado do rótulo RANK', () => {
    assert.ok(
      dashboard.includes('<RankBadge rank={state.rank || \'E\'} size="md" showLabel={false} />'),
      'RankBadge deve utilizar showLabel={false} para evitar duplicação da letra do rank'
    );
    assert.ok(
      !dashboard.includes('>{state.rank || \'E\'}</span>'),
      'Letra do rank não deve ser duplicada fora do RankBadge'
    );
  });

  it('Deve preservar todos os 7 atributos reais do sistema (STR, END, INT, DIS, VIT, WIS, BAL) e seus cálculos', () => {
    const statKeys = [
      "'strength'",
      "'endurance'",
      "'intelligence'",
      "'discipline'",
      "'vitality'",
      "'wisdom'",
      "'balance'",
    ];
    for (const key of statKeys) {
      assert.ok(
        dashboard.includes(key),
        `Atributo real ${key} ausente em src/pages/Dashboard.tsx`
      );
    }
    assert.ok(
      dashboard.includes('Math.max(1, Math.floor(value / 10))'),
      'Cálculo de nível de domínio/atributo ausente'
    );
    assert.ok(
      dashboard.includes('(value % 10) * 10'),
      'Cálculo de progresso de tier de atributo ausente'
    );
  });

  it('Deve modernizar o RadarChart.tsx com estética holográfica ciano/púrpura sem alterar a geometria dos dados', () => {
    assert.ok(
      radarChart.includes('Math.min(stat.value / stat.max, 1)'),
      'Cálculo original de proporção do RadarChart foi alterado indevidamente'
    );
    assert.ok(
      radarChart.includes('#00F0FF') && radarChart.includes('#A855F7'),
      'Gradientes holográficos #00F0FF e #A855F7 ausentes no RadarChart.tsx'
    );
    assert.ok(
      radarChart.includes('React.useId()'),
      'RadarChart deve usar IDs únicos para evitar colisão de defs SVG'
    );
  });

  it('Deve exibir a seção real de Conquistas & Títulos (Recent Achievements) sincronizada com o Supabase e permitir equipar títulos', () => {
    assert.ok(
      dashboard.includes(".from('achievements')"),
      "Consulta real à tabela 'achievements' do Supabase ausente"
    );
    assert.ok(
      dashboard.includes('ALL_POSSIBLE_ACHIEVEMENTS'),
      'Catálogo real ALL_POSSIBLE_ACHIEVEMENTS ausente'
    );
    assert.ok(
      dashboard.includes('state.equipTitle(titleName, user.id)'),
      'Ação real state.equipTitle para equipar títulos desbloqueados ausente'
    );
  });

  it('Deve resolver dinamicamente a ilustração otimizada real da classe e rank no Hero e manter o modal de inspeção', () => {
    assert.ok(
      dashboard.includes('/optimized/Classes/${safeClass}/Rank ${imageRank}.jpg'),
      'Resolução dinâmica de arte otimizada da classe/rank ausente'
    );
    assert.ok(
      dashboard.includes('setIsAvatarOpen(true)') && dashboard.includes('setIsAvatarOpen(false)'),
      'Lightbox de inspeção do avatar (isAvatarOpen) ausente'
    );
  });

  it('Deve preservar todas as âncoras do ProductTour (tour-hud, tour-status, tour-domains, tour-history, tour-biometrics) e suporte a idiomas PT-BR/EN-US', () => {
    const requiredTourIds = [
      'id="tour-hud"',
      'id="tour-status"',
      'id="tour-domains"',
      'id="tour-history"',
      'id="tour-biometrics"',
    ];
    for (const tourId of requiredTourIds) {
      assert.ok(
        dashboard.includes(tourId),
        `Âncora obrigatória do ProductTour ausente em Dashboard.tsx: ${tourId}`
      );
    }
    assert.ok(
      dashboard.includes('usePreferences') && dashboard.includes('translateUiText'),
      'Suporte bilíngue (usePreferences / translateUiText) ausente'
    );
  });
});

