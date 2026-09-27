# World polish — implementation plan

Spec: `docs/superpowers/specs/2026-09-27-world-polish-design.md`. Ledger: `docs/superpowers/ledgers/2026-09-27-world-polish.md`.

## Implementation steps

Branch: `claude/world-polish` (one branch for the session, never push without asking). Each step: failing test first, then code, then `pnpm check` green; each step is a commit. Steps 5 and 6 land together so objects are never invisible in between.

1. **Core: `DecorDef`, `decorPlacements`, `decorFeet`, `decorArt`.** Tests `tests/unit/core/decor.test.ts`: 2×2 well anchors at top-left; `tttttttttt` → five tables; a row of trees plus one below → five 1×1 in row-major order; `UUU` one block and `UUUU` throws "incomplete"; `b` over `b` one bed and `bb` throws; an overlapping arrangement throws "overlaps"; a block at column 39 throws "runs off"; grass/water produce nothing; `decorFeet` of a 2×2 at (14,12) is (240, 222); `decorArt` is stable. Code: `src/core/world/terrain.ts`, new `src/core/world/decor.ts`. Add the `decor` fields to `src/content/terrain.ts` now (inert until step 6).
2. **Core: sign/use rectangles.** Test in `tests/sim/story.test.ts`: a `sign` with `w: 2, h: 2` at (12,8) opens from (13,10) facing north; the 1×1 case still works. Code: `src/core/world/screen.ts` (`sign`, `use` get `w?`, `h?`), `src/core/sim/systems/story.ts:333,339`. Integrity test: rects inside the grid.
3. **Art: tileset frames, groups, animated water and ford.** Tests in `tests/unit/art/tiles.test.ts`: total tile count = Σ `count·frames`; water and ford have `frames 4, frameMs 150`, everything else 1; `tileAnimations` returns 94 items and the fully-surrounded water item lists `[s+46, s+93, s+140, s+187]`; frame 0 vs frame 1 of a surrounded water tile differ in 1–63 pixels; 3×3 water with a `ford` centre gives the ford index 46 (no inset). Code: `src/art/tiles/terrain.ts` (interface, `flow()`, extract `roof(p, mask)`), `src/art/tiles/tileset.ts` (frame-major loop, `tileAnimations`), `src/art/tiles/indices.ts` (`groupMask`, group predicate).
4. **Content + art: `door_shut`, `window`, `chimney`, `jetty` and the E map edits.** Tests first: the integrity describes from section E, legend maps `d + C J`, tiles tests for water-next-to-jetty and roof-next-to-chimney. Code: `src/content/terrain.ts`, `src/content/world/legend.ts`, painters in `src/art/tiles/terrain.ts`, maps `ask_village.ts`, `ask_farmyard.ts`, `ask_hof.ts`, `ask_brook.ts`.
5. **Art: decor and fx frames.** Tests in `tests/unit/art/sprites.test.ts`: every `TERRAIN[id].decor.art` has `ANIMS[art].idle` and drawn frames; `fx_fish` has 8 frames, `fx_smoke` 3 with `w === h` and centred origin; well/trough/hearth frames pairwise differ; margin test covers `decor_` and `fx_fish_` at 1 px. Code: new `src/art/sprites/decor.ts`, `src/art/sprites/fx.ts`, registered in `src/art/sprites/index.ts`.
6. **Shell decor + content footprints go live.** Tests: `tests/unit/shell/tileAnims.test.ts` (keys, cumulative `startTime`, durations sum, `animateTiles` mutates a fake `tileData`); integrity "every screen's decor footprints are complete"; tiles test "decor tiles carry no object pixels" (no `water` in well, no `ember` in hearth, no `leaf` in tree, …). Code: `src/shell/gfx/tileAnims.ts`; `ScreenView` (decor images, `animateTiles`, `tick`, `fadeBehind`, `stats`, `destroy`); `EntityViews.bounds`; `PlayScene` (`screens` map holds `{ view, ambient }`, `showScreen` builds placements via `decorPlacements`/`decorArt` with `fnv1a(id)`, `draw()` ticks and fades every stage before `applyGrade`, `dropScreensExcept` destroys both); base-only painters; the A map edits and `use`/`sign` rects. Run `route_m1a` and `golden` here before moving on.
7. **Ambient: fish and smoke.** Tests `tests/unit/core/ambient.test.ts`: 5×5 water → only the centre; a 4-wide brook → columns 27–28; ford counts as water via the predicate; `fishJump` fires in 70–130 of 800 slots and never returns ≥ `cells`. Code: `src/core/world/ambient.ts`, `src/shell/view/ambientView.ts` (read `node_modules/phaser/skills/particles/SKILL.md` first), wiring in `PlayScene`.
8. **Dev hook.** `DevBridge`/`FimbulHook` gain `view(): ViewStats` (`screens, decor, animatedDecor, animatedTiles, emitters, openWater, fishAlive, fishJumps`) and `jumpFish()`; update the two bridge literals in `tests/unit/shell/devHook.test.ts`. Optional overlay line.
9. **Arm swing.** Tests: `hero_walk_s_1` vs `_3` differ in x 8–9, y 12–26 while `_0` vs `_2` match there; `hero_walk_w_1` vs `_3` differ in x 10–18, y 16–23; `carrywalk` arms unchanged; east = `flipX(west)` for `_1` and `_3`; same for `npc_halvar`. Code: `hero.ts` `torso()` + call site, `people.ts`.
10. **Nameplate.** Test in `tests/content/text.test.ts` (tab width bound). Code: `UiScene.drawStory`.
11. **E2E `tests/e2e/world.spec.ts`** via `window.__fimbul.view()`: village has decor and emitters; brook has animated tiles and open water, `jumpFish()` → `fishAlive` 1 then 0, `missingFrames()` empty; longhouse has ≥ 4 decor and 0 emitters; sliding farmyard → village leaves `screens === 1`. No wait-for-a-natural-fish test (flaky on WebKit).
12. **Docs.** Save this design as `docs/superpowers/specs/2026-09-27-world-polish-design.md` and the steps as `docs/superpowers/plans/2026-09-27-world-polish.md`; update `ARCHITECTURE.md` (decor, animated tiles, blob groups, `AmbientView`, sign/use rects) and tick `docs/roadmap.md`; add a short ledger like the M1a one.

