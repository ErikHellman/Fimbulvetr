# Ledger — M1a Farm days

Plan: `docs/superpowers/plans/2026-09-26-m1a-farm-days.md`. Brief: `docs/briefs/m1.md`. Branch: `claude/loving-bell-65jdxz`, starting from 4881b60 (M0 merged).

| Task | Commit | Notes and rulings |
| --- | --- | --- |
| 1 Docs | (this commit) | Brief and plan written. M0 playtest ticked, on the user's word. |
| 2 Sim split | | Golden hash test pins a fixed script. The private `enemies` list becomes `actors`; `enemies` stays as a filtered getter. |
| 3 ActorCtx | | Ruling: the hurt path is reached through enemy contact damage (`EnemyDef.touch`), because no enemy attacks yet. Tests cover i-frames, the shield and PIERCE_SHIELD. |
| 4 Interiors, fades, doors | | Off-grid screens get pocket origins below the grid. `entryPoint` clamps the other axis (the corner-chaining carry-over). Adds `PW_CHROMIUM_PATH` so e2e runs in containers with a preinstalled Chromium. |
| 5 Ledges | | Only a south-facing `ledge` terrain exists so far; the code handles all four directions. The hop skips collision because the landing is checked up front. |
| 6 Presets | | Only the `m0` preset exists; the story presets (day2, day3, night3) land with the Askdalr content. |
| 7 Cond/Effect | | Content tables that grow as content is written (dialogue, scripts, npcs, quests, shops) are `Partial` records; the integrity test will check references. |
| 8 Dialogue | | Confirm, interact and sword all advance. The typewriter uses the longer of en/sv. |
| 9 Story mode | | Ruling: no `save` step; every finished script emits `autosave`. The golden hash was re-recorded after verifying that removing the two new hash keys restores the old value. |
| 10 NPCs | | NPCs are re-placed when a script ends. They block the hero. |
| 11 Props | | Throw tuned to 4 px/tick × 20 ticks (about 5 tiles). A carried prop is lost if the hero is knocked out of the carry. The new SFX ids and recipes landed here (planned for Task 17). |
| 12 Critters | | Sheep ignore throws. Penned sheep are bits in `world.vars[pen.v]`. |
| 13 Cover | | `coverOrder` is added to ContentDb, because grids store 1 + index. |
| 14 Shop, axe, pieces | | Dev `give` command. Heart pieces are `pickup` entities. |
| 15 Font | | Glyph grids in an 11-row cell with accent rows. Accented letters are composed from a base glyph and a mark. |
| 16 Sprites | | NPCs are composed from parts. Deferred: a hand-axe art variant for the hero's attack frames (they still show the sword). |
| 17 Tiles | | 17 new terrains with legend characters, and cover overlay tiles in the tileset. |
| 18 World view | | Cover layer, shadows, indoor grade, `?dev=gallery`, and the demo corner on test_b/test_int. The golden hash was re-recorded because test_b now spawns props. |
| 19 UI scene | | The font goes through `BitmapText.ParseXMLBitmapFont` with a generated BMFont XML. The typings omit the texture argument, so the call is cast. |
| 20 Askdalr | | Maps generated with a scratch Python helper; the committed TS files are the source of truth. NEW_GAME moves to the longhouse. |
| 21 Prologue | | One `embla_evening` script serves all three evenings (the dialogue picks the scene). Sigrún's shop opens from her counter. |
| 22 Exit tests | | Herding fixes found by the route test: the pen now fills the west end of the pasture; sheep are pushed along the hero's walking direction and slide along walls (ActorCtx gains `heroVel`); grazing sheep drift home. The pail's drop zone is two rows tall. WebKit is not installed in this container, so e2e ran on Chromium only (21/21, twice). |
| 23 Docs | | ARCHITECTURE.md, roadmap and handoff updated. Budget 405 KB gz of 730 KB. |
