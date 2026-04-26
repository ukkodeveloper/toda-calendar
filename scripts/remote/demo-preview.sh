#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT_DIR"

PREVIEW_BRANCH="${DEMO_PREVIEW_BRANCH:-codex/demo-preview}"
BASE_BRANCH="${DEMO_PREVIEW_BASE_BRANCH:-main}"
STATE_FILE="${DISCORD_BRIDGE_STATE_FILE:-.data/discord-bridge-state.json}"

if [[ "${1:-}" == "--" ]]; then
  shift
fi

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  cat <<'EOF'
Usage: pnpm preview:demo [branch ...]

Merges active sprint demo branches into a local demo preview branch, copies
active worktree demo folders from Discord state when available, then creates a
Vercel preview deployment for the aggregated /design-system demos.

Environment:
  DEMO_PREVIEW_BRANCH       Defaults to codex/demo-preview
  DEMO_PREVIEW_BASE_BRANCH  Defaults to main
  DISCORD_BRIDGE_STATE_FILE Defaults to .data/discord-bridge-state.json
EOF
  exit 0
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Working tree is not clean. Commit, stash, or move changes before creating a demo preview." >&2
  exit 1
fi

branches=("$@")
state_entries=()

if [[ ${#branches[@]} -eq 0 && -f "$STATE_FILE" ]]; then
  mapfile -t state_entries < <(
    node -e '
const fs = require("node:fs")
const file = process.argv[1]
const state = JSON.parse(fs.readFileSync(file, "utf8"))
const threads = Object.values(state.threads || {})
  .filter((thread) => thread.status !== "DONE")
  .filter((thread) => thread.branchName && thread.sprintKey && thread.worktreePath)
for (const thread of threads) {
  console.log([thread.branchName, thread.sprintKey, thread.worktreePath].join("\t"))
}
' "$STATE_FILE"
  )

  for entry in "${state_entries[@]}"; do
    IFS=$'\t' read -r branch_name _sprint_key _worktree_path <<<"$entry"
    branches+=("$branch_name")
  done
fi

if [[ ${#branches[@]} -gt 0 ]]; then
  mapfile -t branches < <(printf "%s\n" "${branches[@]}" | awk 'NF && !seen[$0]++')
fi

if [[ ${#branches[@]} -eq 0 ]]; then
  echo "No demo branches were provided or found in $STATE_FILE." >&2
  exit 1
fi

if git show-ref --verify --quiet "refs/heads/$PREVIEW_BRANCH"; then
  git switch "$PREVIEW_BRANCH"
else
  git switch -c "$PREVIEW_BRANCH" "$BASE_BRANCH"
fi

for branch in "${branches[@]}"; do
  if ! git show-ref --verify --quiet "refs/heads/$branch"; then
    echo "Skipping missing local branch: $branch" >&2
    continue
  fi

  echo "Merging $branch into $PREVIEW_BRANCH..."
  if ! git merge --no-edit "$branch"; then
    echo "Merge stopped because git reported conflicts." >&2
    echo "Resolve the conflict or abort the merge, then rerun this command." >&2
    git status --short >&2
    exit 1
  fi
done

for entry in "${state_entries[@]}"; do
  IFS=$'\t' read -r _branch_name sprint_key worktree_path <<<"$entry"
  source_dir="$worktree_path/apps/web/app/design-system/examples/$sprint_key"
  target_dir="$ROOT_DIR/apps/web/app/design-system/examples/$sprint_key"

  if [[ ! -d "$source_dir" ]]; then
    continue
  fi

  echo "Copying demo folder from $source_dir..."
  rm -rf "$target_dir"
  mkdir -p "$target_dir"
  cp -R "$source_dir/." "$target_dir/"
done

if [[ -n "$(git status --porcelain -- apps/web/app/design-system/examples)" ]]; then
  git add apps/web/app/design-system/examples
  git commit -m "chore(demo): aggregate sprint demos"
fi

pnpm preview:vercel
