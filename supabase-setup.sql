-- รันไฟล์นี้หนึ่งครั้งใน Supabase > SQL Editor

create table if not exists public.drawings (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
    title text not null default 'ภาพวาดของฉัน' check (char_length(title) between 1 and 80),
    storage_path text not null unique,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists drawings_user_created_idx
    on public.drawings (user_id, created_at desc);

alter table public.drawings enable row level security;

drop policy if exists "Users can read their drawings" on public.drawings;
create policy "Users can read their drawings"
    on public.drawings for select
    to authenticated
    using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their drawings" on public.drawings;
create policy "Users can create their drawings"
    on public.drawings for insert
    to authenticated
    with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their drawings" on public.drawings;
create policy "Users can update their drawings"
    on public.drawings for update
    to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their drawings" on public.drawings;
create policy "Users can delete their drawings"
    on public.drawings for delete
    to authenticated
    using ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('drawings', 'drawings', false, 5242880, array['image/png'])
on conflict (id) do update set
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can view their drawing files" on storage.objects;
create policy "Users can view their drawing files"
    on storage.objects for select
    to authenticated
    using (
        bucket_id = 'drawings'
        and (storage.foldername(name))[1] = (select auth.uid())::text
    );

drop policy if exists "Users can upload their drawing files" on storage.objects;
create policy "Users can upload their drawing files"
    on storage.objects for insert
    to authenticated
    with check (
        bucket_id = 'drawings'
        and (storage.foldername(name))[1] = (select auth.uid())::text
    );

drop policy if exists "Users can update their drawing files" on storage.objects;
create policy "Users can update their drawing files"
    on storage.objects for update
    to authenticated
    using (
        bucket_id = 'drawings'
        and (storage.foldername(name))[1] = (select auth.uid())::text
    )
    with check (
        bucket_id = 'drawings'
        and (storage.foldername(name))[1] = (select auth.uid())::text
    );

drop policy if exists "Users can delete their drawing files" on storage.objects;
create policy "Users can delete their drawing files"
    on storage.objects for delete
    to authenticated
    using (
        bucket_id = 'drawings'
        and (storage.foldername(name))[1] = (select auth.uid())::text
    );
