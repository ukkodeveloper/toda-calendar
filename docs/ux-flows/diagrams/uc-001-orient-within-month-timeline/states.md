# UC-001 States — Orient Within the Month Timeline

```mermaid
stateDiagram-v2
    [*] --> LoadingSeed
    LoadingSeed --> MonthVisible: Seed ready
    MonthVisible --> Scanning: First paint complete
    Scanning --> Scrolling: User scrolls
    Scrolling --> TitleTransition: Active month changes
    TitleTransition --> Scrolling: Transition complete
    Scrolling --> Scanning: User pauses
```
