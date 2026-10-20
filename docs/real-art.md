# Real art: how it replaces the code-drawn placeholders

Every frame and tile the game draws is generated in code at boot (`src/art`). Real art replaces it by
name, with no code changes, through one file: `public/atlases/manifest.json`. The shell loads the
manifest at boot, then every atlas and tile sheet it names, and lays them over the generated art before
the first scene starts (`src/shell/gfx/atlases.ts`, rules in `src/art/atlas.ts`). A missing or broken
manifest is reported once in the console and the placeholders stay.

The look to match is `docs/art-style-guide.md`. `?dev=gallery` (dev and test builds) shows every frame
and tile with its name, with any real art already in place.

## The manifest

```json
{
  "version": 1,
  "atlases": [{ "key": "hero", "image": "hero.png", "data": "hero.json" }],
  "tiles": [{ "terrain": "grass", "image": "askdalr/grass.png" }]
}
```

- Paths are relative to `public/atlases/`; subfolders are fine, `..` and absolute paths are not.
- `atlases` are sprite atlases, `tiles` are tile sheets, one per terrain. Either list may be left out.
- The shipped manifest lists the drawn hero and people atlases and the Askdalr tile sheets. Add entries as art arrives; a partial set is fine at every step.

## Sprite atlases

An atlas is a PNG plus a TexturePacker-style JSON file (the "JSON hash" or "JSON array" format that
free-tex-packer, TexturePacker and Aseprite all export). Every frame whose name matches a placeholder
frame replaces it. Frame names with no placeholder are ignored and listed in a console warning, so a typo
is easy to spot.

- **Names** follow `<art>_<anim>_<dir>_<n>`: `hero_walk_s_0`, `enemy_vargr_idle_w_1`. The gallery shows
  the full list; `src/art/anims.ts` and the sprite modules under `src/art/sprites/` are the source of
  frame counts and frame rates per animation. East-facing frames are separate names (the placeholders
  bake them by mirroring west), so an atlas supplies `_e_` frames too.
- **Size** is free. A real frame may be bigger than the 32×32 placeholder; the game positions it by its
  origin, so a taller or wider sprite grows outward and upward from the same feet point.
- **Origin.** Give each frame a `pivot` in the JSON (TexturePacker: enable pivot points) where the feet
  touch the ground, as a fraction of the frame: `{ "x": 0.5, "y": 0.95 }` for feet at the bottom centre
  with a couple of rows of outline below. Without a pivot the game keeps the placeholder's feet point,
  centred horizontally and bottom-aligned, which is right whenever the real frame is drawn in the same
  pose box.
- **Trimming** (transparent margins cut by the packer) is supported; sizes and pivots refer to the
  untrimmed `sourceSize`.
- **Pages** up to 2048×2048. Keep one atlas per region or per character family so a page is one request.
- The hero has three kits with their own art names: `hero` (seax), `hero_axe` and `hero_fork`.

## Tile sheets

A tile sheet is a PNG of 16×16 cells for one terrain, read left to right then top to bottom, with as
many cells per row as the image is wide. Cells follow the tileset's order for that terrain:

- An **auto-tiled** terrain (grass, water, rock, walls, roofs…) has 47 cells, one per blob mask in
  `BLOB_MASKS` order (`src/core/world/autotile.ts`), the standard blob-47 layout.
- A **plain** terrain (path, yard, field, floors) has one cell per variant (`variants` in
  `src/content/terrain.ts`, typically 4).
- An **animated** terrain repeats its cells once per frame, frame-major: frame 0's 47 cells, then
  frame 1's, and so on (`frames` in `src/content/terrain.ts`).

A shorter sheet replaces only the cells it has, so a sheet can be filled in gradually. Cells are copied
with their 1 px extrusion, so no bleeding rules apply beyond "draw to the edge of the cell". Season and
time of day are the shell's: draw summer noon and let the colour matrix grade it (style guide rule 7).

The shade bands, fringe tiles and cover tiles stay generated: they are translucent overlays that already
read well over real ground.

## Testing a drop

1. Put the files under `public/atlases/` and list them in the manifest.
2. `pnpm dev`, open `?dev=gallery` and check the replaced frames and tiles.
3. Walk the screens the art appears on; `?screen=<id>&at=20,11&season=summer&time=12:00&nosave`.
4. `pnpm e2e` runs `tests/e2e/art.spec.ts`, which serves a sample atlas and sheet from
   `tests/fixtures/atlases/` and checks the loader; `pnpm build && pnpm budget` checks the size.

Budget: GDD target under 8 MB for the first load once real atlases exist, 60 MB in all. Atlases under
`public/` are precached by the service worker; per-region loading on first entry is still to come and
is the step to take before the atlases grow past a few megabytes.

## Status

