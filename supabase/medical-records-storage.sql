-- Run this once in the Supabase SQL editor for the Medical Reports uploader.

insert into storage.buckets (id, name, public)
values ('medical-records', 'medical-records', false)
on conflict (id) do update set public = false;

drop policy if exists "Users can upload their family medical records" on storage.objects;
create policy "Users can upload their family medical records"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'medical-records'
  and exists (
    select 1
    from public.family_members member
    left join public.families family on family.id = member.family_id
    where member.id::text = split_part(name, '/', 1)
      and (member.user_id = auth.uid() or family.owner_id = auth.uid())
  )
);

drop policy if exists "Users can view their family medical records" on storage.objects;
create policy "Users can view their family medical records"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'medical-records'
  and exists (
    select 1
    from public.family_members member
    left join public.families family on family.id = member.family_id
    where member.id::text = split_part(name, '/', 1)
      and (member.user_id = auth.uid() or family.owner_id = auth.uid())
  )
);

drop policy if exists "Users can delete their family medical records" on storage.objects;
create policy "Users can delete their family medical records"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'medical-records'
  and exists (
    select 1
    from public.family_members member
    left join public.families family on family.id = member.family_id
    where member.id::text = split_part(name, '/', 1)
      and (member.user_id = auth.uid() or family.owner_id = auth.uid())
  )
);