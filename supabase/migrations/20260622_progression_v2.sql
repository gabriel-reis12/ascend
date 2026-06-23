-- Progression v2: faster onboarding, bounded activity rewards and level-100 campaign cap.
-- Safe to run more than once.

alter table profiles alter column xp_to_next_level set default 100;

update tasks
set xp_reward = greatest(5, least(50, coalesce(xp_reward, 5)))
where xp_reward is null or xp_reward < 5 or xp_reward > 50;

update habits
set xp_reward = greatest(5, least(50, coalesce(xp_reward, 5)))
where xp_reward is null or xp_reward < 5 or xp_reward > 50;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tasks_xp_reward_v2_check'
  ) then
    alter table tasks
      add constraint tasks_xp_reward_v2_check
      check (xp_reward between 5 and 50);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'habits_xp_reward_v2_check'
  ) then
    alter table habits
      add constraint habits_xp_reward_v2_check
      check (xp_reward between 5 and 50);
  end if;
end
$$;
