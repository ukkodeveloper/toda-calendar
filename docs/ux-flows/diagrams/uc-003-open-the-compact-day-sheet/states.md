# UC-003 States — Open the Compact Day Sheet

```mermaid
stateDiagram-v2
    [*] --> MonthIdle
    MonthIdle --> TapDetected: User taps day
    TapDetected --> OpeningSheet: Tap confirmed within touch slop
    OpeningSheet --> SheetOpen: Presentation complete
    SheetOpen --> SheetClosing: Cancel, Done, backdrop, or drag
    SheetClosing --> MonthIdle
```
