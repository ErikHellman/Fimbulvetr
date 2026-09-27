# Ledger — M1b Raid + Myrkviðr road

Plan: `docs/superpowers/plans/2026-09-27-m1b-m1c.md` (Part 1). Brief: `docs/briefs/m1.md`. Branch: `claude/gracious-thompson-hz4noa`, starting from 8ad61b1 (world polish merged). Baseline: `pnpm check` green, 499 tests.

| Task | Notes and rulings |
| --- | --- |
| 1 Docs | Plan saved; the brief gains the M1b and M1c details (raid, Myrkviðr, Rótarhellir draft). |
| 2 Presets and walker | `DevPreset` gains season, policy, hp, maxHp, slots, pieces, opened and dungeons. The harness takes a `preset` (applied over `NEW_GAME`, as `?preset=` does) and `expectAnims()`. The walker reads any enemy id. |
