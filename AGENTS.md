# AGENTS.md

## Project overview
- This repository is a `pnpm` + Turborepo monorepo.
- The primary application currently appears to be `apps/web`, a Next.js app.
- Shared packages live under `packages/*`.

## Runtime and package manager
- Use Node.js `>=20`.
- Use `pnpm` as the package manager.
- The repository declares `pnpm@9.15.9`.

## Common commands
Run commands from the repository root unless a task explicitly targets a workspace.

### Install
```bash
pnpm install
```

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

## Working expectations
- Prefer small, reviewable diffs.
- Preserve the existing monorepo structure unless a change clearly requires restructuring.
- Prefer workspace-local fixes over broad cross-repo refactors.
- Keep import paths and package boundaries aligned with the existing workspace layout.
- Avoid introducing new dependencies unless they are necessary for the requested task.

## Validation
Before finishing a task that changes code, prefer the smallest relevant validation first.

- For changes isolated to `apps/web`, prefer:
  - `pnpm --filter web lint`
  - `pnpm --filter web typecheck`
- For broader repository changes, prefer:
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm build`

## Notes for Codex and other coding agents
- Read this file before making edits.
- Start by locating the narrowest workspace affected by the task.
- If the request is UI-focused, inspect `apps/web` first.
- If the request touches shared components or shared configuration, inspect `packages/*` and workspace config files before editing.
- When updating scripts, config, or package relationships, check root files such as `package.json`, `pnpm-workspace.yaml`, and `turbo.json` first.

## Current repository signals
These observations are based on the current repository files and should be re-checked if the repo changes.

- Root scripts are orchestrated through Turborepo.
- `apps/web` uses Next.js.
- No dedicated test command is currently declared at the root `package.json`.
- Formatting is available, but do not reformat unrelated files unless the task calls for it.
