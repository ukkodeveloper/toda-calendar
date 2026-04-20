# AGENTS.md

## Purpose
- Use this file as the first stop before editing the repository.
- Optimize for small, reviewable changes that keep the monorepo easy to navigate from ChatGPT, Codex, and mobile ChatGPT surfaces.

## Repository shape
- This repository is a `pnpm` + Turborepo monorepo.
- The active product surface is `apps/web`, a Next.js App Router app.
- Shared code and shared styling live under `packages/*`.

## Workspace map
- `apps/web/app`
  - App Router entrypoints.
  - Start here for page-level UI and layout changes.
- `apps/web/components`
  - App-specific React components.
  - Currently only contains the theme provider.
- `packages/ui/src/components`
  - Shared UI components exported through `@workspace/ui/components/*`.
- `packages/ui/src/styles/globals.css`
  - Shared design tokens and global styles consumed by the web app.
- `packages/eslint-config`
  - Shared ESLint presets for workspaces.
- `packages/typescript-config`
  - Shared TypeScript config presets.
- `package.json`, `pnpm-workspace.yaml`, `turbo.json`
  - Root orchestration files. Check these before changing scripts, package boundaries, or build flow.

## Runtime and package manager
- Use Node.js `>=20`.
- Use `pnpm` as the package manager.
- The repository declares `pnpm@9.15.9`.

## Quick start
Run commands from the repository root unless a task explicitly targets a single workspace.

### Install
```bash
pnpm install
```

### Start the app
```bash
pnpm dev
```

### Target only the web app
```bash
pnpm --filter web dev
```

## Common commands
### Root commands
```bash
pnpm dev
pnpm build
pnpm lint
pnpm format
pnpm typecheck
```

### Web app commands
```bash
pnpm --filter web dev
pnpm --filter web build
pnpm --filter web lint
pnpm --filter web format
pnpm --filter web typecheck
```

## How to route common tasks
- UI page change:
  - Inspect `apps/web/app/*` first.
- App-wide theme, typography, or global style change:
  - Inspect `apps/web/app/layout.tsx` and `packages/ui/src/styles/globals.css`.
- Shared component work:
  - Edit `packages/ui/src/components/*` and keep exports aligned with `packages/ui/package.json`.
- Tooling, lint, or TypeScript change:
  - Inspect `packages/eslint-config/*`, `packages/typescript-config/*`, and root config files before editing app code.

## Working expectations
- Prefer the narrowest workspace that satisfies the request.
- Preserve the existing monorepo structure unless a change clearly requires restructuring.
- Prefer workspace-local fixes over broad cross-repo refactors.
- Keep import paths and package boundaries aligned with the existing workspace layout.
- Avoid introducing new dependencies unless they are necessary for the requested task.
- Do not reformat unrelated files as part of a focused task.

## Validation
Before finishing a task that changes code, prefer the smallest relevant validation first.

- For changes isolated to `apps/web`, prefer:
  - `pnpm --filter web lint`
  - `pnpm --filter web typecheck`
- For shared packages or repo-wide changes, prefer:
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm build`

## Current project signals
These observations are based on the current branch and should be re-checked if the repo changes.

- Root scripts are orchestrated through Turborepo.
- `apps/web` uses Next.js App Router.
- Shared UI is published locally through the `@workspace/ui` workspace package.
- No dedicated automated test command is currently declared at the root.
- The current app is still scaffold-like, so product/domain behavior may need to be introduced rather than extended.

## Agent guidance
- Read this file before making edits.
- Start by locating the narrowest workspace affected by the task.
- When the request is ambiguous, inspect `apps/web` first because that is the current product surface.
- When updating scripts, config, or package relationships, inspect root files before editing workspace code.
- If a task mentions calendar product behavior but the implementation is not present yet, treat it as greenfield work inside the existing monorepo rather than searching for a hidden domain layer.
