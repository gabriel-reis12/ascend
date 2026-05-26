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

async function runTest() {
  console.log('\n--- 1. Testando Query de workout_routines ---');
  try {
    const { data, error } = await supabase
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
      .limit(1);

    if (error) {
      console.error('Erro na query de workout_routines:', error);
    } else {
      console.log('Sucesso na query de workout_routines! Dados retornados:', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error('Exceção na query de workout_routines:', err);
  }

  console.log('\n--- 2. Testando Query de meal_plans ---');
  try {
    const { data, error } = await supabase
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
      .limit(1);

    if (error) {
      console.error('Erro na query de meal_plans:', error);
    } else {
      console.log('Sucesso na query de meal_plans! Dados retornados:', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error('Exceção na query de meal_plans:', err);
  }
}

runTest();
