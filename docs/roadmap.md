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
- [x] M0 exit test, ARCHITECTURE.md, user playtest

## Later milestones
- [ ] M1 Vertical slice — brief: `docs/briefs/m1.md`
  - [ ] M1a Farm days — plan: `docs/superpowers/plans/2026-09-26-m1a-farm-days.md`
    - [x] Carry-overs: Sim split into systems, ActorCtx, interiors and fades, ledges, presets and gallery
    - [x] Story core: Cond/Effect, dialogue, scripts, NPCs, quests
    - [x] Lift, carry and throw; critters; tall grass; shop
    - [x] Art: font, NPC and prop sprites, farm tiles, SFX
    - [x] Shell: world view, UI scene
    - [x] Content: Askdalr (8 screens, 3 interiors, 13 NPCs, days 1–3)
    - [x] Exit route test, e2e, docs
    - [x] World polish: decor sprites, animated water, fish and smoke, doors, windows, chimneys, arm swing, nameplate — plan: `docs/superpowers/plans/2026-09-27-world-polish.md`
    - [ ] User playtest and Swedish proofread
  - [ ] M1b Raid + Myrkviðr road — plan: `docs/superpowers/plans/2026-09-27-m1b-m1c.md` (Part 1)
    - [x] Carry-overs: presets and walker, one damage and kill path
    - [x] Core: death and continue, enemy framework, vargr/draugr/troll, fire and gate fixtures, leaf cover, story weather and darkness, item slots, NPC schedules, map model
    - [x] Art: enemies and fixtures, hero weapon kits, Myrkviðr terrain, SFX
    - [x] Shell: combat feedback and game over, weather and darkness views, pause menu, dev commands
    - [x] Content: the raid, the morning and the legend, Myrkviðr (9 screens and a hut), 4 NPCs and Kolbeinn
    - [x] Exit route test, e2e, v1-m1b fixture, docs
    - [ ] User playtest and Swedish proofread
  - [ ] M1c Rótarhellir + Rótvættr — plan: `docs/superpowers/plans/2026-09-27-m1b-m1c.md` (Part 2)
- [ ] M2 Uppvík + turning world · [ ] M3 Mýrland + D2 · [ ] M4 Haugar + D3 · [ ] M5 Act I finale (demo)
- [ ] M6 Niflmýrr + D4 · [ ] M7 Sævatn + Refuge + D5 · [ ] M8 Dvergagröf + D6 · [ ] M9 Hrímfjöll + D7 · [ ] M10 Útgarðr + ending · [ ] M11 Completion + ship
