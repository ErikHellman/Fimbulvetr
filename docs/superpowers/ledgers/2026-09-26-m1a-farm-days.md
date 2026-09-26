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
