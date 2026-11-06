import { findTacoFood, searchTacoCandidates, repairMojibake } from './taco.ts';
import type { Food } from '../types/nutrition.ts';

export type NutritionAiSource = 'taco' | 'catalog' | 'estimate' | 'manual' | 'unresolved';
export type NutritionAiLanguage = 'pt-BR' | 'en-US';

export interface NutritionAiSourceData {
  found: boolean;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  label?: string;
}

export interface NutritionCandidate {
  name: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  source: 'taco' | 'catalog';
  score?: number;
}

export interface NutritionAiIngredient {
  rawPhrase: string;
  name: string;
  grams: number;
  status: 'matched' | 'ambiguous' | 'unmatched' | 'invalid_quantity';
  isAmbiguous?: boolean;
  unrecognizedUnit?: string | null;
  candidates?: NutritionCandidate[];
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
  allMatched: boolean;
  unmatchedCount: number;
  ambiguousCount: number;
  hasInvalidQuantity: boolean;
  coverage: number;
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

export const normalizeFoodText = (value: string) =>
  repairMojibake(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

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
  { name: 'Arroz branco cozido', aliases: ['arroz', 'arroz branco', 'arroz cozido', 'rice', 'white rice', 'cooked rice'], kcal: 128, protein: 2.5, carbs: 28.1, fat: 0.3, sourceLabel: 'Catálogo validado', category: 'generic' },
  { name: 'Arroz integral cozido', aliases: ['arroz integral', 'brown rice'], kcal: 124, protein: 2.6, carbs: 25.8, fat: 1, sourceLabel: 'Catálogo validado', category: 'generic', priority: 20 },
  { name: 'Feijão carioca cozido', aliases: ['feijao', 'feijao carioca', 'feijao cozido', 'beans', 'cooked beans'], kcal: 76, protein: 4.8, carbs: 13.6, fat: 0.5, sourceLabel: 'Catálogo validado', category: 'generic' },
  { name: 'Frango grelhado', aliases: ['frango', 'frango grelhado', 'file de frango', 'peito de frango', 'chicken', 'grilled chicken', 'chicken breast'], kcal: 165, protein: 31, carbs: 0, fat: 3.6, sourceLabel: 'Catálogo validado', category: 'generic' },
  { name: 'Carne bovina grelhada', aliases: ['carne', 'bife', 'contra file', 'patinho', 'beef', 'steak'], kcal: 220, protein: 29, carbs: 0, fat: 11, sourceLabel: 'Catálogo validado', category: 'generic' },
  { name: 'Ovo inteiro cozido', aliases: ['ovo', 'ovos', 'ovo cozido', 'egg', 'eggs', 'boiled egg'], kcal: 146, protein: 13.3, carbs: 0.6, fat: 9.5, sourceLabel: 'Catálogo validado', category: 'generic' },
  { name: 'Omelete', aliases: ['omelete', 'omeleta', 'omelet'], kcal: 190, protein: 13, carbs: 1.5, fat: 15, sourceLabel: 'Catálogo validado', category: 'generic' },
  { name: 'Pão francês', aliases: ['pao frances', 'paozinho', 'pao', 'bread', 'french bread', 'roll'], kcal: 300, protein: 8, carbs: 58, fat: 3, sourceLabel: 'Catálogo validado', category: 'generic' },
  { name: 'Pão integral', aliases: ['pao integral', 'pao de forma integral', 'whole wheat bread', 'wholegrain bread'], kcal: 250, protein: 9, carbs: 43, fat: 4, sourceLabel: 'Catálogo validado', category: 'generic', priority: 20 },
  { name: 'Banana', aliases: ['banana'], kcal: 89, protein: 1.1, carbs: 22.8, fat: 0.3, sourceLabel: 'Catálogo validado', category: 'generic' },
  { name: 'Maçã', aliases: ['maca', 'maça', 'apple'], kcal: 52, protein: 0.3, carbs: 14, fat: 0.2, sourceLabel: 'Catálogo validado', category: 'generic' },
  { name: 'Aveia em flocos', aliases: ['aveia', 'oats', 'oatmeal'], kcal: 394, protein: 13.9, carbs: 66.6, fat: 8.5, sourceLabel: 'Catálogo validado', category: 'generic' },
  { name: 'Mel', aliases: ['mel', 'honey'], kcal: 309, protein: 0, carbs: 84, fat: 0, sourceLabel: 'Catálogo validado', category: 'generic' },
  { name: 'Azeite de oliva', aliases: ['azeite', 'oleo de oliva', 'olive oil'], kcal: 884, protein: 0, carbs: 0, fat: 100, sourceLabel: 'Catálogo validado', category: 'generic' },
  { name: 'Queijo mussarela', aliases: ['queijo', 'mussarela', 'muçarela', 'cheese', 'mozzarella'], kcal: 330, protein: 23, carbs: 3, fat: 25, sourceLabel: 'Catálogo validado', category: 'generic' },
  { name: 'Iogurte natural', aliases: ['iogurte natural', 'iogurte', 'yogurt', 'plain yogurt'], kcal: 61, protein: 3.5, carbs: 4.7, fat: 3.3, sourceLabel: 'Catálogo validado', category: 'generic' },
  { name: 'Leite integral', aliases: ['leite', 'leite integral', 'milk', 'whole milk'], kcal: 61, protein: 3.2, carbs: 4.8, fat: 3.3, sourceLabel: 'Catálogo validado', category: 'generic' },
  { name: 'Whey protein', aliases: ['whey', 'whey protein'], kcal: 400, protein: 80, carbs: 8, fat: 6, sourceLabel: 'Catálogo validado', category: 'generic', priority: 40 },
  { name: 'Salada simples', aliases: ['salada', 'alface', 'tomate', 'salad', 'lettuce', 'tomato'], kcal: 25, protein: 1.2, carbs: 4.5, fat: 0.3, sourceLabel: 'Catálogo validado', category: 'generic' },
  { name: 'Batata frita', aliases: ['batata frita', 'fritas', 'fries', 'french fries'], kcal: 312, protein: 3.4, carbs: 41, fat: 15, sourceLabel: 'Catálogo validado', category: 'generic' },
  { name: 'Pizza', aliases: ['pizza', 'fatia de pizza'], kcal: 266, protein: 11, carbs: 33, fat: 10, sourceLabel: 'Catálogo validado', category: 'generic' },
  { name: 'Hambúrguer simples', aliases: ['hamburguer', 'hamburger', 'burger', 'x burger', 'x-burger'], kcal: 260, protein: 14, carbs: 26, fat: 12, sourceLabel: 'Catálogo validado', category: 'generic' },
];

const allCatalog = [...brandCatalog, ...genericCatalog].sort(
  (a, b) => (b.priority ?? 0) - (a.priority ?? 0)
);

const ENGLISH_CATALOG_NAMES: Record<string, string> = {
  'big mac mcdonald s': "Big Mac (McDonald's)",
  'quarterao com queijo mcdonald s': "Quarter Pounder with Cheese (McDonald's)",
  'mcchicken mcdonald s': "McChicken (McDonald's)",
  'mcfritas media mcdonald s': "Medium Fries (McDonald's)",
  'mcfritas grande mcdonald s': "Large Fries (McDonald's)",
  'chicken mcnuggets 10 unidades mcdonald s': "10-piece Chicken McNuggets (McDonald's)",
  'whopper burger king': 'Whopper (Burger King)',
  'whopper com queijo burger king': 'Whopper with Cheese (Burger King)',
  'subway frango 15 cm': 'Subway Chicken 15 cm',
  'lasanha industrializada': 'Frozen lasagna',
  'arroz branco cozido': 'Cooked white rice',
  'arroz branco': 'White rice',
  'arroz integral cozido': 'Cooked brown rice',
  'feijao carioca cozido': 'Cooked pinto beans',
  'frango grelhado': 'Grilled chicken',
  'carne bovina grelhada': 'Grilled beef',
  'ovo inteiro cozido': 'Boiled whole egg',
  'ovo cozido': 'Boiled egg',
  'omelete': 'Omelet',
  'pao frances': 'French bread roll',
  'pao integral': 'Whole wheat bread',
  'batata doce': 'Sweet potato',
  'banana': 'Banana',
  'brocolis': 'Broccoli',
  'maca': 'Apple',
  'aveia em flocos': 'Rolled oats',
  'aveia': 'Oats',
  'mel': 'Honey',
  'azeite de oliva': 'Olive oil',
  'queijo mussarela': 'Mozzarella cheese',
  'iogurte natural': 'Plain yogurt',
  'leite integral': 'Whole milk',
  'whey protein': 'Whey protein',
  'salada simples': 'Simple salad',
  'batata frita': 'French fries',
  'pizza': 'Pizza',
  'hamburguer simples': 'Simple burger',
};

const ENGLISH_SOURCE_LABELS: Record<string, string> = {
  'catalogo fast food': 'Fast food catalog',
  'catalogo industrializados': 'Packaged foods catalog',
  'catalogo validado': 'Validated catalog',
  'biblioteca do usuario app': 'User/app library',
};

function localizeCatalogName(entry: CatalogEntry, language: NutritionAiLanguage) {
  if (language !== 'en-US') return entry.name;
  return ENGLISH_CATALOG_NAMES[normalizeFoodText(entry.name)] ?? entry.name;
}

function localizeSourceLabel(label: string | undefined, language: NutritionAiLanguage) {
  if (!label || language !== 'en-US') return label;
  return ENGLISH_SOURCE_LABELS[normalizeFoodText(label)] ?? label;
}

function localizeStandardFoodName(food: Food, language: NutritionAiLanguage) {
  if (language !== 'en-US' || food.is_custom) return food.name;
  return ENGLISH_CATALOG_NAMES[normalizeFoodText(food.name)] ?? food.name;
}

interface ParsedQuantityResult {
  grams: number;
  rawAmount: number;
  unit: string | null;
  isValid: boolean;
  isZero: boolean;
  unrecognizedUnit: string | null;
}

export function extractQuantityGramsDetails(
  phrase: string,
  entry?: CatalogEntry | Food
): ParsedQuantityResult {
  let clean = repairMojibake(phrase)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  // Substitui frações comuns antes de pontuações
  clean = clean
    .replace(/\b1\/2\b/g, '0.5')
    .replace(/\b1\/4\b/g, '0.25')
    .replace(/\b3\/4\b/g, '0.75');

  // Converte vírgula decimal entre dígitos em ponto: "1,5" -> "1.5"
  clean = clean.replace(/(\d+),(\d+)/g, (_, a, b) => `${a}.${b}`);

  // Normaliza caracteres restantes mantendo ponto decimal
  clean = clean.replace(/[^a-z0-9.]+/g, ' ').trim();

  const numberPattern = '(\\d+(?:\\.\\d+)?)';
  const knownUnitsPattern =
    '(kg|quilo|quilos|kilos|g|gr|grama|gramas|gram|grams|ml|mililitro|mililitros|l|litro|litros|unidade|unidades|unit|units|uni|un|und|fatia|fatias|slice|slices|colheres de sopa|colher de sopa|colheres de sobremesa|colher de sobremesa|colheres de cha|colher de cha|colheres de cafe|colher de cafe|colheres|colher|tbsp|tablespoon|tablespoons|tsp|conchas|concha|xicaras|xicara|copos|copo|cups|cup|scoops|scoop|doses|dose|pratos|prato|porcoes|porcao|servings|serving|pieces|piece)\\b';

  // 1. Procura número seguido de unidade conhecida
  const match = clean.match(new RegExp(`${numberPattern}\\s*${knownUnitsPattern}`));
  const defaultServing = getDefaultServingGrams(phrase, entry);

  if (match) {
    const amount = Number(match[1]);
    const unit = match[2];

    if (!Number.isFinite(amount) || amount < 0) {
      return {
        grams: 0,
        rawAmount: 0,
        unit,
        isValid: false,
        isZero: true,
        unrecognizedUnit: null,
      };
    }

    if (amount === 0) {
      return {
        grams: 0,
        rawAmount: 0,
        unit,
        isValid: false,
        isZero: true,
        unrecognizedUnit: null,
      };
    }

    let calculatedGrams = defaultServing;
    if (unit === 'kg' || unit === 'quilo' || unit === 'quilos' || unit === 'kilos') {
      calculatedGrams = amount * 1000;
    } else if (
      unit === 'g' ||
      unit === 'gr' ||
      unit === 'grama' ||
      unit === 'gramas' ||
      unit === 'gram' ||
      unit === 'grams' ||
      unit === 'ml' ||
      unit === 'mililitro' ||
      unit === 'mililitros'
    ) {
      calculatedGrams = amount;
    } else if (unit === 'l' || unit === 'litro' || unit === 'litros') {
      calculatedGrams = amount * 1000;
    } else if (unit === 'fatia' || unit === 'fatias' || unit === 'slice' || unit === 'slices') {
      calculatedGrams = amount * inferSliceGrams(phrase);
    } else if (
      unit.includes('colher de sopa') ||
      unit.includes('colheres de sopa') ||
      unit === 'tbsp' ||
      unit === 'tablespoon' ||
      unit === 'tablespoons'
    ) {
      calculatedGrams = amount * 15;
    } else if (
      unit.includes('colher de sobremesa') ||
      unit.includes('colheres de sobremesa')
    ) {
      calculatedGrams = amount * 10;
    } else if (
      unit.includes('colher de cha') ||
      unit.includes('colheres de cha') ||
      unit.includes('colher de cafe') ||
      unit.includes('colheres de cafe') ||
      unit === 'tsp'
    ) {
      calculatedGrams = amount * 5;
    } else if (unit.includes('colher') || unit.includes('colheres')) {
      calculatedGrams = amount * inferSpoonGrams(phrase);
    } else if (unit === 'concha' || unit === 'conchas') {
      calculatedGrams = amount * (clean.includes('feij') ? 130 : 100);
    } else if (unit === 'prato' || unit === 'pratos') {
      calculatedGrams = amount * 250;
    } else if (
      unit === 'xicara' ||
      unit === 'xicaras' ||
      unit === 'copo' ||
      unit === 'copos' ||
      unit === 'cup' ||
      unit === 'cups'
    ) {
      calculatedGrams = amount * inferCupGrams(phrase);
    } else if (unit === 'scoop' || unit === 'scoops' || unit === 'dose' || unit === 'doses') {
      calculatedGrams = amount * 30;
    } else {
      calculatedGrams = amount * defaultServing;
    }

    return {
      grams: Math.round(calculatedGrams),
      rawAmount: amount,
      unit,
      isValid: calculatedGrams > 0,
      isZero: calculatedGrams <= 0,
      unrecognizedUnit: null,
    };
  }

  // 2. Procura padrão com unidade não suportada após número (ex: "3 galoes de leite", "2 baldes de pipoca")
  const unknownUnitMatch = clean.match(
    new RegExp(`${numberPattern}\\s*([a-z]{3,15})`)
  );
  if (unknownUnitMatch) {
    const rawNum = Number(unknownUnitMatch[1]);
    const candidateUnit = unknownUnitMatch[2];
    const isKnownWord = [
      'arroz',
      'feijao',
      'frango',
      'carne',
      'ovo',
      'ovos',
      'pao',
      'banana',
      'maca',
      'batata',
      'salada',
      'leite',
      'iogurte',
      'whey',
      'pizza',
      'bife',
      'file',
      'queijo',
      'aveia',
      'mel',
      'azeite',
      'pipoca',
      'suco',
      'agua',
      'peixe',
      'atum',
      'salmao',
      'pasta',
      'macarrao',
    ].includes(candidateUnit);

    if (!isKnownWord && rawNum > 0) {
      return {
        grams: 0,
        rawAmount: rawNum,
        unit: candidateUnit,
        isValid: false,
        isZero: false,
        unrecognizedUnit: candidateUnit,
      };
    }
  }

  // 3. Procura apenas número no início (ex: "2 ovos")
  const countMatch = clean.match(
    new RegExp(`(?:^|\\s)${numberPattern}\\s+(?:${entry ? aliasesForRegex(entry).join('|') : 'unidades?'})`)
  );
  if (countMatch) {
    const amount = Number(countMatch[1].replace(',', '.'));
    if (amount <= 0) {
      return {
        grams: 0,
        rawAmount: 0,
        unit: 'unidades',
        isValid: false,
        isZero: true,
        unrecognizedUnit: null,
      };
    }
    return {
      grams: Math.round(amount * defaultServing),
      rawAmount: amount,
      unit: 'unidades',
      isValid: true,
      isZero: false,
      unrecognizedUnit: null,
    };
  }

  // Se nenhum número foi informado, assume porção padrão com aviso
  return {
    grams: defaultServing,
    rawAmount: 1,
    unit: 'porção',
    isValid: true,
    isZero: false,
    unrecognizedUnit: null,
  };
}

function getDefaultServingGrams(phrase: string, entry?: CatalogEntry | Food) {
  if (entry && 'serving_size' in entry && entry.serving_size) {
    const parsed = Number(entry.serving_size);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  if (entry && 'servingGrams' in entry && entry.servingGrams) return Number(entry.servingGrams);
  return inferServingGrams(phrase);
}

function aliasesForRegex(entry: CatalogEntry | Food) {
  if ('aliases' in entry) return entry.aliases.map((alias) => normalizeFoodText(alias).replace(/\s+/g, '\\s+'));
  return [normalizeFoodText(entry.name).replace(/\s+/g, '\\s+')];
}

function inferServingGrams(phrase: string) {
  const normalized = normalizeFoodText(phrase);
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
  const normalized = normalizeFoodText(phrase);
  if (normalized.includes('pizza')) return 110;
  if (normalized.includes('queijo')) return 30;
  if (normalized.includes('pao')) return 25;
  return 30;
}

function inferSpoonGrams(phrase: string) {
  const normalized = normalizeFoodText(phrase);
  if (normalized.includes('azeite') || normalized.includes('oleo')) return 13;
  if (normalized.includes('mel') || normalized.includes('manteiga')) return 15;
  if (normalized.includes('aveia')) return 10;
  return 15;
}

function inferCupGrams(phrase: string) {
  const normalized = normalizeFoodText(phrase);
  if (normalized.includes('leite') || normalized.includes('agua') || normalized.includes('suco')) return 240;
  if (normalized.includes('arroz')) return 160;
  if (normalized.includes('feijao')) return 170;
  if (normalized.includes('aveia')) return 80;
  return 160;
}

export function stripQuantity(phrase: string) {
  return phrase
    .replace(/\b1\/[24]\b/g, '')
    .replace(
      /\d+(?:[.,]\d+)?\s*(kg|quilo|quilos|kilos|g|gr|gramas?|grams?|ml|mililitros?|l|litros?|unidades?|units?|uni|un|und|fatias?|slices?|colheres?\s+de\s+(?:sopa|sobremesa|cha|cafe)|colheres?|tbsp|tablespoons?|tsp|conchas?|ladles?|x[ií]caras?|copos?|cups?|scoops?|doses?|pratos?|porç(?:ão|oes|ões)|servings?|pieces?)/gi,
      ' '
    )
    .replace(/\b(de|do|da|com|with|and|e|mais)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function findCatalogEntry(phrase: string, entries = allCatalog) {
  const normalized = normalizeFoodText(phrase);
  let best: { entry: CatalogEntry; score: number } | null = null;

  for (const entry of entries) {
    for (const alias of entry.aliases) {
      const normalizedAlias = normalizeFoodText(alias);
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
  const normalized = normalizeFoodText(phrase);
  let best: { food: Food; score: number } | null = null;

  for (const food of foods) {
    const foodName = normalizeFoodText(food.name);
    if (!foodName) continue;
    const exact = normalized === foodName;
    const contains = normalized.includes(foodName) || foodName.includes(normalized);
    const score = exact ? 100 : contains ? Math.min(foodName.length, normalized.length) : 0;

    if (score > 0 && (!best || score > best.score)) best = { food, score };
  }

  return best?.score && best.score >= 5 ? best.food : null;
}

function sourceDataFromMacro(
  found: boolean,
  macro: MacroSet,
  label?: string
): NutritionAiSourceData {
  return {
    found,
    kcal: Math.round(macro.kcal || 0),
    protein: roundMacro(macro.protein || 0),
    carbs: roundMacro(macro.carbs || 0),
    fat: roundMacro(macro.fat || 0),
    label,
  };
}

function buildIngredient(
  phrase: string,
  foods: Food[],
  language: NutritionAiLanguage
): NutritionAiIngredient {
  const cleanedPhrase = stripQuantity(phrase) || phrase;
  const brandEntry = findCatalogEntry(phrase, brandCatalog);
  const localFood = !brandEntry ? findLocalFood(cleanedPhrase, foods) : null;
  const genericEntry =
    !brandEntry && !localFood ? findCatalogEntry(cleanedPhrase, genericCatalog) : null;
  const catalogEntry = brandEntry ?? genericEntry;

  const qtyDetails = extractQuantityGramsDetails(
    phrase,
    brandEntry ?? localFood ?? genericEntry ?? undefined
  );

  // Busca candidatos no catálogo TACO para desambiguação
  const tacoCandidates = !brandEntry ? searchTacoCandidates(cleanedPhrase, 5) : [];
  const tacoMatch = tacoCandidates.length > 0 ? tacoCandidates[0] : null;

  const tacoMacro =
    tacoMatch?.food && tacoMatch.food.kcal > 0
      ? {
          kcal: tacoMatch.food.kcal,
          protein: tacoMatch.food.protein,
          carbs: tacoMatch.food.carbs,
          fat: tacoMatch.food.fat,
        }
      : { kcal: 0, protein: 0, carbs: 0, fat: 0 };

  const catalogMacro = localFood
    ? {
        kcal: localFood.calories_per_100g,
        protein: localFood.protein_per_100g,
        carbs: localFood.carbs_per_100g,
        fat: localFood.fat_per_100g,
      }
    : catalogEntry
    ? catalogEntry.category === 'brand'
      ? per100FromServing(catalogEntry)
      : catalogEntry
    : null;

  const isTacoFound = Boolean(tacoMatch?.food && tacoMatch.food.kcal > 0);
  const isCatalogFound = Boolean(catalogMacro);
  const isFound = isCatalogFound || isTacoFound;

  // Ambiguidades: se há mais de um candidato forte na TACO
  const isAmbiguous =
    tacoCandidates.length > 1 &&
    tacoCandidates[1].score >= 0.4 &&
    !brandEntry &&
    !localFood;

  const formattedCandidates: NutritionCandidate[] = tacoCandidates.map((c) => ({
    name: c.food.description,
    kcal: c.food.kcal,
    protein: c.food.protein,
    carbs: c.food.carbs,
    fat: c.food.fat,
    source: 'taco' as const,
    score: c.score,
  }));

  // Determinação de status
  let status: NutritionAiIngredient['status'] = 'matched';
  if (qtyDetails.unrecognizedUnit) {
    status = 'unmatched';
  } else if (qtyDetails.isZero || qtyDetails.grams <= 0 || !qtyDetails.isValid) {
    status = 'invalid_quantity';
  } else if (!isFound) {
    status = 'unmatched';
  } else if (isAmbiguous) {
    status = 'ambiguous';
  }

  // Se NÃO foi encontrado, NÃO inventa macros (zero valores sintéticos)
  const finalMacro: MacroSet = isCatalogFound
    ? (catalogMacro as MacroSet)
    : isTacoFound
    ? tacoMacro
    : { kcal: 0, protein: 0, carbs: 0, fat: 0 };

  const sourceUsed: NutritionAiSource = isCatalogFound
    ? 'catalog'
    : isTacoFound
    ? 'taco'
    : 'unresolved';

  const taco = sourceDataFromMacro(
    isTacoFound,
    tacoMacro,
    tacoMatch?.food.description
  );
  const catalogLabel = localFood
    ? 'Biblioteca do usuário/app'
    : catalogEntry?.sourceLabel;
  const catalog = sourceDataFromMacro(
    isCatalogFound,
    catalogMacro ?? { kcal: 0, protein: 0, carbs: 0, fat: 0 },
    localizeSourceLabel(catalogLabel, language)
  );

  const estimateReason = isFound
    ? language === 'en-US'
      ? 'Resolved from validated nutritional source.'
      : 'Resolvido de fonte nutricional validada.'
    : language === 'en-US'
    ? 'Item not found in TACO or catalog. Please select or enter manually.'
    : 'Item não localizado na TACO nem no catálogo. Selecione uma sugestão ou informe manualmente.';

  const estimate = {
    ...sourceDataFromMacro(
      isFound,
      finalMacro,
      language === 'en-US' ? 'Reference database' : 'Base de referência'
    ),
    reason: estimateReason,
  };

  const resolvedName = localFood
    ? localizeStandardFoodName(localFood, language)
    : catalogEntry
    ? localizeCatalogName(catalogEntry, language)
    : tacoMatch?.food.description ?? cleanedPhrase;

  return {
    rawPhrase: phrase,
    name: resolvedName,
    grams: qtyDetails.grams,
    status,
    isAmbiguous,
    unrecognizedUnit: qtyDetails.unrecognizedUnit,
    candidates: formattedCandidates.length > 0 ? formattedCandidates : undefined,
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
      source_used: sourceUsed,
      kcal: finalMacro.kcal,
      protein: finalMacro.protein,
      carbs: finalMacro.carbs,
      fat: finalMacro.fat,
    },
  };
}

export function splitMealText(input: string): string[] {
  return input
    .replace(/\s+(?:\+|mais)\s+/gi, ', ')
    .replace(
      /\s+(?:e|and|with)\s+(?=(?:\d|um|uma|one|two|big|whopper|mc|subway|batata|fries|arroz|rice|feij|beans|frango|chicken|ovo|egg|banana|aveia|oats|salada|salad|p[aã]o|bread|queijo|cheese|iogurte|yogurt|leite|milk|whey|pizza|hamb|burger))/gi,
      ', '
    )
    .split(/[;\n,]+/g)
    .map((part) => part.trim())
    .filter(Boolean);
}

function mealNameFromIngredients(
  ingredients: NutritionAiIngredient[],
  input: string,
  language: NutritionAiLanguage
) {
  if (ingredients.length === 1) return ingredients[0].name.toUpperCase();
  const relevant = ingredients
    .slice(0, 4)
    .map((ingredient) => ingredient.name.replace(/\s*\(.+?\)\s*/g, '').split(',')[0])
    .filter(Boolean);

  if (relevant.length) return relevant.join(', ').toUpperCase();
  return (
    stripQuantity(input) ||
    (language === 'en-US' ? 'Analyzed meal' : 'Refeição analisada')
  )
    .slice(0, 58)
    .toUpperCase();
}

/**
 * Mescla ingredientes duplicados (ex: 100g de arroz + 50g de arroz -> 150g de arroz)
 */
function mergeDuplicateIngredients(
  ingredients: NutritionAiIngredient[]
): NutritionAiIngredient[] {
  const merged: NutritionAiIngredient[] = [];
  const map = new Map<string, number>();

  for (const ing of ingredients) {
    const key = `${normalizeFoodText(ing.name)}:${ing.final.source_used}`;
    if (map.has(key)) {
      const existingIdx = map.get(key)!;
      merged[existingIdx].grams += ing.grams;
      merged[existingIdx].rawPhrase += ` + ${ing.rawPhrase}`;
    } else {
      map.set(key, merged.length);
      merged.push({ ...ing });
    }
  }

  return merged;
}

export function analyzeNutritionText(
  input: string,
  foods: Food[] = [],
  language: NutritionAiLanguage = 'pt-BR'
): NutritionAiPreview {
  const phrases = splitMealText(input);

  if (!phrases.length) {
    throw new Error(
      language === 'en-US'
        ? 'Describe the meal so the Codex can calibrate it.'
        : 'Descreva a refeição para que o Códex possa calibrar.'
    );
  }

  const rawIngredients = phrases.map((phrase) =>
    buildIngredient(phrase, foods, language)
  );

  // Mesclagem determinística de duplicatas
  const ingredients = mergeDuplicateIngredients(rawIngredients);

  const totals = ingredients.reduce(
    (acc, ingredient) => {
      if (ingredient.final.source_used === 'unresolved' || ingredient.status === 'invalid_quantity') {
        return {
          ...acc,
          totalGrams: acc.totalGrams + ingredient.grams,
        };
      }

      const ratio = ingredient.grams / 100;
      return {
        calories: acc.calories + ingredient.final.kcal * ratio,
        protein: acc.protein + ingredient.final.protein * ratio,
        carbs: acc.carbs + ingredient.final.carbs * ratio,
        fat: acc.fat + ingredient.final.fat * ratio,
        totalGrams: acc.totalGrams + ingredient.grams,
        coveredGrams: acc.coveredGrams + ingredient.grams,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, totalGrams: 0, coveredGrams: 0 }
  );

  const unmatchedCount = ingredients.filter(
    (ing) => ing.status === 'unmatched' || ing.final.source_used === 'unresolved'
  ).length;
  const ambiguousCount = ingredients.filter((ing) => ing.status === 'ambiguous').length;
  const hasInvalidQuantity = ingredients.some(
    (ing) => ing.status === 'invalid_quantity' || ing.grams <= 0
  );

  const allMatched =
    unmatchedCount === 0 &&
    ambiguousCount === 0 &&
    !hasInvalidQuantity &&
    ingredients.length > 0;
  const coverage =
    totals.totalGrams > 0
      ? Math.round((totals.coveredGrams / totals.totalGrams) * 100)
      : 0;

  const detailSignals =
    input.match(
      /\b\d+(?:[.,]\d+)?\s*(?:kg|g|gramas?|ml|unidades?|fatias?|colheres?|conchas?|x[ií]caras?|scoops?)\b/gi
    )?.length ?? 0;
  const strongSources = ingredients.filter(
    (ingredient) =>
      ingredient.final.source_used === 'taco' ||
      ingredient.final.source_used === 'catalog'
  ).length;

  const confidence = clamp(
    50 + strongSources * 12 + detailSignals * 4 - unmatchedCount * 25,
    30,
    98
  );

  return {
    mealName: mealNameFromIngredients(ingredients, input, language),
    calories: Math.round(totals.calories),
    protein: roundMacro(totals.protein),
    carbs: roundMacro(totals.carbs),
    fat: roundMacro(totals.fat),
    totalGrams: Math.round(totals.totalGrams),
    confidence,
    ingredients,
    allMatched,
    unmatchedCount,
    ambiguousCount,
    hasInvalidQuantity,
    coverage,
  };
}
