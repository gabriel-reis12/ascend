const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Ler o .env.local de forma síncrona
const envContent = fs.readFileSync('.env.local', 'utf-8');
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const supabaseAnonKey = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseAnonKey ? 'Encontrada' : 'Não encontrada');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Erro: Chaves do Supabase não encontradas no .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const testUserId = '4de163f2-7d85-4fb5-8930-cb2605224a84'; // Gabriela Sarra

async function runTest() {
  console.log('\n--- 1. Testando Query de workout_routines ---');
  try {
    const { data: routinesData, error: routineError } = await supabase
      .from('workout_routines')
      .select(`
        id, 
        name, 
        scheduled_days, 
        scheduled_time, 
        scheduled_end_time,
        exercises:routine_exercises(
          exercise:exercises(category)
        )
      `)
      .eq('user_id', testUserId);

    if (routineError) {
      console.error('Erro na query de workout_routines:', routineError);
    } else {
      console.log('Sucesso na query de workout_routines! Quantidade de rotinas:', routinesData.length);
      
      // Simular processamento do useHabits
      routinesData.forEach((r) => {
        const isCardio = r.name.toLowerCase().includes('cardio') || 
          (r.exercises && r.exercises.some((re) => re.exercise?.category?.toLowerCase() === 'cardio'));
        console.log(`Rotina "${r.name}": isCardio = ${isCardio}`);
      });
    }
  } catch (err) {
    console.error('Exceção na query de workout_routines:', err);
  }

  console.log('\n--- 2. Testando Query de meal_plans ---');
  try {
    const { data: mealPlansData, error: mealPlansError } = await supabase
      .from('meal_plans')
      .select(`
        id, 
        name, 
        xp_reward, 
        is_active, 
        scheduled_time, 
        scheduled_end_time,
        items:meal_plan_items(
          quantity_grams,
          food:foods(calories_per_100g)
        )
      `)
      .eq('user_id', testUserId)
      .eq('is_active', true);

    if (mealPlansError) {
      console.error('Erro na query de meal_plans:', mealPlansError);
    } else {
      console.log('Sucesso na query de meal_plans! Quantidade de planos ativos:', mealPlansData.length);
      
      // Simular processamento do useHabits
      mealPlansData.forEach((plan) => {
        const totalKcal = (plan.items ?? []).reduce((sum, item) => {
          const foodObj = Array.isArray(item.food) ? item.food[0] : item.food;
          const kcal = ((foodObj?.calories_per_100g ?? 0) * (item.quantity_grams ?? 0)) / 100;
          return sum + kcal;
        }, 0);
        console.log(`Plano "${plan.name}": totalKcal = ${totalKcal}`);
      });
    }
  } catch (err) {
    console.error('Exceção na query de meal_plans:', err);
  }
}

runTest();
