drop policy if exists "Public reads published schedule" on public.schedule_slots;

create policy "Public reads published schedule"
on public.schedule_slots for select to anon
using (
  is_public
  and public_status <> 'hidden'
  and exists (
    select 1 from public.pt_public_profiles
    where pt_id = schedule_slots.pt_id and enabled
  )
);
