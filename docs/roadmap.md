# Roadmap

Full plan: `docs/superpowers/specs/2026-09-26-fimbulvetr-design.md` §4. Detailed M0 plan: `docs/superpowers/plans/2026-09-26-m0-foundations.md`.

## M0 — Foundations
- [x] Project scaffold, strict tsconfigs, lint boundaries, Vitest
- [x] Browser boot, WebGL gate, Playwright smoke, docs
- [x] Core math
- [x] Ids, registries, i18n, GameState v1
- [x] Save format (checksum, validation, migrations)
- [x] Fixed-step loop and input latch
- [x] Shell input devices and bindings
- [x] Text maps, legend, blob-47 autotile
- [x] World layout, test screens, content integrity
- [x] Tile collision with corner slide
- [x] State machines, hero, tuning
- [x] Combat and training dummy
- [x] World clock, weather, colour grading
- [x] Sim: step loop, transitions, commands, determinism
- [x] Art primitives and packing
- [x] Terrain tiles
- [x] Hero and dummy sprites
- [x] Shell rendering (boot, play scene, views, scaling, slide, tint)
- [x] Dev tools (query string, hook, overlay, console)
- [x] Settings, language, synthesized SFX
- [x] Browser saves (IndexedDB, autosave, export/import, tab lock)
- [x] PWA and icons
- [x] Budget, CI and Pages workflows
- [ ] M0 exit test, ARCHITECTURE.md, user playtest
  - Exit test and ARCHITECTURE.md done; waiting for the user's playtest.

## Later milestones
- [ ] M1 Vertical slice
  - Carried over from M0: one-way ledges in collision; `?dev=gallery` texture gallery for art review.
- [ ] M2 Uppvík + turning world · [ ] M3 Mýrland + D2 · [ ] M4 Haugar + D3 · [ ] M5 Act I finale (demo)
- [ ] M6 Niflmýrr + D4 · [ ] M7 Sævatn + Refuge + D5 · [ ] M8 Dvergagröf + D6 · [ ] M9 Hrímfjöll + D7 · [ ] M10 Útgarðr + ending · [ ] M11 Completion + ship
