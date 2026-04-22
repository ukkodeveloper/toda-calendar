# Development Context

Last updated: 2026-04-23

## Current Product Focus

- The active product surface is `apps/web`, a month-first calendar experience built with Next.js App Router.
- `apps/api` serves calendar data and is part of the deployed Vercel runtime path.
- `main` is the shipping branch for the current web experience and production deploys to `toda-calendar.vercel.app`.

## Recent Development Changes

### Day Editor And Bottom Sheet Touch Fixes

- The day editor sheet now blocks interaction with the calendar layer behind it while open.
- The closed journal dock no longer lets a vertical drag scroll the calendar underneath.
- The core lesson from this bug was that `z-index` alone does not stop mobile browser pan behavior. The interactive surface also needs explicit `touch-action` control when the overlay should own the gesture.

### Doodle Touch Input Fix

- Touch drawing in the doodle editor was adjusted so strokes no longer break into dot-like fragments on mobile.
- The input path now keeps the active stroke in refs during touch movement, uses coalesced pointer samples when available, and commits on pointer capture end instead of prematurely ending on leave.
- Mouse drawing was already healthy, so the fix was focused on the touch-specific pointer flow instead of changing the drawing model broadly.

### Supporting Repository Changes Landed Around The Same Time

- Added April calendar example media for richer seeded content.
- Added the OAuth login MVP specification at [mvp-oauth-login-spec.md](/Users/kimyoukwon/Desktop/toda-calendar/docs/architecture/mvp-oauth-login-spec.md).
- Web deployment continues to use the Vercel runtime path that also serves the API surface.

## Validation Notes

- For web interaction fixes, the smallest useful checks were:
  - `pnpm --filter web lint`
  - `pnpm --filter web build`
  - `pnpm --filter web typecheck`
- In a fresh local state, `pnpm --filter web typecheck` can fail before `.next/types` exists. Running `pnpm --filter web build` first generates the expected Next.js type files.

## Deployment Context

- Production alias: [toda-calendar.vercel.app](https://toda-calendar.vercel.app)
- Recent fixes were pushed directly on `main` and then deployed to production after local validation.

## Useful Debugging Reminders

- When a sheet or dock appears visually above the calendar, verify both hit-testing and browser gesture behavior.
- If mobile-only drawing regresses again, inspect `pointercapture`, `getCoalescedEvents()`, and whether any overlay action UI is stealing touch during an active stroke.
