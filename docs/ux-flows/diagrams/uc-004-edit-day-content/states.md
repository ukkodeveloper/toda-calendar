# UC-004 States — Edit Day Content

```mermaid
stateDiagram-v2
    [*] --> SheetReady
    SheetReady --> EditingPhoto: Photo tab
    SheetReady --> EditingDoodle: Doodle tab
    SheetReady --> EditingText: Text tab
    EditingPhoto --> Saving: Done
    EditingDoodle --> Saving: Done
    EditingText --> Saving: Done
    Saving --> Saved: Record updated
    Saved --> [*]
```
