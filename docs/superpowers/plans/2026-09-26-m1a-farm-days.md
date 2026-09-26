# M1a Farm days — implementation plan

**Goal:** Build the Askdalr prologue (days 1–3) on top of the M0 foundations: dialogue, cutscenes, NPCs, lift, carry and throw, tall grass, the shop, the HUD, and interiors with fade transitions. It ends at the `st_raid_begun` beat.

**Brief:** `docs/briefs/m1.md`. **Spec:** `docs/superpowers/specs/2026-09-26-fimbulvetr-design.md`. **Ledger:** `docs/superpowers/ledgers/2026-09-26-m1a-farm-days.md`.

**Branch:** `claude/loving-bell-65jdxz`. One commit per task, with `pnpm check` green before each commit.

The work is 23 tasks, one commit each, with `pnpm check` green before every commit. TDD applies to core, content and art. New games keep starting in `test_a` until Task 20, so stopping after any task still leaves a green, playable build.

Before shell work I run `pnpm install` and read `node_modules/phaser/skills/<topic>/SKILL.md`. At the end I push to `claude/loving-bell-65jdxz`, because the cloud container is temporary. **Approving this plan counts as the "ask" that CLAUDE.md requires before pushing.** I will not open a PR.

### Core interface changes (CLAUDE.md "plan first")

**`Sim`**
- It becomes an orchestrator over `src/core/sim/systems/*`, with a shared `SimRt` in `sim/rt.ts`.
- `mode` becomes `'play' | 'transition' | 'story'`. One `StoryRun` script runner drives dialogue, cutscenes, the shop and cards. Its state is plain JSON (ids and numbers only).
- `transition.kind` is `'slide'` (30 ticks, as today) or `'fade'` (36 ticks, the screen swaps at tick 18).
- `actors: Entity[]` replaces the private `enemies` and holds enemies, NPCs, critters and props. `get enemies()` stays as a filter.
- New read-only accessors: `storyUi()`, `fade()`, `cover`.
- `originOf()` now also works for off-grid screens.
- `hash()` now also covers `actors`, `story`, the cover bits and `nextId`.

**`Command` and `SimEvent`**
- `Command` gains `buy` and a dev-only `give`.
- `SimEvent` gains `autosave`, `coverChanged` and `itemGet`.
- The shell autosaves on `autosave`, which fires only when the game returns to play mode after a screen change or a script's `save` step. A save therefore never catches a cutscene halfway through.

**`ContentDb`**
- New entries: `npcs`, `dialogue`, `scripts`, `quests`, `shops`, `props`, `critters`, `cover`, `coverLegend`.
- `TerrainDef` gains `ledge?: Dir4` and `slow?`.
- `ScreenDef` gains `indoor?`, and `things` becomes the full union.
- `Tuning.weapons[WeaponId]` gains carry, throw and story text speed.
- `indexLayout(layout, ids)` gives each off-grid screen a stable pocket origin below the grid.

**`GameState` / `SaveData`: no shape change and no `SAVE_VERSION` bump.** M1a state fits existing fields:
- flags, including int flags
- `world.vars.ask_pen_mask` (which sheep are penned)
- `world.cover` (hex bitset plus the season epoch; decoding never throws)
- `world.pieces`, `inv.items` and `inv.slots`, `hero.silver`
- `inv.weapon = 'handaxe'`, which is a new id added to the union

Interiors are ordinary 40×22 maps with void around the room, so the validator's bounds still hold. `NewGameInit` gains optional `flags` and `minute`, which is additive. The milestone fixture `tests/fixtures/saves/v1-m1a.json` covers an interior screen, cover data, vars and int flags.

### Tasks

**A — Carry-overs** (no gameplay change)

1. **Docs.**
   - Write `docs/briefs/m1.md` (Part 1 above), `docs/superpowers/plans/2026-09-26-m1a-farm-days.md` and the M1a ledger.
   - Tick M0 in `docs/roadmap.md`.
2. **Split `Sim` into systems.**
   - `sim/rt.ts`, plus `systems/{movement,combat,transition,spawn,timers,clock}.ts`.
   - Test first: `tests/sim/golden.test.ts` pins the determinism-script `hash()` before and after the split.
3. **`ActorCtx`.**
   - Replaces `EnemyCtx` with `{ tuning, rng, hero, solidAt, emit }`.
   - Hurt-path tests (`hurtIframes`, `PIERCE_SHIELD`) through a fixture behaviour that attacks.
