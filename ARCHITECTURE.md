# Architecture

Fimbulvetr is a deterministic pure-TypeScript simulation wrapped in a thin Phaser 4 shell. The rationale is in `docs/superpowers/specs/2026-09-26-fimbulvetr-design.md`.

## Frame loop

```
keyboard/gamepad ─► InputMapper ─► InputLatch ──► Sim.step(frame) ×0–4 @ 60 Hz ──► GameState + SimEvents
                                                        ▲                                   │
                        Commands (dev console, menus) ──┘          ┌────────────────────────┤
                                                                    ▼                        ▼
       PlayScene: EntityViews / ScreenView (ground + cover + decor) / AmbientView (smoke, fish) / FxView (puffs)
                  WeatherView (rain, lightning) / DarknessView (dark with lights cut out) / ColorMatrix
                  AudioDirector · autosave · pause menu state · dev hook
       UiScene (untinted): HUD (keys, boss bar), text boxes, choices, cards, shop, game over, pause menu
                           ◄── sim.storyUi(), sim.boss()
```

- **Modes.** `Sim.mode` is `play`, `transition` (a 30-tick slide across an edge, or a 36-tick fade through a door that swaps screens at the midpoint), `story` (a script is running: play and the clock are frozen) or `over` (the hero fell: only the fall advances; confirm continues at `Sim.entry` with three hearts).
- **Pause.** The pause menu lives in the shell: while it is open the sim does not step at all, tile timers, smoke and rain pause, and its choices reach the sim as commands (`equip`, `eat`) applied at once with `flushCommands()`.
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
  - `cover` (mowing, regrowth; the boomerang blows away `blown` cover only), `pickups` (heart pieces, heart containers, dropped hearts and silver, hidden under leaves), `timers` and `clock` (frozen while `ContentDb.freezeClock` holds, and in dungeon rooms).
  - `enemies` (`actorCtx`, `runEnemies`: stun, summons, the gone-sweep) and `combat` (`damageActor` is the one kill path for sword, throws and later projectiles; `resolveAttacks` hurts the hero by touch or by a blow inside an attack window; `hurtHero`).
  - `fixtures`: one entity per tile of a gate, fire, lock or shutter, one per chest, switch and brazier, driven by a per-kind table (solid never / while on / always, on and off animations) and re-evaluated every play and story tick. Solid fixtures and wall props (root blocks, vines) are stamped into `LoadedScreen.collision` over the terrain-only `base`, so enemies and the walker respect them. Locks spend a small key (bump or interact) and save their id in the dungeon's `doors`; shutters arm once Ask is clear of them and open for good on a room signal (a saved `id` keeps them open; one without `opens` is the far side of another room's shutter); switches light when struck (sword or boomerang); braziers from the lantern.
  - `rooms` (`RoomSignal`: `clear`, `switches`, `braziers`, `blocks`, worked out from the live actors; chests and heart containers wait hidden until `when` and `appear` hold, never appearing on top of Ask) and `chests` (interact opens: `world.opened`, the gift, the item's `found` line).
  - `projectiles` (the boomerang: eight ways, out to its range or a wall, back to hand through anything; stuns, lights switches, blows leaves, fetches a pickup) and `props` also pushes root blocks (a steady 16-tick lean slides one a tile; they reset on re-entry).
  - `death` (`checkDeath`, `stepOver`, `continueGame`) and `items` (K/L slot uses: the lantern lights braziers, the boomerang flies; `equip`, `eat`).
- **`src/core/story/*`** — the story rules:
  - `Cond` (flags, items, silver, quests, season, part of the day…) and `Effect` (flags, vars, items, silver, health, kit, clock, sleep).
  - Dialogue graphs, with a typewriter measured on the longest language so replays never depend on the language setting.
  - Scripts: plain step lists copied into a JSON `StoryRun`.
  - Quests derived from flags, and shops.
- **`src/core/world/collision.ts`** — pixel-stepped AABB against the tile grid, with a 6 px corner slide.
- **`src/core/world/decor.ts`** — groups object terrain cells (trees, the well, furniture) into footprint blocks; the shell draws one y-sorted sprite per block. `src/core/world/ambient.ts` finds open water and schedules fish jumps statelessly.
- **`src/core/actors/hero.ts`** — the hero's state machine: move (shows `push` while leaning on a block), attack (3-hit combo), charge → spin, roll (12 i-frames), shield, hurt, toss (a sub-item), dying.
- **`src/core/actors/enemies/*`** — behaviours over shared helpers in `common.ts`: `vargr` (stalk, 24-tick crouch, lunge), `draugr` (rises untouchable, 30-tick raised arms, HEAVY blow), `troll` (armoured raid troll), `root_biter` (buried until Ask is near, rears up, bites, stands open to the blade), `rotvaettr` (the D1 boss, with its `rot_bulb`s and `root_spike`s), the training `dummy`. `EnemyDef` holds hp, boxes, drops, `attacks` (per state: blow ticks and boxes by facing; the ticks before are the telegraph, held to 18–30 by a test), `stunnable` (a behaviour may shorten it with `mem.stunFor`), `guard` (or `mem.guard` for a while), `boss` (a name for the boss bar) and `needs` (items it cannot be beaten without, for the solver). A start state's `enter` does not run at spawn, so start states set their pose in `tick`.
- **Bosses.** `Sim.boss()` is the first live enemy whose def has `boss`. Killing a boss kills its summons, marks `bossDead` in its dungeon (it never spawns again) and emits `bossDead` and `shake`. Rótvættr's core stays shut (`mem.guard`) until all three bulbs are stunned at once, opens for 150 ticks, and roars into a new phase at 16 and 8 hp (bulbs wake sooner, root-biters, then root spikes under Ask).
- **`src/core/world/light.ts`** — `darknessOf` (night outdoors, storms, `dark` rooms); `Sim.darkness()` and `Sim.lights()` (the lantern once owned, fire tiles, lit braziers). **`src/core/world/mapModel.ts`** — the overworld and each dungeon floor as the pause map shows them (`dungeonMap`: rooms walked through, all of them with the map, compass marks for the lair and shut chests).
- **Dungeons.** `WorldLayout.dungeons` gives each dungeon its own grid of rooms (`ScreenDef.dungeon`); `indexLayout` places every grid in its own block below the overworld and `neighbourOf` never crosses grids, so rooms slide into each other. A dungeon's saved state is read only through `dungeonOf` (creates it on first use) or `peekDungeon` (reads without storing); a tooling test forbids indexing `state.dungeons` anywhere else. Dungeon items (`small_key`, `big_key`, `dungeon_map`, `compass`) are ItemIds whose `ItemDef.dungeon` routes them into the current room's dungeon, never the bag.
- **`src/core/progress/solver.ts`** — progression solver v1: floods tiles (steps, edges, doors, ledge hops) under a state's fixtures, takes everything reachable, repeats, and branches only on which lock a key opens. `tests/content/solver.test.ts` proves D1: finishable without the lantern, not without the boomerang, every chest and piece reachable, no key order soft-locks, the entrance always reachable again.
- **Weather.** `Sim.weather()` is story weather: the first `ContentDb.weather` rule that holds, outdoors only, else clear (`storm` is set by the story, never rolled). Rolled weather (`weatherAt`) arrives in M2.
- **`src/core/clock/*`** — the world clock:
  - Hybrid seasons: `held` or `cycling` policy, with `setSeason` for story beats.
  - Daylight ramps and stateless weather.
- **`src/core/state/save.ts`** — `SaveData` with version, checksum, migrations and validation. Every version has a fixture in `tests/fixtures/saves/`.
- **`src/art/*`** — all placeholder pixels and sounds, as pure functions:
  - Frame names follow `<art>_<anim>_<dir>_<n>`.
  - East frames are baked mirrors of west.
  - The tileset stores animated terrain (water, the ford) frame-major after its variants; `tileAnimations` lists them for Phaser's animated tiles. Terrains in one auto-tile `group` (water/ford/jetty, roof/chimney) join without a bank.
- **`src/shell/scenes/BootScene.ts`** — packs generated frames into canvas textures, builds the tileset and renders the SFX.
- **`src/shell/ui/pauseMenu.ts`** — the pause menu as a pure model (tabs Items, Map, Quests, Game; `stepMenu` returns the next state and actions), drawn by `UiScene`.
- **`src/shell/scenes/PlayScene.ts`** — owns the Sim, input, views, the camera ColorMatrix, audio, autosave triggers and the pause menu. The hero's sprite follows the weapon in hand (`heroArtFor`: `hero`, `hero_axe`, `hero_fork`). Each shown screen is a stage: a `ScreenView` (tile layers plus decor sprites, ticked from `sim.tick` and faded when they hide the hero) and an `AmbientView` (a smoke emitter per chimney, fish jumps in open water).
- **`src/shell/platform/*`**:
  - Settings in `localStorage['fimbulvetr.settings.v1']`.
  - IndexedDB `fimbulvetr` (stores `saves`: auto, auto_prev, s1–s3; and `meta`).
  - Export/import as JSON, a Web Locks single-tab guard, and the PWA service worker.

## Content model
- **Screens** (`src/content/world/<region>/<id>.ts`) are 40×22 text maps plus `things`:
  - enemy (optional `when`, e.g. night-only draugr, and `onDeath` effects), door, sign, `use` (interact runs a script), trigger (entering runs a script)
  - `fire` (burning tiles: hurt through the shield, not solid, glow in the dark) and `gate` (tiles that are solid while `closed` holds: a palisade, a wall of fire, piled logs)
  - prop (lift/throw/split; `wall` props fill their tile, `pushable` ones slide), drop zone, critter, pen, heart piece
  - `chest` (`gives` an item or silver; `appear` on a room signal), `heart` (a heart container), `lock`, `shutter` (`opens` on a signal, saved by `id`), `switch`, `brazier` (`lit` from the start or by the lantern)
  - Signs and uses may cover a `w`×`h` block (a sign on a 2×2 well).
- **Dungeon rooms** carry `dungeon` (no clock, no weather) and may be `dark`. Locks and shutters between two rooms sit on the edge tiles and are mirrored in both rooms under one id, so a slide never lands Ask inside a shut one. `tests/content/persisted.test.ts` holds every chest, lock, saved shutter, piece and heart id: append only.
- **Terrain** may be `low` (solid underfoot but open above: water, sap), which the boomerang crosses.
- **Decor** terrains (tree, well, trough, stump, bed, hearth, table, menhir) mark solid footprint tiles; the map must draw each object as a whole block (`OO`/`OO` for a well, `b` over `b` for a bed). `tests/content/integrity.test.ts` rejects incomplete blocks.
- **Buildings** are roof rows over a wall row: `D` open doorway (needs a door thing), `d` shut door, `+` window, `C` chimney inside the roof (the shell smokes it). `J` is a jetty over water.
- **Cover** grows from map characters listed in `COVER_LEGEND` (`"` = tall grass in summer, `%` = leaf piles in autumn, which hide pickups until cut). Cut cells are saved per screen under the season epoch.
- **Story weather and the clock:** `content/weather.ts` (the raid storm) and `DB.freezeClock` (the raid night never dawns).
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
  2. Write the behaviour machine in `src/core/actors/enemies/` (reuse `common.ts`), register it in `BEHAVIOURS` and its start state in `START`. Every attack needs a state with the anim `tell` before it.
  3. Add its definition in `src/content/enemies.ts`: `attacks` windows per state, `drops`, `stunnable`, `guard`.
  4. Add frames and animations in `src/art/sprites/enemies.ts` (`enemy_<id>`, 2 px margin). `tests/sim/enemies_m1b.test.ts` checks the telegraph length for every enemy that attacks.
- **Add an NPC:**
  1. Add the id to `NPCS` and its name to `NPC_NAMES`.
  2. Add a look in `src/art/sprites/people.ts`, places in `NPC_DEFS` and a dialogue file registered in `content/dialogue/index.ts`.
  3. `tests/content/story.test.ts` checks the links, places, flags and text.
- **Add a dungeon:**
  1. Add the room ids to `SCREEN_IDS` and their files under `src/content/world/<dungeon>/`, each with `dungeon: '<id>'`.
  2. Place them on `layout.dungeons.<id>` and give one room a door from the overworld.
  3. Record every chest, lock, saved shutter, piece and heart id in `tests/content/persisted.test.ts`, and prove the dungeon in `tests/content/solver.test.ts`.
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
  - Presets (`content/dev/presets.ts`): `m0` is the old test kit; `day2`, `day3` and `night3` are prologue checkpoints; `raid` (just woken to fire), `morning` (after the raid), `myr` (Myrkviðr after the legend), `d1` (just inside Rótarhellir) and `d1boss` (below the lair's door with the boomerang).
- **F1:** the overlay.
- **Backquote:** the console. Commands: warp, time, season, flag, give, hp, god, weather, kill, lang, volume, save, export, import, help.
- **Tab / M:** the pause menu (M opens its map).
- **`window.__fimbul`:** the Playwright hook (`boss()` and `dungeon()` read the boss bar and the dungeon's keys, map and compass).
- **Tests:**
  - `pnpm test`: Vitest for core, art, content, shell units and headless sim scenarios.
    - `tests/sim/golden.test.ts` pins one run's hash: re-record it only on purpose.
    - `tests/sim/route_m1a.test.ts` plays the whole prologue with real inputs through the walker in `tests/sim/walk.ts`; `route_m1b.test.ts` plays the raid, the legend and Myrkviðr to the roots, fighting with `walkFighting`/`fightNear`; `route_m1c.test.ts` plays Rótarhellir and Rótvættr to the lit stone. Each logs its length in ticks.
  - `pnpm e2e`: Playwright on Chromium and WebKit. `tests/e2e/world.spec.ts` checks decor, animated tiles, smoke and fish through `__fimbul.view()`. In a container with a preinstalled Chromium of another revision, set `PW_CHROMIUM_PATH`.
  - `pnpm budget`: the gzipped JS budget (730 KB).
