# Motion Tokens

## Intent
Motion explains hierarchy and interaction state. It should feel calm, intentional, and Apple-like rather than flashy.

## Duration tokens
| Token | Value | Use |
| --- | --- | --- |
| `motion.duration.instant` | `120ms` | pressed state release, icon affordances |
| `motion.duration.quick` | `180ms` | preview crossfade, popover fade |
| `motion.duration.base` | `240ms` | sheet backdrop, section entrance |
| `motion.duration.emphasis` | `320ms` | sheet body, larger state transitions |

## Easing tokens
| Token | Value | Use |
| --- | --- | --- |
| `motion.ease.enter` | `[0.22, 1, 0.36, 1]` | content entering |
| `motion.ease.exit` | `[0.4, 0, 1, 1]` | content exiting |
| `motion.ease.fade` | `[0.2, 0, 0, 1]` | opacity-only transitions |

## Spring tokens
| Token | Config | Use |
| --- | --- | --- |
| `motion.spring.sheet` | `{ type: "spring", stiffness: 280, damping: 28, mass: 0.9 }` | bottom sheet presentation |
| `motion.spring.press` | `{ type: "spring", stiffness: 420, damping: 24, mass: 0.55 }` | cell press feedback |
| `motion.spring.preview` | `{ type: "spring", stiffness: 320, damping: 30, mass: 0.8 }` | preview swap |

## Gesture thresholds
| Token | Value | Use |
| --- | --- | --- |
| `motion.gesture.doubleTapMs` | `220` | distinguish single tap from double tap |
| `motion.gesture.sheetDismissOffset` | `120` | drag distance to dismiss sheet |
| `motion.gesture.sheetDismissVelocity` | `700` | drag release velocity to dismiss sheet |

## Reduced-motion fallback
- Remove stagger.
- Replace large translate and scale with opacity plus minimal Y movement.
- Keep state change visible for sheet open/close and preview replacement.

## Preview aspect tokens
| Token | Value | Use |
| --- | --- | --- |
| `preview.photo.aspect` | `4 / 5` | portrait-first photo preview |
| `preview.doodle.aspect` | `1 / 1` | doodle preview card |
| `preview.text.lines` | `3` | text preview clamp |

## Non-goals
- No decorative hero animations.
- No oversized bounce.
- No motion that blocks touch input.
