-- Video status enum (in videohost schema)
create type videohost.video_status as enum (
  'uploading',
  'queued',
  'processing',
  'ready',
  'error'
);

-- Videos table
create table if not exists videohost.videos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled',
  description text,
  status videohost.video_status not null default 'uploading',
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
create index idx_videos_user_id on videohost.videos(user_id);
create index idx_videos_status on videohost.videos(status);
create index idx_videos_created_at on videohost.videos(created_at desc);

-- Enable RLS
alter table videohost.videos enable row level security;

-- RLS Policies
create policy "Users can view own videos"
  on videohost.videos for select
  using (auth.uid() = user_id);

create policy "Users can insert own videos"
  on videohost.videos for insert
  with check (auth.uid() = user_id);

create policy "Users can update own videos"
  on videohost.videos for update
  using (auth.uid() = user_id);

create policy "Users can delete own videos"
  on videohost.videos for delete
  using (auth.uid() = user_id);

-- Auto-update updated_at on row change
create or replace function videohost.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger videos_updated_at
  before update on videohost.videos
  for each row execute function videohost.update_updated_at();

-- Grant permissions on new tables (schema grant already done in 001)
grant all on all tables in schema videohost to authenticated, anon;

-- Create storage bucket for videos (run via Supabase SQL editor or API)
-- Note: Storage bucket creation is typically done via the Supabase dashboard
-- or the management API, not via SQL. This is here as documentation.
-- INSERT INTO storage.buckets (id, name, public) VALUES ('videos', 'videos', false);
