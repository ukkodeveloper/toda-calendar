# Sprint Docs

Store feature work under sprint-local folders, but keep the durable document set
lean.

## Naming Convention

- sprint folder: `docs/sprints/<sprint-id>/`
- sprint id format: `sprint1`, `sprint2`, `sprint3`, ...
- feature slug: short stable name such as `oauth`, `calendar-sharing`
- master doc: `<sprint-id>-<feature-slug>.md`

## Standard Feature Files

For a feature like `oauth` in `sprint1`, use:

- `docs/sprints/sprint1/sprint1-oauth.md`

This master document should hold the full sprint trail through these sections:

- `Discovery`
- `PRD Lite`
- `UX Decisions`
- `Demo Review`
- `Technical Freeze`
- `Delivery Notes`
- `Durable Delta`

Do not create separate feature docs for:

- demo spec
- integration checklist
- context update

## Asset Location

Keep only the assets that add clarity:

```text
docs/sprints/sprint1/assets/oauth/
  diagrams/
  wireframes/
  demo/
```

Use sprint-local design assets only for ambiguous core paths. Do not document the
entire feature flow when the implementation path is already clear.

## Demo Location

Preferred location:

- `apps/web/app/design-system/examples/<sprint-key>/`

Each sprint demo should be reviewable at:

```text
/design-system/examples/sprint1-oauth
```

Demo rules:

- only `3` to `5` core screens or states
- include the feature entry point
- include the trigger that starts the feature
- include the path between screens
- include completion and the most important cancel, empty, or fallback state
- static or mocked data only
- no API calls, auth, persistence, or production business logic
- use shared web UI components and existing design tokens first
- keep each demo in a unique folder so parallel sprint branches can merge cleanly
- demo-to-design revision loop defaults to `1`, max `2`

Production code must not depend on sprint-local demo artifacts.

## Templates

Use this template when starting a sprint feature:

- `docs/sprints/templates/sprint-feature.md`
