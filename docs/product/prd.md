# PRD — Toda Calendar Apple-Aligned Month View Reset

## 1. Summary
Toda Calendar is resetting its month-view MVP around the interaction model of Apple Calendar on iPhone, while adapting the surface for personal journaling content instead of event density. The goal is not to imitate Apple Calendar pixel for pixel; the goal is to inherit the parts that make Apple Calendar feel native, calm, and obvious, then bend that structure toward Toda's core job: seeing and editing photo, doodle, and text memories directly from a month timeline.

This document supersedes the earlier MVP direction as the current source of truth for the month-view redesign.

## 2. Problem
The current implementation behaves like a polished demo rather than a first-class mobile calendar app. The main issues are structural, not cosmetic:

- The screen reads like a standalone card or showcase instead of an app-native month timeline.
- The header hierarchy doesn't match the user's mental model of Apple Calendar on iPhone.
- The month title does not feel anchored to the currently visible month in a trustworthy way.
- The month grid and day cells don't yet balance Apple-like calm with Toda's larger journaling previews.
- The bottom sheet contains too much explanation and too much control chrome for an edit surface that should feel lightweight.

Because Toda is intended to grow into a broader personal product with feed and reminders later, the redesign must solve the UX foundation now instead of layering visual polish on top of the wrong shell.

## 3. Product Goal
Design a month-first mobile calendar that feels immediately legible to iPhone users, supports vertical infinite browsing, and makes daily memory capture feel lightweight.

### Success Criteria
- A user immediately recognizes the screen as a mobile calendar app, not a marketing or demo page.
- The month title always reflects the month that currently owns the viewport.
- Month browsing feels continuous and calm in both directions.
- A day can be opened and edited with minimal UI overhead.
- Photo, doodle, and text previews fit the month grid without collapsing readability.
- The interface remains extensible enough to live alongside future feed and reminder features.

## 4. Apple Baseline
This redesign is grounded in Apple’s current public guidance and support materials.

### Official references
- Apple Support: Change how you view events in Calendar on iPhone
  https://support.apple.com/guide/iphone/change-how-you-view-events-iphfd1054569/ios
- Apple Developer: Customizing your app’s navigation bar
  https://developer.apple.com/documentation/UIKit/customizing-your-app-s-navigation-bar
- Apple Developer: `largeTitleDisplayMode`
  https://developer.apple.com/documentation/uikit/uinavigationitem/largetitledisplaymode-swift.property
- Apple Developer HIG: Sheets
  https://developer.apple.com/design/human-interface-guidelines/sheets

### What we adopt directly
- Month view is a scanning surface first, not a dense editor.
- The top navigation uses a large title that is tied to scroll behavior.
- The large title lives at the leading edge and transitions with the scrollable content.
- The interface uses minimal chrome and relies on spacing and hierarchy more than visible borders.
- A sheet is the correct pattern for a scoped task related to the current context.

### What we adapt for Toda
- Apple Calendar month cells are event-oriented and relatively compact; Toda month cells must be roomier because they carry media and note previews.
- Apple Calendar offers multiple month display styles like compact, stacked, and details; Toda replaces this with a single calm grid and a global preview mode cycle for `photo`, `doodle`, and `text`.
- Apple event editing is a large task flow; Toda editing must stay shorter and closer to a lightweight journal action.

### What we intentionally do not copy
- We do not replicate Apple's event creation flow.
- We do not replicate Apple's exact control set or toolbar structure where it conflicts with Toda's journaling purpose.
- We do not introduce extra list/detail subviews into the MVP just because Apple Calendar supports them.

## 5. Core Product Principles

### 5.1 Native first
Every primary behavior should feel like it belongs in an iPhone calendar before it feels unique to Toda.

### 5.2 Quiet by default
The default screen should feel calm even when it contains rich content. Empty states, borders, shadows, and helper copy must stay restrained.

### 5.3 One glance, then one tap
The month screen should answer two questions instantly:
- What month am I in?
- Which days have meaningful content?

