# World polish: scale, animation and building details — design

Date: 2026-09-27. Status: implemented on branch `claude/world-polish`. Plan: `docs/superpowers/plans/2026-09-27-world-polish.md`.

## Context

Ten visual complaints from playtesting Askdalr, all in the placeholder art and how the shell draws it:

1. The speaker's name above the dialogue box is hard to read against some backgrounds.
2. Furniture, the well and the trough look tiny next to the hero.
3. Walking is stilted: legs move, arms never do.
4. Trees are tiny next to the hero.
5. Water is static, wells and troughs too.
6. No fish ever show in lakes or the brook.
7. Grass shows between the water and the jetty, and between the water and the ford (the "bridge").
8. Three village houses have no door.
9. No building has windows.
10. Hearths are static, and no building has a chimney or smoke.

Root causes found during exploration:

- **Scale.** Tiles are 16 px and the hero is 28 px tall. Trees, well, trough, stump, bed, hearth, table and menhir are each a single 16 px *terrain tile* painted into the ground layer (`src/art/tiles/terrain.ts`, `src/content/terrain.ts`). Nothing can be taller than its tile and nothing y-sorts with the hero.
- **No ambient animation exists.** Tiles are put once (`src/shell/view/screenView.ts`); the only animation is sim-driven frame swapping via `frameFor` (`src/art/anims.ts`, `src/shell/view/entityViews.ts`). No tweens, particles or animated tiles anywhere.
- **Grass seams.** Every auto-tiled terrain paints grass underneath and only counts *its own* terrain as a neighbour (`src/art/tiles/indices.ts:20`), so water next to the ford or next to the jetty (four `f` floor tiles on `ask_brook` row 4) insets 3 px and shows grass.
- **Nameplate** is a bare gold BitmapText at `BOX.y - 14` with no background (`src/shell/scenes/UiScene.ts:93`).
- **Buildings** are `R` roof rows over one `W` wall row. `door` is a dark opening; there is no shut-door, window or chimney terrain. The NE, SW and SE houses on `ask_village` have plain walls.

Decisions taken with the user:

- The ford stays a ford (slow wading); it and the jetty just stop showing grass at the waterline. No bridge.
- Every house *and* the hof gets a chimney with smoke.
- Sprites that overlap the hero from in front fade to 60% alpha so the hero stays visible.

Assumptions (say so if wrong): windows go on the five houses, not the hof (carved gables per the design document); the three doorless houses get *shut* doors, not interiors; fish jump in every season; trees keep a 1-tile solid trunk so no map row moves, the canopy overhangs.

Verified Phaser 4.2.1 facts this plan leans on: `addTilesetImage` on a blank map gives `firstgid = 0`; `Tileset.tileData` is a plain object keyed by local id; `animation[].tileid` is local; `getAnimatedTileId` returns `null` (tile skipped) unless the frame durations tile `animationDuration` contiguously; `createBlankLayer` layers join the update list and drive `ElapseTimer` themselves; `TilemapLayerWebGLRenderer.js:81` reads the animated id every frame. Particles resolve `frame` names on the emitter's own texture, so all smoke frames must share one atlas page. The camera ColorMatrix grades everything PlayScene renders, so decor, fish and smoke are graded with the world, and the UI scene stays untinted.

## Design

### A. Decor sprites (fixes 2, 4, well/trough water, fire)

The eight object terrains become **decor**: the map character still marks solid footprint tiles, but the shell draws one y-sorted sprite per footprint block.

- `TerrainDef` (`src/core/world/terrain.ts`) gains `decor?: { art: readonly string[]; w: number; h: number }`. Art keys are strings, as `PropDef.art` already is.
- Footprints: tree 1×1 (arts `decor_tree`, `decor_pine`, picked by `hashInts(x, y, salt)`), stump 1×1, menhir 1×1, trough 3×1 (matches the existing `UUU`), bed 1×2, table 2×1, hearth 2×2, well 2×2.
- New pure helpers in `src/core/world/decor.ts`:
  - `decorPlacements(grid, terrainDefs): DecorPlacement[]` scans row-major, claims a `w×h` block at each unclaimed decor cell (anchor = top-left), throws `MapError` naming the cell when a block is incomplete, overlaps another or runs off the map. Greedy row-major is what turns the trader's `tttttttttt` into five tables with no map edit.
  - `decorFeet(p)` = `((x + w/2)·16, (y + h)·16 − 2)`, the same "2 px above the tile bottom" rule as `tileFeet`, so y-sort against entities is consistent.
  - `decorArt(p, def, salt)` = `def.art[hashInts(x, y, salt) % art.length]`.
