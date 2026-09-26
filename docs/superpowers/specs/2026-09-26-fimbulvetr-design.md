# Fimbulvetr — design spec, roadmap and Milestone 0 plan

## Context

The repo holds only `Fimbulvetr-game-design-document.md` (GDD): a Zelda-3-style Norse action-adventure,
Phaser 4 + TypeScript, browser-only. The user asked to analyse the GDD, change what needs changing, then design
and implement the game — entirely in the browser, all state local via standard Web APIs. Agreed scope: **the
whole game, built iteratively milestone by milestone across sessions**, with code-drawn placeholder art until a
separate art track replaces it. This document is the design spec (GDD corrections + architecture), the
full-game roadmap, and the task list for Milestone 0.

Verified facts (npm + Phaser tarball, 2026-09-26): Phaser 4.2.1 is latest (4.0.0 shipped 2026-04-10) and ships
`skills/` (36 agent docs). Phaser 4 creates a **WebGL 1** context; built-in shaders are GLSL ES 1.00. Camera
`filters.internal.addColorMatrix()`, `textures.addCanvas`, RenderTexture `erase` all exist. Vite 8.3.1,
vite-plugin-pwa 1.3.0. Node 22.14 + pnpm 10.13 installed. Remote: github.com/ErikHellman/Fimbulvetr.

## 1. GDD changes

### Technical corrections
1. WebGL 1 + GLSL ES 1.00, not WebGL 2 / GLSL 3.0. **Drop the Canvas fallback** (no Filters in Canvas → tints
   vanish silently); check for WebGL before `new Phaser.Game` and show a "WebGL required" page.
2. **Cut the custom shaders.** Season + time + weather grading = one camera ColorMatrix. Outlines baked into
   sprites. Night/fog/dark rooms = one visibility RenderTexture with erased light sprites. Water = animated tiles.
3. **`pixelArt: true`**, integer zoom (`scale.mode: NONE`, zoom = floor(min(w·dpr/640, h·dpr/360))/dpr, "fit" as
   a setting). `pixelArt:false` blurs the 3× upscale.
4. **360 ≠ n×16.** Playfield 640×352 (40×22 tiles); world camera viewport (0,4,640,352); HUD camera full 640×360.
5. **Flip-screen**, not a 3×3 streamer (see decisions).
6. **Safari 7-day storage eviction**: `navigator.storage.persist()`, "Add to Dock" hint, export-save nudge.
7. **Content as typed TS modules**, not JSON + JSON Schema + linter; a content-integrity test replaces the linter
   and quest-graph validator.
8. Hand-written IndexedDB wrapper instead of idb-keyval (standard Web APIs only).
9. Procedural Web Audio SFX (ZzFX-style) played through Phaser's sound manager until real audio exists.

### Design fixes
10. **Hybrid seasons** (story beats set the season; clock cycles 6-day seasons between beats). Opening the pass
    snaps the world to winter — the Fimbulvetr. Drop the "see every season twice" claim (clock pauses in dungeons).
11. **Hearts** 3 + 8 containers + **36** pieces (9) = 20 (GDD said 24 pieces → 17).
12. **Sequence breaks**: ferry and frozen Sævatn require `pass_open`; Sævatn still needs the seal-skin.
13. **Gates**: seal-skin quest giver on the Niflmýrr shore; Embla joins on reaching the Refuge (not "after D5");
    ember byrnie forged in Dvergagröf, protects against forge heat *and* Hrímfjöll's killing frost (Hrímfjöll gate);
    D7 door needs the other three thanes (Eldr from Act I no longer opens the highlands early).
14. **Gamepad**: A interact/lift, X sword, B/Y item slots, RT galdr, RB roll, LB shield, Start/Select menu/map.
15. **Open questions resolved**: title Fimbulvetr; Embla story-only in Act II, binding clock in the final fight;
    keep Kolbeinn spare/kill; night spawns fixed per region tier, lowland difficulty scales with runestones lit;
    one difficulty + accessibility; no Tauri; sv + en from day one.

These edits are applied to the GDD itself (with a short changelog at the top) as the first implementation step.

