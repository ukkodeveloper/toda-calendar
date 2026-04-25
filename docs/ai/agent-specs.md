# AI Agent Specs

These are the durable role definitions for the `toda-calendar` workflow. Use them
with delegation when the user explicitly wants parallel agents, or adopt them
sequentially in one thread when delegation is unnecessary.

| Agent | Type / model / reasoning | Primary skills | Purpose |
| --- | --- | --- | --- |
| `orchestrator` | `default`, `gpt-5.4`, `high` | `toda-dev-pipeline`, `senior-project-owner` | Intake, planning, routing, stage gating, final task ownership |
| `context-explorer` | `explorer`, `gpt-5.4-mini`, `medium` | `toda-dev-pipeline` plus matching owner skill | Read-only repo exploration and context-pack creation |
| `frontend-builder` | `worker`, `gpt-5.4`, `medium-high` | `senior-frontend-toda` | Web UI and `packages/ui` implementation |
| `backend-builder` | `worker`, `gpt-5.4`, `medium-high` | `senior-backend-toda` | API, persistence, contracts, and backend shared logic |
| `rn-builder` | `worker`, `gpt-5.4`, `medium-high` | `senior-rn-toda` | Expo app, native UX, mobile integrations |
| `verifier` | `worker`, `gpt-5.4-mini`, `medium` | `toda-dev-pipeline`, reviewer skill as needed | Runs validation, summarizes failures, applies one bounded repair loop |
| `reviewer` | `default`, `gpt-5.4`, `high`, read-only | matching reviewer skill + `code-review-excellence` | Finds bugs, regressions, missing tests, and residual risk |
| `merger` | `default`, `gpt-5.4`, `high` | `toda-merge-operator`, `github:yeet`, `git-worktree-finish` | Landing, publishing, cleanup, and merge gating |

## Sprint Mode Additions

| Agent | Type / model / reasoning | Primary skills | Purpose |
| --- | --- | --- | --- |
| `sprint-orchestrator` | `default`, `gpt-5.4`, `high` | `toda-sprint-workflow`, `senior-project-owner`, `toda-lean-design-pack` as needed | Leads discovery, keeps the master sprint doc current, drives design/technical freeze, and routes delivery |
| `design-pack-builder` | `worker`, `gpt-5.4`, `high` | `toda-lean-design-pack`, `ux-flow-designer`, `toss-apple-mobile-design`, `ui-ux-pro-max` | Produces sprint-local flows, clickable wireframes, and visual/motion direction for ambiguous core paths, then updates `UX Decisions` for demo handoff |
| `demo-markup-builder` | `worker`, `gpt-5.4`, `medium` | `toda-demo-markup` | Builds the markup-only prototype in `apps/demo` or the sprint-local fallback |
| `preview-reporter` | `default`, `gpt-5.4-mini`, `medium` | `toda-preview-reporter` | Creates Vercel preview links, checks readiness, and returns a compact mobile review note |
| `mobile-feedback-curator` | `default`, `gpt-5.4`, `medium-high` | `toda-mobile-feedback-intake` | Converts mobile feedback into lean sprint doc updates and implementation deltas |

## Handoff Contracts

### Orchestrator -> Builder

Must include:

- goal and done criteria
- primary owner and why
- affected paths
- explicit non-goals
- validation commands
- escalation triggers

### Builder -> Verifier

Must include:

- changed files or path groups
- intended behavior change
- commands that must pass
- known weak spots or assumptions

### Verifier -> Reviewer

Must include:

- validation results
- remaining gaps
- high-risk files
- whether any commands could not be run

### Reviewer -> Merger

Must include:

- `P1/P2/P3` findings summary
- merge verdict
- unresolved risks
- whether guarded domains were touched

### Sprint Orchestrator -> Demo Builder

Must include:

- approved discovery and PRD-lite summary
- only the ambiguous core paths that still need to be made tangible
- target screen list capped at `3` to `5`
- the current demo review round (`1` or `2`)

### Sprint Orchestrator -> Design Pack Builder

Must include:

- approved discovery and PRD-lite summary
- the ambiguous core paths only, not the full feature map
- current non-goals and scope exclusions
- sprint-local artifact target path
- the specific demo risks the design pack must de-risk

### Design Pack Builder -> Demo Builder

Must include:

- approved screen inventory and wireframe links
- the interaction contract and important state changes
- visual/material direction and motion notes
- content tone guidance
- accessibility constraints and unresolved questions

## Role Notes

### Orchestrator

- Owns end-to-end flow.
- Chooses whether a task can stay sequential or benefits from explicit delegation.
- Updates durable context docs when repo reality changes.

### Context Explorer

- Never edits files.
- Reads only the minimum files needed to unblock planning or implementation.
- Produces focused context, not long repository tours.

### Builders

- Own implementation within their surface.
- Prefer small diffs and avoid broad cross-surface edits unless planned.
- Must respect `docs/ai/ownership-map.md`.

### Verifier

- Uses `docs/ai/verification-matrix.md`.
- May attempt one bounded fix and rerun commands.
- Escalates instead of repeatedly thrashing on the same failure.

### Reviewer

- Findings before summary.
- Correctness and regressions over style opinions.
- Read-only on the first pass.

### Merger

- Runs only when landing or publishing is in scope.
- Must obey `docs/ai/escalation-policy.md`.
- Stops on semantic conflicts, guarded domains, or incomplete validation.

### Sprint Orchestrator

- Owns the single sprint master document under `docs/sprints/<sprint-id>/`.
- Uses only two manual checkpoints by default: discovery alignment and demo review.
- Keeps design output lean and limited to ambiguous core paths.

### Design Pack Builder

- Owns the Lean Design Pack stage after discovery alignment.
- Keeps artifacts sprint-local and limited to the smallest set that unblocks demo work.
- Treats wireframes as clarification artifacts, not production UI.
- Updates `UX Decisions` with only the durable decisions that should survive into demo and technical freeze.
