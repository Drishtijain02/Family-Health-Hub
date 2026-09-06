insert into storage.buckets (id, name, public)
values ('prescriptions', 'prescriptions', true)
on conflict (id) do update set public = true;

alter table public.prescriptions
	add column if not exists family_member_id uuid references public.family_members(id);

alter table public.prescriptions enable row level security;

drop policy if exists "Authenticated users can create prescriptions" on public.prescriptions;
create policy "Authenticated users can create prescriptions"
on public.prescriptions
for insert
to authenticated
with check (
	exists (
		select 1
		from public.family_members member
		left join public.families family on family.id = member.family_id
		where member.id = prescriptions.family_member_id
			and (member.user_id = auth.uid() or family.owner_id = auth.uid())
	)
);

drop policy if exists "Authenticated users can view prescriptions" on public.prescriptions;
create policy "Authenticated users can view prescriptions"
on public.prescriptions
for select
to authenticated
using (
	exists (
		select 1
		from public.family_members member
		left join public.families family on family.id = member.family_id
		where member.id = prescriptions.family_member_id
			and (member.user_id = auth.uid() or family.owner_id = auth.uid())
	)
);

drop policy if exists "Authenticated users can delete prescriptions" on public.prescriptions;
create policy "Authenticated users can delete prescriptions"
on public.prescriptions
for delete
to authenticated
using (
	exists (
		select 1
		from public.family_members member
		left join public.families family on family.id = member.family_id
		where member.id = prescriptions.family_member_id
			and (member.user_id = auth.uid() or family.owner_id = auth.uid())
	)
);

drop policy if exists "Authenticated users can upload prescriptions" on storage.objects;
create policy "Authenticated users can upload prescriptions"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'prescriptions');

drop policy if exists "Authenticated users can view prescriptions" on storage.objects;
create policy "Authenticated users can view prescriptions"
on storage.objects
for select
to authenticated
using (bucket_id = 'prescriptions');

drop policy if exists "Authenticated users can delete prescriptions" on storage.objects;
create policy "Authenticated users can delete prescriptions"
on storage.objects
for delete
to authenticated
using (bucket_id = 'prescriptions');
