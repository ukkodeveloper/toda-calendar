# UC-002 States — Browse Earlier and Later Months Continuously

```mermaid
stateDiagram-v2
    [*] --> RangeStable
    RangeStable --> NearBoundary: User approaches sentinel
    NearBoundary --> LoadingPast: Top boundary
    NearBoundary --> LoadingFuture: Bottom boundary
    LoadingPast --> RangeStable: Past chunk inserted
    LoadingFuture --> RangeStable: Future chunk inserted
```