## Verification

- `pnpm check` after every step; `pnpm e2e` and `pnpm build && pnpm budget` at the end (gzipped JS is 380 KB of a 730 KB cap; Phaser is imported whole, so particles and tile animation add nothing).
- Existing e2e nets: `m1a.spec.ts` warps to every screen and asserts `missingFrames()` empty and no console errors (a `decorPlacements` throw surfaces as a page error); `story.spec.ts` door fade on `test_int`; `m0.spec.ts` slides and grade thresholds (grading untouched).
- Manual, with the built-in browser (`preview_start` the dev server, then screenshot/zoom):
  - `/?screen=ask_brook&at=20,11&nosave`: water and ford flow, no grass at the jetty or ford waterline, a fish within ~30 s.
  - `/?screen=ask_village&at=14,14&nosave`: 2×2 well, tall trees, smoke from four chimneys, shut doors and windows; walk to row 11 above the well → hero fades behind it; row 14 → in front.
  - `/?screen=ask_int_longhouse&nosave`: beds 1×2, hearth flames at 8 fps, no smoke.
  - `/?screen=ask_farmyard&at=38,11&nosave` walk east: both screens' decor and smoke during the slide.
  - Nameplate at night: `/?screen=ask_farmyard&at=14,11&nosave&time=22:00`, talk to Halvar; and a choice list in the trader house to confirm the tab and choices panel do not touch; check `lang=sv`.
  - `/?dev=gallery` shows the new frames and the taller tileset.

## Risks

- Tile animation runs on Phaser's wall clock, decor on `sim.tick`: water keeps flowing during dialogue while hearths freeze. Acceptable now; `layer.setTimerPaused` if a pause menu arrives.
- Border trees are 32×40 sprites on 16 px tiles: canopies overlap into hedgerows and, on row 0, into the neighbouring screen's last row during vertical slides. Plausible; watch it in playtest.
- ~130–160 images per screen, two screens during a slide. Created once per `ScreenView`, cheap.
- Particles are sub-pixel in Phaser 4 (`roundPixels` only rounds the filter quad); fine for soft grey puffs.
- The sign/use rect change is a small core rule change: a rect `use` is reachable from any adjacent tile. Only wells, beds and the dev table get rects.
