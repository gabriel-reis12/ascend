import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  analyzeNutritionText,
  extractQuantityGramsDetails,
  normalizeFoodText,
  splitMealText,
  stripQuantity,
} from '../src/lib/nutritionAi.ts';

const rootDir = process.cwd();
const nutritionPagePath = path.join(rootDir, 'src', 'pages', 'Nutrition.tsx');
const nutritionAiPath = path.join(rootDir, 'src', 'lib', 'nutritionAi.ts');
const tacoPath = path.join(rootDir, 'src', 'lib', 'taco.ts');

const nutritionPageSource = fs.readFileSync(nutritionPagePath, 'utf-8');
const nutritionAiSource = fs.readFileSync(nutritionAiPath, 'utf-8');
const tacoSource = fs.readFileSync(tacoPath, 'utf-8');

test('ASCEND — Parser Determinístico de Refeições & Catálogo TACO', async (t) => {

  await t.test('1. Suporte a unidades e conversões determinísticas de porção (g, kg, ml, colheres, xícaras, conchas, fatias, scoops, frações)', () => {
    // Gramas diretos
    const gResult = extractQuantityGramsDetails('150 g de arroz');
    assert.equal(gResult.grams, 150);
    assert.equal(gResult.unit, 'g');
    assert.equal(gResult.isZero, false);

    // Gramas sem espaço
    const gSpaceless = extractQuantityGramsDetails('200g frango');
    assert.equal(gSpaceless.grams, 200);

    // Quilogramas com vírgula (padrão PT-BR)
    const kgComma = extractQuantityGramsDetails('1,5 kg de melancia');
    assert.equal(kgComma.grams, 1500);
    assert.equal(kgComma.unit, 'kg');

    // Quilogramas com ponto
    const kgDot = extractQuantityGramsDetails('0.5 kg de batata');
    assert.equal(kgDot.grams, 500);

    // Mililitros / Litros
    const mlResult = extractQuantityGramsDetails('250 ml de suco');
    assert.equal(mlResult.grams, 250);
    const lResult = extractQuantityGramsDetails('1 l de leite');
    assert.equal(lResult.grams, 1000);

    // Colher de sopa, sobremesa e chá
    const sopaResult = extractQuantityGramsDetails('2 colheres de sopa de azeite');
    assert.equal(sopaResult.grams, 30); // 2 * 15g
    const sobremesaResult = extractQuantityGramsDetails('1 colher de sobremesa');
    assert.equal(sobremesaResult.grams, 10);
    const chaResult = extractQuantityGramsDetails('2 colheres de cha de acucar');
    assert.equal(chaResult.grams, 10); // 2 * 5g

    // Concha e Xícara
    const conchaResult = extractQuantityGramsDetails('2 conchas de feijao');
    assert.equal(conchaResult.grams, 260); // 2 * 130g
    const xicaraResult = extractQuantityGramsDetails('1 xicara de arroz');
    assert.equal(xicaraResult.grams, 160);

    // Fatias
    const fatiaResult = extractQuantityGramsDetails('3 fatias de queijo');
    assert.equal(fatiaResult.grams, 90); // 3 * 30g

    // Scoops / Doses de suplemento
    const scoopResult = extractQuantityGramsDetails('2 scoops de whey protein');
    assert.equal(scoopResult.grams, 60); // 2 * 30g

    // Frações comuns (1/2, 1/4)
    const fracaoXicara = extractQuantityGramsDetails('1/2 xicara de aveia');
    assert.equal(fracaoXicara.grams, 40); // 0.5 * 80g (xícara de aveia = 80g)
    const fracaoPizza = extractQuantityGramsDetails('1/2 fatia de pizza');
    assert.equal(fracaoPizza.grams, 55); // 0.5 * 110g (fatia de pizza = 110g)
  });

  await t.test('2. Tratamento estrito de quantidades zero (0g) ou inválidas sem conversão oculta para porção padrão', () => {
    // 0g não deve virar porção padrão de 150g
    const zeroGrams = extractQuantityGramsDetails('0 g de arroz');
    assert.equal(zeroGrams.grams, 0);
    assert.equal(zeroGrams.isZero, true);

    const zeroNoSpace = extractQuantityGramsDetails('0g frango');
    assert.equal(zeroNoSpace.grams, 0);
    assert.equal(zeroNoSpace.isZero, true);

    // Executando no parser completo
    const previewZero = analyzeNutritionText('0g de arroz cozido');
    assert.equal(previewZero.hasInvalidQuantity, true);
    assert.equal(previewZero.allMatched, false);
    assert.equal(previewZero.ingredients[0].status, 'invalid_quantity');
    assert.equal(previewZero.ingredients[0].grams, 0);
  });

  await t.test('3. Identificação determinística de unidades não reconhecidas (ex: galões, baldes) sinalizadas para ajuste manual', () => {
    const unrecGal = extractQuantityGramsDetails('3 galoes de leite');
    assert.equal(unrecGal.unrecognizedUnit, 'galoes');

    const unrecBalde = extractQuantityGramsDetails('2 baldes de pipoca');
    assert.equal(unrecBalde.unrecognizedUnit, 'baldes');

    // Executando no parser completo: deve marcar status como 'unmatched' e não inventar conversão
    const previewUnrec = analyzeNutritionText('2 baldes de pipoca');
    assert.equal(previewUnrec.allMatched, false);
    assert.equal(previewUnrec.ingredients[0].unrecognizedUnit, 'baldes');
    assert.equal(previewUnrec.ingredients[0].status, 'unmatched');
  });

  await t.test('4. Refeição com múltiplos itens separados por delimitadores (+, vírgula, ponto e vírgula, quebra de linha)', () => {
    const mealInput = '150 g de arroz + 100 g de frango + 80 g de feijão';
    const splitItems = splitMealText(mealInput);
    assert.equal(splitItems.length, 3);

    const preview = analyzeNutritionText(mealInput);
    assert.equal(preview.ingredients.length, 3);
    assert.equal(preview.totalGrams, 330);
    assert.ok(preview.calories > 0);
    assert.ok(preview.protein > 0);
    assert.ok(preview.carbs > 0);

    // Múltiplos delimitadores misturados
    const mixedInput = "2 fatias de queijo, 1 ovo cozido;\n200 ml de leite";
    const mixedSplit = splitMealText(mixedInput);
    assert.equal(mixedSplit.length, 3);
  });

  await t.test('5. Fusão determinística de itens duplicados (ex: 100g arroz + 50g arroz -> 150g)', () => {
    const duplicatedInput = '100g arroz cozido + 50g arroz cozido';
    const preview = analyzeNutritionText(duplicatedInput);

    // Deve mesclar em um único ingrediente somando as gramas
    assert.equal(preview.ingredients.length, 1);
    assert.equal(preview.ingredients[0].grams, 150);
    assert.equal(preview.totalGrams, 150);

    // As calorias devem ser exatamente proporcionais a 150g
    const single150Preview = analyzeNutritionText('150g arroz cozido');
    assert.equal(preview.calories, single150Preview.calories);
    assert.equal(preview.protein, single150Preview.protein);
    assert.equal(preview.carbs, single150Preview.carbs);
    assert.equal(preview.fat, single150Preview.fat);
  });

  await t.test('6. Zero alucinação nutricional: itens não encontrados NUNCA recebem macros sintéticos ou inventados', () => {
    // Alimento inventado/inexistente na TACO
    const unknownText = '100g de substancia cosmica misteriosa desconhecida';
    const preview = analyzeNutritionText(unknownText);

    assert.equal(preview.allMatched, false);
    assert.equal(preview.unmatchedCount, 1);
    assert.equal(preview.coverage, 0);

    const item = preview.ingredients[0];
    assert.equal(item.status, 'unmatched');
    assert.equal(item.final.source_used, 'unresolved');
    assert.equal(item.final.kcal, 0);
    assert.equal(item.final.protein, 0);
    assert.equal(item.final.carbs, 0);
    assert.equal(item.final.fat, 0);

    // Código fonte não deve conter o fallback legado de 180 kcal sintéticas
    assert.doesNotMatch(nutritionAiSource, /kcal:\s*180,\s*protein:\s*8/);
  });

  await t.test('7. Identificação de ambiguidade e listagem de candidatos TACO para escolha explícita do usuário', () => {
    // "frango" é um termo amplo que corresponde a peito grelhado, peito cozido, etc.
    const preview = analyzeNutritionText('150g frango');
    const frangoItem = preview.ingredients[0];

    // Deve identificar ambiguidade e oferecer candidatos
    assert.equal(frangoItem.isAmbiguous, true);
    assert.equal(frangoItem.status, 'ambiguous');
    assert.ok(frangoItem.candidates && frangoItem.candidates.length > 1);

    // Os candidatos devem conter opções reais da TACO (ex: cozido, grelhado, assado)
    const candidateNames = frangoItem.candidates.map(c => c.name.toLowerCase());
    assert.ok(candidateNames.some(name => name.includes('frango')));

    // A contagem de ambíguos na preview deve ser 1 e allMatched deve ser false enquanto não resolvido
    assert.equal(preview.ambiguousCount, 1);
    assert.equal(preview.allMatched, false);
  });

  await t.test('8. Entrada vazia ou contendo apenas espaços em branco lança erro descritivo sem quebrar a aplicação', () => {
    assert.throws(
      () => analyzeNutritionText(''),
      /Descreva a refeição|Describe the meal/
    );
    assert.throws(
      () => analyzeNutritionText('   \n\t   '),
      /Descreva a refeição|Describe the meal/
    );
  });

  await t.test('9. Integração na interface Nutrition.tsx: segurança, disclaimer clínico e desativação de salvamento com pendências', () => {
    // Componentes de resolução de ambiguidade
    assert.match(nutritionPageSource, /handleSelectCandidate/);
    assert.match(nutritionPageSource, /handleUpdateIngredientGrams/);
    assert.match(nutritionPageSource, /handleRemoveIngredient/);

    // O botão de salvar deve estar condicionado a !iaPreview.allMatched || iaPreview.totalGrams <= 0
    assert.match(nutritionPageSource, /disabled=\{iaRegistering\s*\|\|\s*!iaPreview\.allMatched\s*\|\|\s*iaPreview\.totalGrams\s*<=\s*0/);

    // Botões de exemplo rápido (NUTRITION_PROMPTS)
    assert.match(nutritionPageSource, /150 g de arroz \+ 100 g de frango/);
    assert.match(nutritionPageSource, /NUTRITION_PROMPTS/);

    // Link para a busca tradicional no catálogo TACO
    assert.match(nutritionPageSource, /Busca Normal no Catálogo TACO/);

    // Disclaimer médico/clínico explícito
    assert.match(nutritionPageSource, /Aviso de Integridade/);
    assert.match(nutritionPageSource, /não substitui avaliação clínica, orientação médica ou de nutricionista/);

    // Preservação de todos os métodos de registro e edição manual
    assert.match(nutritionPageSource, /handleLogFood/);
    assert.match(nutritionPageSource, /handleEditLog/);
    assert.match(nutritionPageSource, /handleDeleteLog/);
    assert.match(nutritionPageSource, /handleCreateFood/);
  });

  await t.test('10. taco.ts exporta searchTacoCandidates e preserva pontuação e normalização', () => {
    assert.match(tacoSource, /export function searchTacoCandidates/);
    assert.match(tacoSource, /findTacoFood/);
    assert.match(tacoSource, /repairMojibake/);
  });

});
