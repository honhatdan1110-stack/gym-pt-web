create index if not exists exercises_pt_id_idx on public.exercises(pt_id);
create index if not exists workout_plans_pt_id_idx on public.workout_plans(pt_id);
create index if not exists meal_plans_pt_id_idx on public.meal_plans(pt_id);
create index if not exists metrics_pt_id_idx on public.metrics(pt_id);
create index if not exists workout_plan_exercises_exercise_id_idx on public.workout_plan_exercises(exercise_id);