## 2. Decisions (agreed 2026-09-26)
| Topic | Decision |
| --- | --- |
| Scope | Whole game, iteratively; placeholder art throughout |
| Art | Code-drawn pixel art (palette-indexed grids + procedural tile painters) → textures at boot; GDD frame names so real atlases swap in key-for-key |
| Seasons | Hybrid (story sets, clock cycles between beats) |
| Screens | Flip-screen with slide transitions; screen = unit of layout, spawns, cover, autosave |
| Maps | ASCII text maps in TS (40×22) + typed entity lists; runtime blob-47 auto-tiling |
| Languages | Swedish + English from day one, inline `{ en, sv }` |
| Architecture | Pure TS core (rules + simulation, zero Phaser/DOM) + thin Phaser shell |

## 3. Architecture

### Principles
- **Core is the game.** `Sim.step(input)` runs all rules at a fixed 60 Hz, headless. Phaser only draws, reads
  input, plays audio.
- **State is truth, events are one-shots.** Views re-derive from sim state every frame (idempotent); events carry
  only sfx/fx/shake/toast/autosave triggers.
- **Two input channels**: per-tick `InputFrame` (gameplay, dialogue) and queued `Command` (menus, shops, saves,
  warps, dev cheats). Both recordable → replays.
- **Deterministic**: seeded RNG only; no `Math.random`/`Date.now`/`Math.sin` in core (table trig); integer HP/silver.
- **Names are contracts**: flag/item/screen/frame/sfx ids are typed string unions; code-drawn and real assets share them.

