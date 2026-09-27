# Ledger — M1c Rótarhellir + Rótvættr

Plan: `docs/superpowers/plans/2026-09-27-m1b-m1c.md` (Part 2). Brief: `docs/briefs/m1.md`. Branch: `claude/gracious-thompson-hz4noa`, continuing after M1b (5a40cc9). Baseline: `pnpm check` green, 694 tests.

| Task | Notes and rulings |
| --- | --- |
| 1 dungeonOf | `src/core/state/dungeons.ts`: `emptyDungeon` and `dungeonOf` (creates a missing entry on first use). `newGame` and `applyPreset` use them. A tooling test forbids indexing `.dungeons[` anywhere else in core. Closes the M0 carry-over with no migration and no save-format change. |