4. **Off-grid screens, fade transitions and doors.**
   - Add a dev-only screen `test_int`.
   - `Thing` becomes a real union with `door` as its second variant; restore `switch (thing.k)` with a `never` default.
   - Tests:
     - interior origins are distinct
     - the fade swaps the screen at its midpoint
     - the clock pauses during slides and fades
     - a diagonal corner step no longer chains two transitions
     - warping to an interior works
5. **One-way ledges, slow terrain and a hero `hop` state.**
   - Collision gains `LEDGE_*` and `SLOW` bits and `solidAtMoving`.
   - Tests in `collision.test.ts` and `hero.test.ts`.
6. **Harness, presets and dev query.**
   - `TEST_START` (the M0 kit) becomes the harness default.
   - Add `content/dev/presets.ts` with the presets `m0`, `day2`, `day3` and `night3`.
   - `DevQuery` gains `preset` and `dev=gallery`.
   - The M0 e2e boots with `&preset=m0`.

**B — Core systems** (headless, tested through the harness with fixture DBs)

7. **`Cond`, `Effect`, quests, `sleepUntil` and the id registries.**
   - Files: `src/core/story/{cond,effects,quests}.ts`.
   - A quest's stage is the last stage whose `when` holds.
8. **Dialogue graph.**
   - Picks the first entry whose condition holds; supports choices with conditions and effects.
   - The typewriter counts ticks against max(en, sv) length, so the language setting never affects determinism.
   - Input is ignored on the tick the dialogue opens (E is both interact and confirm).
9. **Script runner and story mode.**
   - Steps: `talk`, `say`, `move`, `face`, `wait`, `fade`, `do`, `warp`, `shop`, `card`, `if`, `save`.
   - Interaction probe for `sign` and `use` (the bed); `trigger` zones start scripts.
   - Tests: the clock is paused during a story, `autosave` fires only after it ends, and `sleep` moves to the next morning at 06:00.
10. **NPCs.**
    - `NpcDef.places` is a list of `{when, screen, at, facing, patrol?}`; the first match decides where the NPC is. Positions are derived and never saved.
    - NPCs face the hero when talked to, and their patrol pauses.
    - Includes the corner-slide tie-break against an NPC box.
11. **Lift, carry, throw, set down, props and drop zones.**
    - Hero states `lift`, `carry` and `throw`.
    - Thrown props hit through `resolveHit`, and fragile ones break.
    - Big logs break only from the spin (`TAG_SPIN`).
12. **Critters.**
    - Sheep wander, flee and can be pushed. A pen zone fills `ask_pen_mask`.
    - Ravens flee and are hurt only by thrown objects, each hit adding to `q_ravens`.
    - All randomness comes from `state.rng`.
13. **Ground cover v1: tall grass.**
    - Files: `src/core/world/cover.ts`.
    - The sword and the spin cut grass; tall grass slows to 60%.
    - Cleared bits are saved per screen, tagged with the season epoch; a changed epoch means the grass has regrown.
    - Cuts emit `coverChanged`.
14. **Shop, `buy`, the `handaxe` weapon and heart pieces.**
    - Buying returns `ok | poor | owned | full`, and the item goes to the first free slot.
    - The weapon tuning comes from `Tuning.weapons`.
    - Four heart pieces make one heart.

**C — Art** (pure, TDD)

15. **Bitmap font** (`src/art/font.ts`).
    - The charset includes å ä ö æ ø ð þ ǫ, the acute vowels and typographic punctuation.
    - Glyphs have variable widths, and `layoutText()` wraps text.
16. **Sprites.**
    - Compose the 13 NPCs from parts with palette swaps, 4 directions each.
    - Draw sheep, raven, pail, stone, pot, small and big logs, rock, heart piece and shadow.
    - Hero: `lift`, `carry`, `throw` and `hop` animations, plus a hand-axe variant.
17. **Tiles and SFX.**
    - Terrain: fence, field, yard, longhouse wall and roof, wood floor, interior wall, void, stream, ford, ledge.
    - Cover tiles: tall grass and stubble.
    - SFX: `sfx_talk`, `sfx_lift`, `sfx_throw`, `sfx_break`, `sfx_door`, `sfx_buy`, `sfx_bleat`, `sfx_caw`, `sfx_itemget`.

**D — Shell**

18. **World view.**
    - Draw the cover layer and fade transitions, and give `indoor` screens a warm grade.
    - Views for NPCs, critters and props, including height (`z`) and shadows.
    - Autosave on the `autosave` event.
    - The `?dev=gallery` scene, imported dynamically.
    - A demo corner in `test_b` with a sign, pots, stones, grass and a door to `test_int`.
