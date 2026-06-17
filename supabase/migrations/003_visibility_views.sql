-- Video visibility enum
create type videohost.video_visibility as enum (
  'public',
  'unlisted',
  'private'
);

-- Add visibility column to videos
alter table videohost.videos
  add column if not exists visibility videohost.video_visibility not null default 'public';

-- Add view count column
alter table videohost.videos
  add column if not exists view_count integer not null default 0;

-- Index for public video browsing
create index idx_videos_visibility on videohost.videos(visibility)
  where status = 'ready';

-- Update RLS: allow anonymous users to view public videos
create policy "Anyone can view public ready videos"
  on videohost.videos for select
  using (status = 'ready' and visibility = 'public');
