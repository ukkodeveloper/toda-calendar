# Toda AI Development Pipeline

This is the default workflow for development work in `toda-calendar`.

## Entry Modes

- Task mode
  - Use this document directly for bounded implementation, fix, refactor, and review work.
- Sprint mode
  - For feature development that starts from product planning and design, use `docs/ai/sprint-workflow.md` first.
  - Sprint mode wraps this pipeline and reaches this document again at the domain-implementation stage.

## Principles

- Start from the narrowest affected workspace.
- Use one primary implementation owner per task.
- Keep builder, verifier, and reviewer responsibilities separate.
- Persist only durable context in `docs/ai/*`; keep task-local notes lightweight unless the user asks to save them.

## Stages

### 1. Intake

Summarize the request into a `Task Brief`:

- goal
- constraints
- done criteria
- out of scope
- key risks
- likely primary owner
- likely validation

Use the template in `docs/ai/templates/task-brief.md` when you want to persist it.

### 2. Planner

Break the task into a small execution plan:

- work items
- affected paths
- owner routing
- validation commands
- escalation triggers

Use `docs/ai/ownership-map.md` and `docs/ai/verification-matrix.md`.

### 3. Context Builder

Gather only the files and docs needed for the chosen path:

- `AGENTS.md`
- `docs/ai/repo-context.md`
- `docs/ai/ownership-map.md`
- `docs/ai/verification-matrix.md`
- domain docs under `docs/product/*`, `docs/architecture/*`, or `docs/backend/*`
- relevant owner skill and reviewer skill

Use the template in `docs/ai/templates/context-pack.md` when you need a durable context handoff.

### 4. Builder

Implement with the primary owner skill:

- `senior-frontend-toda`
- `senior-backend-toda`
- `senior-rn-toda`

Prefer small, reviewable diffs and keep shared-boundary changes explicit.

For sprint-scoped feature work, the builder stage starts only after:

- discovery workshop alignment is complete
- lean UX decisions have clarified the ambiguous core paths
- the runnable design-system demo review has clarified the entry point, core interaction, and completion path
- the technical freeze is written

### 5. Verifier

Run the minimum relevant commands from `docs/ai/verification-matrix.md`.

- Allow at most two automatic build/fix/verify loops.
- Summarize failures by root cause, not raw log volume.
- If a fix changes scope, refresh the plan before continuing.

### 6. Reviewer

Run a separate review pass after verification:

- use a reviewer skill that matches the changed surface
- findings first, ordered by severity
- no edits during the first review pass
- resolve `P1` and `P2` items before landing

Use `docs/ai/templates/review-report.md` for durable reports.

### 7. Merger

Run this stage only when the task explicitly includes landing, publishing, or worktree cleanup.

Preconditions:

- intended scope is clear
- required verification passed
- reviewer has no unresolved `P1` or `P2`
- no unresolved escalation-policy blockers remain

Use `toda-merge-operator` together with `docs/ai/escalation-policy.md`.

## Artifact Rules

- Durable repo facts belong in `docs/ai/*`.
- Architecture or product decisions belong in `docs/architecture/*`, `docs/backend/*`, or `docs/product/*`.
- Task-local briefs, plans, and reviews may stay in the conversation unless the user asks to persist them.

## Routing Rules

- `apps/web/**` only: frontend owner
- `apps/api/**` only: backend owner
- `apps/mobile/**` only: RN owner
- `packages/contracts/**`, `packages/app-core/**`, or root config: shared-workflow orchestration first, then downstream verification

## Default Looping Rules

- `Builder -> Verifier`: maximum two loops
- `Reviewer -> Builder`: fix only the reviewed findings, then re-run affected validation
- `Merger`: never proceed past a blocker silently
