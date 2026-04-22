# AI Verification Matrix

Run the smallest relevant validation first, then widen only when shared boundaries or
runtime behavior justify it.

| Changed paths | Required commands | Add when risk is higher | Notes |
| --- | --- | --- | --- |
| `apps/web/**` | `pnpm --filter web lint`<br>`pnpm --filter web typecheck`<br>`pnpm --filter web test` | `pnpm --filter web build` | Add build when route wiring, shared UI, env usage, or bundle-sensitive behavior changed |
| `packages/ui/**` | `pnpm --filter @workspace/ui lint`<br>`pnpm --filter @workspace/ui typecheck`<br>`pnpm --filter web lint`<br>`pnpm --filter web typecheck` | `pnpm --filter web build` | Shared web UI must still prove the consuming web app builds |
| `apps/api/**` | `pnpm --filter api lint`<br>`pnpm --filter api typecheck`<br>`pnpm --filter api test` | `pnpm --filter api build` | Add build when entrypoints, persistence, config, or emitted server code changed |
| `packages/contracts/**` | `pnpm --filter @workspace/contracts lint`<br>`pnpm --filter @workspace/contracts typecheck`<br>`pnpm --filter api typecheck`<br>`pnpm --filter api test`<br>`pnpm --filter web typecheck`<br>`pnpm --filter mobile typecheck` | `pnpm --filter api build`<br>`pnpm --filter web build` | Contract changes ripple into all consumers |
| `packages/app-core/**` | `pnpm --filter @workspace/app-core lint`<br>`pnpm --filter @workspace/app-core typecheck`<br>`pnpm --filter api typecheck`<br>`pnpm --filter api test`<br>`pnpm --filter web typecheck`<br>`pnpm --filter mobile typecheck` | consumer builds as needed | Add consumer builds when render-time or runtime behavior depends on the changed helper |
| `apps/mobile/**` | `pnpm --filter mobile lint`<br>`pnpm --filter mobile typecheck` | `pnpm --filter mobile build` | Add build for route changes, app config, asset pipeline, or release-sensitive work |
| Root config and shared tooling | `pnpm lint`<br>`pnpm typecheck` | `pnpm build`<br>`pnpm test` | Use repo-wide commands when workspace boundaries or orchestration changed |

## Verification Loop Rules

- `Builder -> Verifier` may auto-loop at most two times.
- Re-run only the commands impacted by the fix before widening.
- If a required command is unavailable or fails due to environment limitations, say so explicitly and record the residual gap.
- After reviewer-driven fixes, re-run the affected commands before closing the task.
