# Calendar Frontend Foundation

## Purpose
This document defines the frontend architecture for the calendar MVP and sets rules for future sibling features such as feed and reminders.

## Feature boundaries
- `apps/web/app/*`: route shell, metadata, and page-level composition only.
- `apps/web/features/calendar/*`: calendar-specific model, seed data, state, hooks, and components.
- `packages/ui/*`: reusable UI primitives, shared surface styling, and motion presets that can serve more than one future feature.

## Calendar feature shape
```text
apps/web/features/calendar/
├── components
├── data
├── hooks
├── model
├── utils
└── __tests__
```

## State model
- Seed is loaded once from a read-only JSON file.
- Zod validation converts seed content into typed records.
- Session state lives on the client through a reducer-style state container.
- The reducer owns a global `activePreviewType` plus a `previewFilter` that constrains the cycle order.
- Persisted backend concerns are intentionally absent from the MVP API surface.

## Day record model
- A day record is keyed by ISO date.
- Each record may contain `photo`, `doodle`, and `text` slots at the same time.
- `currentPreviewType` is retained as record-local editing metadata and last-edited tab memory.
- Visible preview is resolved from the global `activePreviewType` plus the current filter, rather than mutating a record whenever the filter changes.

## UI architecture
- Month sections are computed from a range utility, not from hard-coded 12-month arrays.
- The month scroll container owns section refs so the sticky header can derive the currently visible month.
- The month grid uses placeholder blanks instead of repeating adjacent-month dates.
- The calendar owns month-specific layout rules, preview algorithms, and the staged day-editor sheet behavior.
- Shared UI takes only primitive responsibilities: motion presets, icon button, surface.

## Future expansion rules
- Add new product surfaces as sibling feature folders under `apps/web/features/`.
- Promote code to `packages/ui` only after at least two features need the same primitive behavior.
- Keep product logic out of shared packages.
- Keep docs in `docs/` updated whenever behavior, state shape, or interaction rules change.
