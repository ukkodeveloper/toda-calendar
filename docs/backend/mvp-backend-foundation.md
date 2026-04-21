# MVP Backend Foundation

## Decision

- Add a dedicated `apps/api` Fastify service now.
- Keep the current frontend untouched.
- Keep API contracts inside `apps/api` for now instead of extracting
  `packages/contracts` immediately.
- Use file-backed persistence behind a repository boundary for local/demo use.

## Why

The architecture doc clearly pushes toward frontend/backend separation.
Creating `apps/api` now gives the monorepo a real backend boundary without
forcing any `apps/web` edits.

The `senior-backend-toda` rule to avoid premature extraction also matters here:
because the frontend is intentionally frozen, a shared contracts package would be
an unused abstraction today. Co-locating contracts inside `apps/api` keeps the
design clean while preserving an easy extraction path later.

## Scope In This Change

- `GET /health`
- `GET /v1/me`
- `GET /v1/calendars`
- `GET /v1/calendars/:calendarId/month-view`
- `GET /v1/calendars/:calendarId/day-records/:localDate`
- `PATCH /v1/calendars/:calendarId/day-records/:localDate`
- Vitest-based backend test mode

## Key Constraints

- Persistence is local-only/demo-only for now.
- Filesystem writes are not assumed to be durable in serverless deployments.
- Photo slots store direct asset URLs for this MVP foundation.
- Text slots stay `TEXT` with `title` and `body` so the existing web surface can
  be integrated later without changing frontend data semantics.

## Rejected Alternatives

### Route handlers inside `apps/web`

Rejected because the design doc explicitly separates frontend and backend
responsibilities, and the user asked not to touch frontend code.

### Immediate `packages/contracts` extraction

Rejected because there is only one active consumer after freezing the frontend.
The extraction path is obvious, but doing it now would add package overhead
without reducing real duplication.

## Forward Path

1. Extract `apps/api/src/contracts` into `packages/contracts` when a second
   client starts consuming the API.
2. Replace the file repository with Postgres/Supabase adapters behind the same
   application ports.
3. Introduce authenticated request context once login flow is wired.
4. Add upload/presign flow and asset metadata persistence when photo pipeline is
   ready.
