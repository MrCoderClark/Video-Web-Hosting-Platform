# Design System — Video Platform

## Design Philosophy

**"Cinema-grade interface."** The content (video) is always the hero. The UI recedes — dark, spacious, and quiet — so the viewer's focus stays on the work. Every element earns its space.

Inspired by Vimeo's restraint, but elevated with:
- Deeper contrast and richer dark tones (not flat gray)
- More generous whitespace and breathing room
- Subtle depth via layered glass effects and soft shadows
- Fluid micro-interactions that feel premium
- Typography with more personality (not just Inter everywhere)

---

## Color Palette

### Dark Theme (Primary)

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-deep` | `#0a0a0f` | Page background — near-black with slight blue undertone |
| `--bg-surface` | `#12121a` | Cards, panels, elevated surfaces |
| `--bg-elevated` | `#1a1a26` | Hover states, active elements |
| `--bg-glass` | `rgba(255,255,255,0.03)` | Glassmorphism overlays |
| `--border-subtle` | `rgba(255,255,255,0.06)` | Card borders, dividers |
| `--border-focus` | `rgba(255,255,255,0.12)` | Hover borders |
| `--text-primary` | `#f0f0f5` | Headings, important text |
| `--text-secondary` | `#8a8a9a` | Body text, descriptions |
| `--text-muted` | `#4a4a5a` | Timestamps, metadata |
| `--accent` | `#6366f1` | Primary actions (indigo — more refined than Vimeo's blue) |
| `--accent-hover` | `#818cf8` | Hover state for accent |
| `--accent-glow` | `rgba(99,102,241,0.15)` | Glow effect behind accent elements |
| `--success` | `#10b981` | Processing complete, upload done |
| `--warning` | `#f59e0b` | Processing, attention needed |
| `--error` | `#ef4444` | Failed, error states |

### Light Theme (Optional, for settings/upload)
Will follow same token structure with inverted values. Dark is the default and primary experience.

---

## Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| Display (hero) | `Plus Jakarta Sans` | 48-64px | 700 |
| H1 | `Plus Jakarta Sans` | 32-40px | 600 |
| H2 | `Plus Jakarta Sans` | 24-28px | 600 |
| H3 | `Plus Jakarta Sans` | 18-20px | 500 |
| Body | `Inter` | 15-16px | 400 |
| Caption/meta | `Inter` | 13px | 400 |
| Code/mono | `JetBrains Mono` | 13px | 400 |

**Key principle:** Jakarta Sans for headings gives personality without being distracting. Inter for body keeps readability high.

---

## Spacing & Layout

- **Base unit:** 4px (all spacing is multiples of 4)
- **Content max-width:** 1400px (wider than Vimeo — let videos breathe)
- **Video player max-width:** 1200px on watch pages
- **Card grid:** CSS Grid with `auto-fill, minmax(320px, 1fr)` — responsive without breakpoints
- **Section padding:** 64px vertical, 24px horizontal (mobile: 32px / 16px)
- **Card border-radius:** 12px (softer than Vimeo's sharper corners)
- **Button border-radius:** 8px

---

## Component Patterns

### Video Card
- 16:9 aspect ratio thumbnail with lazy loading + blur placeholder
- Hover: thumbnail scales 1.02x, soft shadow expands, shows duration badge
- Below: title (1 line, truncated), uploader name, view count + time ago
- No visible border at rest — border appears on hover (`--border-focus`)

### Video Player
- Full-width, edge-to-edge on the watch page (no sidebar competing)
- Custom controls: minimal, appear on hover, fade out after 2s
- Progress bar: thin line, accent color, expands on hover
- Quality selector: pill dropdown, not a menu

### Navbar
- Fixed top, glassmorphism background (`backdrop-filter: blur(16px)`)
- Logo left, search center (expandable), user avatar right
- Height: 64px, with `--border-subtle` bottom line
- Collapses to hamburger on mobile

### Upload Dropzone
- Large dashed border area (not a tiny button)
- Drag state: border animates to accent, background glows
- Progress: circular ring around file icon, percentage text
- After upload: show processing stages as animated steps

### Buttons
- **Primary:** Filled accent, subtle glow shadow on hover
- **Secondary:** Ghost with border, fills on hover
- **Danger:** Red ghost, fills red on hover
- All buttons have `transition: all 150ms ease`

### Cards & Surfaces
- No hard shadows — use layered soft shadows + border
- `box-shadow: 0 1px 2px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.2)`
- Hover lifts: `transform: translateY(-2px)` + shadow expansion

---

## Motion & Animation

| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| Page transitions | Fade + slight Y translate | 200ms | ease-out |
| Card hover | Scale + shadow | 150ms | ease |
| Button press | Scale down 0.97 | 100ms | ease |
| Modal open | Fade + scale from 0.95 | 250ms | spring(1, 80, 10) |
| Progress bar | Width transition | 300ms | ease-in-out |
| Skeleton loading | Shimmer pulse | 1.5s | linear, infinite |

**Principle:** Animations should feel fast and responsive. Never block interaction. Prefer CSS transitions over JS animation libraries.

---

## Responsive Breakpoints

| Name | Width | Behavior |
|------|-------|----------|
| `sm` | 640px | Single column, full-width cards |
| `md` | 768px | 2-column grid, collapsed nav |
| `lg` | 1024px | 3-column grid, full nav |
| `xl` | 1280px | 4-column grid, max-width container |
| `2xl` | 1536px | Wider content area |

---

## Iconography

- **Lucide React** — consistent 24px stroke icons
- Stroke width: 1.5px (lighter than default 2px — more elegant)
- Icons are `--text-secondary` by default, `--text-primary` on hover/active

---

## What This Is NOT

- ❌ Not a flat gray card layout with rounded corners (the "shadcn default" look)
- ❌ Not a cluttered dashboard with sidebars and data tables on every page
- ❌ Not bright white backgrounds with colored accents (that's every SaaS app)
- ❌ Not gradient-heavy or neon (that's the "AI startup" look)

**This IS:** Dark, spacious, cinematic. The video is the star. The UI is the theater.
