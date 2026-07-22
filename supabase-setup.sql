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

-- ตารางเรียนของแต่ละบัญชี
create table if not exists public.student_courses (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
    name text not null check (char_length(name) between 1 and 80),
    code text check (code is null or char_length(code) <= 30),
    instructor text check (instructor is null or char_length(instructor) <= 80),
    day_of_week smallint not null check (day_of_week between 1 and 7),
    start_time time not null,
    end_time time not null,
    room text check (room is null or char_length(room) <= 80),
    color text not null default '#f08fb7' check (color ~ '^#[0-9A-Fa-f]{6}$'),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint student_courses_time_order check (end_time > start_time)
);

create index if not exists student_courses_user_schedule_idx
    on public.student_courses (user_id, day_of_week, start_time);

alter table public.student_courses enable row level security;

drop policy if exists "Users can read their courses" on public.student_courses;
create policy "Users can read their courses"
    on public.student_courses for select to authenticated
    using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their courses" on public.student_courses;
create policy "Users can create their courses"
    on public.student_courses for insert to authenticated
    with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their courses" on public.student_courses;
create policy "Users can update their courses"
    on public.student_courses for update to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their courses" on public.student_courses;
create policy "Users can delete their courses"
    on public.student_courses for delete to authenticated
    using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.student_courses to authenticated;

-- การบ้านจะผูกกับวิชาของเจ้าของบัญชีเดียวกัน
create table if not exists public.homework_tasks (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
    course_id uuid not null references public.student_courses(id) on delete cascade,
    title text not null check (char_length(title) between 1 and 120),
    details text check (details is null or char_length(details) <= 1000),
    due_at timestamptz not null,
    original_due_at timestamptz not null,
    status text not null default 'pending' check (status in ('pending', 'completed')),
    timing_status text not null default 'normal' check (timing_status in ('normal', 'postponed', 'late')),
    completed_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists homework_tasks_user_due_idx
    on public.homework_tasks (user_id, due_at);
create index if not exists homework_tasks_course_idx
    on public.homework_tasks (course_id);

alter table public.homework_tasks enable row level security;

drop policy if exists "Users can read their homework" on public.homework_tasks;
create policy "Users can read their homework"
    on public.homework_tasks for select to authenticated
    using ((select auth.uid()) = user_id);

drop policy if exists "Users can create homework for their courses" on public.homework_tasks;
create policy "Users can create homework for their courses"
    on public.homework_tasks for insert to authenticated
    with check (
        (select auth.uid()) = user_id
        and exists (
            select 1 from public.student_courses as course
            where course.id = course_id
              and course.user_id = (select auth.uid())
        )
    );

drop policy if exists "Users can update their homework" on public.homework_tasks;
create policy "Users can update their homework"
    on public.homework_tasks for update to authenticated
    using ((select auth.uid()) = user_id)
    with check (
        (select auth.uid()) = user_id
        and exists (
            select 1 from public.student_courses as course
            where course.id = course_id
              and course.user_id = (select auth.uid())
        )
    );

drop policy if exists "Users can delete their homework" on public.homework_tasks;
create policy "Users can delete their homework"
    on public.homework_tasks for delete to authenticated
    using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.homework_tasks to authenticated;

-- อัปเดตเวลาที่แก้ไขให้อัตโนมัติ
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists set_student_courses_updated_at on public.student_courses;
create trigger set_student_courses_updated_at
    before update on public.student_courses
    for each row execute function public.set_updated_at();

drop trigger if exists set_homework_tasks_updated_at on public.homework_tasks;
create trigger set_homework_tasks_updated_at
    before update on public.homework_tasks
    for each row execute function public.set_updated_at();
