# Use Cases — Apple-Aligned Reset

These use cases are rewritten to match the reset PRD in [docs/product/prd.md](../product/prd.md). They replace the earlier month-view interpretation and are intended for approval before diagrams and wireframes are regenerated.

## UC-001 — Orient Within the Month Timeline
- **Actors**: User
- **Preconditions**: Calendar app has loaded validated seed data.
- **Main Flow**:
  1. User opens Toda Calendar.
  2. System shows a large leading month title, weekday row, and the current month grid.
  3. User scans the month title and visible cells to understand where they are.
  4. User scrolls vertically through the month timeline.
  5. System updates the active month title when a new month takes ownership of the viewport.
- **Alternative Flows**:
  - If visible days have no content for the current preview mode, cells remain present with quiet placeholders.
  - If the user taps `Today`, the timeline scrolls back to the current month.
- **Postconditions**: User remains oriented in the infinite month timeline without losing context.

## UC-002 — Browse Earlier and Later Months Continuously
- **Actors**: User, System
- **Preconditions**: The month timeline is visible and scrollable.
- **Main Flow**:
  1. User scrolls toward the top or bottom of the visible month list.
  2. System detects approach to the current range boundary.
  3. System prepends or appends a new chunk of months.
  4. System preserves perceived scroll continuity.
- **Alternative Flows**:
  - If additional months are loading, the current viewport remains stable.
- **Postconditions**: The user can continue browsing in either direction without hitting a hard stop.

## UC-003 — Open the Compact Day Sheet
- **Actors**: User
- **Preconditions**: A day cell is visible in the month grid.
- **Main Flow**:
  1. User single taps a day cell.
  2. System opens a compact bottom sheet for that date.
  3. System shows only the essential editing controls: date context, segmented content tabs, and `Cancel` / `Done`.
  4. User dismisses or completes the task and returns to the month context.
- **Alternative Flows**:
  - If the user taps outside the sheet or drags it down, the sheet dismisses.
  - If the user has no content yet, the sheet opens in a clean empty editor state.
- **Postconditions**: The user edits a day without feeling like they navigated away from the month screen.

## UC-004 — Edit Day Content
- **Actors**: User
- **Preconditions**: The compact day sheet is open.
- **Main Flow**:
  1. User selects `Photo`, `Doodle`, or `Text`.
  2. User adds or edits content in the chosen mode.
  3. User taps `Done`.
  4. System updates the in-session day record.
  5. System reflects the saved content back in the month grid when the active preview mode matches.
- **Alternative Flows**:
  - If the user clears the current content type, the corresponding slot becomes empty.
  - If all slots become empty, the record is removed from session state.
- **Postconditions**: The selected date reflects the user's latest memory content.

## UC-005 — Change the Global Visible Preview Mode
- **Actors**: User
- **Preconditions**: At least one preview type is enabled in the filter.
- **Main Flow**:
  1. User double taps within the month grid or taps the visible preview control in the top bar.
  2. System reads the enabled preview types.
  3. System advances the global active preview mode to the next enabled type.
  4. System updates visible day cells to show only that preview type where content exists.
- **Alternative Flows**:
  - If only one preview type is enabled, the active mode remains unchanged.
  - If a given day has no content for the active mode, the cell stays quiet instead of falling back to another type.
- **Postconditions**: The entire month view shifts to a consistent preview mode.

## UC-006 — Configure the Preview Cycle Filter
- **Actors**: User
- **Preconditions**: The top-right filter control is visible.
- **Main Flow**:
  1. User opens the filter menu.
  2. User toggles `Photo`, `Doodle`, and `Text` inclusion.
  3. System updates the set of preview types eligible for global cycling.
  4. If needed, system repairs the active preview mode to the next enabled type.
- **Alternative Flows**:
  - If the user attempts to disable the final remaining format, the system rejects that action.
- **Postconditions**: Preview cycling and visible content reflect the user's chosen filter.

## UC-007 — Preserve Calm Accessibility
- **Actors**: User, Assistive Technology
- **Preconditions**: The month screen or day sheet is visible.
- **Main Flow**:
  1. User interacts via touch, keyboard, or assistive technology.
  2. System provides visible focus states and minimum-size touch targets.
  3. If reduced motion is enabled, system simplifies transitions while preserving clarity.
  4. If text size increases, system keeps controls legible without overlapping or truncating critical content.
- **Alternative Flows**:
  - If the user cannot discover the double-tap gesture, the top-bar preview control provides an explicit alternative.
- **Postconditions**: The core calendar flow remains usable without relying on hidden gestures or decorative motion.
