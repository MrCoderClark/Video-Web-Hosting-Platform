-- Create dedicated schema for the video platform
create schema if not exists videohost;

-- Create profiles table (extends auth.users)
create table if not exists videohost.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table videohost.profiles enable row level security;

-- RLS Policies: users can only read/update their own profile
create policy "Users can view own profile"
  on videohost.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on videohost.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on videohost.profiles for insert
  with check (auth.uid() = id);

-- Auto-create profile on signup via trigger
create or replace function videohost.handle_new_user()
returns trigger as $$
begin
  insert into videohost.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'display_name');
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists to allow re-running
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function videohost.handle_new_user();

-- Grant usage to authenticated and anon roles so RLS works
grant usage on schema videohost to authenticated, anon;
grant all on all tables in schema videohost to authenticated, anon;