- `sign` and `use` Things gain optional `w`/`h` (default 1) and `checkInteract` (`src/core/sim/systems/story.ts:333,339`) passes them to `tileBox`. Without this the well sign (on row 12 of a 2×2 well) is unreachable from the yard to the south, because the probe only reaches the block's bottom row.
- Tile painters for decor terrains paint only their base (grass or floor) plus a denser shade speckle as ground shadow; the sprite carries the whole object. `tree` drops to one tile variant.
- Art in new `src/art/sprites/decor.ts` (`decorFrames()`, `DECOR_ANIMS`), names `decor_<id>_idle_s_<n>`, 1 px ink outline, 1 px margin, origin bottom-centre (as `propFrame` in `farm.ts:160`):

  | Art | Size | Frames | Notes |
  |---|---|---|---|
  | `decor_tree` | 32×40 | 1 | round leaf canopy on a 4×10 trunk, `leafShade` lower-right, `leafLight` highlight |
  | `decor_pine` | 24×44 | 1 | three widening tiers, shaded right third |
  | `decor_well` | 32×44 | 4 @ 4 fps | stone ring, two posts, gable roof, crank, rope; water disc in the mouth with `waterLight` glints that shift per frame |
  | `decor_trough` | 48×20 | 4 @ 4 fps | wooden box on legs, water strip with ripples drifting 2 px per frame |
  | `decor_hearth` | 32×36 | 4 @ 8 fps | stone ring, two logs, flame ellipse that sways and stretches, rotating ember glow pixels |
  | `decor_bed` | 16×30 | 1 | straw, pillow, blanket, footboard |
  | `decor_table` | 32×22 | 1 | top, two legs, bowl and bread |
  | `decor_stump` | 16×18 | 1 | ringed top, striped side |
  | `decor_menhir` | 16×30 | 1 | shaded stone with rune scratches |

- Shell: `ScreenView` owns the decor sprites: one `Image` per placement, origin from `FrameIndex`, depth = feet y − 0.25 (entities win same-row ties regardless of creation order). `tick(t)` swaps frames for animated decor with `frameFor(ANIMS, art, 'idle', 's', t)`, `t = sim.tick`, so pauses freeze them. `fadeBehind(heroBounds)` sets alpha 0.6 on any decor image whose rect overlaps the hero's and whose depth is greater. `EntityViews.bounds(id)` supplies the hero rect without allocating.
- Map edits (anchor at the existing character; wells, hearths and tables grow right/down, beds grow **up** so the sleep `use` tile (10,7) and the M1a route stay valid):
  - `ask_village` well → `OO`/`OO` at (14–15, 12–13); well sign gets `w: 2, h: 2`.
  - `ask_farmyard` well → (24–25, 9–10); sign gets `w: 2, h: 2`. Trough `UUU` and stump unchanged.
  - `ask_int_longhouse`: beds `b` at (10,7), (27,7), (29,7) gain a top cell on row 6; `hhhh` → `hh`/`hh` at (18–19, 11–12); table (10,16) → `tt`; `tt` at (26–27,15) unchanged; sleep `use` → `at (10,6), h: 2`.
  - `ask_int_trader`: hearth → 2×2 at (13–14, 8–9) (clear of the counter); counter unchanged.
  - `ask_int_hof`: hearths → 2×2 at (14–15, 12–13) and (24–25, 12–13).
  - `test_int`: bed (13,6)+(13,7), table `tt` at (25–26,7), hearth 2×2 at (19–20, 11–12); `use` rects widened to match.
  - `ask_brook` (34,4): `T` → `M` so the "marker stone" sign stands on a stone.
  - Every changed cell was checked against NPC places, presets, `use`/`sign`/`drop`/`trigger` zones, door arrivals, save fixtures and the route test; none conflicts. The golden hash (`test_a`/`test_b`) is untouched and must not be re-recorded.

### B. Blob groups (fix 7, roofs around chimneys)

- `TerrainArt` gains `group?: string`; `TilesetEntry` carries it (default = the terrain id); `tileIndices` treats a neighbour as "same" when groups match. Extract `groupMask(grid, tileset, x, y)` for reuse.
- `water`, `ford`, `jetty` → group `water`. `roof`, `chimney` → group `roof`.
- New plain terrain `jetty` (walkable, legend `J`): full-tile horizontal planks with ink rows top and bottom, seams every 4 px, post ends. `ask_brook` row 4 `ffff` → `JJJJ`. Because water treats it as water-group, water paints right up to its edge; because it is full-tile, grass tiles above and below meet plank, not water.

### C. Animated water tiles (fix 5)