19. **`UiScene`** (untinted camera).
    - Hearts, silver and the item slots.
    - A dialogue box with typewriter, choices and a talk blip; the shop panel; the fade overlay and cards.
    - The font goes through `BitmapText.ParseFromAtlas`. If the Phaser 4 skill doc says otherwise, the fallback is packed glyph images.
    - The dev hook gains `story()`, `flags()`, `silver()` and `actors()`.
    - e2e test covering a sign and the door fade.

**E — Content** (as the brief approves)

20. **Askdalr world.**
    - Registries, legend and cover legend; the 8 screens and 3 interiors.
    - `NEW_GAME` moves to `ask_int_longhouse`: day 1, 06:00, hand-axe, no shield.
    - Integrity test v2: doors and arrival tiles are valid, every interior has a way out, seams match, things stand on walkable tiles, and grid positions are unique.
21. **NPCs, dialogue, chores, cutscenes, quest and shop.**
    - Content: 13 NPCs × 3 days in en and sv; the Embla scenes for days 1–3; sleep; `raid_begins`; `q_chores`; Sigrún's shop.
    - Integrity test adds:
      - flags read but never set
      - both languages present, font charset, at most 3 lines
      - valid node and NPC references
22. **Exit tests.**
    - `tests/sim/route_m1a.test.ts`: New Game → `st_raid_begun` driven by a BFS walker in `tests/sim/walk.ts`, plus determinism over the whole route.
    - `tests/e2e/m1a.spec.ts`: talk, lift and throw, door fade, sleep, shop.
    - The smoke test warps to every screen.
    - The `v1-m1a.json` fixture test.
23. **Docs and handoff.**
    - `ARCHITECTURE.md`: the new systems, and how to add an NPC, a dialogue or an interior.
    - Tick `docs/roadmap.md`, close the ledger, write the M1a handoff.
    - Run `pnpm build && pnpm budget`, then push.

**Story flow:**
- The evening trigger in the longhouse runs `embla_dN` once that day's chores are paid and its scene hasn't played.
- Until that scene has played, the bed says "not tired yet". After it, sleeping adds 1 to `st_farm_day` and moves to 06:00.
- On day 3, sleeping runs `raid_begins` instead: horns, `st_raid_begun` is set, and a "to be continued" card shows.

**Deferred on purpose:**
- Grid block-pushing and chests move to M1c.
- Using the lantern and the pause/map menu move to M1b.
- NPCs are placed by `NpcDef.places` rather than by an `npc` Thing, so there is only one placement mechanism.

### Reuse
- `moveBox`, `gridSolidAt` and `buildCollision` (`src/core/world/collision.ts`)
- `runFsm` and `changeState` (`actors/fsm.ts`)
- `resolveHit` (`combat/hit.ts`)
- `setMinute`, `setSeason` and `tickClock` (`clock/clock.ts`)
- `t()` (`core/i18n/t.ts`)
- `canonicalJson` and `fnv1a` for the hash
- `createPainter`, `decodeGrid`, `outline` and `packShelves` (art)
- `registerSprites` / `FrameIndex` (Boot)
- `Harness` (`tests/sim/harness.ts`)
- The e2e helpers in `tests/e2e/helpers.ts`

### Risks
- **Hash coverage.** Add a "hash diverges when X differs" test for each newly hashed part.
- **Autosave timing.** Save only on `autosave` so a save never lands mid-story.
- **Breaking tests with the new start.** Moving `NEW_GAME` breaks tests that assume the M0 start, so Task 6 has to land before Task 20.
- **Route test run time.** Give the BFS walker a tick budget per leg and treat NPCs as obstacles.
- **Scope.** This is a big session. If time runs out, I stop at a task boundary and record the rest in the ledger and handoff.

### Verification
- `pnpm check` green after every task. Headless sim tests prove each system, and the golden-hash, determinism and route tests prove the whole flow.
- `pnpm e2e` on Chromium (and WebKit if it is available in the container): the M0 spec with `preset=m0`, the new M1a spec and the smoke warp over all screens.
- `pnpm build && pnpm budget` within 730 KB gzipped.
- Manual check with the run skill or Playwright: New Game → talk to Halvar → herd the sheep → carry the pail → buy the lantern → sleep through the 3 days → "to be continued"; `?dev=gallery`; `?preset=day3&season=summer&time=21:00`. Screenshots go into the session.
