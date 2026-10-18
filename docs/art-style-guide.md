# Fimbulvetr art style guide

The rules every tile, sprite and panel follows, whether the code paints it (`src/art`) or an artist draws it
for the atlas loader (G4). Written for the graphics overhaul (G2); the analysis that led here is linked from
`docs/roadmap.md`.

## The look in one line

Flip-screen, 16 px, cel-shaded pixel art with one light, three tones and an ink line: a storybook
Scandinavia, not a photograph of one.

## 1. One light, from the top-left

Everything is lit from the upper left, as if the sun stood over the player's left shoulder.

- Highlights sit on top and left faces; shade sits on bottom and right faces.
- Raised ground (rock, walls, roofs, a barrow) gets a light edge on its north and west sides and a dark edge
  on its south and east sides. Sunken ground (water, pits, sap) is the reverse: the bank throws shade on the
  north and west edge of the pool, and the south and east edge catches light.
- Cast shadows fall down and right. The shell draws them (contact shadows under sprites, the shade overlay
  under walls); art never bakes a drop shadow into a tile.

## 2. Three tones and an ink line

Each material has a base, a shade and a highlight. That is the whole ramp; a fourth tone needs a reason.

- The palette lives in `src/art/palette.ts` as `<material>`, `<material>Shade`, `<material>Light`.
- Sprites and decor get a 2 px (hero, enemies) or 1 px (decor, props) outline of `C.ink`, never a coloured
  line. Tiles have no outline; a blob terrain's edge ring is its lit or shaded tone (rule 1), and ink is
  used on tiles only where one thing stands on another (a roof's eave, a wall's top, a door frame).
- Shade is a darker version of the base, not grey: keep the hue, drop value and a little saturation.

## 3. Clusters, not speckle

Random single pixels read as noise. Texture is made of small shapes with a top-left light and a
bottom-right shade, placed on a jittered grid so no two tiles line up.

- Grass: tufts of two or three pixels, light tip up-left, shade at the root.
- Earth, scree, sand: pebbles and clods of two to four pixels, one light pixel on the upper left.
- Stone floors: seams one px wide, a light pixel where two seams meet, a chipped corner now and then.
- Snow and firn: long soft ridges, one highlight row and one shade row each.
- `Painter.speckle` stays for fine grain only (grit on a cave floor, foam on water), at a density that
  reads as tone, not as dots.

## 4. Ground meets ground with a fringe

Where one ground spills over another, the higher ground overlaps the lower by two or three pixels, with
tufts or crumbs leaning into it. The fringe layer draws this from blob-47 masks, so maps never change.

- Soft ground spills: grass, heath, moss, mire and firn spill onto paths, sand, fields, paving and peat.
- Priority decides who overlaps whom (`FRINGE_SPILL` in `src/content/terrain.ts`); equals do not fringe.
- Auto-tiled terrain (path, water, rock) already carries its own bank in the tile; the fringe layer only
  fills the pairs the blob tiles cannot.

## 5. Walls have a face

A wall tile is a face seen at a slant, not a flat pattern.

- A light cap row along the top (rule 1), the face below it, a darker base band in the bottom three or four
  rows where the ground's shade climbs the wall.
- Timber: boards with a joint line and a lit edge; one or two nail heads per tile at most.
- Stone: courses with offset joints, a light pixel on each stone's upper-left corner.
- Turf roofs: lighter towards the ridge, darker towards the eave, the eave itself an ink line.

## 6. Characters

Readable at 32 px: silhouette first, then eyes, then hands.

- Three tones on skin, hair and cloth; one highlight row on the hair, one on the shoulder nearest the light.
- Eyes are ink with no white; a lighter skin pixel under each gives the face a plane.
- Idle breathes: two frames, the second a pixel lower, at two frames a second. Walk bobs on frames 1 and 3.
- Frame names never change (`<art>_<anim>_<dir>_<n>`); the shell's animation table is the contract.

## 7. Seasons and time of day are the shell's

Art is drawn once, in summer colours at noon. Autumn, winter, dusk and night come from the shell's colour
matrix, the light layers and the snow cover tiles. Real art for the atlas loader follows the same rule: one
summer set, graded at runtime.

## 8. UI

Ink panels with a gold line, dressed sparingly: a double rule with a knot at each corner, a runic cap on
the title. No gradients, no drop shadows, no texture fills. Text stays the bitmap font in paper white, gold
for emphasis.

## Checklist for a new tile or sprite

1. Light from the top-left? Highlights up-left, shade down-right.
2. Three tones of the material plus ink; nothing else.
3. Texture in clusters on a jittered grid; speckle only as grain.
4. Tiles 16×16, sprites with their outline margin inside the frame, feet on the bottom row.
5. Frame name `<art>_<anim>_<dir>_<n>`, east baked by mirroring west.
6. Summer colours; let the shell grade it.
