# MVP Backend Foundation

## Decision

- Add a dedicated `apps/api` Fastify service now.
- Keep the current frontend untouched while backend boundaries evolve.
- Share API contracts through `packages/contracts`.
- Use file-backed persistence behind a repository boundary for local/demo use.
- Introduce authenticated request context with an external-auth adapter boundary.

## Why

The architecture doc clearly pushes toward frontend/backend separation.
Creating `apps/api` now gives the monorepo a real backend boundary without
forcing any `apps/web` edits.

The auth spec also pushes toward a backend-owned user model even when external
authentication is delegated to a broker like Supabase. That means the backend
needs a stable internal user id, a request-scoped auth context, and a narrow
adapter boundary where token verification happens.

Now that multiple surfaces already consume the same calendar contracts, keeping
shared request and response schemas in `packages/contracts` is the cleaner
source of truth.

## Scope In This Change

- `GET /health`
- `GET /v1/me`
- `GET /v1/calendars`
- `GET /v1/calendars/:calendarId/month-view`
- `GET /v1/calendars/:calendarId/day-records`
- `GET /v1/calendars/:calendarId/day-records/:localDate`
- `PATCH /v1/calendars/:calendarId/day-records/:localDate`
- Vitest-based backend test mode
- Request-scoped bearer authentication for all `/v1/*` routes
- Internal user bootstrap from external auth identity
- Swappable access-token verifier boundary with `mock` and `supabase` adapters

## Additional Backend Decision

- `month-view` is backed by the full visible `6-week` grid, not only the
  in-month dates.
- The repository boundary now queries day records by `localDate` range instead
  of a month-only shortcut so later week-view or mobile surfaces can reuse the
  same access pattern.
- Each returned month-view cell includes `isCurrentMonth` so web/mobile clients
  can choose whether to render adjacent dates or quiet placeholders.
- The API treats external auth as infrastructure and never exposes vendor
  session objects through product contracts.
- Internal `user.id` is distinct from external auth `subject`, and the mapping
  lives in persisted `authIdentities`.

## Key Constraints

- Persistence is local-only/demo-only for now.
- Filesystem writes are not assumed to be durable in serverless deployments.
- Photo slots store direct asset URLs for this MVP foundation.
- Text slots stay `TEXT` with `title` and `body` so the existing web surface can
  be integrated later without changing frontend data semantics.
- The default auth mode is `mock` until real Supabase project settings are
  available.
- First-login bootstrap currently uses file-backed atomic mutation rather than a
  database transaction, so durable production semantics still need a real DB
  adapter.

## Current Backend Shape

```text
apps/api/src/
  application/
    ports/
      access-token-verifier.ts
      auth-repository.ts
      calendar-repository.ts
    services/
      auth-context-service.ts
      calendar-service.ts
  domain/
    authenticated-user.ts
    auth-errors.ts
  http/
    auth/
      get-bearer-token.ts
      require-auth.ts
    routes.ts
  infrastructure/
    auth/
      mock-access-token-verifier.ts
      supabase-jwks-verifier.ts
    persistence/
      file-auth-repository.ts
      file-calendar-repository.ts
      file-store.ts
```

## Auth Slice Notes

- `/health` remains public, but every `/v1/*` route now requires
  `Authorization: Bearer <token>`.
- In local development, `Bearer dev:<subject>[:email]` tokens are accepted by
  the mock verifier.
- In Supabase mode, JWT verification is isolated behind the JWKS verifier
  adapter so the rest of the application only sees `{ source, subject, email }`.
- The authenticated request context now carries the internal user profile, and
  calendar services no longer read a singleton "current user" from persistence.
- Legacy file-store shape is migrated forward into `users + authIdentities +
  calendars + dayRecords` on read.

## Validation Completed

- `pnpm --filter api lint`
- `pnpm --filter api typecheck`
- `pnpm --filter api test`
- `pnpm build:packages`
- `pnpm --filter api build`

## Rejected Alternatives

### Route handlers inside `apps/web`

Rejected because the design doc explicitly separates frontend and backend
responsibilities, and the user asked not to touch frontend code.

### Leaking Supabase session shape into services

Rejected because it would make a future auth-provider swap mostly mechanical on
paper but expensive in practice. The application layer should only know about a
verified external identity and an internal authenticated user.

## Forward Path

1. Replace the file repositories with Postgres-backed adapters behind the same
   application ports.
2. Wire `apps/web` login/callback routes to mint real Supabase access tokens for
   the API.
3. Add upload/presign flow and asset metadata persistence when photo pipeline is
   ready.
4. Reconcile the broader backend doc wording with the currently implemented
   `TEXT` slot contract and auth storage model.
