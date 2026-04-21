# UC-007 Sequence — Preserve Calm Accessibility

```mermaid
sequenceDiagram
    actor User
    participant UI as Calendar UI
    participant Prefs as Accessibility Preferences
    participant Assist as Assistive Tech

    User->>UI: Interact with month screen
    UI->>Prefs: Read reduced motion and text size
    Prefs-->>UI: Accessibility preferences
    UI->>Assist: Expose labels, focus order, and announcements
    Assist-->>User: Accessible feedback
    UI-->>User: Calm, usable interaction path
```
