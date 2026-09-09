begin;
select plan(11);

insert into auth.users (id, email)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'pt-test@example.com'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'member-test@example.com'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'other-member@example.com');

update public.profiles set role = 'pt' where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
update public.profiles set role = 'member' where id in ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccccccc');

insert into public.pt_public_profiles (pt_id, slug, display_name, enabled)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'test-pt', 'Test PT', true);
insert into public.clients (id, pt_id, user_id, name, email, account_status)
values
  ('member-a', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Member A', 'member-test@example.com', 'active'),
  ('member-b', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Member B', 'other-member@example.com', 'active');
insert into public.schedule_slots (id, pt_id, client_id, starts_at, ends_at, title, is_public, public_label, public_status)
values
  ('slot-a', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'member-a', '2026-09-07 08:00:00+07', '2026-09-07 09:00:00+07', 'Private title A', true, 'Còn lịch', 'available'),
  ('slot-b', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'member-b', '2026-09-07 10:00:00+07', '2026-09-07 11:00:00+07', 'Private title B', false, 'Đã có lịch', 'booked');

set local role anon;
select results_eq($$select display_name from public.pt_public_profiles where slug = 'test-pt'$$, array['Test PT']::text[], 'anonymous can read an enabled PT profile');
select results_eq($$select public_label from public.schedule_slots where id = 'slot-a'$$, array['Còn lịch']::text[], 'anonymous can read a published slot');
select is_empty($$select public_label from public.schedule_slots where id = 'slot-b'$$, 'anonymous cannot read unpublished slots');
select throws_ok($$select name from public.clients$$, '42501', null, 'anonymous cannot read member data');

set local role authenticated;
set local request.jwt.claim.sub = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
select results_eq($$select name from public.clients$$, array['Member A']::text[], 'member reads only their own profile');
select results_eq($$select id from public.schedule_slots$$, array['slot-a']::text[], 'member reads only their own schedule');
select is_empty($$select id from public.schedule_slots where id = 'slot-b'$$, 'member cannot read another member schedule');
select throws_ok($$insert into public.schedule_slots (id, pt_id, client_id, starts_at, ends_at) values ('stolen', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'member-b', now(), now() + interval '1 hour')$$, '42501', null, 'member cannot create a schedule');

set local request.jwt.claim.sub = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
select results_eq($$select count(*)::text from public.clients$$, array['2']::text[], 'PT reads all of their members');
select results_eq($$update public.schedule_slots set title = 'Updated' where id = 'slot-a' returning title$$, array['Updated']::text[], 'PT can update their schedule');
select is_empty($$select * from public.clients where pt_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'$$, 'PT cannot read another PT data');

select * from finish();
rollback;
