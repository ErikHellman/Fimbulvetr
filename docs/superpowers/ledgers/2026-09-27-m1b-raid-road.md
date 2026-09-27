# Ledger — M1b Raid + Myrkviðr road

Plan: `docs/superpowers/plans/2026-09-27-m1b-m1c.md` (Part 1). Brief: `docs/briefs/m1.md`. Branch: `claude/gracious-thompson-hz4noa`, starting from 8ad61b1 (world polish merged). Baseline: `pnpm check` green, 499 tests.

| Task | Notes and rulings |
| --- | --- |
| 1 Docs | Plan saved; the brief gains the M1b and M1c details (raid, Myrkviðr, Rótarhellir draft). |
| 2 Presets and walker | `DevPreset` gains season, policy, hp, maxHp, slots, pieces, opened and dungeons. The harness takes a `preset` (applied over `NEW_GAME`, as `?preset=` does) and `expectAnims()`. The walker reads any enemy id. |
| 3 One damage path | `damageActor` in `systems/combat.ts` serves the sword and thrown props; thrown kills now remove the enemy (M1a bug). `killed` event. `EnemyDef.drops` (heart/silver/none weights) rolled with `state.rng`; drops last 600 ticks. Ruling: the dummy keeps no drops, so the golden hash is unchanged. |
| 4 Death and continue | Hero `dying` state; `checkDeath` puts the sim in `over` mode whatever the damage source. After the 60-tick fall comes `gameOver`; confirm or interact is accepted 30 ticks later. Continue: 3 hearts (or max), back to `Sim.entry` (set by every `enterScreen`), actors respawn, state kept. A save at 0 hp loads alive. Ruling: Continue is input-driven in core (no command), so replays cover it. **Golden hash re-recorded (b6ab359e → f865b677) because `entry` is now hashed**; removing it restores the old value. Found: passing `entry` as a position copied its `facing` into `hero.pos`. |
