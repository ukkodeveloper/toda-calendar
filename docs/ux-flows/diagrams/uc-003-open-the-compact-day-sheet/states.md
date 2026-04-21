# UC-003 States — Open the Compact Day Sheet

```mermaid
stateDiagram-v2
    [*] --> MonthIdle
    MonthIdle --> TapDetected: User taps day
    TapDetected --> OpeningSheet: Single tap confirmed
    TapDetected --> MonthIdle: Double tap rerouted
    OpeningSheet --> SheetOpen: Presentation complete
    SheetOpen --> SheetClosing: Cancel, Done, backdrop, or drag
    SheetClosing --> MonthIdle
```
