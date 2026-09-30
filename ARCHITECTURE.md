# Architecture

Fimbulvetr is a deterministic pure-TypeScript simulation wrapped in a thin Phaser 4 shell. The rationale is in `docs/superpowers/specs/2026-09-26-fimbulvetr-design.md`.

## Frame loop

```
keyboard/gamepad ─► InputMapper ─► InputLatch ──► Sim.step(frame) ×0–4 @ 60 Hz ──► GameState + SimEvents
                                                        ▲                                   │
                        Commands (dev console, menus) ──┘          ┌────────────────────────┤
                                                                    ▼                        ▼
       PlayScene: EntityViews / ScreenView (ground + cover + decor) / AmbientView (smoke, fish) / FxView (puffs)
                  WeatherView (rain, snow, leaves, lightning) / DarknessView ×2 (fog; dark with lights cut out)
                  ColorMatrix (season × light × weather, colour-blind aid) · AudioDirector · autosave
                  pause menu, settings menu and save-slot picker state · dev hook
       UiScene (untinted): HUD (keys, boss bar), text boxes, choices, cards, shop, slot picker, game over,
                           pause menu with settings ◄── sim.storyUi(), sim.boss()
       Boot ─► TitleScene (press any key; continue, new, load a slot, import, export, settings) ─► PlayScene
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
  - `projectiles` (the boomerang: eight ways, out to its range or a wall, back to hand through anything; stuns, lights switches, blows leaves, fetches a pickup; and enemy shots: `ActorCtx.shoot` looses a `spit` that flies over water and low tiles, dies on a wall, is knocked away by the sword and reaches Ask through `hurtHero`, so the shield stops it) and `props` also pushes root blocks (a steady 16-tick lean slides one a tile; they reset on re-entry).
  - `death` (`checkDeath`, `stepOver`, `continueGame`) and `items` (K/L slot uses: the lantern lights braziers, the boomerang flies; `equip`, `eat`, which drinks mead too).
- **`src/core/story/*`** — the story rules:
  - `Cond` (flags, items, silver, quests, season, part of the day, weather…) and `Effect` (flags, vars, items, silver, health, seiðr, weapon, armour, galdr, kit, clock, sleep).
  - Dialogue graphs, with a typewriter measured on the longest language so replays never depend on the language setting.
  - Scripts: plain step lists copied into a JSON `StoryRun`. A press that ends a blocking step is spent on it: the next step starts that tick with nothing pressed (closing a keeper's last line never buys the first row).
  - Quests derived from flags, and shops.
- **`src/core/world/collision.ts`** — pixel-stepped AABB against the tile grid, with a 6 px corner slide.
- **`src/core/world/decor.ts`** — groups object terrain cells (trees, the well, furniture) into footprint blocks; the shell draws one y-sorted sprite per block. `src/core/world/ambient.ts` finds open water and schedules fish jumps statelessly.
- **`src/core/actors/hero.ts`** — the hero's state machine: move (shows `push` while leaning on a block), attack (3-hit combo), charge → spin, roll (12 i-frames), shield, hurt, toss (a sub-item), dying.
- **`src/core/actors/enemies/*`** — behaviours over shared helpers in `common.ts`: `vargr` (stalk, 24-tick crouch, lunge), `draugr` (rises untouchable, 30-tick raised arms, HEAVY blow), `troll` (armoured raid troll), `root_biter` (buried until Ask is near, rears up, bites, stands open to the blade), `rotvaettr` (the D1 boss, with its `rot_bulb`s and `root_spike`s), `vatnormr` (a water-worm: `swims`, placed in water; surfaces with a tell, spits, stays up open to a blow, sinks), `myrljos` (a bog-light at night: `flies` and `glow`, which `Sim.lights()` turns into a light; drifts, fades out of reach, flares and darts), `vargr_alpha` (the pack leader: howls — the tell — and vargr come until two of its own live, `mem.caller` marking them; a blow mid-howl stops it; a heavy lunge), `rime_raven` (circles its home out of reach, shrieks when it spots Ask and calls one vargr, dives, climbs back open to a blow), the training `dummy`. `EnemyDef` holds hp, boxes, drops, `attacks` (per state: blow ticks and boxes by facing; the ticks before are the telegraph, held to 18–30 by a test), `stunnable` (a behaviour may shorten it with `mem.stunFor`), `guard` (or `mem.guard` for a while), `boss` (a name for the boss bar), `needs` (items it cannot be beaten without, for the solver), `petrify`, `weak` and `flies` (walls, water and cover neither stop nor slow it; only the screen edge does). A start state's `enter` does not run at spawn, so start states set their pose in `tick`.
- **Bosses.** `Sim.boss()` is the first live enemy whose def has `boss`. Killing a boss kills its summons, marks `bossDead` in its dungeon (it never spawns again) and emits `bossDead` and `shake`. Rótvættr's core stays shut (`mem.guard`) until all three bulbs are stunned at once, opens for 150 ticks, and roars into a new phase at 16 and 8 hp (bulbs wake sooner, root-biters, then root spikes under Ask).
- **`src/core/world/light.ts`** — `darknessOf` (night outdoors, storms, `dark` rooms); `Sim.darkness()` and `Sim.lights()` (the lantern once owned, fire tiles, lit braziers). **`src/core/world/mapModel.ts`** — the overworld and each dungeon floor as the pause map shows them (`dungeonMap`: rooms walked through, all of them with the map, compass marks for the lair and shut chests).
- **Dungeons.** `WorldLayout.dungeons` gives each dungeon its own grid of rooms (`ScreenDef.dungeon`); `indexLayout` places every grid in its own block below the overworld and `neighbourOf` never crosses grids, so rooms slide into each other. A dungeon's saved state is read only through `dungeonOf` (creates it on first use) or `peekDungeon` (reads without storing); a tooling test forbids indexing `state.dungeons` anywhere else. Dungeon items (`small_key`, `big_key`, `dungeon_map`, `compass`) are ItemIds whose `ItemDef.dungeon` routes them into the current room's dungeon, never the bag.
- **`src/core/progress/solver.ts`** — progression solver v1: floods tiles (steps, edges, doors, ledge hops, and the warp of any `use` whose script warps, such as knocking at a barred gate) under a state's fixtures, takes everything reachable, repeats, and branches only on which lock a key opens. Brambles (props that `burns`) block until Eldr is known; other props never block. Lowered drawbridges give footing, and a latch (`switch.set`) sets its flag once it is beside the reach or in boomerang range. Given a season (`solve(…, {season})`), `coverPassage` runs the sim's own `buildCover` per screen: winter ice makes still water walkable and a spring flood makes a shoal impassable (without a season, cover is ignored). `tests/content/solver.test.ts` proves Mýrland in every season (the weir holds without the boomerang; with it everything opens and nothing strands; the reed islet's piece only over winter ice; the old bridge past the spring flood), the Myrkviðr and Uppvík gates in every season, and D1 (finishable without the lantern, not without the boomerang, every chest and piece reachable, no key order soft-locks, the entrance always reachable again) and the overworld from the `north` preset (Uppvík only once the road is open; every Myrkviðr piece, the fen's only with Eldr; nothing stranded at night on either side of Uppvík's gate).
- **Weather** (`sim/systems/weather.ts`). `skyOf` is the sky over the current region: the dev override, then story weather (the first `ContentDb.weather` rule that holds; `storm` is story-only), then — while `SimOptions.rolled` is on — the region's roll for the day (`weatherAt`, by season), else clear. `Sim.weather()` is the sky outdoors and clear indoors and underground; `Sim.sky()` is the sky even indoors (the `weather` condition reads it lazily through `CondCtx.weather`). `windAt` gives one of eight hashed directions per region and day, its strength by kind (`Sim.wind()`): it bends the boomerang's outward flight and the particles. Fog (`fogOf`, `Sim.fog()`) is its own layer: thick outdoors, clear in 80 px around Ask (112 with the lantern). Rain and storms put out braziers in the open. The test harness pins rolling off by default; tests that want it pass `rolled: true`.
- **Seasonal cover.** Besides the map's own cover, `CoverDef.grows` lets a kind grow by itself outdoors from the terrain beneath: winter snow on open ground (0.7, the sword clears it; the winter cloak halves the slowdown), winter ice on water (walkable: `stampCollision` takes SOLID and LOW off it), spring mud beside water on a wet day (the region's sky at 00:00 was not clear; 0.75, uncuttable). Drifts are drawn with `^` (winter, 0.5, uncuttable). Spring floods cover shoals (`CoverDef.sink`: `stampCollision` puts SOLID and LOW on them); `holdFloodOff` keeps the whole stretch of flood joined to Ask's feet dry, on a rebuild and on arrival, so nobody is trapped mid-ford. `rapids` and warm `spring` water are water that never freezes (ice grows only on `water`). `refreshCover` rebuilds on a new epoch or a change of wet day, keeping the saved cuts. The integrity test checks every seam in every season, since `checkEdges` never checks the landing tile.
- **Spawn tables** (`core/world/spawns.ts`, `content/spawns.ts`). Screens that list `spawns` points get the region's rolled foes on entry: the season's count (×2 at night), from (seed, day, screen, night) alone, never the combat RNG, kept 4 tiles from where Ask arrives, after the screen's own things. Forest trolls (`EnemyDef.petrify`) come only at night; `petrifyAtDawn` turns each into a liftable `troll_stone` at sunrise, whose `PropDef.loot` spills when it breaks.
- **Galdr and seiðr** (`sim/systems/galdr.ts`, `eldr.ts`). The galdr button, in `move` or `shield`, sings the first galdr known (`ContentDb.galdr` gives its seiðr cost), or fizzles without the seiðr. Hero state `cast`. Eldr's bolt flies eight ways with the wind, and the first thing it touches takes the fire: a foe (halved in rain; `EnemyDef.weak` doubles an element), a cold brazier, a burnable prop (brambles), burnable cover, or drifts and ice (`CoverDef.melts`: a 3×3 patch cleared and saved). Seiðr (`hero.seidr` to `maxSeidr`, at most 30) comes back from green and blue mead, seiðr-jar drops and prayer at a hof.
- **Fire** (`sim/systems/fire.ts`). `ignite` sets standing burnable cover (`CoverDef.burns`: tall grass, leaves) alight; `CoverGrid.burn` counts each tile down, never saved, and `burning` keeps an idle screen free. A tile spreads when `Tuning.fire.spreadAt` ticks are left: one step downwind, or on a hashed one-in-three chance to each side in calm air, never in rain. Burnt-out tiles are cleared and saved like cuts. Flames scorch Ask (through the shield) and foes; burning tiles glow (`fireLights`), and the hash gains `fire` only while something burns.
- **Gear and the economy.** `Tuning.armor` takes a share off each blow in `hurtHero` (never below 1; the tunic takes nothing); `Tuning.weapons` sets each sword's combo and reach. A shop's `stock` is `Ware & {price, n?, when?}`, a ware being an item, a weapon, armour or a galdr; `buyRow` refuses what is already held (or armour no better), a full stack, and mead without an empty horn (`hornsFree`: all horn-carried items together never outnumber the horns). The purse caps silver (100, 300, 999; each `purse` item raises it a step).
- **Fishing** (`story/fishing.ts`, the `{k:'fish', float, each?}` step). A blocking step like the shop, with its own `StoryRun.fish` (absent otherwise). Idle → cast → wait (nibbles; striking early spooks the fish) → a 20-tick bite window → reel: holding the line adds the fish's `pull` to the tension and reels 12 in, slack takes 25 off and lets it run; a surge (the float jerks) strains a held line harder. Tension 1000 snaps it; long slack or a long run loses the fish; distance 0 lands it (its silver, its `onLand`, then `each`). A fish can be landed while `run × pull < reel × slack`. The fish table (`content/fish.ts`) is by region season and part of the day. Randomness is `state.rng`, drawn only while fishing. The shell shows `fishPanel` (`shell/ui/fishText.ts`) in the text box and `FishView` (the float and line). A piece of heart can be handed over by the `{k:'piece', id}` effect (`grantPiece`), as Kári does for Gamli.
- **Latches and drawbridges.** `switch.set` sets a flag when struck and spawns lit while it holds; a `bridge` thing's tiles lose SOLID and LOW while `down` holds (fixture kind with `walk: 'on'`), and the shell draws a lowered one flat under anyone standing on it.
- **Saving at hofs and mead halls.** The script step `{k:'save'}` blocks with `storyUi() = {k:'save'}` until the shell answers the `saved` command; the shell's slot picker writes `sim.snapshot()` to slot 1–3.
- **`src/core/clock/*`** — the world clock:
  - Hybrid seasons: `held` or `cycling` policy, with `setSeason` for story beats.
  - Daylight ramps and stateless weather.
- **`src/core/state/save.ts`** — `SaveData` with version, checksum, migrations and validation. Every version has a fixture in `tests/fixtures/saves/`.
- **`src/art/*`** — all placeholder pixels and sounds, as pure functions:
  - Frame names follow `<art>_<anim>_<dir>_<n>`.
  - East frames are baked mirrors of west.
  - The tileset stores animated terrain (water, the ford) frame-major after its variants; `tileAnimations` lists them for Phaser's animated tiles. Terrains in one auto-tile `group` (water/ford/jetty, roof/chimney) join without a bank.
- **`src/shell/scenes/BootScene.ts`** — packs generated frames into canvas textures, builds the tileset and renders the SFX.
- **`src/shell/ui/*`** — menus as pure models, drawn by the scenes: `pauseMenu.ts` (tabs Items, Gear, Map, Quests, Game; `stepMenu` returns the next state and actions; `gearText.ts` lists weapon, armour, galdr, seiðr, horns, cloak and purse; `wareText.ts` names shop wares), `settingsMenu.ts` (+ `settingsText.ts`: language, volume, picture, shake, flashes, shield toggle, long days, colour-blind aid, and the controls page that rebinds keys through `shell/input/remap.ts`), `titleMenu.ts` and `slotPicker.ts` (+ `slotText.ts` for slot summaries). Settings changes apply at once (`PlayScene.applySettings`, `InputMapper.configure`, `Sim.setLongDay`) and are stored straight away.
- **`src/shell/scenes/PlayScene.ts`** — owns the Sim, input, views, the camera ColorMatrix, audio, autosave triggers and the pause menu. The hero's sprite follows the weapon in hand (`heroArtFor`: `hero`, `hero_axe`, `hero_fork`). Each shown screen is a stage: a `ScreenView` (tile layers plus decor sprites, ticked from `sim.tick` and faded when they hide the hero) and an `AmbientView` (a smoke emitter per chimney, fish jumps in open water). A `FireView` draws a pooled flame on every burning cover tile. Once a galdr is known the HUD shows the galdr box by the K/L slots and the seiðr bar under the hearts.
- **`src/shell/platform/*`**:
  - Settings in `localStorage['fimbulvetr.settings.v1']` (with `colourBlind` and `keys`, the keyboard overrides).
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
- **Cover** grows from map characters listed in `COVER_LEGEND` (`"` = tall grass in summer, `%` = leaf piles in autumn, which hide pickups until cut, `^` = winter drifts) and, for snow, mud and ice, from the terrain (see Seasonal cover). Cut cells are saved per screen under the season epoch.
- **Mýrland** (`content/world/myrland/`, region `myrland`, grid cols 0–3, rows 8–10): entered only over the weir's drawbridge from `myr_brook`'s bank path. Water types matter: `rapids` and `spring` never freeze, `shoal` floods in spring, `water` ices over in winter. Swimming foes stand in water (the integrity test checks it).
- **Herbs** (`{k:'herb', id, item, at, season}`) grow only in their season; walking over one picks it, and `world.vars[id]` keeps the season epoch it was picked in, so it grows back the next year. Herb ids are persisted ids.
- **Spawn points** (`spawns` on a screen) only outdoors, on walkable tiles, in a region with a table; the integrity test checks them.
- **Story weather and the clock:** `content/weather.ts` (the raid storm) and `DB.freezeClock` (the raid night never dawns).
- **NPCs** (`content/npcs.ts`) list `places`; the first whose condition holds decides where they stand. Positions are never saved. Uppvík's folk use the `weather` condition too: by evening most crowd into the mead hall, and rain sends the outdoor ones indoors.
- **Shops** open from a `use` on a counter or anvil whose script says a line and then runs the `shop` step; a `when` on the use shuts the shop at night (Hrafnkell's counter, Ketill's anvil outside on a dry day and inside on a wet one).
- **Dialogue** (`content/dialogue/<npc>.ts`, plus graphs that belong to no one, such as the Þing-stone's notices, read through a `use` whose script is a bare `talk`), **scripts** (`content/scripts/`), **quests** (`content/quests.ts`) and **shops** (`content/shops.ts`) are typed data. Every string is `{ en, sv }`.

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
- **Add a script or cutscene:** add the id to `SCRIPTS` and the steps in `content/scripts/`, then point a `use` or `trigger` thing at it. A place to rest and save runs a script with a `{ k: 'save' }` step (see `hof_pray`).
- **Add rolled foes to a region:** a table in `content/spawns.ts` and `spawns` points on its screens.
- **Add art:** draw frames named by convention. A real atlas later replaces frames with the same names. `?dev=gallery` shows every frame and tile.
- **Add a decor object:** a terrain with `decor: { art, w, h }` in `content/terrain.ts`, a base-only tile painter, and `decor_<id>_idle_s_<n>` frames in `src/art/sprites/decor.ts` standing on their bottom centre.
- **Change the save format:**
  1. Bump `SAVE_VERSION`.
  2. Add `MIGRATIONS[old]`.
  3. Commit `tests/fixtures/saves/v<new>.json`.

## Dev and test tools
- **Query string** (dev and `--mode test` builds): `?screen=&at=x,y&season=&time=HH:MM|day|night&seed=&lang=&preset=&weather=<kind>&rolled=0|1&title=0|1&dev=gallery&nosave&mute`. The title screen shows unless the query names a screen, a preset or `nosave` (or says `title=0`); `rolled=0` turns rolled weather and spawns off.
  - Presets (`content/dev/presets.ts`): `m0` is the old test kit; `day2`, `day3` and `night3` are prologue checkpoints; `raid` (just woken to fire), `morning` (after the raid), `myr` (Myrkviðr after the legend), `turning` (a winter night on the Myrkviðr road just before sunrise), `eldr` (Myrkviðr in autumn with Eldr and a full bar), `north` (by Önundr after Rótarhellir, before the road opens), `uppvik` (Uppvík's square at noon with 100 silver), `hunt` (where M2b leaves Ask: back in the square with Eldr), `myl` (where M2 leaves Ask, at the forest brook's bank path down to Mýrland with the boomerang), `fisher` (the end of Kári's jetty on an autumn evening, the rod lent), `d1` (just inside Rótarhellir) and `d1boss` (below the lair's door with the boomerang).
- **F1:** the overlay.
- **Backquote:** the console. Commands: warp, time, season, flag, give, hp, god, weather, kill, lang, volume, save, export, import, help.
- **Tab / M:** the pause menu (M opens its map).
- **`window.__fimbul`:** the Playwright hook (`boss()` and `dungeon()` read the boss bar and the dungeon's keys, map and compass; `gear()` the weapon, armour, galdr and seiðr; `picker()` the save-slot picker, `armed` once it takes input).
- **Tests:**
  - `pnpm test`: Vitest for core, art, content, shell units and headless sim scenarios.
    - `tests/sim/golden.test.ts` pins one run's hash: re-record it only on purpose.
    - `tests/sim/route_m1a.test.ts` plays the whole prologue with real inputs through the walker in `tests/sim/walk.ts`; `route_m1b.test.ts` plays the raid, the legend and Myrkviðr to the roots, fighting with `walkFighting`/`fightNear`; `route_m1c.test.ts` plays Rótarhellir and Rótvættr to the lit stone. Each logs its length in ticks. They run with rolling off; `FIMBUL_ROLLED=1` turns it on for a one-off look.
    - `tests/sim/turning.test.ts` (rolling on) is M2a's exit: foes by day and night, trolls to stone at sunrise, weather by day, snow. `route_m2b.test.ts` is M2b's: Önundr's road, Uppvík, the horn, mead, Sölvi and Skeggi's stave, Eldr, burning leaves. `route_m2c.test.ts` is M2c's: the Þing-stone notice, Dagný's hint, the pack leader, Bersi's bounty. `route_m3a.test.ts` is M3a's: the weir's latch, the bridge, west to the mill, Þuríðr's tale, Kári's rod and a fish landed.
  - `pnpm e2e`: Playwright on Chromium and WebKit. The `boot` helper adds `rolled=0&title=0`; `m2a.spec.ts` walks the title, the settings, a hof save and every weather; `m2b.spec.ts` buys from Ketill and Hrafnkell, drinks mead from the menu, saves in the mead hall and burns leaves with Eldr; `m2c.spec.ts` strikes the huldra's bargain, buys from Heiðr and watches trolls turn to stone at sunrise; `m3a.spec.ts` strikes the weir's latch and crosses, meets the spring flood on the shoal, hears Bárðr refuse, and lands a fish through real key presses (hook `fish()`). Every spec presses keys through `tap` in `helpers.ts`, which holds a key across two rendered frames (never a fixed number of ms), so a slow machine never loses a press. `tests/e2e/world.spec.ts` checks decor, animated tiles, smoke and fish through `__fimbul.view()`. In a container with a preinstalled Chromium of another revision, set `PW_CHROMIUM_PATH`.
  - `pnpm budget`: the gzipped JS budget (730 KB).
