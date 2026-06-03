# Context

## 2026-04-23 Auth Frontend Slice

### What changed

- Added a server-first web auth slice in `apps/toda-calendar` based on
  `docs/architecture/mvp-oauth-login-spec.md`.
- Introduced Toda-owned auth boundaries under:
  - `apps/toda-calendar/lib/auth/*`
  - `apps/toda-calendar/lib/supabase/*`
- Added web auth routes:
  - `/login`
  - `/auth/sign-in/[provider]`
  - `/auth/callback`
  - `/auth/error`
  - `/auth/sign-out`
- Gated `apps/toda-calendar/app/page.tsx` on server session presence before entering the
  calendar surface.
- Injected Supabase access tokens into the existing web API client so the
  current calendar fetch flow can move forward without changing feature-level
  calendar code.
- Added a small signed-in affordance in the calendar header with a sign-out
  entry point.

### Why this shape

- The UI only knows Toda routes and Toda provider enums. It does not call a
  vendor SDK directly.
- Supabase is treated as an auth broker behind adapters, not as the product
  boundary.
- The server route contract can stay stable even if the auth provider changes
  later.
- Client islands stay small:
  - login shell is server-rendered
  - provider entry is plain navigation
  - calendar auth state is only passed where needed

### Important architectural implications

- `apps/toda-calendar/next.config.mjs`
  - Removed `output: "export"`.
  - Reason: the new auth flow depends on dynamic route handlers and server-side
    session checks, which are incompatible with static export mode.
- Shared package builds still matter for production builds.
  - `pnpm build:packages` may be required before `pnpm --filter toda-calendar build`
    when shared workspace packages changed or have not been built yet.

### Current web auth contract

- `apps/toda-calendar/lib/auth/providers.ts`
  - Toda enum: `kakao | apple | google`
  - Supabase provider mapping is isolated in one place.
- `apps/toda-calendar/lib/auth/session.ts`
  - Exposes a small `AppSession` contract instead of leaking raw Supabase
    session objects into the app.
- `apps/toda-calendar/lib/auth/require-session.ts`
  - Redirects unauthenticated requests from `/` to `/login`.
- `apps/toda-calendar/lib/api/client.ts`
  - Adds `Authorization: Bearer <access_token>` automatically when a browser
    session exists.

### Environment expected by the web app

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

If these are missing, the UI stays usable for frontend work:

- the login page renders
- provider buttons are disabled
- auth gating falls back to a bypass runtime instead of blocking all frontend
  progress

### Validation completed

- `pnpm --filter toda-calendar lint`
- `pnpm --filter toda-calendar typecheck`
- `pnpm build:packages`
- `pnpm --filter toda-calendar build`

### Still intentionally not done

- `apps/api` bearer token verification
- internal user bootstrap from auth identity
- provider console setup and OAuth secrets
- production middleware/session refresh hardening

These are still expected to follow the existing auth architecture docs rather
than the temporary frontend-only bypass path.
