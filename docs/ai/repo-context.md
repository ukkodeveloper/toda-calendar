# AI Repo Context

## Snapshot

- Repository: `toda-calendar`
- Workspace model: `pnpm` + Turborepo monorepo
- Node requirement: `>=20`
- Package manager: `pnpm@9.15.9`

## Current Product Surfaces

- `apps/web`
  - Next.js App Router app on Next.js `16.1.x` + React `19`
  - Main product surface for calendar UX and shared web UI consumption
  - Also hosts sprint design-system demos under `/design-system/examples/<sprint-key>`
- `apps/api`
  - Fastify TypeScript API service
  - Owns backend domain/application/infrastructure/http layers
- `apps/mobile`
  - Expo Router mobile app
  - Owns native UX, mobile navigation, device integrations, and local mobile services

## Shared Packages

- `packages/contracts`
  - Shared API request/response contracts
  - Changes here affect `web`, `api`, and `mobile`
- `packages/app-core`
  - Pure TypeScript domain/date helpers that are safe to share
- `packages/ui`
  - Shared web UI only
  - Not a cross-platform UI system for React Native
- `packages/eslint-config`, `packages/typescript-config`
  - Shared tooling presets

## Working Assumptions

- The project is still MVP-oriented, but code quality and architecture still matter.
- Web, API, and mobile can move in parallel, but package boundaries should stay explicit.
- File-backed persistence is acceptable for local development and some MVP flows.
- Filesystem persistence is not automatically safe for deployed or serverless runtimes.
- `packages/ui` should stay web-focused unless a deliberate cross-platform token layer is introduced.
- Shared logic should be extracted before shared UI.

## Architectural Boundaries To Preserve

- Keep transport layers thin.
  - `apps/web/app/**` handles route composition and page entrypoints.
  - `apps/api/src/http/**` handles HTTP translation only.
  - `apps/mobile/app/**` handles Expo Router route wiring only.
- Keep business rules out of route files and screens where possible.
- Use `packages/contracts` for stable cross-surface contracts.
- Use `packages/app-core` for pure reusable logic that has no framework or platform dependency.
- Avoid moving unstable product-specific UI into `packages/*`.

## Canonical Validation Entry Points

- Whole repo:
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm build`
- Web:
  - `pnpm --filter web lint`
  - `pnpm --filter web typecheck`
  - `pnpm --filter web test`
  - `pnpm --filter web build`
- API:
  - `pnpm --filter api lint`
  - `pnpm --filter api typecheck`
  - `pnpm --filter api test`
  - `pnpm --filter api build`
- Mobile:
  - `pnpm --filter mobile lint`
  - `pnpm --filter mobile typecheck`
  - `pnpm --filter mobile build`

## Durable Sources Of Truth

- Repo instructions: `AGENTS.md`
- Sprint-scoped feature docs: `docs/sprints/*`
- Product direction: `docs/product/*`
- Architecture decisions: `docs/architecture/*`, `docs/backend/*`
- AI workflow rules: `docs/ai/*`

## Update This Document When

- a new workspace or shared package is introduced
- a package boundary changes
- deployment or persistence assumptions change
- a new guarded domain is added to the escalation policy
