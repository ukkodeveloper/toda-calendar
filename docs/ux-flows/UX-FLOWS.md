# UX Flows — Toda Calendar Reset

## Master Screen Map
- [Screen Map](./diagrams/screen-map.md)

## Screen Inventory
| Screen | Purpose | Wireframe | Use Cases |
| --- | --- | --- | --- |
| Month Timeline · Photo Mode | Default month entry with large title and photo-based global preview | [month-home-photo.html](./wireframes/month-home-photo.html) | UC-001, UC-002, UC-005, UC-006 |
| Month Timeline · Doodle Mode | Same month timeline with doodle-based global preview | [month-home-doodle.html](./wireframes/month-home-doodle.html) | UC-001, UC-002, UC-005, UC-006 |
| Month Timeline · Text Mode | Same month timeline with text-based global preview | [month-home-text.html](./wireframes/month-home-text.html) | UC-001, UC-002, UC-005, UC-006 |
| Preview Filter | Compact filter menu controlling the preview cycle | [preview-filter.html](./wireframes/preview-filter.html) | UC-005, UC-006 |
| Day Sheet · Photo Tab | Compact editor for image memories | [day-sheet-photo.html](./wireframes/day-sheet-photo.html) | UC-003, UC-004 |
| Day Sheet · Doodle Tab | Compact editor for sketch memories | [day-sheet-doodle.html](./wireframes/day-sheet-doodle.html) | UC-003, UC-004 |
| Day Sheet · Text Tab | Compact editor for written memories | [day-sheet-text.html](./wireframes/day-sheet-text.html) | UC-003, UC-004 |

## Use Case Diagrams
### UC-001: Orient Within the Month Timeline
- Flow: [flow](./diagrams/uc-001-orient-within-month-timeline/flow.md)
- States: [states](./diagrams/uc-001-orient-within-month-timeline/states.md)
- Sequence: [sequence](./diagrams/uc-001-orient-within-month-timeline/sequence.md)

### UC-002: Browse Earlier and Later Months Continuously
- Flow: [flow](./diagrams/uc-002-browse-earlier-and-later-months-continuously/flow.md)
- States: [states](./diagrams/uc-002-browse-earlier-and-later-months-continuously/states.md)
- Sequence: [sequence](./diagrams/uc-002-browse-earlier-and-later-months-continuously/sequence.md)

### UC-003: Open the Compact Day Sheet
- Flow: [flow](./diagrams/uc-003-open-the-compact-day-sheet/flow.md)
- States: [states](./diagrams/uc-003-open-the-compact-day-sheet/states.md)
- Sequence: [sequence](./diagrams/uc-003-open-the-compact-day-sheet/sequence.md)

### UC-004: Edit Day Content
- Flow: [flow](./diagrams/uc-004-edit-day-content/flow.md)
- States: [states](./diagrams/uc-004-edit-day-content/states.md)
- Sequence: [sequence](./diagrams/uc-004-edit-day-content/sequence.md)

### UC-005: Change the Global Visible Preview Mode
- Flow: [flow](./diagrams/uc-005-change-the-global-visible-preview-mode/flow.md)
- States: [states](./diagrams/uc-005-change-the-global-visible-preview-mode/states.md)
- Sequence: [sequence](./diagrams/uc-005-change-the-global-visible-preview-mode/sequence.md)

### UC-006: Configure the Preview Cycle Filter
- Flow: [flow](./diagrams/uc-006-configure-the-preview-cycle-filter/flow.md)
- States: [states](./diagrams/uc-006-configure-the-preview-cycle-filter/states.md)
- Sequence: [sequence](./diagrams/uc-006-configure-the-preview-cycle-filter/sequence.md)

### UC-007: Preserve Calm Accessibility
- Flow: [flow](./diagrams/uc-007-preserve-calm-accessibility/flow.md)
- States: [states](./diagrams/uc-007-preserve-calm-accessibility/states.md)
- Sequence: [sequence](./diagrams/uc-007-preserve-calm-accessibility/sequence.md)

## Clickable Prototype Links
| From Screen | Element | To Screen |
| --- | --- | --- |
| month-home-photo.html | Preview pill | month-home-doodle.html |
| month-home-photo.html | Filter | preview-filter.html |
| month-home-photo.html | Day cell | day-sheet-photo.html |
| month-home-doodle.html | Preview pill | month-home-text.html |
| month-home-doodle.html | Filter | preview-filter.html |
| month-home-doodle.html | Day cell | day-sheet-doodle.html |
| month-home-text.html | Preview pill | month-home-photo.html |
| month-home-text.html | Filter | preview-filter.html |
| month-home-text.html | Day cell | day-sheet-text.html |
| preview-filter.html | Apply Photo | month-home-photo.html |
| preview-filter.html | Apply Doodle | month-home-doodle.html |
| preview-filter.html | Apply Text | month-home-text.html |
| day-sheet-photo.html | Doodle tab | day-sheet-doodle.html |
| day-sheet-photo.html | Text tab | day-sheet-text.html |
| day-sheet-photo.html | Cancel / Done | month-home-photo.html |
| day-sheet-doodle.html | Photo tab | day-sheet-photo.html |
| day-sheet-doodle.html | Text tab | day-sheet-text.html |
| day-sheet-doodle.html | Cancel / Done | month-home-doodle.html |
| day-sheet-text.html | Photo tab | day-sheet-photo.html |
| day-sheet-text.html | Doodle tab | day-sheet-doodle.html |
| day-sheet-text.html | Cancel / Done | month-home-text.html |

## Navigation Patterns
- The month timeline is the app’s primary screen and primary navigation surface.
- The large title is the orientation anchor and changes with scroll rather than through separate page navigation.
- The preview mode behaves as a screen-wide state change, not a per-day drill-in.
- The filter is a compact contextual overlay rather than a full navigation destination in production; the wireframe uses a separate HTML screen to keep the prototype clickable without JavaScript.
- The day sheet is a modal editing layer over the month screen and returns directly to the same month context on `Cancel` or `Done`.
- Segment tabs inside the sheet are modeled as separate linked screens in the prototype, but will be implemented as in-place state changes in the product.

## Open Questions
- Should the in-content start of the next month be fully headerless, or should a tiny inline month marker appear at the transition boundary?
- Should the preview pill in the top bar always show the active mode name, or should it be icon-first with a label on expanded states only?
- Should the compact day sheet remember the last-edited tab for each date, or always open on the active global preview mode?
- At what viewport width should the web implementation stop mimicking a phone shell and adapt into a broader tablet layout?

## Next Handoff
- The wireframes are ready to drive the visual rebuild.
- The diagrams are ready to drive component boundaries and interaction wiring.
- The wireframes can also be exported to Figma later via Code to Canvas if you want a design-tool handoff.