### Layout and import boundary
```
src/core/     math/ clock/ state/ (gameState, flags, save, migrations/) world/ (layout, parse, collision, cover,
              spawns, npcs) sim/ (sim, entities, events, commands, systems/) actors/ (fsm, hero, enemies/, bosses/)
              combat/ items/ story/ (cond, effects, dialogue, quests, cutscene) input/ i18n/
src/content/  flags items galdr gear enemies spawns quests npcs shops i18n/ui dialogue/<npc> cutscenes/
              world/{legend,layout}.ts world/<region>/<screenId>.ts dungeons/<dN>/ dev/presets  index.ts → DB
src/art/      palettes raster outline compose painter autotile grading font sprites/ tiles/  (pure → RGBA buffers)
src/shell/    main scenes/ view/ gfx/ audio/ input/ platform/ (idb, saveStore, settings, exportImport, pwa) dev/
tests/        unit/ content/ art/ sim/ replays/ fixtures/saves/ e2e/
```
Allowed imports: content → core; art → core, content; core → content **types only**; shell → all. The shell
composes `new Sim(DB, state, opts)`, so tests inject fixture content.
Enforced by **split tsconfigs** (`tsconfig.pure.json` for core/content/art with `lib: ES2023, types: []` → any DOM
global is a compile error; `tsconfig.shell.json` adds DOM) plus **ESLint** `no-restricted-imports` (phaser, @shell/*,
value imports of @content in core) and `no-restricted-properties` (Math.random, Date.now, Math.sin/cos/atan2).
Strict TS with `noUncheckedIndexedAccess`, `verbatimModuleSyntax`.

### Core model (key shapes)
- **Registries**: `FLAGS = {...} as const satisfies Record<string, FlagSpec>` → `FlagId`; same for ItemId,
  GaldrId, EnemyId, NpcId, QuestId, SfxId, ScreenId… Typos are compile errors. Text type `L10n = Record<'en'|'sv', string>`
  (missing Swedish = compile error).
- **GameState** (plain JSON): seed + rng, flags, hero (screen, pos, hp in quarter-hearts, seiðr, silver, purse),
  inventory (items, 2 slots, galdr, weapon/armor/ring), clock, world (opened chests, pieces, warps, visited bitset,
  cover cleared-bitsets tagged with season epoch, per-screen switches), playTicks.
  **SaveData** = `{ format, v, build, savedAt, state, sum }` (FNV-1a); `loadSave` = checksum → migrate chain → validate.
  Every schema version ships a fixture that must load forever.
- **WorldClock** (sole writer of time/season/weather): `tick() → ClockEvent[]` (dawn, dusk, newDay, season, weather),
  `phase()`, `light()`, `setSeason(s, 'story'|'loom')`, `sleepUntil()`; season advance gated by `rules.gates(flags)`;
  Hrímfjöll always winter until the ending. Weather is a pure hash of (seed, day, region) against the season table.
- **World**: `layout.ts` places named ScreenIds (`ask_farmyard`) on the 16×12 world grid → neighbours; dungeons
  have per-floor grids (`d1_r05`); interiors via doors (`ask_int_longhouse`). `ScreenDef = { id, map: string[22],
  legend?, things: Thing[], purpose, dark?, music?, spawns? }`; `Thing` = npc | enemy | chest | door | secret |
  trigger | sign | brazier | warp | save | piece. Multi-screen rooms via `size`.
- **Collision**: terrain grid → flag grid (SOLID, WATER, DEEP, HOLE, LEDGE_*, ICE, SLOW), patched per tile by
  cover/secrets. Feet AABBs (hero 12×8), X-then-Y moves, **Zelda corner slide** (nudge ≤6 px), ledges one-way,
  holes/deep water → fall + respawn at screen entry.
- **Ground cover**: `Uint8Array` per screen (kind + CLEARED + BURNING + fire timer); `clearAt(tool)` may reveal a
  Thing; `tickFire(wind)` spreads downwind. Only cleared bits are saved, tagged with season epoch → regrowth free.
  Winter lakes and Ís are both `Ice` cover on water.
- **Entities**: plain data (pos/prev/vel, body/hurt boxes, faction, hp, iframes, fsm `{s,t}`, anim, mem); data-driven
  `Machine<S>` state machines per behaviour; `HitData { amount, element, knock, dir, faction, tags }` and one
  `resolveHit` path for sword, arrows, galdr, fire, traps. Shield = facing test unless HEAVY; roll = 12 i-frames.
- **Story**: `Cond` (flag/item/quest/season/night/weather/all/any/not), `Effect` (set/add/give/take/silver/heal/
  setSeason/sleep/cutscene/shop/sfx). Dialogue graph with first-match `pick`, choices, typewriter in core.
  Quest status **derived from flags** (last stage whose `when` holds). Cutscenes = step lists run in core.

### Frame loop and events
Play scene `update`: accumulate delta (clamped 100 ms), run ≤4 fixed steps with `input.consume()`, dispatch
`sim.drainEvents()` (sfx, fx, shake, flash, coverChanged, screenTransition, screenEntered → autosave, itemGet,
toast, music, clock, gameOver), then `views.sync(sim, alpha)`. Screen transitions are owned by core
(`rt.transition`); the shell slides the new screen container in (~0.5 s) and drops the old one.

### Shell scenes
Boot (WebGL check, settings, art pipeline → atlas pages, SFX buffers, IndexedDB) · Title (press-any-key audio
unlock; continue/new/load/import/export; language; SW update prompt; Safari nudge) · Play (Sim, input mapper,
screen view with ground/cover/canopy tile layers, entity views y-sorted, weather, visibility layer, world camera
with ColorMatrix) · Ui (untinted HUD, dialogue, banners) · Menu (inventory, map, quests, settings, save/export →
Commands) · Dev (dev/test builds only).

### Code-drawn art
- Sprites = palette-indexed text grids (lowercase base, UPPERCASE shade), **composed from parts + pose tables**
  (300 hand-typed hero frames is not viable); `outline()` adds 2 px (characters) / 1 px (props) from alpha;
  `recolor()` for palette swaps incl. colour-blind. 32×32 characters, 48×48 attack frames. Missing art → labelled
  magenta capsule.
- Tiles = procedural painters (`fill, px, rect, speckle, dither, edge, rng`) → all 47 blob variants per autotiled
  terrain + 2–4 plain variants picked by hash(x,y); seasonal cover tiles and tree canopy frames.
- Shell shelf-packs frames into ≤2048² canvas pages → `textures.addCanvas` + per-frame `add()`; a FrameIndex maps
  frame → page. Later, `public/atlases/manifest.json` overrides frames by name — no code changes.
- `grade(season, light, weather, colourBlind) → number[20]` feeds the camera ColorMatrix (set only on change).
  Visibility RenderTexture (clear, fill, erase lights, render) only when dark/foggy. Weather = pooled emitters ≤500
  particles, wind → particle acceleration.
- Bitmap font drawn from grids (charset incl. å ä ö æ ø ð þ ǫ + accented vowels), three drawn sizes for the text-size option.

### Input
Phaser keyboard/gamepad plugins off. `KeyboardEvent.code` listeners (layout-independent WASD), Gamepad API polling
(standard mapping), presses latched until a tick consumes them, bindings in settings, hold-to-toggle shield as a
mapper transform (core never sees it).

### Persistence (standard Web APIs only)
- IndexedDB `fimbulvetr` v1 (~80-line promise wrapper): store `saves` (`auto`, `auto_prev`, `s1`–`s3`, each with a
  summary for the load screen) and `meta` (lastSlot, lastExportAt, persistAsked).
- Autosave on `screenEntered` (snapshot sync, write debounced ≤1/4 s, `auto` rotates to `auto_prev`, flush on
  `visibilitychange`); manual slots at mead halls/hofs with `durability: 'strict'`.
- Single tab via `navigator.locks`. Export = Blob download of SaveData JSON; import = `<input type=file>` →
  checksum (warn only) → migrate → validate → pick slot. `storage.persist()` on New Game / first save.
- Settings in `localStorage['fimbulvetr.settings.v1']`, merged over validated defaults.
- PWA via vite-plugin-pwa, `registerType: 'prompt'` (never swap code mid-session), precache everything (~1 MB).

### Phaser 4 gotchas (verified in 4.2.1 source)
ColorMatrix values via `.colorMatrix.set(m20)` (offsets 0–255; the cameras skill doc's `fx.grayscale()` example is
wrong) · RenderTexture draws only on `render()`, lost on context loss (we redraw each frame) · call `refresh()` after
redrawing a canvas page · `setTintFill` removed → `setTint(c).setTintMode(Phaser.TintModes.FILL)` · synthesized
AudioBuffers go into `cache.audio` and play through `this.sound` · ESM build is monolithic (~355 KB gz, accept) ·
CI WebGL is SwiftShader: screenshots/errors valid, GPU timings not.

### Testing and dev tooling
- **Vitest (node)**: RNG, clock, weather distribution, collision, cover + fire, resolveHit, FSM timing, dialogue,
  quests, inventory, save migrations/fixtures, art decoders.
- **Content integrity**: flags read-but-never-set, doors/warps valid, map sizes + legend, **walkable seams between
  neighbours**, unique chest/piece ids, heart total = 20, both languages present + in font charset, frame names
  exist, spawn tables valid, `purpose` present.
- **Progression solver** (from M1): gate graph × items × flags × season → proves intended order, blocks known breaks.
- **Sim harness + route tests**: `harness({screen, season, time, give, seed}).hold('right', 90).press('sword')…`;
  determinism test (same seed + inputs → same `hash()`); recorded replays become regression tests; per-milestone
  autopilot route from New Game to the milestone's goal flag.
- **Playwright** (Chromium + WebKit) against a test build exposing `window.__fimbul`: smoke warps every screen ×
  season × time, fails on console errors/missing frames; ~20 golden screenshots; save round-trip; frame-time spec.
- **Dev**: query string `?screen=&at=&season=&time=&weather=&seed=&preset=&flags=&give=&lang=&nosave&mute`;
  F1 overlay (DOM, readable by Playwright), F2 hitboxes/collision, F3 cover grid, F4 step; backtick console
  (warp, season, time, flag, give, god, noclip, speed…); `/dev/world.html` stitches a whole region into one image.
  Dev code is dynamically imported and tree-shaken from production.
- **Budgets** (scripts/check-budget.mjs + Playwright): Phaser chunk ≤380 KB gz, app+content ≤350 KB gz, art
  pipeline ≤300 ms, title ≤2.5 s, sim step p95 ≤2 ms, JS frame p95 ≤6 ms, ≤500 particles, heap <100 MB, save <150 KB.

## 4. Roadmap

Rhythm per milestone: brief `docs/briefs/mN.md` (screens, NPCs, quests, flags, rooms) approved by the user before
content is written → sessions on a feature branch, each ending with `pnpm check` + Playwright green → user playtest
+ Swedish proofread → a save fixture committed that every later milestone must load. The data model covers the
full game from M0; systems land in the milestone whose content first needs them.

| # | Milestone | New systems (highlights) | Content | Sessions |
| --- | --- | --- | --- | --- |
| M0 | Foundations | project, boundaries, fixed-step sim, input, text maps + autotile, collision, hero FSM, damage, flip-screen, clock + tints, dev tools, saves, settings, PWA, CI/Pages | 3 test screens | 7–9 |
| M1 | Vertical slice (1a farm days · 1b raid + road · 1c Rótarhellir) | font, dialogue, cutscenes, NPC schedules, interiors, push/lift/throw, grass + leaf cover, quests, shop, HUD, pause/map, enemy AI + telegraphs, storm, darkness + lantern, dungeon doors/keys/chests/map/compass, boomerang, boss framework, SFX, solver v1 | Askdalr 8 + 3 interiors, Myrkviðr 9 + 1, Rótarhellir 12 rooms + Rótvættr, 18 NPCs, vargr/draugr/root-biter | 16–18 |
| M2 | Uppvík + turning world | 5 weathers, snow/mud, spawn tables, trolls ↔ stone, economy, gear, galdr + seiðr, Eldr + fire spread, mead, title/3 slots, settings UI | Uppvík hub, Myrkviðr +4, völva, huldra, vargar hunt, +3 enemies | 11–13 |
| M3 | Mýrland + D2 | water levels, bombs, seasonal fords, fishing, ferry gated by `pass_open` | 10 screens, D2 16 rooms + Lindormr | 10–11 |
| M4 | Haugar + D3 | bow, Farvegr + warps, dark rooms, mini-boss, huscarl techniques, runestone scaling | 10 screens, D3 20 rooms + Haugbúi King | 11–12 |
| M5 | Act I finale — **public demo** | pass → winter snap, Hlíf, credits stub | Askdalr aftermath, trading chain 1–3, farm rebuild 1–2, 10 side quests | 6–8 |
| M6 | Niflmýrr + D4 | fog, grapple, rune-staves, Ís, Ljós, thanes, captives | 10 screens, D4 22 rooms + Náströnd | 11–12 |
| M7 | Sævatn + Refuge + D5 | swim/dive, Vindr, Refuge hub, Embla joins, Norns' loom | 13 screens, D5 24 rooms + Nykr | 12–14 |
| M8 | Dvergagröf + D6 | hammer, Skjálfti, lava/conveyors/heat, ember byrnie, escort AI | 10 screens, D6 28 rooms + Ívaldi | 11–13 |
| M9 | Hrímfjöll + D7 | killing frost, ice sliding, beams + mirror, blizzards, Bragð duel | 10 screens, D7 32 rooms + Hrímgerðr | 11–13 |
| M10 | Útgarðr + ending | room-template library, Kolbeinn duel + spare/kill, Hrímnir 3 phases + binding clock, stay/go | D8 40 rooms, epilogues | 13–15 |
| M11 | Completion + ship | achievements, accessibility completion, Safari/perf pass | 25 side quests, 45 NPCs, 36 heart pieces | 10–14 |

Cut lines agreed up front: D8 40→28 rooms, fewer Act II side quests, 3 highland dungeons if M6–M9 overrun by 30%.
Real art/music is a parallel track that swaps texture/audio keys with no code changes.

## 5. Milestone 0 — Foundations (task outline)

Work on branch `m0-foundations`, one commit per task, TDD for everything in core/art. Nothing is pushed to GitHub
without asking first.

1. Scaffold: pnpm, exact pins (phaser 4.2.1, vite 8, typescript), split strict tsconfigs, index.html, `src/shell/main.ts`.
2. ESLint flat config (typescript-eslint strict, boundary + determinism rules), Prettier, `pnpm check`.
3. Vitest (node) + Playwright (Chromium + WebKit vs `vite preview`); smoke spec: canvas exists, zero console errors.
4. `CLAUDE.md` (commands, layer rules, TDD, never rename persisted ids, migration rule, bilingual rule, read
   `node_modules/phaser/skills` before shell work, plan before changing core), `ARCHITECTURE.md`, `docs/roadmap.md`.
5. Core math: seeded RNG (mulberry32), vec, box, hash (FNV-1a), table trig, Dir4.
6. **Full-game data model v1**: id unions for all regions/dungeons/items/galdr/gear/rings/seasons, flag registry,
   GameState, `newGame()`, SaveData + validator.
7. Fixed-timestep loop helper (60 Hz, ≤4 catch-up steps, alpha).
8. Input: actions, `InputFrame`, edge latching; keyboard (`code`) + Gamepad API sources; default bindings as data.
9. Text-map parser + legend (40×22 enforced, row/col errors) and blob-47 auto-tile index.
10. World layout + screen model; 3 test screens in an L; content-integrity test v1 (sizes, legend, seams, ids, purpose).
11. Tile collision with corner slide, ledges, no tunnelling at roll speed.
12. StateMachine + hero (walk, 3-hit combo, charge → spin, roll with 12 i-frames + cooldown, shield) with tuning in one file.
13. Combat: HitData, factions, resolveHit, training dummy.
14. `Sim.step` + events + commands; edge exit → neighbour at mirrored position; no neighbour = solid; determinism test.
15. Art: palette, sprite-grid decoder, part composer, outline, tile painters (grass, dirt, water, cliff, wall, path),
    hero + dummy sprites, frame-name registry.
16. Shell Boot: atlas packing → canvas textures, anims; Play scene: tilemap layers, entity views with interpolation +
    y-sort; `?dev=gallery`.
17. Integer scaling + letterbox + `pixelArt: true`.
18. Flip-screen slide transition.
19. WorldClock + season policy + weather roll (clear only rendered in M0) with unit tests.
20. `grade()` + camera ColorMatrix (world camera only; UI camera untinted).
21. Dev query parser + `window.__fimbul` test hook + F1 DOM overlay + backtick console (warp/season/time).
22. Saves: IndexedDB wrapper (tested with fake-indexeddb), save store with auto/auto_prev/slots, debounced autosave,
    migrations pipeline + v1 fixture, export/import, `storage.persist()`, `navigator.locks` single tab.
23. Settings (localStorage) + i18n `t()` + language toggle.
24. Procedural SFX bank (swing, hit, roll, step) via cache.audio; audio unlock on first key.
25. PWA (vite-plugin-pwa, prompt update, generated icons via a node script with `node:zlib` PNG encoder).
26. Budget script; CI workflow (typecheck, lint, Vitest, build, budget, Playwright both browsers).
27. Pages deploy workflow (base `/Fimbulvetr/`) — committed, but enabling Pages and the first push need the user's OK.
28. M0 exit e2e (written first, red until the end): move, hit dummy, roll, shield, walk A→B→C→A, night/winter
    tints via query, reload resumes on screen B, export → import round-trip.

## 6. How execution proceeds after this plan is approved
1. Apply the GDD changes in §1 to `Fimbulvetr-game-design-document.md` (changelog at top) and save this spec as
   `docs/superpowers/specs/2026-09-26-fimbulvetr-design.md`; commit on branch `m0-foundations`.
2. Invoke **writing-plans** to expand §5 into a step-level M0 implementation plan
   (`docs/superpowers/plans/2026-09-26-m0-foundations.md`) for review; the user picks the execution method
   (recommended: subagent-driven development, one subagent per task with review between tasks).
3. Execute M0; finish with a user playtest in the browser. Then write the M1 brief for approval and continue
   milestone by milestone.

## 7. Verification (M0)
- `pnpm check` → tsc (both projects) + ESLint (boundary rules fire on a planted violation test) + Vitest all green.
- `pnpm build` + `node scripts/check-budget.mjs` within budget.
- `pnpm e2e` → Playwright smoke + M0 exit spec green on Chromium and WebKit.
- Manual: `pnpm dev`, open in the in-app browser — walk the three screens, fight the dummy, try
  `?season=winter&time=night`, F1 overlay, reload to resume, export/import a save, go offline and reload (PWA).
