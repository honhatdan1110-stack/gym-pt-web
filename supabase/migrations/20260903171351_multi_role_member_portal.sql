-- Liftlog's first version stored the entire workspace in app_states. The
-- portal requires row-level ownership, so keep the legacy row as a backup and
-- move operational data into tables scoped per PT/member.

create schema if not exists private;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('pt', 'member')),
  full_name text not null default '',
  email text not null default '',
  phone text not null default '',
  bio text not null default '',
  timezone text not null default 'Asia/Ho_Chi_Minh',
  must_change_password boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.pt_public_profiles (
  pt_id uuid primary key references public.profiles(id) on delete cascade,
  slug text not null unique check (slug = lower(slug) and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  display_name text not null default '',
  bio text not null default '',
  timezone text not null default 'Asia/Ho_Chi_Minh',
  enabled boolean not null default false,
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.clients (
  id text primary key,
  pt_id uuid not null references public.profiles(id) on delete cascade,
  user_id uuid unique references auth.users(id) on delete set null,
  name text not null,
  email text not null default '',
  phone text not null default '',
  goal text not null default '',
  status text not null default 'active' check (status in ('active', 'paused', 'lead')),
  avatar text not null default '',
  color text not null default '#f97316',
  joined_at date,
  weight numeric not null default 0,
  weight_start numeric not null default 0,
  sessions_this_month integer not null default 0,
  progress integer not null default 0 check (progress between 0 and 100),
  next_session text not null default 'Chưa lên lịch',
  note text not null default '',
  account_status text not null default 'none' check (account_status in ('none', 'invited', 'active', 'disabled')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.exercises (
  id text primary key,
  pt_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  muscle text not null default '',
  equipment text not null default '',
  level text not null default 'Beginner' check (level in ('Beginner', 'Intermediate', 'Advanced')),
  sets integer not null default 3,
  reps text not null default '10–12',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.schedule_slots (
  id text primary key,
  pt_id uuid not null references public.profiles(id) on delete cascade,
  client_id text references public.clients(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  title text not null default 'Training session',
  status text not null default 'upcoming' check (status in ('upcoming', 'completed', 'missed')),
  accent text not null default '#f97316',
  is_public boolean not null default false,
  public_label text not null default 'Đã có lịch',
  public_status text not null default 'booked' check (public_status in ('available', 'booked', 'blocked', 'completed', 'hidden')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint schedule_slots_valid_range check (ends_at > starts_at)
);

create table public.workout_plans (
  id text primary key,
  pt_id uuid not null references public.profiles(id) on delete cascade,
  client_id text not null references public.clients(id) on delete cascade,
  name text not null,
  goal text not null default '',
  frequency integer not null default 3,
  duration_weeks integer not null default 6,
  status text not null default 'draft' check (status in ('active', 'draft')),
  updated_at date not null default current_date
);

create table public.workout_plan_exercises (
  plan_id text not null references public.workout_plans(id) on delete cascade,
  exercise_id text not null references public.exercises(id) on delete cascade,
  position integer not null default 0,
  primary key (plan_id, exercise_id)
);

create table public.meal_plans (
  id text primary key,
  pt_id uuid not null references public.profiles(id) on delete cascade,
  client_id text not null references public.clients(id) on delete cascade,
  calories integer not null default 0,
  protein numeric not null default 0,
  carbs numeric not null default 0,
  fat numeric not null default 0,
  status text not null default 'on-track' check (status in ('on-track', 'needs-review')),
  meals integer not null default 3,
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.meal_plan_items (
  plan_id text not null references public.meal_plans(id) on delete cascade,
  position integer not null default 0,
  item text not null,
  primary key (plan_id, position)
);

create table public.metrics (
  id text primary key,
  pt_id uuid not null references public.profiles(id) on delete cascade,
  client_id text not null references public.clients(id) on delete cascade,
  measured_on date not null,
  weight numeric not null default 0,
  body_fat numeric not null default 0,
  waist numeric not null default 0,
  note text not null default ''
);

create index clients_pt_id_idx on public.clients(pt_id);
create index clients_user_id_idx on public.clients(user_id);
create index schedule_slots_pt_time_idx on public.schedule_slots(pt_id, starts_at);
create index schedule_slots_client_time_idx on public.schedule_slots(client_id, starts_at);
create index workout_plans_client_idx on public.workout_plans(client_id);
create index meal_plans_client_idx on public.meal_plans(client_id);
create index metrics_client_date_idx on public.metrics(client_id, measured_on desc);

create or replace function private.is_pt(target_pt uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and id = target_pt and role = 'pt'
  );
$$;

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

create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, role, full_name, email)
  values (new.id, 'member', coalesce(new.raw_user_meta_data ->> 'full_name', ''), coalesce(new.email, ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function private.handle_new_user();

alter table public.profiles enable row level security;
alter table public.pt_public_profiles enable row level security;
alter table public.clients enable row level security;
alter table public.exercises enable row level security;
alter table public.schedule_slots enable row level security;
alter table public.workout_plans enable row level security;
alter table public.workout_plan_exercises enable row level security;
alter table public.meal_plans enable row level security;
alter table public.meal_plan_items enable row level security;
alter table public.metrics enable row level security;

revoke all on table public.profiles, public.pt_public_profiles, public.clients, public.exercises,
  public.schedule_slots, public.workout_plans, public.workout_plan_exercises,
  public.meal_plans, public.meal_plan_items, public.metrics from anon, authenticated;

grant select, update on table public.profiles to authenticated;
grant select on table public.pt_public_profiles to anon;
grant select, insert, update, delete on table public.pt_public_profiles to authenticated;
grant select, insert, update, delete on table public.clients to authenticated;
grant select, insert, update, delete on table public.exercises to authenticated;
grant select (id, pt_id, starts_at, ends_at, public_label, public_status) on table public.schedule_slots to anon;
grant select, insert, update, delete on table public.schedule_slots to authenticated;
grant select, insert, update, delete on table public.workout_plans to authenticated;
grant select, insert, update, delete on table public.workout_plan_exercises to authenticated;
grant select, insert, update, delete on table public.meal_plans to authenticated;
grant select, insert, update, delete on table public.meal_plan_items to authenticated;
grant select, insert, update, delete on table public.metrics to authenticated;

create policy "Users read their profile" on public.profiles for select to authenticated
using ((select auth.uid()) = id);
create policy "Users update their profile" on public.profiles for update to authenticated
using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "Anyone reads enabled PT profiles" on public.pt_public_profiles for select to anon, authenticated
using (enabled or (select private.is_pt(pt_id)));
create policy "PTs manage their public profile" on public.pt_public_profiles for all to authenticated
using ((select private.is_pt(pt_id))) with check ((select private.is_pt(pt_id)));

create policy "PTs manage their clients" on public.clients for all to authenticated
using ((select private.is_pt(pt_id))) with check ((select private.is_pt(pt_id)));
create policy "Members read their client profile" on public.clients for select to authenticated
using ((select auth.uid()) = user_id and account_status in ('active', 'invited'));

create policy "PTs manage their exercises" on public.exercises for all to authenticated
using ((select private.is_pt(pt_id))) with check ((select private.is_pt(pt_id)));
create policy "Members read assigned exercises" on public.exercises for select to authenticated
using (exists (select 1 from public.workout_plan_exercises wpe join public.workout_plans wp on wp.id = wpe.plan_id where wpe.exercise_id = exercises.id and (select private.is_member_plan(wp.id))));

create policy "PTs manage their schedule" on public.schedule_slots for all to authenticated
using ((select private.is_pt(pt_id))) with check ((select private.is_pt(pt_id)));
create policy "Members read their schedule" on public.schedule_slots for select to authenticated
using ((select private.is_member_client(client_id)));
create policy "Public reads published schedule" on public.schedule_slots for select to anon
using (is_public and public_status <> 'hidden');

create policy "PTs manage workout plans" on public.workout_plans for all to authenticated
using ((select private.is_pt(pt_id))) with check ((select private.is_pt(pt_id)));
create policy "Members read their workout plans" on public.workout_plans for select to authenticated
using ((select private.is_member_client(client_id)));

create policy "PTs manage plan exercises" on public.workout_plan_exercises for all to authenticated
using (exists (select 1 from public.workout_plans wp where wp.id = plan_id and (select private.is_pt(wp.pt_id))))
with check (exists (select 1 from public.workout_plans wp where wp.id = plan_id and (select private.is_pt(wp.pt_id))));
create policy "Members read their plan exercises" on public.workout_plan_exercises for select to authenticated
using ((select private.is_member_plan(plan_id)));

create policy "PTs manage meal plans" on public.meal_plans for all to authenticated
using ((select private.is_pt(pt_id))) with check ((select private.is_pt(pt_id)));
create policy "Members read their meal plans" on public.meal_plans for select to authenticated
using ((select private.is_member_client(client_id)));

create policy "PTs manage meal items" on public.meal_plan_items for all to authenticated
using ((select private.is_pt((select pt_id from public.meal_plans where id = plan_id))))
with check ((select private.is_pt((select pt_id from public.meal_plans where id = plan_id))));
create policy "Members read their meal items" on public.meal_plan_items for select to authenticated
using ((select private.is_member_meal(plan_id)));

create policy "PTs manage metrics" on public.metrics for all to authenticated
using ((select private.is_pt(pt_id))) with check ((select private.is_pt(pt_id)));
create policy "Members read their metrics" on public.metrics for select to authenticated
using ((select private.is_member_client(client_id)));

-- Backfill the current demo workspace without exposing its JSON document to members.
insert into public.profiles (id, role, full_name, email, phone, bio)
select a.user_id, 'pt', coalesce(a.state -> 'profile' ->> 'name', ''),
  coalesce(a.state -> 'profile' ->> 'email', u.email, ''),
  coalesce(a.state -> 'profile' ->> 'phone', ''), coalesce(a.state -> 'profile' ->> 'bio', '')
from public.app_states a left join auth.users u on u.id = a.user_id
on conflict (id) do update set role = 'pt', full_name = excluded.full_name, email = excluded.email, phone = excluded.phone, bio = excluded.bio, updated_at = timezone('utc', now());

insert into public.pt_public_profiles (pt_id, slug, display_name, bio, enabled)
select id, coalesce(nullif(lower(split_part(email, '@', 1)), ''), 'pt-' || left(id::text, 8)), full_name, bio, true
from public.profiles where role = 'pt'
on conflict (pt_id) do update set display_name = excluded.display_name, bio = excluded.bio;

insert into public.clients (id, pt_id, name, email, phone, goal, status, avatar, color, joined_at, weight, weight_start, sessions_this_month, progress, next_session, note)
select c->>'id', a.user_id, c->>'name', coalesce(c->>'email', ''), coalesce(c->>'phone', ''), coalesce(c->>'goal', ''), coalesce(c->>'status', 'active'), coalesce(c->>'avatar', ''), coalesce(c->>'color', '#f97316'), nullif(c->>'joinedAt', '')::date, coalesce((c->>'weight')::numeric, 0), coalesce((c->>'weightStart')::numeric, 0), coalesce((c->>'sessionsThisMonth')::integer, 0), coalesce((c->>'progress')::integer, 0), coalesce(c->>'nextSession', 'Chưa lên lịch'), coalesce(c->>'note', '')
from public.app_states a cross join lateral jsonb_array_elements(a.state->'clients') c
on conflict (id) do update set pt_id = excluded.pt_id, name = excluded.name, email = excluded.email, phone = excluded.phone, goal = excluded.goal, status = excluded.status, avatar = excluded.avatar, color = excluded.color, joined_at = excluded.joined_at, weight = excluded.weight, weight_start = excluded.weight_start, sessions_this_month = excluded.sessions_this_month, progress = excluded.progress, next_session = excluded.next_session, note = excluded.note;

insert into public.exercises (id, pt_id, name, muscle, equipment, level, sets, reps)
select e->>'id', a.user_id, e->>'name', coalesce(e->>'muscle', ''), coalesce(e->>'equipment', ''), coalesce(e->>'level', 'Beginner'), coalesce((e->>'sets')::integer, 3), coalesce(e->>'reps', '10–12')
from public.app_states a cross join lateral jsonb_array_elements(a.state->'exercises') e
on conflict (id) do update set pt_id = excluded.pt_id, name = excluded.name, muscle = excluded.muscle, equipment = excluded.equipment, level = excluded.level, sets = excluded.sets, reps = excluded.reps;

insert into public.schedule_slots (id, pt_id, client_id, starts_at, ends_at, title, status, accent, is_public, public_label, public_status)
select s->>'id', a.user_id, s->>'clientId', (((s->>'date')::date + (s->>'time')::time) at time zone 'Asia/Ho_Chi_Minh'), (((s->>'date')::date + (s->>'time')::time + coalesce((s->>'duration')::integer, 60) * interval '1 minute') at time zone 'Asia/Ho_Chi_Minh'), coalesce(s->>'type', 'Training session'), coalesce(s->>'status', 'upcoming'), coalesce(s->>'accent', '#f97316'), true, case when s->>'status' = 'completed' then 'Đã hoàn thành' else 'Đã có lịch' end, case when s->>'status' = 'completed' then 'completed' else 'booked' end
from public.app_states a cross join lateral jsonb_array_elements(a.state->'sessions') s
on conflict (id) do update set pt_id = excluded.pt_id, client_id = excluded.client_id, starts_at = excluded.starts_at, ends_at = excluded.ends_at, title = excluded.title, status = excluded.status, accent = excluded.accent, is_public = excluded.is_public, public_label = excluded.public_label, public_status = excluded.public_status;

insert into public.workout_plans (id, pt_id, client_id, name, goal, frequency, duration_weeks, status, updated_at)
select w->>'id', a.user_id, w->>'clientId', w->>'name', coalesce(w->>'goal', ''), coalesce((w->>'frequency')::integer, 3), coalesce((w->>'durationWeeks')::integer, 6), coalesce(w->>'status', 'draft'), coalesce(nullif(w->>'updatedAt', '')::date, current_date)
from public.app_states a cross join lateral jsonb_array_elements(a.state->'workoutPlans') w
on conflict (id) do update set pt_id = excluded.pt_id, client_id = excluded.client_id, name = excluded.name, goal = excluded.goal, frequency = excluded.frequency, duration_weeks = excluded.duration_weeks, status = excluded.status, updated_at = excluded.updated_at;

insert into public.workout_plan_exercises (plan_id, exercise_id, position)
select w->>'id', x.value, x.ordinality - 1
from public.app_states a cross join lateral jsonb_array_elements(a.state->'workoutPlans') w cross join lateral jsonb_array_elements_text(w->'exerciseIds') with ordinality x(value, ordinality)
on conflict (plan_id, exercise_id) do update set position = excluded.position;

insert into public.meal_plans (id, pt_id, client_id, calories, protein, carbs, fat, status, meals)
select m->>'id', a.user_id, m->>'clientId', coalesce((m->>'calories')::integer, 0), coalesce((m->>'protein')::numeric, 0), coalesce((m->>'carbs')::numeric, 0), coalesce((m->>'fat')::numeric, 0), coalesce(m->>'status', 'on-track'), coalesce((m->>'meals')::integer, 3)
from public.app_states a cross join lateral jsonb_array_elements(a.state->'mealPlans') m
on conflict (id) do update set pt_id = excluded.pt_id, client_id = excluded.client_id, calories = excluded.calories, protein = excluded.protein, carbs = excluded.carbs, fat = excluded.fat, status = excluded.status, meals = excluded.meals;

insert into public.meal_plan_items (plan_id, position, item)
select m->>'id', x.ordinality - 1, x.value
from public.app_states a cross join lateral jsonb_array_elements(a.state->'mealPlans') m cross join lateral jsonb_array_elements_text(m->'items') with ordinality x(value, ordinality)
on conflict (plan_id, position) do update set item = excluded.item;

insert into public.metrics (id, pt_id, client_id, measured_on, weight, body_fat, waist, note)
select m->>'id', a.user_id, m->>'clientId', (m->>'date')::date, coalesce((m->>'weight')::numeric, 0), coalesce((m->>'bodyFat')::numeric, 0), coalesce((m->>'waist')::numeric, 0), coalesce(m->>'note', '')
from public.app_states a cross join lateral jsonb_array_elements(a.state->'metrics') m
on conflict (id) do update set pt_id = excluded.pt_id, client_id = excluded.client_id, measured_on = excluded.measured_on, weight = excluded.weight, body_fat = excluded.body_fat, waist = excluded.waist, note = excluded.note;

alter publication supabase_realtime add table public.schedule_slots;