- `TerrainArt` gains `frames?: number` (default 1) and `frameMs?: number`; `paint` receives `frame`. `buildTileset` lays tiles out frame-major: tile for (variant i, frame f) = `start + f·count + i`, with the **same painter seed for every frame of a variant** so speckle never flickers. `TilesetEntry` = `{ start, count (per frame), autotile, frames, frameMs, group }`. `tileIndices` keeps returning frame-0 ids.
- Water and ford: 4 frames at 150 ms. A `flow()` helper draws 3 px `waterLight` dashes on a fixed lattice at `y = (k·4 + 2 + frame·4) mod 16`, only inside the blob and off its edge, so the loop is seamless and reads as flow.
- Art exposes `tileAnimations(tileset): { tile, frames[], frameMs }[]` (one per frame-0 tile of every multi-frame entry). Shell `src/shell/gfx/tileAnims.ts` maps that to Phaser's shape and `animateTiles(phaserTileset, tileset)` does `Object.assign(tileset.tileData, …)` right after `addTilesetImage`, with `startTime` cumulative and durations summing to `animationDuration`.

### D. Ambient effects: fish and smoke (fixes 6, 10)

New `AmbientView` (`src/shell/view/ambientView.ts`), one per shown screen, created and destroyed alongside `ScreenView`.

- **Open water and schedule** are pure core helpers in `src/core/world/ambient.ts`: `openWaterCells(grid, isWaterGroup)` = water cells not on the outer ring whose 8 neighbours are all water-group; `fishJump(salt, slot, cells)` = `hashInts(salt, slot) % 8 === 0 ? hashInts(salt, slot, 1) % cells : null`. About one jump every 8 s per screen, reproducible.
- **Fish.** `tick(t)`: `slot = floor(t / 60)`; on a new slot, if `fishJump` fires, place a one-shot `fx_fish` image at `tileFeet(cell)`, depth = feet y, advance its frame from `age = t − start`, destroy at 48 ticks. `jump()` is public for the dev hook.
- **Smoke.** One `ParticleEmitter` per `chimney` cell at the stack top, texture frames `fx_smoke_idle_s_{0,1,2}` (7, 9, 11 px soft grey puffs, no outline, centred origin), `frequency 400`, `quantity 1`, `lifespan 2400`, `speedY −14…−8`, `speedX 2…5`, `alpha 0.7 → 0`, no scale tween (keeps texels even), `maxAliveParticles 8`, `advance 2400` so smoke is already rising when a door fade reveals a screen, `blendMode NORMAL`, depth `SMOKE_DEPTH = 100_000` (world y reaches ~4928 in the interior pockets; the fade rect is at 1e6). Guard: if the three frames are not on one atlas page, use the ones that are and `console.error` (e2e catches it).

### E. Doors, windows, chimneys (fixes 8, 9, 10)

New terrains **appended** to `TERRAIN_IDS` (keeps every existing tile's pixels stable): `door_shut` (solid, `d`), `window` (solid, `+`), `chimney` (solid, `C`), `jetty` (walkable, `J`). All four characters are unused today.

- `door_shut`: wall planks, lintel, plank leaf with seams, two hinges, ring handle. `door` gains the same lintel so both read as one family.
- `window`: wall planks, ink frame, dark glass, cross bars, one highlight, sill.
- `chimney`: the roof painter at "fully surrounded" plus a stone stack with a dark top; `group: 'roof'`.
- Map edits: `ask_village` row 2 chimneys at (5,2) and (33,2); row 5 `W..W+WDW+WW` for the NW house and `WWW+WdW+WW` for NE (shut door (31,5)); row 16 chimneys at (6,16) and (33,16); row 18 `WW+WdW+W` (SW, door (8,18)) and `WW+WdW+WW` (SE, door (31,18)). `ask_farmyard` chimney (12,4), windows at (7,7) and (11,7). `ask_hof` chimney (17,3), no windows.
- Integrity tests: every `door` tile has a door Thing; every `chimney` has all 8 in-bounds neighbours in {roof, chimney}; every `window`/`door_shut` has roof directly above; every `jetty` touches a water-group tile; every `sign`/`use` rect lies inside the grid; every screen's decor footprints are complete.

### F. Arm swing (fix 3)

`torso()` in `src/art/sprites/hero.ts:84` takes the walk `phase`; the torso block in `people.ts:197-208` uses the one it already has. Contralateral gait (opposite arm to the lifted leg): facing s/n, phase 1 → left arm +1, right arm −2 px; phase 3 → left −2, right +1 (arms are the 2 px columns at x 8–9 and 22–23, hands follow). Facing w, the near arm shifts x by −2 on phase 1 and +2 on phase 3, staying inside the torso span. Applies to `walk` and `shieldwalk`; `carrywalk` (arms up) returns early as today. East stays `flipX(west)`. Extremes keep the 2 px margin.

### G. Nameplate (fix 1)

In `drawStory` (`UiScene.ts:186-189`): when the speaker is non-empty, draw `panel(BOX.x + 4, BOX.y - 17, textWidth(who) + 16, 18)` **before** the main box panel so the strokes merge into one outline, then place the name at `(BOX.x + 12, BOX.y - 14)`. All integers, so the round-pixels UI camera keeps it crisp. The choices panel starts at x 432; a text test asserts every `NPC_NAMES` and `UI.speaker_ask` string in both languages keeps the tab under 400 px.
