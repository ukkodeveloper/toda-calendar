# Toda Sprint Workflow

Use this workflow for feature work that starts with product discussion and should
move from discovery to merge with the minimum durable documentation needed for
future AI context.

## Goal

Take a feature from product intent to merge with:

1. one sprint-local master document
2. two human checkpoints only
3. one demo review loop by default, two at most
4. implementation routed through `docs/ai/pipeline.md`

For smaller implementation tasks, stay in `docs/ai/pipeline.md`.

## When To Use Sprint Mode

Use sprint mode when the work:

- is a feature, not just a bounded code change
- needs product discussion before writing scope
- changes UX flow materially
- benefits from a fast markup-only prototype before production code
- may touch multiple surfaces or needs a technical freeze before implementation

## Sprint Document Convention

Every feature belongs to a sprint folder and keeps one master document:

```text
docs/sprints/
  sprint1/
    sprint1-oauth.md
    assets/
      oauth/
        diagrams/
        wireframes/
        demo/
```

Naming rules:

- sprint id: `sprint1`, `sprint2`, `sprint3`, ...
- feature slug: short lowercase kebab or flat slug such as `oauth`, `calendar-sharing`
- master doc: `<sprint-id>-<feature-slug>.md`

The master document should carry these sections:

- `Discovery`
- `PRD Lite`
- `UX Decisions`
- `Demo Review`
- `Technical Freeze`
- `Delivery Notes`
- `Durable Delta`

Use sprint-local assets only when they add clarity. Do not create separate PRD,
demo spec, integration checklist, or context update files.

## Stage Map

### 0. Discovery Workshop

This is the first human-heavy checkpoint.

Participants:

- you
- `senior-project-owner`
- `toda-sprint-workflow`

Output:

- `docs/sprints/<sprint-id>/<sprint-id>-<feature-slug>.md`

Rules:

- keep this as a real back-and-forth, not a one-shot spec dump
- capture service history, policy constraints, product direction, success criteria, and non-goals
- write the result into `Discovery` and `PRD Lite`

Gate:

- do not move forward until the problem framing and success criteria feel aligned

### 1. Lean Design Pack

Primary agent:

- `design-pack-builder`

Primary skill:

- `toda-lean-design-pack`

Underlying skill stack:

- `ux-flow-designer`
- `toss-apple-mobile-design`
- `ui-ux-pro-max`

Output:

- update `UX Decisions` in the master doc
- add sprint-local assets only for ambiguous core paths under `docs/sprints/<sprint-id>/assets/<feature-slug>/`

Rules:

- keep the design pack scoped to the smallest set of ambiguous paths that can unblock the demo
- do not map the entire feature if it is already obvious
- generate flows and wireframes only for the paths that are genuinely ambiguous, risky, or easy to misbuild
- prefer `3` to `5` screens unless the sprint explicitly needs a wider pass
- keep design output sprint-local unless it becomes a durable shared pattern

### 2. Demo Markup Review

This is the second human-heavy checkpoint.

Primary skill:

- `toda-demo-markup`

Preferred workspace:

- `apps/demo`

Fallback while the workspace does not exist:

- `docs/sprints/<sprint-id>/assets/<feature-slug>/demo/`

Rules:

- implement only the core `3` to `5` screens
- markup only
- no API calls
- no auth
- no persistence
- no production business logic
- use static or mocked data only
- allow one design revision loop by default and two at most

Output:

- demo files in the demo workspace or sprint-local fallback
- update `Demo Review` in the master doc with:
  - prototype location
  - included screens
  - feedback
  - revision count
  - approved changes

Gate:

- do not write the technical freeze until the demo pass is accepted

### 3. Technical Freeze

Participants:

- `senior-project-owner`
- relevant domain owners:
  - `senior-frontend-toda`
  - `senior-backend-toda`
  - `senior-rn-toda`

Output:

- update `Technical Freeze` in the master doc

Required content:

- implementation scope per surface
- shared contract boundaries
- sequence and dependencies
- validation plan
- merge constraints

Rules:

- this is the implementation contract
- after this stage, scope should not drift unless the escalation policy forces a revisit

### 4. Domain Delivery

Use `docs/ai/pipeline.md` per surface.

Rules:

- split work by ownership where possible
- keep frontend, backend, and mobile tasks parallel only when dependencies are explicit
- write rollout, verification, and reviewer outcomes into `Delivery Notes`

### 5. Integration And Merge

Primary skill:

- `toda-merge-operator`

Rules:

- no separate integration checklist doc
- merge only after the affected surfaces are verified together
- land only after reviewers have no unresolved `P1` or `P2`
- treat cross-surface integration as its own automated gate

### 6. Durable Delta

Rules:

- no separate context update doc
- record durable repo truth changes in `Durable Delta`
- update broader docs only when the feature changes long-lived reality:
  - `docs/ai/*`
  - `docs/architecture/*`
  - `docs/backend/*`
  - shared product docs when appropriate

## Approval Model

Only two manual checkpoints are expected:

1. discovery workshop alignment
2. demo markup review

Everything else should proceed automatically unless `docs/ai/escalation-policy.md`
requires a stop.

## Triggering

- default sprint entry:
  - `$toda-sprint-workflow sprint1 oauth 기능 스프린트로 진행해줘`
- implementation after technical freeze:
  - `$toda-dev-pipeline sprint1 oauth technical freeze 기준으로 web 작업 진행해줘`
- merge after implementation:
  - `$toda-merge-operator sprint1 oauth 작업을 main에 반영하고 정리해줘`
