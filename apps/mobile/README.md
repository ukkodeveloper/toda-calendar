# Toda Calendar Mobile

Expo shell app for `toda-calendar`.

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
- `src/features/web-shell`
  WebView shell that loads the web support surface
- `src/components`, `src/features`, `src/services`
  Earlier native-first calendar work kept in place for future follow-up

The current integration path treats mobile as a React Native shell around the
web app, so `EXPO_PUBLIC_WEB_APP_URL` is the main switch for local/dev preview
flows.
