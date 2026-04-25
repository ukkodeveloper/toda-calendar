#!/usr/bin/env bash

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$HOME/Library/pnpm:$HOME/.nvm/versions/node/v22.9.0/bin"

exec /opt/homebrew/bin/pnpm --filter discord-bridge exec tsx src/index.ts
