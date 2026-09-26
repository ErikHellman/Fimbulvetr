# Architecture

Fimbulvetr is a pure-TypeScript simulation wrapped in a thin Phaser 4 shell. The full rationale is in `docs/superpowers/specs/2026-09-26-fimbulvetr-design.md`.

```
input devices ──► InputMapper ──► InputLatch ──► Sim.step(frame) ×N @60 Hz ──► state + one-shot events
                                                     ▲                                 │
                          Commands (menus, dev) ─────┘                                 ▼
                                             views.sync(state, alpha) · audio · autosave · dev hook
```

| Layer | Folder | Contents |
| --- | --- | --- |
| core | `src/core` | math, clock, state and save, input frames, world (maps, collision), actors (state machines), combat, the sim |
| content | `src/content` | ids, flags, items, screens, tuning, clock rules, bindings, the `DB` object |
| art | `src/art` | raster ops, sprite painters, tile painters, colour grading, SFX synth |
| shell | `src/shell` | Phaser scenes, texture registration, views, input devices, storage, PWA, dev tools |

Sections are added as systems land (see `docs/roadmap.md`).
