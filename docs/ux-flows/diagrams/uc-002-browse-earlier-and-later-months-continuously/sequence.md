# UC-002 Sequence — Browse Earlier and Later Months Continuously

```mermaid
sequenceDiagram
    actor User
    participant Timeline as Month Timeline
    participant Range as Range Manager
    participant Dates as Month Generator

    User->>Timeline: Scroll toward top or bottom
    Timeline->>Range: Check sentinel visibility
    Range->>Dates: Expand month range
    Dates-->>Range: New month keys
    Range-->>Timeline: Updated sections
    Timeline-->>User: Continuous infinite scroll
```
