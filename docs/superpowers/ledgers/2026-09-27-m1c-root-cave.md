# Ledger — M1c Rótarhellir + Rótvættr

Plan: `docs/superpowers/plans/2026-09-27-m1b-m1c.md` (Part 2). Brief: `docs/briefs/m1.md`. Branch: `claude/gracious-thompson-hz4noa`, continuing after M1b (5a40cc9). Baseline: `pnpm check` green, 694 tests.

| Task | Notes and rulings |
| --- | --- |
| 1 dungeonOf | `src/core/state/dungeons.ts`: `emptyDungeon` and `dungeonOf` (creates a missing entry on first use). `newGame` and `applyPreset` use them. A tooling test forbids indexing `.dungeons[` anywhere else in core. Closes the M0 carry-over with no migration and no save-format change. |
| 2 Dungeon grids | `WorldLayout.dungeons` (one `ScreenGrid` per dungeon); `indexLayout` keys cells by grid, places each dungeon grid in its own origin block below the pockets and adds `gridOf`; `neighbourOf` never crosses grids, so rooms slide into each other. `ScreenDef.dungeon`: no clock, no weather, no night (`darkness` counts a room as sheltered unless `dark`); the shell grades caves with a fixed cool light. Integrity: rooms on a grid carry its `dungeon` and every grid is entered by a door from outside; seams already run per grid. Golden unchanged. |
