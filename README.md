# toda-calendar

`toda-calendar` is a `pnpm` + Turborepo monorepo with:

- `apps/api`: Fastify JSON-store backend
- `apps/web`: Next.js support surface
- `apps/mobile`: Expo WebView shell
- `packages/app-core`: shared pure TypeScript helpers
- `packages/contracts`: shared API contracts
- `packages/ui`: shared UI primitives

## Quick start

Use Node.js `>=20` and `pnpm`.

```bash
pnpm install
pnpm dev
```

To run only the web app:

```bash
pnpm --filter web dev
```

## Repository map

- `apps/web`
  - Next.js App Router app and the current product entrypoint.
- `apps/api`
  - Fastify backend for calendar data.
- `apps/mobile`
  - Expo shell that loads the web app in a WebView.
- `packages/contracts`
  - Shared request/response schemas for web and API.
- `packages/app-core`
  - Shared pure TypeScript date and calendar helpers.
- `packages/ui`
  - Shared UI components, utilities, and global styles used by the app.
- `packages/eslint-config`
  - Shared ESLint presets.
- `packages/typescript-config`
  - Shared TypeScript presets.
- `AGENTS.md`
  - Repo-specific guidance for Codex and other coding agents.

## Common commands

Run these from the repository root.

```bash
pnpm dev
pnpm build
pnpm lint
pnpm format
pnpm typecheck
```

Workspace-scoped commands for the web app:

```bash
pnpm --filter web dev
pnpm --filter web build
pnpm --filter web lint
pnpm --filter web format
pnpm --filter web typecheck
```

## Adding shadcn/ui components

Run the generator from the repository root:

```bash
pnpm dlx shadcn@latest add button -c apps/web
```

Generated shared components land in `packages/ui/src/components`.

## Using shared components

Import shared components from the `@workspace/ui` package.

```tsx
import { Button } from "@workspace/ui/components/button";
```

## Notes for ChatGPT and Codex

- Start with `AGENTS.md` for repo-specific editing guidance.
- The current product surface is the web app, so most feature work should begin in `apps/web`.
- Shared UI work belongs in `packages/ui`.

## Integration Guide

- Local/dev/Expo verification steps live in [docs/architecture/mvp-integration-runbook.md](/Users/kimyoukwon/Desktop/toda-calendar/docs/architecture/mvp-integration-runbook.md).
