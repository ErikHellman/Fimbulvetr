# Ledger — M7b Sökkva Hof and the loom

Plan: `docs/superpowers/plans/2026-10-04-m7.md` (Part 2). Brief: `docs/briefs/m7.md`, approved 2026-10-04. Branch: `claude/m7b-sokkva-hof`, cut from `claude/project-thread-hru6i7` at 227cd6c (M7a, PR #14); its PR is stacked on #14. On 2026-10-05 the user asked for every remaining milestone to be built in turn, one stacked PR each, without stopping to ask. Where the plan or brief leaves a question, the recommended answer is taken and recorded here. Baseline: `pnpm check` green, 2886 tests; golden hash `f865b677`; budget 580.6 KB gz of 730.

## System details pinned before building

- **Vindr.** Sung like the other galdr (3 seiðr, the cast pose). A gust entity (`projectile` `vindr`, art `fx_vindr`) leaves Ask the way Ask faces and runs 4 px a tick for 20 ticks (five tiles), stopped by walls but not by water or pits. What its front touches: a foe is shoved two tiles on at once (`shove`, by what stops it walking), once per gust; a boss is not shoved but marked `mem.gust = 1` for its own behaviour to read and clear; `blown` cover (leaf piles) blows away; a wind fan spins; a resting sailing raft's sail fills.
- **Fans.** `switch.fan: true` (append-only): art `fix_fan`; only a gust spins it (sword, boomerang, arrows and blasts pass it by), and it sets its flag like any switch.
- **Sails.** `raft.sail: true` (append-only): art `fix_sailraft`; the raft rests at each stop until a gust fills its sail, then plies to its next stop as any raft, and waits again.
- **Solver.** A fan is spun from a reached tile up to five tiles off in a straight line, with Vindr known; a sailing raft joins its stops only with Vindr known.
- **Golden hash.** Nothing old sings Vindr, has fans or sails, so it does not change.

## Tasks

| Task | Rulings |
| --- | --- |
| 6 Vindr | `systems/vindr.ts` (`VINDR` 20 ticks, 4 px a tick, push 32 px), `castVindr` in `SONGS`, `stepVindr` in `stepProjectiles`; `shove` in `movement.ts`; `spinFan` in `fixtures.ts` (fans are left out of `strikeSwitch`); `fillSail` and the sail wait in `raft.ts`. New sfx `sfx_gust`; art module `sprites/hof.ts` (`fx_vindr` blow ×2 in four facings, `fix_fan` off/on, `fix_sailraft`); the Gear icon `galdr_vindr`. Solver: `gustable` (with `inLine`, shared with arrows) and sail rafts in `raftEdges`. Tests: `tests/sim/vindr.test.ts` (7), `tests/content/solver_vindr.test.ts`. |