- [x] Atlas loader, manifest format, tile sheets, e2e coverage (G4, 2026-10-18).
- [x] Hero sheet (`hero`, `hero_axe`, `hero_fork`) and Embla.
- [x] The Askdalr tileset: grass, path, yard, field, fence, rock, roof, water, ford.
- [x] Every villager (`people` atlas, 55 people) and the Askdalr decor (trees, pines, birch, boulder, stump, menhir, runestone, well).
- [x] Askdalr's houses (wall, door, door_shut, window, chimney, ledge, floor, wall_int, jetty), the ground under standing things, and the bed, table, hearth and trough.
- [x] Myrkviðr: moss, bog, mound, cave_mouth, rapids, the kiln, reeds and the fallen log (`art-src/myrkvidr`).
- [x] Mýrland and Uppvík: sand, peat, silt, spring, shoal, planks, palisade, the drowned mill, the ferry, the stalls, the Þing-stone and the anvil (`art-src/myrland`).
- [x] Haugar: heath, barrow, flagstone, drystone, the cairn and Geirmundr's tent (`art-src/haugar`).
- [x] Niflmýrr: mire, blackwater and the drowned path, the snag (`art-src/niflmyrr`).
- [x] Sævatn: the currents and surges on the lake's water (`art-src/saevatn`); its sand, reeds, rock and the hall were drawn earlier.
- [x] Dvergagröf: the scree, and the cave set (`cave_floor`, `cave_wall`) that Rótarhellir, the mines, the lake's well and the fisher's cave share (`art-src/dvergagrof`).
- [x] Hrímfjöll and Hrímturn: firn, glaze, the rime cliffs (now an autotiled blob island, like the other cliffs), and the tower's floor, walls and clear ice (`art-src/hrimfjoll`).
- [x] Ívaldi's Forge: iron flags, black stone walls bound with iron, lava under a drifting crust (4 frames) and the belts by the way they run (`art-src/forge`).
- [x] Rótarhellir: the sap (a sunken blob island, 4 frames) and the roots (`art-src/rotarhellir`); Konungshaugr: the crypt's flags, its walls and the pits, with the ghost floor sharing the pit's cells (`art-src/konungshaugr`).
- [x] Sökkva Kvern: the sluice floors at both levels, the race channels, the boards and the mill wall as a blob island over the boards (`art-src/sokkva`); the hof's flags at both levels and the sunken arch (`art-src/hof`); Útgarðr's giant floor and wall (`art-src/utgard`).
- [x] The wilds' foes (`enemies` atlas): the vargr and the pack leader, the rime raven, the draugr, the raid and forest trolls, the troll turned to stone, and the puff where a foe dies.
- [x] The first dungeons' foes and bosses (`dungeon` atlas): the root-biter, rótvættr, sap bulb and root spike; the mud-crab, the lindormr and its mounds; the haugbúi, bogdraugr, haugvörðr and the Haugbúi King; the water-worm and the bog-light.
- [ ] Decor and tiles of the other regions, the remaining dungeons' foes and bosses, fixtures, UI.
- [ ] Per-region atlas loading and unloading.

## Drawing art in the repo: `art-src/`

The drawn art is kept as source, not generated: hand-drawn pixel grids (one palette letter per pixel, a
`palette.ts` per set maps letters to colours) and a small composition script per set.

- `art-src/hero`: Ask's parts (`parts.ts`, `props.ts`) composed into poses (legs, torso, arm, head,
  shield, weapon), outlined, for the 25 animations of the three weapon kits (`hero`, `hero_axe`, `hero_fork`).
- `art-src/people`: every villager (the `people` atlas, `npc_<id>` idle and walk). One shared body (the hero's
  trousers and torso, or Embla's skirt and bodice), coloured per person from `LOOKS` in
  `src/art/sprites/people.ts`, with overlays for long hair, braid, beard, apron, kerchief, bald heads, the
  huldra's tail, and children drawn from cropped parts at child height. A new villager needs only a look entry.
- `art-src/enemies`: the wilds' foes (the `enemies` atlas). The wolf, raven and troll are drawn as bodies with
  separate leg, wing and club strips composed per pose; the draugr is the villagers' body with a grave look and
  dead eyes, sunk into a mound for its rise; the raid, forest and stone trolls and the two wolves differ only by
  palette (`palette.ts`). Mirroring supplies east.
- `art-src/dungeon`: the dungeons' foes (the `dungeon` atlas, a 2048 px page). The creatures of Rótarhellir,
  Sökkva Kvern and Mýrland are one grid per frame in `grids.ts` (generated by a pencil script, kept as text so
  they can be touched up by hand) with a palette per creature; the barrows' dead (`wights.ts`) are the
  villagers' body with dead eyes under a helm, shield, sword, bow or crown, grown half again for the warden
  and the king, and sunk into a mound for their rise.
- `art-src/askdalr`: the ground and the decor. Plain terrain is drawn tile by tile; auto-tiled terrain (rock, roof, water, ford)
  is drawn as a 32×32 island (outer corners, edges, middle) plus a 16×16 tile holding the four inner
  corners, and `build.ts` cuts both into 8×8 quarters and assembles the 47 blob cells in `BLOB_MASKS`
  order. Water's and the ford's four frames are four islands with the ripples moved a pixel. `decor.ts` holds the
  trees, stones and the well (`decor` atlas, `decor_<id>_idle_s_<n>`), at the placeholder sizes and standing on
  their bottom centre; `house.ts` the house fronts, interiors, jetty and ledge; `indoors.ts` the bed, table,
  hearth and trough. Terrain that only carries a standing thing (`tree`, `well`, `bed`, …) gets the plain
  drawn ground or floor as its sheet, so the drawn piece never stands on a placeholder square.

`art-src/lib` holds the tiny toolkit: PNG encoding, grid parsing, mirroring and rotation, shelf packing into
an atlas, preview sheets.

- `pnpm art:pack` rewrites everything under `public/atlases/` that the manifest lists. Commit it with the source.
- `pnpm art:pack --preview <dir>` also writes one contact sheet per animation (`hero_walk.png`) and the
  placeholder's sheet beside it (`old_hero_walk.png`) for before/after review.
- `art-src` is type-checked by `tsconfig.json` but is not part of the game bundle and may use Node.
- To replace the drawn hero with painted art, drop a new atlas under the same frame names and point
  the manifest at it; nothing in `art-src` is imported by the game.
