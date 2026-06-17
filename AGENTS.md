# Repository Guidelines

## Project Structure & Module Organization

```
video-platform/
├── frontend/          # Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui
│   ├── src/app/       # Route pages (login, signup, upload, watch/[id], dashboard, settings)
│   ├── src/components/  # Shared components (ui/, video-player, upload-dropzone, navbar)
│   ├── src/lib/       # Utilities (supabase client, api client, helpers)
│   └── src/hooks/     # Custom hooks (use-auth, use-realtime)
├── backend/           # Python + FastAPI
│   ├── routers/       # API route handlers (videos, processing, users)
│   ├── services/      # Business logic (video_service, transcode, thumbnail, storage)
│   ├── models/        # Pydantic models (video, user)
│   └── workers/       # Background tasks (transcode_worker)
├── supabase/
│   └── migrations/    # SQL migrations for schema + RLS policies
└── .agent/plans/      # Incremental build plans
```

**Frontend** handles UI, auth state, and real-time subscriptions. Communicates with backend via REST API.
**Backend** handles video processing orchestration, FFmpeg transcoding, and Supabase Storage management.
**Supabase** provides Auth, Postgres (via Supavisor pooler), Storage (video files), and Realtime (status updates).

## Build, Test, and Development Commands

### Frontend
```bash
cd frontend
npm install              # Install dependencies
npm run dev              # Dev server on http://localhost:3000
npm run build            # Production build
npm run lint             # ESLint
npx vitest               # Unit tests
npx playwright test      # E2E tests
```

### Backend
```bash
cd backend
uv sync                  # Install dependencies (creates .venv automatically)
uv run uvicorn main:app --reload --port 8001   # Dev server
uv run pytest            # Run tests
uv run ruff check .      # Lint
uv run ruff format .     # Format
```

### Video Processing
```bash
ffmpeg -version          # Verify FFmpeg is installed
```

## Coding Style & Naming Conventions

### Frontend (TypeScript/React)
- **ESLint** + **Prettier** — enforced via config
- Strict TypeScript (`"strict": true`)
- Component files: `kebab-case.tsx` (e.g., `video-player.tsx`)
- Functions/variables: `camelCase`
- Types/interfaces: `PascalCase`
- Use `async/await` over `.then()` chains
- Prefer server components; use `"use client"` only when needed

### Backend (Python)
- **Ruff** for linting + formatting (replaces Black + isort + flake8)
- Type hints on all function signatures
- Files/modules: `snake_case.py`
- Classes: `PascalCase`
- Functions/variables: `snake_case`
- Pydantic models for all request/response schemas
- Async handlers with `async def`
- No LLM frameworks — raw SDK calls only

## Testing Guidelines

| Layer | Framework | Run Single Test |
|-------|-----------|-----------------|
| Frontend unit | Vitest | `npx vitest run src/path/to/test.ts` |
| Frontend E2E | Playwright | `npx playwright test tests/specific.spec.ts` |
| Backend | pytest | `pytest tests/test_specific.py::test_function -v` |

- Tests live in `frontend/tests/` (E2E) and `frontend/src/**/*.test.ts` (unit)
- Backend tests live in `backend/tests/`
- Each new feature must include at least one validation test

## Branching Strategy

Each phase gets its own feature branch off `main`. Merge via PR when the phase is validated.

| Phase | Branch Name |
|-------|-------------|
| Phase 1 | `phase-1/scaffold-auth` |
| Phase 2 | `phase-2/video-upload` |
| Phase 3 | `phase-3/transcode-pipeline` |
| Phase 4 | `phase-4/playback-browse` |
| Phase 5 | `phase-5/dashboard-management` |
| Phase 6 | `phase-6/polish-advanced` |

**Workflow:**
1. `git checkout -b phase-N/branch-name` from `main`
2. Implement the phase (multiple commits allowed)
3. Open PR → review → merge to `main`
4. Delete the feature branch after merge

## Commit & Pull Request Guidelines

- **Conventional Commits**: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`
- Scope optional: `feat(upload): add chunked upload support`
- One logical change per commit
- PR title matches the conventional commit format
- PRs must pass lint + tests before merge

## Architecture Decisions

- **HLS over DASH** — better cross-browser/mobile support
- **SSE for processing status** — lightweight, unidirectional server→client updates
- **Supabase RLS on all tables** — users only see their own data
- **FFmpeg subprocess** — full control over transcoding, no external service dependency
- **Chunked upload** — supports large video files without timeout
