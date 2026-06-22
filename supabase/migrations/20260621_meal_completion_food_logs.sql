-- Sincroniza refeições concluídas dos Cardápios do Caçador com o diário nutricional.
-- Cada item do cardápio gera um food_log reversível e idempotente.

alter table food_logs
  add column if not exists source text not null default 'manual',
  add column if not exists meal_plan_id uuid references meal_plans(id) on delete set null,
  add column if not exists meal_plan_item_id uuid references meal_plan_items(id) on delete set null,
  add column if not exists meal_completion_id uuid references meal_completions(id) on delete cascade;

create unique index if not exists food_logs_meal_completion_item_uidx
  on food_logs(meal_completion_id, meal_plan_item_id)
  where meal_completion_id is not null and meal_plan_item_id is not null;

create index if not exists food_logs_user_plan_idx
  on food_logs(user_id, meal_plan_id, logged_at desc);
