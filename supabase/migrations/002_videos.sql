-- Video status enum
create type public.video_status as enum (
  'uploading',
  'queued',
  'processing',
  'ready',
  'error'
);

-- Videos table
create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled',
  description text,
  status public.video_status not null default 'uploading',
  original_filename text,
  original_size_bytes bigint,
  storage_path text,
  thumbnail_url text,
  duration_seconds numeric,
  width integer,
  height integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index idx_videos_user_id on public.videos(user_id);
create index idx_videos_status on public.videos(status);
create index idx_videos_created_at on public.videos(created_at desc);

-- Enable RLS
alter table public.videos enable row level security;

-- RLS Policies
create policy "Users can view own videos"
  on public.videos for select
  using (auth.uid() = user_id);

create policy "Users can insert own videos"
  on public.videos for insert
  with check (auth.uid() = user_id);

create policy "Users can update own videos"
  on public.videos for update
  using (auth.uid() = user_id);

create policy "Users can delete own videos"
  on public.videos for delete
  using (auth.uid() = user_id);

-- Auto-update updated_at on row change
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger videos_updated_at
  before update on public.videos
  for each row execute function public.update_updated_at();

-- Create storage bucket for videos (run via Supabase SQL editor or API)
-- Note: Storage bucket creation is typically done via the Supabase dashboard
-- or the management API, not via SQL. This is here as documentation.
-- INSERT INTO storage.buckets (id, name, public) VALUES ('videos', 'videos', false);
