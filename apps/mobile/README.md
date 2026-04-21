# Toda Calendar Mobile

Expo Router based native client for `toda-calendar`.

## Commands

```bash
pnpm install
pnpm --filter mobile start
pnpm --filter mobile ios
pnpm --filter mobile android
pnpm --filter mobile web
pnpm --filter mobile lint
pnpm --filter mobile typecheck
```

## Structure

- `app/`
  Route files and stack layouts only
- `src/features`
  Screen composition and data wiring
- `src/components`
  Reusable native UI and calendar primitives
- `src/services`
  On-device repository and native integrations

This branch intentionally keeps storage local to the mobile workspace so we can
iterate on the native product surface without coupling to unfinished backend
work.
