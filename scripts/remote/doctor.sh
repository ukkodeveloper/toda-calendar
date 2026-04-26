#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT_DIR"

check_command() {
  local name="$1"

  if command -v "$name" >/dev/null 2>&1; then
    printf "OK   command %-10s %s\n" "$name" "$(command -v "$name")"
  else
    printf "FAIL command %-10s not found\n" "$name"
    return 1
  fi
}

print_pmset_value() {
  local key="$1"
  local value
  value="$(pmset -g custom 2>/dev/null | awk -v search="$key" '$1 == search { print $2 }' | tail -n 1)"

  if [[ -n "$value" ]]; then
    printf "%s=%s" "$key" "$value"
  else
    printf "%s=unknown" "$key"
  fi
}

printf "## toda-calendar remote sprint doctor\n"
printf "repo=%s\n" "$ROOT_DIR"

check_command node
check_command pnpm
check_command vercel
check_command git

printf "node=%s\n" "$(node -v)"
printf "pnpm=%s\n" "$(pnpm -v)"
printf "git_remote=%s\n" "$(git remote get-url origin 2>/dev/null || printf 'missing')"
printf "vercel_user=%s\n" "$(vercel whoami 2>/dev/null || printf 'unauthenticated')"

if ps -axo args | grep -E "/Applications/Codex.app/Contents/MacOS/Codex|/Applications/Codex.app/Contents/Resources/codex" | grep -v grep >/dev/null 2>&1; then
  printf "codex_app=running\n"
else
  printf "codex_app=not-running\n"
fi

printf "demo_workspace=%s\n" "$([[ -d apps/demo ]] && printf 'present' || printf 'absent-use-design-system-preview')"
printf "design_system_demo_surface=%s\n" "$([[ -d apps/web/app/design-system ]] && printf 'present' || printf 'missing')"
printf "dependencies=%s\n" "$([[ -d node_modules ]] && printf 'installed' || printf 'missing-run-pnpm-install')"
printf "power_ac=%s %s %s %s\n" \
  "$(print_pmset_value sleep)" \
  "$(print_pmset_value displaysleep)" \
  "$(print_pmset_value ttyskeepawake)" \
  "$(print_pmset_value womp)"

printf "notes=%s\n" "For remote sprint work, AC power should usually report sleep=0 displaysleep=0 ttyskeepawake=1 womp=1."
