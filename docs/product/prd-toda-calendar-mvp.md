# PRD — Toda Calendar MVP

## 1. Summary
Toda Calendar MVP is an English-only month calendar for personal journaling. It follows the mental model of Apple Calendar for navigation, but each day can hold a photo, a doodle, and a short text note, with a roomy month grid that keeps content readable.

## 2. Contacts
| Name | Role | Comment |
| --- | --- | --- |
| Product owner | Vision | Wants a calendar-first MVP that can grow into a broader personal life service. |
| Design/Engineering | Implementation | Needs Apple-like quality, calm motion, and a structure that can support feed and reminders later. |

## 3. Background
The product starts as a calendar, but it is intended to evolve into a wider personal service with adjacent surfaces such as feed and reminders. The MVP must therefore avoid a dead-end page implementation and instead establish a feature-first frontend architecture, a reusable interaction system, and documentation that can be updated as the product grows.

The first release is a proof of concept for a single user. There is no backend yet, so the app starts from a read-only JSON seed and keeps edits in session memory only.

## 4. Objective
Create a polished month-view journaling calendar that feels native, calm, and intentionally animated on mobile-first web.

### Why it matters
- Proves the calendar interaction model before backend investment.
- Establishes reusable frontend foundations for future feature siblings.
- Tests whether richer day content can coexist with a month grid without collapsing cell readability.

### Key Results
- Users can scroll continuously through months in both directions without losing orientation.
- The sticky month title updates to the currently visible month as the user scrolls.
- Users can open a floating bottom sheet from any day cell and create or edit photo, doodle, and text content in one place.
- Users can cycle the global visible preview mode from a visible top-bar control without losing touch responsiveness on day cells.
- The month grid remains readable at mobile widths, with stable cell height and clear preview hierarchy.

## 5. Market Segment(s)
- Primary segment: a single personal user who wants to capture light daily memories in a calendar surface instead of a dense note list.
- Constraint: this is a personal MVP, so no collaboration, sync, auth, or backend reliability work is in scope.
- Platform focus: mobile-first web with iPhone-like ergonomics, while still behaving well on desktop.

## 6. Value Proposition(s)
- Combines a familiar calendar interaction model with richer, more visual day content.
- Preserves the calm and predictable feel of Apple-style navigation while making cells larger and more readable for journaling previews.
- Uses motion to explain hierarchy: tap opens depth, the preview control cycles the whole calendar representation, and the filter defines what the cycle may show.

## 7. Solution

### 7.1 UX and prototypes
- Primary screen: continuous month list with roomy 7-column month grids inside a full-width mobile shell.
- Day interaction:
  - Single tap opens a floating bottom sheet.
  - The top-bar preview control cycles the global preview format within the current filter.
- Sticky navigation bar shows the currently visible month and a compact control for the active preview mode.
- Top-right action opens a format filter popover that controls which formats are eligible for preview cycling.
- Supporting docs live in `docs/ux-flows/`.

### 7.2 Key features
- Continuous month scrolling with chunked append/prepend loading.
- Day content model with one day record and optional `photo`, `doodle`, `text` slots.
- Compact bottom sheet editor with explicit format tabs and lightweight `Cancel` / `Done` actions.
- Session-only editing after JSON seed initialization.

### 7.3 Content rules
- Photo preview token: `4:5` portrait-first crop inside the day preview area.
- Doodle preview token: `1:1` square sketch card scaled to fit the preview area.
- Text preview token: maximum `3` lines with medium-density leading.
- Empty state policy: if a day has no visible content for the active filter, show a soft placeholder instead of collapsing the cell.

### 7.4 Technology
- Next.js App Router in `apps/web`.
- Feature-first app code under `apps/web/features/calendar`.
- Reusable primitives and motion presets in `packages/ui`.
- Framer Motion for sheet, popover, cell feedback, and section entrance transitions.
- Zod for JSON seed validation.

### 7.5 Assumptions
- Locale is `en-US` for copy and date formatting.
- A day record may contain multiple filled slots, but the grid shows only one preview at a time.
- Refresh resets the app to the JSON seed plus any local file references still held in the current memory session are discarded.

## 8. Release
### MVP
- Month view only.
- English only.
- JSON seed + in-session editing.
- Photo, doodle, and text editing inside a floating sheet.
- Global format filter and explicit preview cycling.

### Later releases
- Persistence backend and user accounts.
- Feed surface as a sibling feature.
- Reminders and scheduling primitives.
- Internationalization, more calendar views, and cross-surface search.
