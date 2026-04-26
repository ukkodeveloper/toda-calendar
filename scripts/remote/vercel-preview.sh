#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT_DIR"

if [[ "${1:-}" == "--" ]]; then
  shift
fi

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  cat <<'EOF'
Usage: pnpm preview:vercel [-- <extra vercel args>]

Creates a Vercel preview deployment for the current repository state, extracts
the preview URL, then waits for the URL to respond.
EOF
  exit 0
fi

if ! command -v vercel >/dev/null 2>&1; then
  echo "vercel CLI is not installed." >&2
  exit 1
fi

if ! vercel whoami >/dev/null 2>&1; then
  echo "vercel CLI is not authenticated." >&2
  exit 1
fi

TMP_OUTPUT="$(mktemp)"
trap 'rm -f "$TMP_OUTPUT"' EXIT

echo "Creating Vercel preview deployment..."
if ! vercel deploy --yes "$@" 2>&1 | tee "$TMP_OUTPUT"; then
  echo "Preview deployment failed." >&2
  exit 1
fi

PREVIEW_URL="$(grep -Eo 'https://[A-Za-z0-9._/-]+\.vercel\.app' "$TMP_OUTPUT" | tail -n 1)"

if [[ -z "$PREVIEW_URL" ]]; then
  echo "Could not determine preview URL from Vercel output." >&2
  exit 1
fi

READY="no"
for _ in $(seq 1 30); do
  HTTP_STATUS="$(curl -sS -o /dev/null -w '%{http_code}' -L "$PREVIEW_URL" 2>/dev/null || true)"

  if [[ "$HTTP_STATUS" =~ ^[234][0-9][0-9]$ ]]; then
    READY="yes"
    break
  fi

  sleep 2
done

printf "\n## preview summary\n"
printf "preview_url=%s\n" "$PREVIEW_URL"
printf "ready=%s\n" "$READY"
printf "next_step=%s\n" "Share this link in the sprint chat and request mobile feedback."
