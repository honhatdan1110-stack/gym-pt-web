begin;
select plan(8);

insert into auth.users (id, email)
values
  ('11111111-1111-1111-1111-111111111111', 'owner@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'other@example.com');

set local role anon;
select throws_ok(
  $$select * from public.app_states$$,
  '42501',
  null,
  'anonymous users cannot read app state'
);

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select results_eq(
  $$insert into public.app_states (state)
    values ('{"version": 1}'::jsonb)
    returning state->>'version'$$,
  array['1']::text[],
  'a user can create their own app state'
);
select results_eq(
  $$select user_id::text from public.app_states$$,
  array['11111111-1111-1111-1111-111111111111']::text[],
  'a user can read their own app state'
);
select results_eq(
  $$update public.app_states set state = '{"version": 2}'::jsonb returning state->>'version'$$,
  array['2']::text[],
  'a user can update their own app state'
);

set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select is_empty(
  $$select * from public.app_states$$,
  'another user cannot read the owner app state'
);
select is_empty(
  $$update public.app_states set state = '{"version": 3}'::jsonb returning state$$,
  'another user cannot update the owner app state'
);
select results_eq(
  $$select state->>'version' from public.app_states$$,
  '{}'::text[],
  'the owner state was not changed by another user'
);

set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select results_eq(
  $$select state->>'version' from public.app_states$$,
  array['2']::text[],
  'the owner can still read the updated state'
);

select * from finish();
rollback;
