create or replace function private.is_member_client(target_client text)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.clients
    where id = target_client and user_id = (select auth.uid()) and account_status in ('active', 'invited')
  );
$$;

create or replace function private.is_member_plan(target_plan text)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.workout_plans p
    join public.clients c on c.id = p.client_id
    where p.id = target_plan and c.user_id = (select auth.uid()) and c.account_status in ('active', 'invited')
  );
$$;

create or replace function private.is_member_meal(target_plan text)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.meal_plans p
    join public.clients c on c.id = p.client_id
    where p.id = target_plan and c.user_id = (select auth.uid()) and c.account_status in ('active', 'invited')
  );
$$;

drop policy if exists "Members read their client profile" on public.clients;
create policy "Members read their client profile" on public.clients for select to authenticated
using ((select auth.uid()) = user_id and account_status in ('active', 'invited'));
