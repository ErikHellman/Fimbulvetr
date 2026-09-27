# Architecture

Fimbulvetr is a deterministic pure-TypeScript simulation wrapped in a thin Phaser 4 shell. The rationale is in `docs/superpowers/specs/2026-09-26-fimbulvetr-design.md`.

## Frame loop

```
keyboard/gamepad ─► InputMapper ─► InputLatch ──► Sim.step(frame) ×0–4 @ 60 Hz ──► GameState + SimEvents
                                                        ▲                                   │
                        Commands (dev console, menus) ──┘          ┌────────────────────────┤
                                                                    ▼                        ▼
       PlayScene: EntityViews / ScreenView (ground + cover + decor) / AmbientView (smoke, fish) / ColorMatrix
                  AudioDirector · autosave · dev hook
       UiScene (untinted): HUD, text boxes, choices, cards, shop  ◄── sim.storyUi()
```

- **Modes.** `Sim.mode` is `play`, `transition` (a 30-tick slide across an edge, or a 36-tick fade through a door that swaps screens at the midpoint) or `story` (a script is running: play and the clock are frozen).
- **Autosave** happens on the `autosave` event only: when play resumes after a screen change or a finished script, so a save never catches a cutscene halfway.

- **Fixed step.** `advance()` turns frame time into 0–4 fixed 1/60 s steps plus an interpolation alpha. After a long hitch it drops the backlog.
- **State is truth.** Views are rebuilt from `Sim` state every frame. Events are one-shots only: sound, autosave, screen changes.
- **Deterministic.** Pure layers never read `Math.random`, `Date` or engine trig. `tests/sim/determinism.test.ts` guards this.

## Layers

| Layer | Folder | May import | Holds |
| --- | --- | --- | --- |
| core | `src/core` | core, `import type` from content | math, clock and weather, state and save, input frames, world (text maps, auto-tile masks, collision, layout), actors (state machines, hero, enemies), combat, sim, dev query |
| content | `src/content` | core, content | ids, flags, names (en/sv), terrain, legend, screens, layout, tuning, clock rules, bindings, `DB` |
| art | `src/art` | core, content, art | rasters, grids, outlines, painters, packing, animations, colour grading, tiles, sprites, SFX synth |
| shell | `src/shell` | anything | Phaser scenes, texture registration, views, input devices, audio, storage (IndexedDB, localStorage), PWA, dev tools |

The layers are enforced by `tsconfig.pure.json` (no DOM types) and `eslint.boundaries.js`, which is covered by `tests/tooling/boundaries.test.ts`.

## Key modules
- **`src/core/sim/sim.ts`** — `Sim`: the orchestrator. It steps the systems in order, applies commands, and hashes everything that changes (state, mode, transition, story, entities, id counter).
- **`src/core/sim/systems/*`** — plain functions over `SimRt` (`sim/rt.ts`):
  - `transition` (edges, doors, fades) and `spawn` (things → actors).
  - `movement` (terrain and cover speed) and `combat` (sword, contact damage).
  - `story` (interact probe, triggers, the script runner, `storyUi()`) and `npcs` (placement by condition, patrols).
  - `props` (lift, carry, throw, set down, drop zones, logs) and `critters` (sheep, pens, ravens).
  - `cover` (mowing, regrowth), `pickups` (heart pieces), `timers` and `clock`.
- **`src/core/story/*`** — the story rules:
  - `Cond` (flags, items, silver, quests, season, part of the day…) and `Effect` (flags, vars, items, silver, health, kit, clock, sleep).
  - Dialogue graphs, with a typewriter measured on the longest language so replays never depend on the language setting.
  - Scripts: plain step lists copied into a JSON `StoryRun`.
  - Quests derived from flags, and shops.
- **`src/core/world/collision.ts`** — pixel-stepped AABB against the tile grid, with a 6 px corner slide.
- **`src/core/world/decor.ts`** — groups object terrain cells (trees, the well, furniture) into footprint blocks; the shell draws one y-sorted sprite per block. `src/core/world/ambient.ts` finds open water and schedules fish jumps statelessly.
- **`src/core/actors/hero.ts`** — the hero's state machine: move, attack (3-hit combo), charge → spin, roll (12 i-frames), shield, hurt.
- **`src/core/clock/*`** — the world clock:
  - Hybrid seasons: `held` or `cycling` policy, with `setSeason` for story beats.
  - Daylight ramps and stateless weather.
- **`src/core/state/save.ts`** — `SaveData` with version, checksum, migrations and validation. Every version has a fixture in `tests/fixtures/saves/`.
- **`src/art/*`** — all placeholder pixels and sounds, as pure functions:
  - Frame names follow `<art>_<anim>_<dir>_<n>`.
  - East frames are baked mirrors of west.
  - The tileset stores animated terrain (water, the ford) frame-major after its variants; `tileAnimations` lists them for Phaser's animated tiles. Terrains in one auto-tile `group` (water/ford/jetty, roof/chimney) join without a bank.
