import { findTacoFood, repairMojibake } from '@/lib/taco';
import type { Food } from '@/types/nutrition';

export type NutritionAiSource = 'taco' | 'catalog' | 'estimate';

export interface NutritionAiSourceData {
  found: boolean;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  label?: string;
}

export interface NutritionAiIngredient {
  name: string;
  grams: number;
  taco: NutritionAiSourceData;
  catalog: NutritionAiSourceData;
  estimate: Omit<NutritionAiSourceData, 'found'> & { reason?: string };
  final: {
    source_used: NutritionAiSource;
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export interface NutritionAiPreview {
  mealName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  totalGrams: number;
  confidence: number;
  ingredients: NutritionAiIngredient[];
}

interface MacroSet {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface CatalogEntry extends MacroSet {
  name: string;
  aliases: string[];
  servingGrams?: number;
  servingUnit?: string;
  sourceLabel: string;
  category: 'brand' | 'generic';
  priority?: number;
}

const roundMacro = (value: number) => Number(value.toFixed(1));

const normalize = (value: string) => repairMojibake(value)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const per100FromServing = (entry: CatalogEntry): MacroSet => {
  const serving = entry.servingGrams || 100;
  const factor = 100 / serving;

  return {
    kcal: Math.round(entry.kcal * factor),
    protein: roundMacro(entry.protein * factor),
    carbs: roundMacro(entry.carbs * factor),
    fat: roundMacro(entry.fat * factor),
  };
};

const brandCatalog: CatalogEntry[] = [
  {
    name: "Big Mac (McDonald's)",
    aliases: ['big mac', 'bic mac', 'bigmac'],
    servingGrams: 240,
    servingUnit: 'sanduíche',
    kcal: 590,
    protein: 25,
    carbs: 46,
    fat: 34,
    sourceLabel: 'Catálogo fast food',
    category: 'brand',
    priority: 100,
  },
  {
    name: "Quarterão com Queijo (McDonald's)",
    aliases: ['quarterao', 'quarteirao', 'quarter pounder', 'quarterao com queijo'],
    servingGrams: 200,
    servingUnit: 'sanduíche',
    kcal: 520,
    protein: 30,
    carbs: 42,
    fat: 26,
    sourceLabel: 'Catálogo fast food',
    category: 'brand',
    priority: 98,
  },
  {
    name: "McChicken (McDonald's)",
    aliases: ['mcchicken', 'mc chicken'],
    servingGrams: 145,
    servingUnit: 'sanduíche',
    kcal: 400,
    protein: 14,
    carbs: 39,
    fat: 21,
    sourceLabel: 'Catálogo fast food',
    category: 'brand',
    priority: 98,
  },
  {
    name: "McFritas média (McDonald's)",
    aliases: ['mcfritas media', 'batata media mcdonalds', 'batata frita media mc', 'batata frita media'],
    servingGrams: 117,
    servingUnit: 'porção média',
    kcal: 320,
    protein: 4,
    carbs: 43,
    fat: 15,
    sourceLabel: 'Catálogo fast food',
    category: 'brand',
    priority: 96,
  },
  {
    name: "McFritas grande (McDonald's)",
    aliases: ['mcfritas grande', 'batata grande mcdonalds', 'batata frita grande mc', 'batata frita grande'],
    servingGrams: 154,
    servingUnit: 'porção grande',
    kcal: 480,
    protein: 6,
    carbs: 64,
    fat: 23,
    sourceLabel: 'Catálogo fast food',
    category: 'brand',
    priority: 96,
  },
  {
    name: "Chicken McNuggets 10 unidades (McDonald's)",
    aliases: ['10 nuggets', 'mc nuggets 10', 'mcnuggets 10', 'chicken mcnuggets 10'],
    servingGrams: 160,
    servingUnit: '10 unidades',
    kcal: 410,
    protein: 23,
    carbs: 26,
    fat: 25,
    sourceLabel: 'Catálogo fast food',
    category: 'brand',
    priority: 97,
  },
  {
    name: 'Whopper (Burger King)',
    aliases: ['whopper', 'whooper'],
    servingGrams: 290,
    servingUnit: 'sanduíche',
    kcal: 670,
    protein: 29,
    carbs: 51,
    fat: 40,
    sourceLabel: 'Catálogo fast food',
    category: 'brand',
    priority: 100,
  },
  {
    name: 'Whopper com Queijo (Burger King)',
    aliases: ['whopper queijo', 'whopper com queijo', 'whopper cheese'],
    servingGrams: 310,
    servingUnit: 'sanduíche',
    kcal: 740,
    protein: 33,
    carbs: 53,
    fat: 46,
    sourceLabel: 'Catálogo fast food',
    category: 'brand',
    priority: 101,
  },
  {
    name: 'Subway Frango 15 cm',
    aliases: ['subway frango', 'subway de frango', 'sanduiche subway frango', 'rotisserie chicken subway'],
    servingGrams: 230,
    servingUnit: '15 cm',
    kcal: 320,
    protein: 24,
    carbs: 46,
    fat: 5,
    sourceLabel: 'Catálogo fast food',
    category: 'brand',
    priority: 96,
  },
  {
    name: 'Lasanha industrializada',
    aliases: ['lasanha sadia', 'lasanha seara', 'lasanha congelada', 'lasanha industrializada'],
    servingGrams: 350,
    servingUnit: 'porção',
    kcal: 455,
    protein: 18,
    carbs: 55,
    fat: 18,
    sourceLabel: 'Catálogo industrializados',
    category: 'brand',
    priority: 94,
  },
];

const genericCatalog: CatalogEntry[] = [
  { name: 'Arroz branco cozido', aliases: ['arroz', 'arroz branco', 'arroz cozido', 'rice', 'white rice', 'cooked rice'], kcal: 128, protein: 2.5, carbs: 28.1, fat: 0.3, sourceLabel: 'Estimativa validada', category: 'generic' },
  { name: 'Arroz integral cozido', aliases: ['arroz integral', 'brown rice'], kcal: 124, protein: 2.6, carbs: 25.8, fat: 1, sourceLabel: 'Estimativa validada', category: 'generic', priority: 20 },
  { name: 'Feijão carioca cozido', aliases: ['feijao', 'feijao carioca', 'feijao cozido', 'beans', 'cooked beans'], kcal: 76, protein: 4.8, carbs: 13.6, fat: 0.5, sourceLabel: 'Estimativa validada', category: 'generic' },
  { name: 'Frango grelhado', aliases: ['frango', 'frango grelhado', 'file de frango', 'peito de frango', 'chicken', 'grilled chicken', 'chicken breast'], kcal: 165, protein: 31, carbs: 0, fat: 3.6, sourceLabel: 'Estimativa validada', category: 'generic' },
  { name: 'Carne bovina grelhada', aliases: ['carne', 'bife', 'contra file', 'patinho', 'beef', 'steak'], kcal: 220, protein: 29, carbs: 0, fat: 11, sourceLabel: 'Estimativa validada', category: 'generic' },
  { name: 'Ovo inteiro cozido', aliases: ['ovo', 'ovos', 'ovo cozido', 'egg', 'eggs', 'boiled egg'], kcal: 146, protein: 13.3, carbs: 0.6, fat: 9.5, sourceLabel: 'Estimativa validada', category: 'generic' },
  { name: 'Omelete', aliases: ['omelete', 'omeleta', 'omelet'], kcal: 190, protein: 13, carbs: 1.5, fat: 15, sourceLabel: 'Estimativa validada', category: 'generic' },
  { name: 'Pão francês', aliases: ['pao frances', 'paozinho', 'pao', 'bread', 'french bread', 'roll'], kcal: 300, protein: 8, carbs: 58, fat: 3, sourceLabel: 'Estimativa validada', category: 'generic' },
  { name: 'Pão integral', aliases: ['pao integral', 'pao de forma integral', 'whole wheat bread', 'wholegrain bread'], kcal: 250, protein: 9, carbs: 43, fat: 4, sourceLabel: 'Estimativa validada', category: 'generic', priority: 20 },
  { name: 'Banana', aliases: ['banana'], kcal: 89, protein: 1.1, carbs: 22.8, fat: 0.3, sourceLabel: 'Estimativa validada', category: 'generic' },
  { name: 'Maçã', aliases: ['maca', 'maça', 'apple'], kcal: 52, protein: 0.3, carbs: 14, fat: 0.2, sourceLabel: 'Estimativa validada', category: 'generic' },
  { name: 'Aveia em flocos', aliases: ['aveia', 'oats', 'oatmeal'], kcal: 394, protein: 13.9, carbs: 66.6, fat: 8.5, sourceLabel: 'Estimativa validada', category: 'generic' },
  { name: 'Mel', aliases: ['mel', 'honey'], kcal: 309, protein: 0, carbs: 84, fat: 0, sourceLabel: 'Estimativa validada', category: 'generic' },
  { name: 'Azeite de oliva', aliases: ['azeite', 'oleo de oliva', 'olive oil'], kcal: 884, protein: 0, carbs: 0, fat: 100, sourceLabel: 'Estimativa validada', category: 'generic' },
  { name: 'Queijo mussarela', aliases: ['queijo', 'mussarela', 'muçarela', 'cheese', 'mozzarella'], kcal: 330, protein: 23, carbs: 3, fat: 25, sourceLabel: 'Estimativa validada', category: 'generic' },
  { name: 'Iogurte natural', aliases: ['iogurte natural', 'iogurte', 'yogurt', 'plain yogurt'], kcal: 61, protein: 3.5, carbs: 4.7, fat: 3.3, sourceLabel: 'Estimativa validada', category: 'generic' },
  { name: 'Leite integral', aliases: ['leite', 'leite integral', 'milk', 'whole milk'], kcal: 61, protein: 3.2, carbs: 4.8, fat: 3.3, sourceLabel: 'Estimativa validada', category: 'generic' },
  { name: 'Whey protein', aliases: ['whey', 'whey protein'], kcal: 400, protein: 80, carbs: 8, fat: 6, sourceLabel: 'Estimativa validada', category: 'generic', priority: 40 },
  { name: 'Salada simples', aliases: ['salada', 'alface', 'tomate', 'salad', 'lettuce', 'tomato'], kcal: 25, protein: 1.2, carbs: 4.5, fat: 0.3, sourceLabel: 'Estimativa validada', category: 'generic' },
  { name: 'Batata frita', aliases: ['batata frita', 'fritas', 'fries', 'french fries'], kcal: 312, protein: 3.4, carbs: 41, fat: 15, sourceLabel: 'Estimativa validada', category: 'generic' },
  { name: 'Pizza', aliases: ['pizza', 'fatia de pizza'], kcal: 266, protein: 11, carbs: 33, fat: 10, sourceLabel: 'Estimativa validada', category: 'generic' },
  { name: 'Hambúrguer simples', aliases: ['hamburguer', 'hamburger', 'burger', 'x burger', 'x-burger'], kcal: 260, protein: 14, carbs: 26, fat: 12, sourceLabel: 'Estimativa validada', category: 'generic' },
];

const allCatalog = [...brandCatalog, ...genericCatalog].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

function extractQuantityGrams(phrase: string, entry?: CatalogEntry | Food) {
  const normalized = normalize(phrase);
  const number = '(\\d+(?:[\\.,]\\d+)?)';
  const match = normalized.match(new RegExp(`${number}\\s*(kg|quilo|quilos|g|gr|grama|gramas|gram|grams|ml|unidade|unidades|unit|units|uni|fatia|fatias|slice|slices|colher|colheres|tbsp|tablespoon|tablespoons|concha|conchas|xicara|xicaras|cup|cups|scoop|scoops|porcao|porcoes|serving|servings|piece|pieces)`));
  const defaultServing = getDefaultServingGrams(phrase, entry);

  if (!match) {
    const countMatch = normalized.match(new RegExp(`(?:^|\\s)${number}\\s+(?:${entry ? aliasesForRegex(entry).join('|') : 'unidades?'})`));
    return countMatch ? Number(countMatch[1].replace(',', '.')) * defaultServing : defaultServing;
  }

  const amount = Number(match[1].replace(',', '.'));
  const unit = match[2];

  if (!Number.isFinite(amount) || amount <= 0) return defaultServing;
  if (unit === 'kg' || unit === 'quilo' || unit === 'quilos') return amount * 1000;
  if (unit === 'g' || unit === 'gr' || unit === 'grama' || unit === 'gramas' || unit === 'gram' || unit === 'grams') return amount;
  if (unit === 'ml') return amount;
  if (unit === 'fatia' || unit === 'fatias' || unit === 'slice' || unit === 'slices') return amount * inferSliceGrams(phrase);
  if (unit === 'colher' || unit === 'colheres' || unit === 'tbsp' || unit === 'tablespoon' || unit === 'tablespoons') return amount * inferSpoonGrams(phrase);
  if (unit === 'concha' || unit === 'conchas') return amount * 100;
  if (unit === 'xicara' || unit === 'xicaras' || unit === 'cup' || unit === 'cups') return amount * inferCupGrams(phrase);
  if (unit === 'scoop' || unit === 'scoops') return amount * 30;

  return amount * defaultServing;
}

function getDefaultServingGrams(phrase: string, entry?: CatalogEntry | Food) {
  if (entry && 'serving_size' in entry && entry.serving_size) return Number(entry.serving_size);
  if (entry && 'servingGrams' in entry && entry.servingGrams) return Number(entry.servingGrams);
  return inferServingGrams(phrase);
}

function aliasesForRegex(entry: CatalogEntry | Food) {
  if ('aliases' in entry) return entry.aliases.map(alias => normalize(alias).replace(/\s+/g, '\\s+'));
  return [normalize(entry.name).replace(/\s+/g, '\\s+')];
}

function inferServingGrams(phrase: string) {
  const normalized = normalize(phrase);
  if (/\bovo?s?\b/.test(normalized)) return 50;
  if (normalized.includes('banana')) return 86;
  if (normalized.includes('maca')) return 130;
  if (normalized.includes('pao frances') || normalized === 'pao') return 50;
  if (normalized.includes('pao integral')) return 25;
  if (normalized.includes('whey')) return 30;
  if (normalized.includes('iogurte')) return 170;
  if (normalized.includes('leite')) return 200;
  if (normalized.includes('aveia')) return 30;
  if (normalized.includes('mel')) return 15;
  if (normalized.includes('azeite') || normalized.includes('oleo')) return 13;
  if (normalized.includes('arroz')) return 150;
  if (normalized.includes('feijao')) return 100;
  if (normalized.includes('frango') || normalized.includes('carne') || normalized.includes('bife')) return 120;
  if (normalized.includes('salada')) return 80;
  if (normalized.includes('pizza')) return 110;
  if (normalized.includes('batata frita')) return 120;
  return 100;
}

function inferSliceGrams(phrase: string) {
  const normalized = normalize(phrase);
  if (normalized.includes('pizza')) return 110;
  if (normalized.includes('queijo')) return 20;
  if (normalized.includes('pao')) return 25;
  return 30;
}

function inferSpoonGrams(phrase: string) {
  const normalized = normalize(phrase);
  if (normalized.includes('azeite') || normalized.includes('oleo')) return 13;
  if (normalized.includes('mel') || normalized.includes('manteiga')) return 15;
  if (normalized.includes('aveia')) return 10;
  return 15;
}

function inferCupGrams(phrase: string) {
  const normalized = normalize(phrase);
  if (normalized.includes('leite') || normalized.includes('agua') || normalized.includes('suco')) return 240;
  if (normalized.includes('arroz')) return 160;
  if (normalized.includes('feijao')) return 170;
  if (normalized.includes('aveia')) return 80;
  return 160;
}

function stripQuantity(phrase: string) {
  return phrase
    .replace(/\d+(?:[\.,]\d+)?\s*(kg|quilo|quilos|g|gr|gramas?|grams?|ml|unidades?|units?|uni|fatias?|slices?|colheres?|tbsp|tablespoons?|conchas?|x[ií]caras?|cups?|scoops?|porç(?:ão|oes|ões)|servings?|pieces?)/gi, ' ')
    .replace(/\b(de|do|da|com|with|and|e|mais)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function findCatalogEntry(phrase: string, entries = allCatalog) {
  const normalized = normalize(phrase);
  let best: { entry: CatalogEntry; score: number } | null = null;

  for (const entry of entries) {
    for (const alias of entry.aliases) {
      const normalizedAlias = normalize(alias);
      if (!normalizedAlias) continue;
      const exact = normalized === normalizedAlias;
      const contains = normalized.includes(normalizedAlias);
      const score = exact ? 100 : contains ? normalizedAlias.length : 0;
      const finalScore = score + (entry.priority ?? 0);

      if (score > 0 && (!best || finalScore > best.score)) {
        best = { entry, score: finalScore };
      }
    }
  }

  return best?.entry ?? null;
}

function findLocalFood(phrase: string, foods: Food[]) {
  const normalized = normalize(phrase);
  let best: { food: Food; score: number } | null = null;

  for (const food of foods) {
    const foodName = normalize(food.name);
    if (!foodName) continue;
    const exact = normalized === foodName;
    const contains = normalized.includes(foodName) || foodName.includes(normalized);
    const score = exact ? 100 : contains ? Math.min(foodName.length, normalized.length) : 0;

    if (score > 0 && (!best || score > best.score)) best = { food, score };
  }

  return best?.score && best.score >= 5 ? best.food : null;
}

function sourceDataFromMacro(found: boolean, macro: MacroSet, label?: string): NutritionAiSourceData {
  return {
    found,
    kcal: Math.round(macro.kcal || 0),
    protein: roundMacro(macro.protein || 0),
    carbs: roundMacro(macro.carbs || 0),
    fat: roundMacro(macro.fat || 0),
    label,
  };
}

function chooseFinal(taco: NutritionAiSourceData, catalog: NutritionAiSourceData, estimate: MacroSet) {
  if (catalog.found) return { source_used: 'catalog' as const, ...sourceDataFromMacro(true, catalog) };
  if (taco.found && taco.kcal > 0) return { source_used: 'taco' as const, ...sourceDataFromMacro(true, taco) };
  return { source_used: 'estimate' as const, ...sourceDataFromMacro(true, estimate) };
}

function buildIngredient(phrase: string, foods: Food[]): NutritionAiIngredient {
  const cleanedPhrase = stripQuantity(phrase) || phrase;
  const brandEntry = findCatalogEntry(phrase, brandCatalog);
  const localFood = !brandEntry ? findLocalFood(cleanedPhrase, foods) : null;
  const genericEntry = !brandEntry && !localFood ? findCatalogEntry(cleanedPhrase, genericCatalog) : null;
  const catalogEntry = brandEntry ?? genericEntry;
  const grams = Math.max(1, Math.round(extractQuantityGrams(phrase, brandEntry ?? localFood ?? genericEntry ?? undefined)));

  const tacoMatch = !brandEntry ? findTacoFood(cleanedPhrase) : null;
  const tacoMacro = tacoMatch?.food && tacoMatch.food.kcal > 0
    ? { kcal: tacoMatch.food.kcal, protein: tacoMatch.food.protein, carbs: tacoMatch.food.carbs, fat: tacoMatch.food.fat }
    : { kcal: 0, protein: 0, carbs: 0, fat: 0 };

  const catalogMacro = localFood
    ? {
        kcal: localFood.calories_per_100g,
        protein: localFood.protein_per_100g,
        carbs: localFood.carbs_per_100g,
        fat: localFood.fat_per_100g,
      }
    : catalogEntry
      ? catalogEntry.category === 'brand' ? per100FromServing(catalogEntry) : catalogEntry
      : null;

  const estimateMacro = catalogMacro ?? (tacoMatch?.food && tacoMatch.food.kcal > 0
    ? tacoMacro
    : { kcal: 180, protein: 8, carbs: 20, fat: 7 });

  const taco = sourceDataFromMacro(!!tacoMatch?.food && tacoMatch.food.kcal > 0, tacoMacro, tacoMatch?.food.description);
  const catalog = sourceDataFromMacro(!!catalogMacro, catalogMacro ?? { kcal: 0, protein: 0, carbs: 0, fat: 0 }, localFood ? 'Biblioteca do usuário/app' : catalogEntry?.sourceLabel);
  const estimate = {
    ...sourceDataFromMacro(true, estimateMacro, 'Estimativa controlada'),
    reason: catalogMacro || taco.found ? 'Estimativa espelhada da melhor fonte encontrada.' : 'Item não identificado com segurança; usei uma refeição mista média.',
  };
  const chosen = chooseFinal(taco, catalog, estimateMacro);

  return {
    name: localFood?.name ?? catalogEntry?.name ?? tacoMatch?.food.description ?? cleanedPhrase,
    grams,
    taco,
    catalog,
    estimate: {
      kcal: estimate.kcal,
      protein: estimate.protein,
      carbs: estimate.carbs,
      fat: estimate.fat,
      label: estimate.label,
      reason: estimate.reason,
    },
    final: {
      source_used: chosen.source_used,
      kcal: chosen.kcal,
      protein: chosen.protein,
      carbs: chosen.carbs,
      fat: chosen.fat,
    },
  };
}

function splitMealText(input: string) {
  return input
    .replace(/\s+(?:\+|mais)\s+/gi, ', ')
    .replace(/\s+(?:e|and|with)\s+(?=(?:\d|um|uma|one|two|big|whopper|mc|subway|batata|fries|arroz|rice|feij|beans|frango|chicken|ovo|egg|banana|aveia|oats|salada|salad|p[aã]o|bread|queijo|cheese|iogurte|yogurt|leite|milk|whey|pizza|hamb|burger))/gi, ', ')
    .split(/[;\n,]+/g)
    .map(part => part.trim())
    .filter(Boolean);
}

function mealNameFromIngredients(ingredients: NutritionAiIngredient[], input: string) {
  if (ingredients.length === 1) return ingredients[0].name.toUpperCase();
  const relevant = ingredients
    .slice(0, 4)
    .map(ingredient => ingredient.name.replace(/\s*\(.+?\)\s*/g, '').split(',')[0])
    .filter(Boolean);

  if (relevant.length) return relevant.join(', ').toUpperCase();
  return (stripQuantity(input) || 'Refeição analisada').slice(0, 58).toUpperCase();
}

export function analyzeNutritionText(input: string, foods: Food[] = []): NutritionAiPreview {
  const phrases = splitMealText(input);

  if (!phrases.length) {
    throw new Error('Descreva a refeição para que o Códex possa calibrar.');
  }

  const ingredients = phrases.map(phrase => buildIngredient(phrase, foods));
  const totals = ingredients.reduce(
    (acc, ingredient) => {
      const ratio = ingredient.grams / 100;
      return {
        calories: acc.calories + ingredient.final.kcal * ratio,
        protein: acc.protein + ingredient.final.protein * ratio,
        carbs: acc.carbs + ingredient.final.carbs * ratio,
        fat: acc.fat + ingredient.final.fat * ratio,
        totalGrams: acc.totalGrams + ingredient.grams,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, totalGrams: 0 }
  );
  const detailSignals = input.match(/\b\d+(?:[.,]\d+)?\s*(?:kg|g|gramas?|ml|unidades?|fatias?|colheres?|conchas?|x[ií]caras?|scoops?)\b/gi)?.length ?? 0;
  const strongSources = ingredients.filter(ingredient => ingredient.final.source_used !== 'estimate').length;
  const unknownSources = ingredients.length - strongSources;
  const confidence = clamp(64 + strongSources * 9 + detailSignals * 4 - unknownSources * 10, 45, 96);

  return {
    mealName: mealNameFromIngredients(ingredients, input),
    calories: Math.round(totals.calories),
    protein: roundMacro(totals.protein),
    carbs: roundMacro(totals.carbs),
    fat: roundMacro(totals.fat),
    totalGrams: Math.round(totals.totalGrams),
    confidence,
    ingredients,
  };
}
