# Video Hosting Platform — PRD

## What We're Building

A Vimeo-style video hosting platform with two primary interfaces:

1. **Browse & Watch** (default) — Discover and stream videos with adaptive playback
2. **Upload & Manage** — Upload videos, track processing, manage library

Configuration is via environment variables. Self-hosted Supabase provides auth, database, storage, and realtime.

## Target Users

Content creators and teams who want a self-hosted video platform with professional-grade transcoding and playback — without relying on YouTube/Vimeo.

## Scope

### In Scope
- ✅ Video upload (drag-and-drop, chunked for large files)
- ✅ FFmpeg transcoding to HLS (360p, 720p, 1080p)
- ✅ Thumbnail generation
- ✅ Adaptive streaming playback (HLS.js)
- ✅ User auth (signup, login, OAuth)
- ✅ Video management (edit metadata, delete, visibility)
- ✅ Browse/search videos
- ✅ User dashboard with upload status
- ✅ Real-time processing status updates
- ✅ View counting + basic analytics
- ✅ Video embed support
- ✅ RLS — users manage only their own content

### Out of Scope
- ❌ Comments / social features (future phase)
- ❌ Live streaming
- ❌ Monetization / billing
- ❌ Multi-tenant admin
- ❌ AI/ML features (transcription, recommendations)
- ❌ Mobile apps
- ❌ CDN integration (serve from Supabase Storage directly)

## Stack

| Layer | Choice |
|-------|--------|
| Frontend | Next.js 15 (App Router) + TypeScript + Tailwind CSS + shadcn/ui |
| Backend | Python 3.12+ + FastAPI + Pydantic v2 |
| Database | Self-hosted Supabase (Postgres via Supavisor at 127.0.0.1:6543) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Realtime | Supabase Realtime (processing status) |
| Video Processing | FFmpeg (self-hosted) |
| Video Playback | HLS.js |

## Constraints

- No external transcoding services — FFmpeg only
- Row-Level Security on all tables
- Processing status via Supabase Realtime or SSE
- Videos served as HLS (`.m3u8` + `.ts` segments)
- Python backend uses venv (no system-wide packages)

---

## Phase 1: Scaffold & Auth

**Build:** Next.js app, FastAPI app, Supabase connections, auth flow, base schema + RLS

**Validate:** Signup/login works in browser, backend serves health endpoint, RLS blocks cross-user access

---

## Phase 2: Video Upload & Storage

**Build:** Upload page (drag-and-drop, progress), backend upload endpoint, Supabase Storage, videos table, real-time status

**Validate:** Upload file → appears in Storage → row in DB with status `queued`

---

## Phase 3: FFmpeg Transcoding Pipeline

**Build:** Background worker, FFmpeg HLS transcoding (360p/720p/1080p), thumbnail generation, status updates

**Validate:** Upload triggers transcode → HLS segments + manifest generated → status moves to `ready`

---

## Phase 4: Video Playback & Browse

**Build:** Watch page with HLS.js player, video detail page, home/browse grid, search

**Validate:** `/watch/[id]` plays adaptive video, home page shows grid of thumbnails

---

## Phase 5: User Dashboard & Management

**Build:** Dashboard (my videos, status, views), edit metadata, delete cascade, visibility controls

**Validate:** User sees only their videos, can edit/delete, visibility toggle works

---

## Phase 6: Polish & Advanced Features

**Build:** View counting, embed codes, social sharing, pagination, error handling, SEO

**Validate:** View count increments, embed works in iframe, OG tags render in link previews

---

## Success Criteria

- ✅ Upload a video → it transcodes automatically → plays back in HLS
- ✅ Multiple resolution options in the player
- ✅ Auth works with RLS (users isolated)
- ✅ Real-time processing status visible to user
- ✅ Clean, responsive Vimeo-inspired UI
- ✅ All data self-hosted (no external dependencies beyond FFmpeg)
