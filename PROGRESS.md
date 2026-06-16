# Build Progress

## Phase 0: Init — Docs & Project Setup
- [x] AGENTS.md created
- [x] PRD.md created
- [x] PROGRESS.md created
- [x] .agent/plans/ structure created
- [ ] Initial commit to GitHub

## Phase 1: Scaffold & Auth
- [ ] Next.js 15 app initialized (TypeScript, Tailwind, shadcn/ui)
- [ ] FastAPI app initialized (venv, requirements.txt, config)
- [ ] Supabase client connections (frontend + backend)
- [ ] Auth flow: signup, login, logout
- [ ] Protected routes
- [ ] DB migration: profiles table + RLS
- [ ] .env.example

## Phase 2: Video Upload & Storage
- [ ] Upload page with drag-and-drop
- [ ] Chunked upload for large files
- [ ] Backend upload endpoint
- [ ] Supabase Storage integration
- [ ] Videos table + RLS
- [ ] Upload progress indicator

## Phase 3: FFmpeg Transcoding Pipeline
- [ ] Background transcoding worker
- [ ] HLS output (360p, 720p, 1080p)
- [ ] Thumbnail generation
- [ ] Transcoded files stored in Supabase Storage
- [ ] Real-time status updates (queued → processing → ready → error)

## Phase 4: Video Playback & Browse
- [ ] Watch page with HLS.js adaptive player
- [ ] Video detail page (title, description, uploader)
- [ ] Home/browse page with video card grid
- [ ] Search (title/description)
- [ ] Responsive design

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
