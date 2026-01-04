-- 1. Ensure the bucket exists (and force it to be public)
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do update set public = true;

-- 2. Drop existing policies to avoid the "already exists" error
drop policy if exists "Public View Images" on storage.objects;
drop policy if exists "Public Upload Images" on storage.objects;
drop policy if exists "Public Manage Images" on storage.objects;

-- 3. Re-create the policies fresh
create policy "Public View Images"
on storage.objects for select
using ( bucket_id = 'images' );

create policy "Public Upload Images"
on storage.objects for insert
with check ( bucket_id = 'images' );

create policy "Public Manage Images"
on storage.objects for update
using ( bucket_id = 'images' );
