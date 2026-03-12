-- schema.sql

-- Create a table for public profiles
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  gender text,
  date_of_birth date,
  habits text[],
  habits_interests text,
  occupation text,
  location text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create violations table
create table public.violations (
  id uuid default gen_random_uuid() primary key,
  vehicle_number text not null,
  vehicle_type text,
  violation_type text not null,
  location text,
  media_url text,
  status text default 'pending',
  scanned_by uuid references auth.users on delete set null,
  confidence float,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create staff table
create table public.staff (
  id uuid default gen_random_uuid() primary key,
  full_name text not null,
  email text,
  role text default 'team_member',
  system_id text,
  status text default 'active',
  created_by uuid references auth.users on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.violations enable row level security;
alter table public.staff enable row level security;

create policy "Users manage own profile"
  on public.profiles for all
  using ( auth.uid() = id )
  with check ( auth.uid() = id );

create policy "Users manage own violations"
  on public.violations for all
  using ( auth.uid() = scanned_by )
  with check ( auth.uid() = scanned_by );

create policy "Admins manage staff"
  on public.staff for all
  using ( auth.uid() = created_by )
  with check ( auth.uid() = created_by );

-- Set up Realtime!
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;
alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.violations;
alter publication supabase_realtime add table public.staff;

-- Set up Storage!
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true);

insert into storage.buckets (id, name, public)
values ('violation-media', 'violation-media', true);

create policy "Avatar images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'avatars' );

create policy "Anyone can upload an avatar."
  on storage.objects for insert
  with check ( bucket_id = 'avatars' );

create policy "Anyone can update an avatar."
  on storage.objects for update
  with check ( bucket_id = 'avatars' );

create policy "Violation media is publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'violation-media' );

create policy "Anyone can upload violation media."
  on storage.objects for insert
  with check ( bucket_id = 'violation-media' );

create policy "Anyone can update violation media."
  on storage.objects for update
  with check ( bucket_id = 'violation-media' );
