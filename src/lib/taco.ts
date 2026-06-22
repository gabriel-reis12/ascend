import tacoFoodsData from '@/data/tacoFoods.json';

export interface TacoFood {
  id: number;
  description: string;
  category: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface TacoIngredientInput {
  name: string;
  taco_description?: string;
  grams: number;
}

export interface TacoIngredientMatch extends TacoIngredientInput {
  food: TacoFood;
  score: number;
}

export interface TacoMealCalculation {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  totalGrams: number;
  matched: TacoIngredientMatch[];
  unmatched: TacoIngredientInput[];
  coverage: number;
}

const tacoFoods = tacoFoodsData as TacoFood[];
const STOP_WORDS = new Set([
  'a', 'ao', 'aos', 'as', 'com', 'da', 'das', 'de', 'do', 'dos', 'e', 'em',
  'sob', 'um', 'uma',
]);

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function tokens(value: string) {
  return normalize(value)
    .split(/\s+/)
    .filter(token => token.length > 1 && !STOP_WORDS.has(token));
}

function scoreCandidate(query: string, food: TacoFood) {
  const normalizedQuery = normalize(query);
  const normalizedDescription = normalize(food.description);
  if (normalizedDescription === normalizedQuery) return 1;

  const queryTokens = tokens(query);
  const foodTokens = new Set(tokens(food.description));
  if (!queryTokens.length) return 0;

  const matchedTokens = queryTokens.filter(token => foodTokens.has(token)).length;
  const tokenScore = matchedTokens / queryTokens.length;
  const containmentBonus = normalizedDescription.includes(normalizedQuery) || normalizedQuery.includes(normalizedDescription)
    ? 0.2
    : 0;

  return Math.min(0.99, tokenScore + containmentBonus);
}

export function findTacoFood(query: string) {
  let best: { food: TacoFood; score: number } | null = null;

  for (const food of tacoFoods) {
    const score = scoreCandidate(query, food);
    if (!best || score > best.score) best = { food, score };
  }

  return best && best.score >= 0.5 ? best : null;
}

export function calculateMealFromTaco(ingredients: TacoIngredientInput[]): TacoMealCalculation {
  const matched: TacoIngredientMatch[] = [];
  const unmatched: TacoIngredientInput[] = [];

  for (const ingredient of ingredients) {
    if (!ingredient || typeof ingredient.name !== 'string') {
      unmatched.push(ingredient);
      continue;
    }

    const grams = Number(ingredient.grams);
    if (!ingredient.name.trim() || !Number.isFinite(grams) || grams <= 0) {
      unmatched.push(ingredient);
      continue;
    }

    const tacoDescription = typeof ingredient.taco_description === 'string'
      ? ingredient.taco_description
      : '';
    const match = findTacoFood(tacoDescription || ingredient.name);
    if (!match) {
      unmatched.push(ingredient);
      continue;
    }

    matched.push({ ...ingredient, grams, ...match });
  }

  const totals = matched.reduce(
    (acc, ingredient) => {
      const ratio = ingredient.grams / 100;
      return {
        calories: acc.calories + ingredient.food.kcal * ratio,
        protein: acc.protein + ingredient.food.protein * ratio,
        carbs: acc.carbs + ingredient.food.carbs * ratio,
        fat: acc.fat + ingredient.food.fat * ratio,
        totalGrams: acc.totalGrams + ingredient.grams,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, totalGrams: 0 }
  );

  const describedGrams = ingredients.reduce((sum, ingredient) => sum + Math.max(0, Number(ingredient.grams) || 0), 0);

  return {
    calories: Math.round(totals.calories),
    protein: Number(totals.protein.toFixed(1)),
    carbs: Number(totals.carbs.toFixed(1)),
    fat: Number(totals.fat.toFixed(1)),
    totalGrams: Math.round(totals.totalGrams),
    matched,
    unmatched,
    coverage: describedGrams > 0 ? Math.round((totals.totalGrams / describedGrams) * 100) : 0,
  };
}
