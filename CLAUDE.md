# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start Vite dev server (localhost:5173)
npm run build      # TypeScript check + Vite production build
npm run lint       # ESLint (flat config, TS + React Hooks + React Refresh)
npm run preview    # Preview production build locally
```

No test runner is configured. There is no `npm test` command.

## Tech Stack

- **Frontend:** React 19 + TypeScript 5.9 (strict) + Vite 7 + React Router v7
- **State:** Zustand 5 (12 domain-scoped stores, no persist except authStore.familyId)
- **Backend:** Vercel serverless functions (`api/` directory, Node.js)
- **Database:** Supabase (PostgreSQL + Auth)
- **Auth:** Supabase Auth (email/password) + WebAuthn/Passkey (@simplewebauthn)
- **Animations:** Framer Motion 12
- **PWA:** vite-plugin-pwa with auto-update service worker

## Architecture

### Data Flow

1. **Auth init:** `App.tsx` → `authStore.initialize()` → Supabase session listener
2. **Core data:** Auth success → `appStore.fetchFamily()` + `appStore.fetchChildren()`
3. **Page data:** Each page uses `usePageData(['tasks', 'rewards', ...])` to lazy-load only what it needs per child
4. **Mutations:** Optimistic update in store → API call → replace with server response (rollback on error)

### Frontend (`src/`)

- **`stores/`** — 12 Zustand stores, one per domain (auth, app, task, point, reward, exchange, badge, health, family, knowledge, emotion, recommendation). Each store tracks loaded children via `_loadedChildIds` Set and implements `logout()` for cleanup.
- **`pages/`** — Route components. Auth/Onboarding flow gates access to main app routes.
- **`hooks/usePageData.ts`** — Central data-loading hook. Takes an array of `DataKey` strings, fetches only missing data for current child, skips already-loaded data.
- **`lib/api.ts`** — Typed API client with namespaced objects (`tasksApi`, `rewardsApi`, etc.). All requests include Bearer token from authStore session. Uses `ApiError` class.
- **`types/index.ts`** — All TypeScript types (~627 lines). Single source of truth for domain models.
- **`data/`** — Static data: task/reward templates, badge definitions with checker functions, WHO growth curves, knowledge articles, vaccine schedules.

### Backend (`api/`)

- Vercel serverless handlers. Each file handles multiple HTTP methods and sub-paths.
- `vercel.json` rewrites `/api/<domain>/:path+` → `/api/<domain>` (single handler per domain).
- Uses Supabase Service Role Key for elevated database operations.
- `completedToday` on tasks is calculated server-side to avoid timezone/clock manipulation issues.

### Key Conventions

- **Per-child scoping:** All data queries are filtered by `childId`. Switching children resets store tracking and triggers fresh fetches.
- **Store access outside React:** Use `useXxxStore.getState()` for imperative access (e.g., in `api.ts` reading auth token).
- **Stable fetch references:** `usePageData` uses module-level `fetchFunctions` object to avoid React dependency array issues.
- **CSS theming:** CSS custom properties in `index.css`. Per-child accent color via `--child-accent`. Mobile-first layout with `--content-max-width: 480px`.
- **Task stages:** Tasks progress through `start` (1.5x points) → `persist` → `stable` (0.8x) → `graduated`.
- **Badge checking:** Declarative badge definitions in `src/data/badges.ts` with checker functions. Fire-and-forget server persist after task completion.

## Environment Variables

Frontend (prefixed `VITE_`):
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

Backend:
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`
- `WEBAUTHN_RP_NAME`, `WEBAUTHN_RP_ID`, `WEBAUTHN_ORIGIN`

## Deployment

Hosted on Vercel. Frontend builds to `dist/`. API handlers are auto-deployed as serverless functions. Database migrations in `supabase/migrations/`.
