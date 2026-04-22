# User Stories — Calendar MVP

## Story 1 — Scroll Through Months
**As a** personal user  
**I want to** scroll up and down through month sections  
**So that** I can browse my timeline naturally.

### Acceptance Criteria
- Given the calendar is open
- When I scroll near the bottom sentinel
- Then the app appends the next chunk of month sections without replacing the current view.

- Given the calendar is open
- When I scroll near the top sentinel
- Then the app prepends the previous chunk of month sections and preserves my visual scroll position.

- Given the calendar is open
- When a different month becomes dominant in the viewport
- Then the sticky top title updates to that month and year.

## Story 2 — Open a Day Editor
**As a** personal user  
**I want to** tap a day cell  
**So that** I can edit the content for that date.

### Acceptance Criteria
- Given I single tap a day cell
- When the interaction stays within the mobile tap tolerance
- Then a floating bottom sheet opens for that date.

- Given the bottom sheet is open
- When I dismiss it by backdrop tap, drag, or close action
- Then the sheet exits smoothly and the month grid remains in place.

## Story 3 — Edit Photo Content
**As a** personal user  
**I want to** attach a photo to a date  
**So that** the day can show a visual memory.

### Acceptance Criteria
- Given the day sheet is open on the Photo tab
- When I choose an image file
- Then the draft preview updates immediately in the sheet.

- Given I save the sheet
- When the photo slot contains content
- Then the day record stores the photo in session memory and the grid preview can use it.

## Story 4 — Edit Doodle Content
**As a** personal user  
**I want to** draw a quick doodle for a date  
**So that** I can capture something faster than text.

### Acceptance Criteria
- Given the day sheet is open on the Doodle tab
- When I draw on the canvas
- Then strokes are added to the draft preview in real time.

- Given the doodle has strokes
- When I save the sheet
- Then the grid can render the doodle preview for that date.

## Story 5 — Edit Text Content
**As a** personal user  
**I want to** write a short note for a date  
**So that** I can keep a lightweight journal entry.

### Acceptance Criteria
- Given the day sheet is open on the Text tab
- When I type a note
- Then the draft preview updates inside the sheet.

- Given the note is saved
- When I return to the month grid
- Then the cell shows up to three lines of text preview when text is the visible format.

## Story 6 — Change the Visible Preview
**As a** personal user  
**I want to** tap the visible preview control  
**So that** I can cycle the visible preview mode for the whole month view.

### Acceptance Criteria
- Given the current format filter allows more than one preview type
- When I tap the preview control
- Then the active preview mode advances to the next enabled format.

- Given the active preview mode changes
- When the grid re-renders
- Then each day shows the newly active format if it has data for that format, or a quiet placeholder if it does not.

## Story 7 — Control the Preview Filter
**As a** personal user  
**I want to** control which formats are available to preview cycling  
**So that** I can focus the grid on the representations I care about.

### Acceptance Criteria
- Given the top-right filter button is visible
- When I open the filter popover
- Then I can toggle Photo, Doodle, and Text on or off.

- Given the filter changes
- When the active preview mode is no longer allowed
- Then the app resolves to the next enabled preview mode without mutating the underlying day records.

- Given the filter is open
- When I try to disable the last remaining enabled format
- Then the UI prevents that action so at least one format stays enabled.

## Story 8 — Visible Preview Control Outside the Gesture
**As a** personal user  
**I want to** change the visible preview without relying on a hidden gesture  
**So that** I have an accessible mobile-first path for the same action.

### Acceptance Criteria
- Given the top navigation is visible
- When I tap the active preview control
- Then the calendar advances to the next enabled preview mode.

## Story 9 — Reduced Motion Support
**As a** motion-sensitive user  
**I want to** see calmer state changes  
**So that** the app still feels usable without decorative movement.

### Acceptance Criteria
- Given my device prefers reduced motion
- When the app renders sheets, popovers, previews, and sections
- Then large spring flourish, stagger, and exaggerated scale are removed while state changes remain visible.

## Story 10 — Refresh Reset Behavior
**As a** POC user  
**I want to** understand the current persistence boundary  
**So that** I know what happens after a refresh.

### Acceptance Criteria
- Given I edit content during the current session
- When I refresh the browser
- Then the app resets to the validated JSON seed.