Then it should support one clear next action:
- Tap a day to edit.

### 5.4 Toda differentiates through content, not chrome
The novelty is the day content model, not decorative UI.

## 6. Primary Screen Architecture

## 6.1 Screen composition
The month screen consists of five layers:

1. Safe-area-aware top navigation
2. Weekday row
3. Vertically scrolling month sections
4. Floating bottom sheet for day editing
5. Lightweight contextual controls for preview mode and filter

## 6.2 Top navigation
The top navigation is not a hero area. It is an app bar.

Required behavior:
- The month label is small, floating, and leading-aligned.
- The month label updates as the visible month changes.
- The month label transition is subtle and continuous with scroll.
- A `Today` action may float near the bottom edge instead of living in the header.
- The header should not introduce extra year labels or utility controls that compete with the month context.

Rejected behavior:
- Centered hero titles
- Marketing subcopy
- Surface cards around the entire app shell
- Redundant explanatory labels like `Month view MVP`

## 6.3 Weekday row
- A single weekday row is pinned directly below the top navigation.
- It remains visually quiet and secondary.
- The row does not repeat per month section.

## 6.4 Month sections
- The month timeline scrolls vertically and infinitely in both directions.
- Each month section is full width inside the mobile screen.
- Section spacing is minimal; the transition from one month to the next should feel like continuation, not separate cards.
- The large title communicates which month is active, so in-content month headers should be absent or extremely subdued.

## 6.5 Day cells
- The grid remains seven columns.
- Cell width follows the screen; cell height is fixed by token and never allowed to collapse to Apple Calendar's event-density size.
- The minimum cell height at a 375pt viewport should stay in an approximately `76-88px` band after final visual validation.
- The date label is a low-emphasis floating overlay, not the main focal point of the cell.
- Leading and trailing grid gaps should render as empty placeholders rather than greyed previous/next-month dates.
- The cell body is primarily a full-bleed preview surface.
- `Today` and `selected day` are communicated with border treatments, not filled date chips.

## 7. Interaction Model

## 7.1 Vertical browsing
- The month timeline is the primary navigation model.
- Scrolling up loads earlier months.
- Scrolling down loads later months.
- When the active month changes, the large title updates immediately enough to feel trustworthy.

## 7.2 Day tap
- Single tap on a day opens the day editor sheet.
- The tap target must remain reliable on touch devices.
- Touch feedback is required but subtle.

## 7.3 Global preview cycle
- The visible preview control in the top bar is the primary way to cycle the active preview mode on touch devices.
- Cycling preview mode must never delay the primary day-open tap interaction.
- Active preview modes are limited to `photo`, `doodle`, and `text`.
- If a day does not contain content for the active mode, the cell stays quiet rather than falling back to another type.
- The mode change should behave like a surface-level swap first, then cell content should reveal second.

## 7.4 Preview filter
- The trailing filter control defines which modes participate in the global cycle.
- At least one format must always remain enabled.
- The filter must be compact and menu-like, not a large instructional panel.

## 7.5 Explicit accessibility alternative
- The app must not rely on a hidden gesture for preview mode changes.
- A compact visible control in the top bar cycles the active preview mode directly.
- Keyboard and assistive technologies must be able to reach the same behavior without gesture discovery.

## 8. Bottom Sheet Strategy

## 8.1 Sheet purpose
The sheet is only for scoped day editing. It should never feel like leaving the month view.

## 8.2 Sheet content rules
- One sheet at a time only.
- `Cancel` and `Done` are the primary sheet-level controls.
- Stage 1 uses a segmented control for `Photo`, `Doodle`, `Text`.
- Stage 2 removes the segmented control and exposes all three inputs at once.
- No extra explainer copy above the segment control.
- No separate preview picker section.
- Copy inside the sheet should be extremely sparse.

