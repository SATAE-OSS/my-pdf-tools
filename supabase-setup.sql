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

alter table public.drawings add column if not exists file_size bigint not null default 0;
alter table public.drawings add column if not exists is_public boolean not null default false;
alter table public.drawings add column if not exists share_token uuid unique;
alter table public.drawings add column if not exists public_path text;

drop policy if exists "Users can read their drawings" on public.drawings;
create policy "Users can read their drawings"
    on public.drawings for select
    to authenticated
    using ((select auth.uid()) = user_id);

drop policy if exists "Anyone can view shared drawings" on public.drawings;

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

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('shared-drawings', 'shared-drawings', true, 5242880, array['image/png'])
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

drop policy if exists "Users can upload shared drawing files" on storage.objects;
create policy "Users can upload shared drawing files"
    on storage.objects for insert
    to authenticated
    with check (
        bucket_id = 'shared-drawings'
        and (storage.foldername(name))[1] = (select auth.uid())::text
    );

drop policy if exists "Users can update shared drawing files" on storage.objects;
create policy "Users can update shared drawing files"
    on storage.objects for update
    to authenticated
    using (
        bucket_id = 'shared-drawings'
        and (storage.foldername(name))[1] = (select auth.uid())::text
    )
    with check (
        bucket_id = 'shared-drawings'
        and (storage.foldername(name))[1] = (select auth.uid())::text
    );

drop policy if exists "Users can delete shared drawing files" on storage.objects;
create policy "Users can delete shared drawing files"
    on storage.objects for delete
    to authenticated
    using (
        bucket_id = 'shared-drawings'
        and (storage.foldername(name))[1] = (select auth.uid())::text
    );

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
    delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;

create or replace function public.get_shared_drawing(p_token uuid)
returns table(title text, public_path text)
language sql
stable
security definer
set search_path = ''
as $$
    select drawing.title, drawing.public_path
    from public.drawings as drawing
    where drawing.share_token = p_token
      and drawing.is_public = true
    limit 1;
$$;

revoke all on function public.get_shared_drawing(uuid) from public;
grant execute on function public.get_shared_drawing(uuid) to anon, authenticated;