- **`src/shell/scenes/BootScene.ts`** — packs generated frames into canvas textures, builds the tileset and renders the SFX.
- **`src/shell/scenes/PlayScene.ts`** — owns the Sim, input, views, the camera ColorMatrix, audio and autosave triggers. Each shown screen is a stage: a `ScreenView` (tile layers plus decor sprites, ticked from `sim.tick` and faded when they hide the hero) and an `AmbientView` (a smoke emitter per chimney, fish jumps in open water).
- **`src/shell/platform/*`**:
  - Settings in `localStorage['fimbulvetr.settings.v1']`.
  - IndexedDB `fimbulvetr` (stores `saves`: auto, auto_prev, s1–s3; and `meta`).
  - Export/import as JSON, a Web Locks single-tab guard, and the PWA service worker.

## Content model
- **Screens** (`src/content/world/<region>/<id>.ts`) are 40×22 text maps plus `things`:
  - enemy, door, sign, `use` (interact runs a script), trigger (entering runs a script)
  - prop (lift/throw/split), drop zone, critter, pen, heart piece
  - Signs and uses may cover a `w`×`h` block (a sign on a 2×2 well).
- **Decor** terrains (tree, well, trough, stump, bed, hearth, table, menhir) mark solid footprint tiles; the map must draw each object as a whole block (`OO`/`OO` for a well, `b` over `b` for a bed). `tests/content/integrity.test.ts` rejects incomplete blocks.
- **Buildings** are roof rows over a wall row: `D` open doorway (needs a door thing), `d` shut door, `+` window, `C` chimney inside the roof (the shell smokes it). `J` is a jetty over water.
- **Cover** grows from map characters listed in `COVER_LEGEND` (for example `"` = tall grass over grass). Cut cells are saved per screen under the season epoch.
- **NPCs** (`content/npcs.ts`) list `places`; the first whose condition holds decides where they stand. Positions are never saved.
- **Dialogue** (`content/dialogue/<npc>.ts`), **scripts** (`content/scripts/`), **quests** (`content/quests.ts`) and **shops** (`content/shops.ts`) are typed data. Every string is `{ en, sv }`.

## How to…
- **Add a screen:**
  1. Add the id to `SCREEN_IDS`.
  2. Create `src/content/world/<region>/<id>.ts` (40×22 legend characters and a `purpose`).
  3. Register it in `registry.ts`, and place it in `layout.ts` if it is on the overworld.
  4. `tests/content/integrity.test.ts` checks the map size, legend, seams and placements.
- **Add an enemy:**
  1. Add the id to `ENEMIES`.
  2. Write the behaviour machine in `src/core/actors/enemies/` and register it in `BEHAVIOURS`.
  3. Add its definition in `src/content/enemies.ts`.
  4. Add frames and animations in `src/art/sprites/`.
- **Add an NPC:**
  1. Add the id to `NPCS` and its name to `NPC_NAMES`.
  2. Add a look in `src/art/sprites/people.ts`, places in `NPC_DEFS` and a dialogue file registered in `content/dialogue/index.ts`.
  3. `tests/content/story.test.ts` checks the links, places, flags and text.
- **Add an interior:** a screen id that is not in `layout.ts`, a door on each side (each door's `arrive` tile must be walkable), and `indoor: true`.
- **Add a script or cutscene:** add the id to `SCRIPTS` and the steps in `content/scripts/`, then point a `use` or `trigger` thing at it.
- **Add art:** draw frames named by convention. A real atlas later replaces frames with the same names. `?dev=gallery` shows every frame and tile.
- **Add a decor object:** a terrain with `decor: { art, w, h }` in `content/terrain.ts`, a base-only tile painter, and `decor_<id>_idle_s_<n>` frames in `src/art/sprites/decor.ts` standing on their bottom centre.
- **Change the save format:**
  1. Bump `SAVE_VERSION`.
  2. Add `MIGRATIONS[old]`.
  3. Commit `tests/fixtures/saves/v<new>.json`.

## Dev and test tools
- **Query string** (dev and `--mode test` builds): `?screen=&at=x,y&season=&time=HH:MM|day|night&seed=&lang=&preset=&dev=gallery&nosave&mute`.
  - Presets (`content/dev/presets.ts`): `m0` is the old test kit; `day2`, `day3` and `night3` are prologue checkpoints.
- **F1:** the overlay.
- **Backquote:** the console. Commands: warp, time, season, flag, lang, volume, save, export, import, help.
- **`window.__fimbul`:** the Playwright hook.
- **Tests:**
  - `pnpm test`: Vitest for core, art, content, shell units and headless sim scenarios.
    - `tests/sim/golden.test.ts` pins one run's hash: re-record it only on purpose.
    - `tests/sim/route_m1a.test.ts` plays the whole prologue with real inputs through the walker in `tests/sim/walk.ts`.
  - `pnpm e2e`: Playwright on Chromium and WebKit. `tests/e2e/world.spec.ts` checks decor, animated tiles, smoke and fish through `__fimbul.view()`. In a container with a preinstalled Chromium of another revision, set `PW_CHROMIUM_PATH`.
  - `pnpm budget`: the gzipped JS budget (730 KB).