## 8.3 Sheet size and density
- Stage 1 sheet height is fixed for the month-view MVP and must remain visually stable while the user switches the segmented control.
- Switching between `Photo`, `Doodle`, and `Text` must never cause the sheet height to grow or shrink.
- Internal sheet scrolling is not allowed in the month-view MVP. The editor panes must fit within the fixed frame.
- Large empty-state paragraphs are not allowed.
- Fields must stay touch-friendly and safe-area aware.
- The sheet floats with visible margins on all sides instead of attaching edge-to-edge.
- Dragging downward from Stage 1 dismisses the sheet.
- Dragging upward from Stage 1 expands into Stage 2.
- Dragging downward from Stage 2 collapses back to Stage 1.
- Releasing a partial drag should settle the sheet back to its current stage.
- While sketch input is active, the sheet must not move.

## 9. Visual System

## 9.1 Typography
- Use the existing system stack to approximate SF Pro behavior on the web.
- Large month title should map to iOS large-title rhythm, not a custom display font.
- Body and control text should stay in a `16px`-first system for readability.
- Avoid stylized editorial fonts.

## 9.2 Color
- Neutral system-like light surfaces are the baseline.
- One Apple-like accent color should anchor interactive state.
- The accent should behave like system emphasis, not brand decoration.
- Dark mode is supported, but light mode correctness is the primary reference for this redesign pass.

## 9.3 Shape and elevation
- Roundness should feel iOS-native, not soft-card-productized.
- Borders stay faint.
- Shadows are minimal and reserved for overlay elements like the sheet or popover.
- Blur is allowed only when it communicates layered context.

## 10. Motion Rules
- Motion must explain hierarchy, not showcase animation.
- Month title changes use subtle crossfade or vertical continuity only.
- Day press uses minimal scale or opacity response.
- Preview replacement uses crossfade with transform-only animation.
- Sheet presentation uses spring motion with restrained amplitude.
- Reduced-motion mode removes flourish while preserving state change visibility.

Target guidance from `ui-ux-pro-max`:
- Micro-interactions in the `150-300ms` range
- `transform` and `opacity` only
- Respect `prefers-reduced-motion`

## 11. Accessibility and Interaction Gates
These are mandatory, not optional polish items.

- All primary touch targets must be at least `44x44`.
- Keep at least `8px` between adjacent compact actions.
- Respect safe areas at top and bottom.
- Keep body text in the `14-16px+` readable band; do not push critical text below `12px`.
- Provide visible focus treatment for keyboard users.
- Avoid gesture conflicts with vertical scroll.
- Provide a non-gesture path for preview-mode changes.
- Support dynamic text growth without breaking the top bar or sheet controls.

## 12. Architecture Implications
We should preserve the current domain and state foundation where it already supports the product well:

- Keep the feature-first folder structure.
- Keep seed JSON + Zod validation.
- Keep reducer-based client state.
- Keep infinite month range generation as a core mechanic.

We should treat the following as replaceable:
- App shell
- Header
- Month grid presentation
- Day cell presentation
- Filter popover presentation
- Day editor sheet presentation

## 13. Scope for This Reset

### In scope
- iPhone-style month screen shell
- Infinite vertical month browsing
- Scroll-linked month title behavior
- Global preview cycling
- Compact day sheet
- Updated flows and wireframes

### Out of scope
- Week view
- Day view
- Persistence backend
- Multi-user or collaboration
- Feed and reminders implementation

## 14. Design QA Checklist
- Does the first screen read as an app, not a demo?
- Is the month title clearly leading, left aligned, and scroll-trustworthy?
- Are month sections continuous instead of card-stacked?
- Are day cells large enough for Toda content without feeling crowded?
- Is the bottom sheet shorter and calmer than the current version?
- Is every extra word on screen earning its place?
- Would an iPhone user understand the primary interaction without instruction copy?

## 15. Next Deliverables
After approval of this PRD reset:

1. Rewrite use cases around the Apple-aligned interaction model
2. Generate screen map and per-use-case Mermaid flows
3. Generate clickable HTML wireframes
4. Use those artifacts to drive the actual UI rebuild
