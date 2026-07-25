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

-- แบบสำรวจพื้นที่ของแต่ละบัญชี
create table if not exists public.site_surveys (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
    name text not null check (char_length(name) between 1 and 120),
    surveyed_on date not null default current_date,
    location text check (location is null or char_length(location) <= 100),
    room_width numeric(10,2) check (room_width is null or room_width >= 0),
    room_length numeric(10,2) check (room_length is null or room_length >= 0),
    room_height numeric(10,2) check (room_height is null or room_height >= 0),
    door_count integer not null default 0 check (door_count >= 0),
    door_details text check (door_details is null or char_length(door_details) <= 300),
    window_count integer not null default 0 check (window_count >= 0),
    window_details text check (window_details is null or char_length(window_details) <= 300),
    lighting text check (lighting is null or char_length(lighting) <= 600),
    noise text check (noise is null or char_length(noise) <= 600),
    issues text check (issues is null or char_length(issues) <= 1200),
    notes text check (notes is null or char_length(notes) <= 1200),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists site_surveys_user_date_idx
    on public.site_surveys (user_id, surveyed_on desc);

alter table public.site_surveys enable row level security;

drop policy if exists "Users can read their site surveys" on public.site_surveys;
create policy "Users can read their site surveys"
    on public.site_surveys for select to authenticated
    using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their site surveys" on public.site_surveys;
create policy "Users can create their site surveys"
    on public.site_surveys for insert to authenticated
    with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their site surveys" on public.site_surveys;
create policy "Users can update their site surveys"
    on public.site_surveys for update to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their site surveys" on public.site_surveys;
create policy "Users can delete their site surveys"
    on public.site_surveys for delete to authenticated
    using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.site_surveys to authenticated;

drop trigger if exists set_site_surveys_updated_at on public.site_surveys;
create trigger set_site_surveys_updated_at
    before update on public.site_surveys
    for each row execute function public.set_updated_at();

-- คลังวัสดุส่วนตัว
create table if not exists public.material_library (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
    name text not null check (char_length(name) between 1 and 120),
    category text not null default 'อื่น ๆ',
    brand_model text check (brand_model is null or char_length(brand_model) <= 120),
    price numeric(12,2) check (price is null or price >= 0),
    price_unit text not null default 'ชิ้น' check (price_unit in ('ชิ้น', 'ตร.ม.', 'เมตร', 'ชุด', 'ม้วน', 'กล่อง')),
    store text check (store is null or char_length(store) <= 160),
    dimensions text check (dimensions is null or char_length(dimensions) <= 160),
    image_path text,
    notes text check (notes is null or char_length(notes) <= 1000),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists material_library_user_created_idx
    on public.material_library (user_id, created_at desc);
create index if not exists material_library_user_category_idx
    on public.material_library (user_id, category);

alter table public.material_library enable row level security;

drop policy if exists "Users can read their materials" on public.material_library;
create policy "Users can read their materials"
    on public.material_library for select to authenticated
    using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their materials" on public.material_library;
create policy "Users can create their materials"
    on public.material_library for insert to authenticated
    with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their materials" on public.material_library;
create policy "Users can update their materials"
    on public.material_library for update to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their materials" on public.material_library;
create policy "Users can delete their materials"
    on public.material_library for delete to authenticated
    using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.material_library to authenticated;

drop trigger if exists set_material_library_updated_at on public.material_library;
create trigger set_material_library_updated_at
    before update on public.material_library
    for each row execute function public.set_updated_at();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('material-images', 'material-images', false, 5242880, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update set
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can view their material images" on storage.objects;
create policy "Users can view their material images"
    on storage.objects for select to authenticated
    using (
        bucket_id = 'material-images'
        and (storage.foldername(name))[1] = (select auth.uid())::text
    );

drop policy if exists "Users can upload their material images" on storage.objects;
create policy "Users can upload their material images"
    on storage.objects for insert to authenticated
    with check (
        bucket_id = 'material-images'
        and (storage.foldername(name))[1] = (select auth.uid())::text
    );

drop policy if exists "Users can update their material images" on storage.objects;
create policy "Users can update their material images"
    on storage.objects for update to authenticated
    using (
        bucket_id = 'material-images'
        and (storage.foldername(name))[1] = (select auth.uid())::text
    )
    with check (
        bucket_id = 'material-images'
        and (storage.foldername(name))[1] = (select auth.uid())::text
    );

drop policy if exists "Users can delete their material images" on storage.objects;
create policy "Users can delete their material images"
    on storage.objects for delete to authenticated
    using (
        bucket_id = 'material-images'
        and (storage.foldername(name))[1] = (select auth.uid())::text
    );

-- สัตว์เลี้ยงคู่เรียนของแต่ละบัญชี
create table if not exists public.study_pets (
    user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
    species text not null default 'pig' check (species in ('pig', 'dog', 'cat', 'rabbit', 'capybara')),
    name text not null default 'โมจิ' check (char_length(name) between 1 and 30),
    petals integer not null default 15 check (petals >= 0),
    happiness integer not null default 75 check (happiness between 0 and 100),
    owned_accessories text[] not null default '{}',
    equipped_accessory text not null default '' check (equipped_accessory in ('', 'ribbon', 'glasses', 'hat')),
    fed_at timestamptz,
    petted_at timestamptz,
    daily_reward_on date,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.study_pets
    add column if not exists daily_reward_on date;

alter table public.study_pets
    alter column petals set default 15;

alter table public.study_pets enable row level security;

drop policy if exists "Users can read their study pet" on public.study_pets;
create policy "Users can read their study pet"
    on public.study_pets for select to authenticated
    using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their study pet" on public.study_pets;
create policy "Users can create their study pet"
    on public.study_pets for insert to authenticated
    with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their study pet" on public.study_pets;
create policy "Users can update their study pet"
    on public.study_pets for update to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their study pet" on public.study_pets;
create policy "Users can delete their study pet"
    on public.study_pets for delete to authenticated
    using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.study_pets to authenticated;

create or replace function public.claim_daily_petals()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
    reward_amount integer := 0;
begin
    update public.study_pets
    set petals = petals + 3,
        daily_reward_on = current_date,
        updated_at = now()
    where user_id = auth.uid()
      and (daily_reward_on is null or daily_reward_on < current_date);

    if found then
        reward_amount := 3;
    end if;

    return reward_amount;
end;
$$;

revoke all on function public.claim_daily_petals() from public;
grant execute on function public.claim_daily_petals() to authenticated;

drop trigger if exists set_study_pets_updated_at on public.study_pets;
create trigger set_study_pets_updated_at
    before update on public.study_pets
    for each row execute function public.set_updated_at();

alter table public.homework_tasks
    add column if not exists pet_rewarded boolean not null default false;

create or replace function public.reward_pet_for_homework(p_task_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
    rewarded boolean := false;
begin
    if exists (
        select 1
        from public.homework_tasks
        where id = p_task_id
          and user_id = auth.uid()
          and status = 'completed'
          and pet_rewarded = false
    ) and exists (
        select 1
        from public.study_pets
        where user_id = auth.uid()
    ) then
        update public.homework_tasks
        set pet_rewarded = true
        where id = p_task_id
          and user_id = auth.uid()
          and pet_rewarded = false;

        if found then
            update public.study_pets
            set petals = petals + 5,
                happiness = least(100, happiness + 5),
                updated_at = now()
            where user_id = auth.uid();
            rewarded := true;
        end if;
    end if;
    return rewarded;
end;
$$;

revoke all on function public.reward_pet_for_homework(uuid) from public;
grant execute on function public.reward_pet_for_homework(uuid) to authenticated;
