# Remote Mobile Sprint Workflow

Use this document when a sprint starts on mobile and the always-on home desktop
does the implementation and preview work.

## Goal

Split the workflow into:

- mobile as the control plane
- desktop Codex as the execution plane

This keeps discovery and demo review easy on your phone while the desktop handles
doc updates, code changes, preview creation, verification, merge, and deploy.

## Current Repository Mode

- `apps/web` is the current previewable Next.js surface.
- `apps/demo` does not exist yet.
- Sprint demo previews should use:
  - `/design-system` for the full demo index
  - `/design-system/examples/<sprint-key>` for a specific sprint demo
  - a Vercel preview of the current demo branch or aggregated demo preview branch

## Desktop Setup

Use the home desktop as the execution machine.

Required state:

- ChatGPT / Codex desktop app signed in
- repo available locally
- GitHub remote configured
- Vercel CLI installed and authenticated
- AC power sleep disabled or effectively prevented

Validation command:

```bash
pnpm remote:doctor
```

The doctor should confirm:

- `node`, `pnpm`, `vercel`, `git` available
- `vercel_user` is authenticated
- `codex_app=running` when the app is open
- `power_ac` is suitable for always-on remote work

## Desktop Preview Flow

When the sprint reaches the demo or implementation preview step:

```bash
pnpm preview:vercel
```

This creates a Vercel preview deployment, extracts the URL, waits for readiness,
and prints a small summary.

When multiple sprint demos are running in parallel and should be checked
together:

```bash
pnpm preview:demo
```

This merges active sprint branches from the Discord state file into
`codex/demo-preview`, copies each active worktree's unique demo folder into that
preview branch, commits the aggregated demo folders, deploys that combined state,
and prints the preview URL.

Recommended usage:

1. build the sprint demo under `/design-system/examples/<sprint-key>`
2. run `pnpm preview:vercel` for one demo branch or `pnpm preview:demo` for the combined demo branch
3. send the reported URL back into the sprint chat
4. ask for mobile feedback on the entry point, flow, completion state, and visual consistency

## Mobile Setup

Recommended app:

- ChatGPT iOS or Android app

Recommended workspace:

- one Project per product or active sprint stream

Project instructions should say, in spirit:

- use `docs/ai/sprint-workflow.md` for feature work
- keep sprint docs lean
- only require manual confirmation at discovery and demo review
- route implementation through `toda-dev-pipeline`
- send preview links back with a short review checklist

## Mobile Operating Flow

1. Start the sprint from mobile in the project chat.
2. Run discovery and PRD-lite discussion there.
3. Let desktop Codex update the sprint master doc.
4. When demo is ready, receive the Vercel preview URL in chat.
5. Open the URL on mobile and leave feedback in plain language.
6. Let Codex convert that feedback into:
   - `PRD Lite` changes
   - `UX Decisions` changes
   - `Demo Review` notes
   - `Technical Freeze` updates when needed
7. After demo approval, let implementation, verification, merge, and deployment proceed automatically.

## Mobile Feedback Format

Short feedback is enough. The agent should normalize it.

Useful examples:

- `온보딩 문구가 너무 길어. 첫 화면은 더 가볍게.`
- `구글 로그인 버튼이 너무 아래에 있어. 첫 스크롤 안에서 보여야 해.`
- `이 흐름은 맞는데 취소 후 다시 돌아오는 경로가 어색해.`
- `이건 scope에서 빼고 v2로 넘겨도 될 듯.`

## Validation

### Desktop Validation

Run:

```bash
pnpm remote:doctor
```

Check:

- Vercel auth is valid
- Git remote is present
- AC sleep settings are suitable

### Preview Validation

Run:

```bash
pnpm preview:vercel
```

Check:

- a `preview_url` is printed
- `ready=yes` is returned or the URL still opens a few moments later

### Mobile Validation

Check:

- the preview URL opens on LTE or Wi-Fi
- the core `3` to `5` screens are reachable
- the feature entry point is visible
- the user can move from start to completion without missing context
- completion and cancel/fallback states return to the right location
- feedback can be sent back from the same project/thread
- after feedback, the sprint master doc and `Technical Freeze` are updated

## Role Additions

These helper roles improve remote sprint operation:

- `preview-reporter`
  - creates a preview URL
  - checks readiness
  - sends a compact mobile-ready summary
- `mobile-feedback-curator`
  - turns raw mobile feedback into sprint doc updates and implementation deltas

## What Is Already Ready Here

As of April 23, 2026 on this machine:

- `vercel` CLI is installed
- Vercel auth is available
- `origin` points to GitHub
- AC power sleep is configured for always-on style operation

That means the desktop side is close to ready right now. The remaining operating
habit is mainly to start the sprint from a mobile ChatGPT Project and keep the
desktop thread alive as the execution surface.
