import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const nutritionPath = path.join(rootDir, 'src', 'pages', 'Nutrition.tsx');
const mealPlansPath = path.join(rootDir, 'src', 'components', 'nutrition', 'NutritionMealPlans.tsx');

const nutritionSource = fs.readFileSync(nutritionPath, 'utf-8');
const mealPlansSource = fs.readFileSync(mealPlansPath, 'utf-8');

test('Etapa 03.7 — Nutrition.tsx uses ASCEND HUD v2 components (HudCard, TacticalButton, NeonProgressBar, NeonProgressRing, RankBadge)', () => {
    assert.match(nutritionSource, /import\s+\{\s*HudCard\s*\}\s+from\s+['"]@\/components\/ui\/hud-card['"]/);
    assert.match(nutritionSource, /import\s+\{\s*TacticalButton\s*\}\s+from\s+['"]@\/components\/ui\/tactical-button['"]/);
    assert.match(nutritionSource, /import\s+\{\s*NeonProgressBar,\s*NeonProgressRing\s*\}\s+from\s+['"]@\/components\/ui\/neon-progress['"]/);
    assert.match(nutritionSource, /import\s+\{\s*RankBadge\s*\}\s+from\s+['"]@\/components\/ui\/rank-badge['"]/);
    assert.match(nutritionSource, /<NeonProgressRing/);
    assert.match(nutritionSource, /<NeonProgressBar/);
    assert.match(nutritionSource, /<HudCard/);
    assert.match(nutritionSource, /<TacticalButton/);
});

test('Etapa 03.7 — Nutrition.tsx features centered Calorie Progress Ring and compact 3-column horizontal macronutrient summary', () => {
    // Centered calorie ring with leading-none and whitespace-nowrap for zero clipping/overlap
    assert.match(nutritionSource, /value=\{calorieProgress\}/);
    assert.match(nutritionSource, /size=\{196\}/);
    assert.match(nutritionSource, /variant="cyan-purple"/);
    assert.match(nutritionSource, /leading-none/);
    assert.match(nutritionSource, /whitespace-nowrap/);

    // Compact 3-column horizontal macronutrient bar inside HudCard
    assert.match(nutritionSource, /grid-cols-3\s+divide-x\s+divide-white\/10/);
    assert.match(nutritionSource, /dailyMacros\.protein/);
    assert.match(nutritionSource, /dailyMacros\.carbs/);
    assert.match(nutritionSource, /dailyMacros\.fat/);
    assert.match(nutritionSource, /macroTargets\.protein/);
    assert.match(nutritionSource, /macroTargets\.carbs/);
    assert.match(nutritionSource, /macroTargets\.fat/);
});

test('Etapa 03.7 — Nutrition.tsx implements structured TODAYS MEALS cards, manual food search, live nutritional preview, and TACO integration', () => {
    // Today's Meals slots (Café da Manhã, Almoço, Jantar, Lanche)
    assert.match(nutritionSource, /DEFAULT_MEAL_SLOTS/);
    assert.match(nutritionSource, /REFEIÇÕES DE HOJE/);
    assert.match(nutritionSource, /TODAY'S MEALS/);
    assert.match(nutritionSource, /\+ ADICIONAR ALIMENTO/);
    assert.match(nutritionSource, /\+ ADD FOOD/);

    // Manual food registration, editing, deletion, and custom food creation preserved
    assert.match(nutritionSource, /handleLogFood/);
    assert.match(nutritionSource, /handleEditLog/);
    assert.match(nutritionSource, /handleDeleteLog/);
    assert.match(nutritionSource, /handleCreateFood/);
    assert.match(nutritionSource, /quantityToGrams\(selectedFood,\s*Math\.max\(0,\s*quantity\s*\|\|\s*0\)\)/);
    assert.match(nutritionSource, /inputMode="decimal"/);

    // Local deterministic TACO & catalog integration preserved without external AI or horizontal scrolling tables
    assert.match(nutritionSource, /analyzeNutritionText/);
    assert.doesNotMatch(nutritionSource, /overflow-x-auto/);
    assert.doesNotMatch(nutritionSource, /openai|gemini|stripe|paywall/i);
});

test('Etapa 03.7 — NutritionMealPlans.tsx uses ASCEND HUD v2 components and preserves meal plan synchronization and Boss Raid damage', () => {
    assert.match(mealPlansSource, /import\s+\{\s*HudCard\s*\}\s+from\s+['"]@\/components\/ui\/hud-card['"]/);
    assert.match(mealPlansSource, /import\s+\{\s*TacticalButton\s*\}\s+from\s+['"]@\/components\/ui\/tactical-button['"]/);
    assert.match(mealPlansSource, /<HudCard/);
    assert.match(mealPlansSource, /<TacticalButton/);
    assert.match(nutritionSource, /handleUseMealPlan/);
    assert.match(nutritionSource, /attackActiveBoss/);
});
