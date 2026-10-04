# Ledger — M6b Helgrind

Plan: `docs/superpowers/plans/2026-10-04-m6.md` (Part 2). Brief: `docs/briefs/m6.md`, approved 2026-10-04. Branch: `claude/project-thread-hru6i7`, continuing after M6a (a4296d4). Baseline: `pnpm check` green, 2391 tests; golden hash unchanged; budget 557.0 KB gz of 730.

## System details pinned before building

- **The grapple chain** (`systems/grapple.ts`, `USES.grapple`). The chain's head flies the way Ask faces (four ways) at `Tuning.grapple.speed` for `range` px (96, six tiles) over floor, water, pits and low ground, and stops at walls. Ask stands still in hero state `chain` while it is out. What the head meets first decides:
  - A `post` thing (a solid 1×1 pillar, art `fix_post`): Ask is pulled along the line (hero state `pulled`, through water and pits, foes and props ignored) until Ask's feet stand on the tile before the post. Content keeps that tile floor.
  - A foe with `EnemyDef.light`: reeled back to Ask's feet and stunned.
  - Any other foe: the head sets `mem.hooked` on it and returns (`sfx_block` unless its behaviour reacts). Behaviours read `hooked`: a shield bearer loses its shield, Garmr's collar ring throws it off balance.
  - A pickup: dragged back like the boomerang's.
  - A switch: lit, as by the boomerang.
  - Only one chain at a time; `sfx_chain`. `Sim.grapple()` gives the view the line from Ask's hand to the head (null when none).
  - **Solver:** once the grapple is held, a post in a straight four-way line of up to six tiles of floor, water, pit or low ground from a reached tile adds a one-way edge to the tile before the post.
- **Rafts** (`raft` thing, `systems/raft.ts`): a 2×2 fixture riding a straight path of tile-aligned stops (`path`), resting `RAFT.wait` ticks at each stop and moving at `RAFT.speed` between them. While it rests, its four tiles are footing (stamped like a lowered bridge). Ask is aboard when Ask's feet are inside its box as it sets off; aboard and moving, Ask is carried and cannot walk (the sword still swings). Never saved: rafts restart at their first stop when the room is entered. **Solver:** a raft's stops are footing, joined both ways by edges.
- **Fog rooms:** `ScreenDef.fog: true` (dungeon rooms). `fogOf` gives `FOG_THICK` there, and the clear circle is the lantern's radius only (`FOG_ROOM_RADIUS` without it). Náströnd's phase 3 fills his room the same way while he lives (`mem.fog` on the boss).
- **Ís for good:** the chest past Garmr gives `stave_is` and teaches the galdr `is` (a chest gift can now `learn`).
- **Thanes and captives:** quests `q_thanes` (int 4) and `q_captives` (int 8); flags `st_thane_nastrond`, `st_freed_ulf`, `st_freed_tofa`. Homecomings key on the freed flags.
- **New enemies:** `helhound` (light, lunges in pairs), `garmr` (mini-boss), `nastrond` (boss, three phases). `fog_draugr` becomes `light`.

| Task | Notes and rulings |
| --- | --- |
| 1 Ledger | This ledger. |
