-- Keep one policy per operation so the exposed tables remain easy to audit and
-- PostgreSQL does not evaluate several permissive policies for each request.

drop policy if exists "PTs manage their public profile" on public.pt_public_profiles;
drop policy if exists "Anyone reads enabled PT profiles" on public.pt_public_profiles;
create policy "Anyone reads enabled PT profiles" on public.pt_public_profiles for select to anon
using (enabled);
create policy "Users read enabled or owned PT profile" on public.pt_public_profiles for select to authenticated
using (enabled or (select private.is_pt(pt_id)));
create policy "PTs create their public profile" on public.pt_public_profiles for insert to authenticated
with check ((select private.is_pt(pt_id)));
create policy "PTs update their public profile" on public.pt_public_profiles for update to authenticated
using ((select private.is_pt(pt_id))) with check ((select private.is_pt(pt_id)));
create policy "PTs delete their public profile" on public.pt_public_profiles for delete to authenticated
using ((select private.is_pt(pt_id)));

drop policy if exists "PTs manage their clients" on public.clients;
drop policy if exists "Members read their client profile" on public.clients;
create policy "Users read permitted clients" on public.clients for select to authenticated
using ((select private.is_pt(pt_id)) or ((select auth.uid()) = user_id and account_status in ('active', 'invited')));
create policy "PTs create their clients" on public.clients for insert to authenticated
with check ((select private.is_pt(pt_id)));
create policy "PTs update their clients" on public.clients for update to authenticated
using ((select private.is_pt(pt_id))) with check ((select private.is_pt(pt_id)));
create policy "PTs delete their clients" on public.clients for delete to authenticated
using ((select private.is_pt(pt_id)));

drop policy if exists "PTs manage their exercises" on public.exercises;
drop policy if exists "Members read assigned exercises" on public.exercises;
create policy "Users read permitted exercises" on public.exercises for select to authenticated
using ((select private.is_pt(pt_id)) or exists (select 1 from public.workout_plan_exercises wpe join public.workout_plans wp on wp.id = wpe.plan_id where wpe.exercise_id = exercises.id and (select private.is_member_plan(wp.id))));
create policy "PTs create their exercises" on public.exercises for insert to authenticated
with check ((select private.is_pt(pt_id)));
create policy "PTs update their exercises" on public.exercises for update to authenticated
using ((select private.is_pt(pt_id))) with check ((select private.is_pt(pt_id)));
create policy "PTs delete their exercises" on public.exercises for delete to authenticated
using ((select private.is_pt(pt_id)));

drop policy if exists "PTs manage their schedule" on public.schedule_slots;
drop policy if exists "Members read their schedule" on public.schedule_slots;
create policy "Users read permitted schedule" on public.schedule_slots for select to authenticated
using ((select private.is_pt(pt_id)) or (select private.is_member_client(client_id)));
create policy "PTs create their schedule" on public.schedule_slots for insert to authenticated
with check ((select private.is_pt(pt_id)));
create policy "PTs update their schedule" on public.schedule_slots for update to authenticated
using ((select private.is_pt(pt_id))) with check ((select private.is_pt(pt_id)));
create policy "PTs delete their schedule" on public.schedule_slots for delete to authenticated
using ((select private.is_pt(pt_id)));

drop policy if exists "PTs manage workout plans" on public.workout_plans;
drop policy if exists "Members read their workout plans" on public.workout_plans;
create policy "Users read permitted workout plans" on public.workout_plans for select to authenticated
using ((select private.is_pt(pt_id)) or (select private.is_member_client(client_id)));
create policy "PTs create workout plans" on public.workout_plans for insert to authenticated
with check ((select private.is_pt(pt_id)));
create policy "PTs update workout plans" on public.workout_plans for update to authenticated
using ((select private.is_pt(pt_id))) with check ((select private.is_pt(pt_id)));
create policy "PTs delete workout plans" on public.workout_plans for delete to authenticated
using ((select private.is_pt(pt_id)));

drop policy if exists "PTs manage plan exercises" on public.workout_plan_exercises;
drop policy if exists "Members read their plan exercises" on public.workout_plan_exercises;
create policy "Users read permitted plan exercises" on public.workout_plan_exercises for select to authenticated
using ((select private.is_member_plan(plan_id)) or exists (select 1 from public.workout_plans wp where wp.id = plan_id and (select private.is_pt(wp.pt_id))));
create policy "PTs create plan exercises" on public.workout_plan_exercises for insert to authenticated
with check (exists (select 1 from public.workout_plans wp where wp.id = plan_id and (select private.is_pt(wp.pt_id))));
create policy "PTs update plan exercises" on public.workout_plan_exercises for update to authenticated
using (exists (select 1 from public.workout_plans wp where wp.id = plan_id and (select private.is_pt(wp.pt_id))))
with check (exists (select 1 from public.workout_plans wp where wp.id = plan_id and (select private.is_pt(wp.pt_id))));
create policy "PTs delete plan exercises" on public.workout_plan_exercises for delete to authenticated
using (exists (select 1 from public.workout_plans wp where wp.id = plan_id and (select private.is_pt(wp.pt_id))));

drop policy if exists "PTs manage meal plans" on public.meal_plans;
drop policy if exists "Members read their meal plans" on public.meal_plans;
create policy "Users read permitted meal plans" on public.meal_plans for select to authenticated
using ((select private.is_pt(pt_id)) or (select private.is_member_client(client_id)));
create policy "PTs create meal plans" on public.meal_plans for insert to authenticated
with check ((select private.is_pt(pt_id)));
create policy "PTs update meal plans" on public.meal_plans for update to authenticated
using ((select private.is_pt(pt_id))) with check ((select private.is_pt(pt_id)));
create policy "PTs delete meal plans" on public.meal_plans for delete to authenticated
using ((select private.is_pt(pt_id)));

drop policy if exists "PTs manage meal items" on public.meal_plan_items;
drop policy if exists "Members read their meal items" on public.meal_plan_items;
create policy "Users read permitted meal items" on public.meal_plan_items for select to authenticated
using ((select private.is_member_meal(plan_id)) or (select private.is_pt((select pt_id from public.meal_plans where id = plan_id))));
create policy "PTs create meal items" on public.meal_plan_items for insert to authenticated
with check ((select private.is_pt((select pt_id from public.meal_plans where id = plan_id))));
create policy "PTs update meal items" on public.meal_plan_items for update to authenticated
using ((select private.is_pt((select pt_id from public.meal_plans where id = plan_id))))
with check ((select private.is_pt((select pt_id from public.meal_plans where id = plan_id))));
create policy "PTs delete meal items" on public.meal_plan_items for delete to authenticated
using ((select private.is_pt((select pt_id from public.meal_plans where id = plan_id))));

drop policy if exists "PTs manage metrics" on public.metrics;
drop policy if exists "Members read their metrics" on public.metrics;
create policy "Users read permitted metrics" on public.metrics for select to authenticated
using ((select private.is_pt(pt_id)) or (select private.is_member_client(client_id)));
create policy "PTs create metrics" on public.metrics for insert to authenticated
with check ((select private.is_pt(pt_id)));
create policy "PTs update metrics" on public.metrics for update to authenticated
using ((select private.is_pt(pt_id))) with check ((select private.is_pt(pt_id)));
create policy "PTs delete metrics" on public.metrics for delete to authenticated
using ((select private.is_pt(pt_id)));
