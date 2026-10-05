# Ledger — M9b Hrímturn

Plan: `docs/superpowers/plans/2026-10-05-m9.md` (Part 2). Brief: `docs/briefs/m9.md`. Branch: `claude/m9-hrimfjoll`, on top of M9a (7475326). Baseline: `pnpm check` green, 3866 tests; golden hash `f865b677`.

## Tasks

| Task | Rulings |
| --- | --- |
| 5–6 Light and the ice mirror | Things `beam` (a window of rime-light, `dir`, optional `when`), `prism` (`turn` `/` or `\`, `turns` if a sword blow or Bragð flips it) and `eye` (a crystal that sets its `flag` for good once lit). `world/beam.ts` traces a beam tile by tile (`BEAM_TILES` 60) through a `meet` callback; `systems/beams.ts` runs it each tick after the sword switches, sets `Sim.beams()` (segments in px for `beamView`) and lights eyes. Beams pass open floor, pits and water (LOW) and terrain marked `clear` (new `clear_ice`, `▧`, solid to everything else); they stop at walls and solid things. **Ruling:** Bragð lights an eye it reaches and turns a prism it strikes, so puzzle eyes stand in niches behind clear ice where only light reaches them. The ice mirror (`mirror` item, hero state `mirror`): held on the item key, Ask stands still behind it and turns with the stick; a beam reaching Ask's tile goes on the way Ask faces (stops if it comes head-on); a rime `bolt` meeting the mirror from the front is sent back the way Ask faces (`mem.mine`), and hurts the first foe it meets with the `REFLECT` tag, so a frost wisp dies of its own bolt. Solver: `World.clear`; an eye is lit by a beam traced with every combination of reachable turning prisms, by Bragð in a straight line, or (with the mirror) by re-aiming a beam from any reached tile on its path. Art `fix_window`, `fix_prism`, `fix_crystal`, a mirror icon. Tests: `beams` (6), `mirror` (5), `solver_beams` (4). `pnpm check` green (3881 tests). |
