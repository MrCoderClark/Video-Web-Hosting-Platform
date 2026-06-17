# Build Progress

## Phase 0: Init — Docs & Project Setup
- [x] AGENTS.md created
- [x] PRD.md created
- [x] PROGRESS.md created
- [x] .agent/plans/ structure created
- [ ] Initial commit to GitHub

## Phase 1: Scaffold & Auth ✅
- [x] Next.js 15 app initialized (TypeScript, Tailwind, shadcn/ui)
- [x] FastAPI app initialized (uv, pyproject.toml, config)
- [x] Supabase client connections (frontend + backend)
- [x] Auth flow: signup, login, logout
- [x] Protected routes (middleware)
- [x] DB migration: profiles table + RLS + trigger
- [x] .env.example + cinema-grade dark theme

## Phase 2: Video Upload & Storage
- [x] Upload page with drag-and-drop dropzone
- [x] Upload progress bar (XHR with percentage + bytes)
- [x] Backend upload endpoint (POST /api/videos/upload)
- [x] Supabase Storage integration (service role)
- [x] Videos table + RLS + status enum migration
- [x] Dashboard with video list + status badges
- [x] API client with auth token injection
- [x] GET /api/videos + GET /api/videos/:id endpoints

## Phase 3: FFmpeg Transcoding Pipeline ✅
- [x] Background transcoding worker (polls queued, processes FIFO)
- [x] HLS output (360p, 720p, 1080p adaptive with master.m3u8)
- [x] Thumbnail generation (signed URL)
- [x] Transcoded files stored in Supabase Storage
- [x] Real-time status updates via SSE (dashboard live updates)

## Phase 4: Video Playback & Browse ✅
- [x] Watch page with HLS.js adaptive player + quality selector
- [x] Video detail page (title, description, uploader, resolution)
- [x] Home/browse page with responsive video card grid
- [x] Search (title/description via ILIKE)
- [x] Responsive design (1-4 column grid)
- [x] Backend: public endpoints (browse, detail, HLS proxy)
- [x] Custom video controls (play/pause, mute, seek, fullscreen)

## Phase 5: User Dashboard & Management
- [ ] User dashboard (my videos, status, views)
- [ ] Edit video metadata
- [ ] Delete video (cascade)
- [ ] Visibility controls (public/unlisted/private)
- [ ] User profile/settings

## Phase 6: Polish & Advanced Features
- [ ] View counting + analytics
- [ ] Embed support (iframe code)
- [ ] Social sharing links
- [ ] Pagination / infinite scroll
- [ ] Error handling + loading states + toasts
- [ ] SEO / Open Graph tags
