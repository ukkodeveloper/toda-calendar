# UC-005 States — Change the Global Visible Preview Mode

```mermaid
stateDiagram-v2
    [*] --> PhotoMode
    PhotoMode --> DoodleMode: Cycle next
    DoodleMode --> TextMode: Cycle next
    TextMode --> PhotoMode: Cycle next
```
