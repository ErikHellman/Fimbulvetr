# Ledger — World polish

Plan: `docs/superpowers/plans/2026-09-27-world-polish.md`. Spec: `docs/superpowers/specs/2026-09-27-world-polish-design.md`. Branch: `claude/world-polish`, starting from c4a3ce8 (M1a merged).

| Step | Notes and rulings |
| --- | --- |
| 1 Decor footprints | `TerrainDef.decor` and `decorPlacements` (row-major, throws on incomplete or overlapping blocks). Inert until step 6. |
| 2 Sign and use rectangles | Signs and uses take `w`/`h` so a sign on a 2×2 well reads from any side. A small core rule change: a rect `use` is reachable from every adjacent tile. |
| 3 Animated water, blob groups | Ruling: the flow dashes drift 2 px per frame on an 8 px lattice; the plan's 4 px on a 4 px lattice made every frame identical. Frames share the variant's painter seed so speckle never flickers. |
| 4 Doors, windows, chimneys, jetty | Four terrains appended to `TERRAIN_IDS`; integrity tests pin the placement rules. The brook's marker stone is now a menhir. |
| 5 Decor and fx frames | Well frames 1 and 3 came out identical with a yoyo glint table; the glints now drift one way. |
| 6 Decor sprites live | Ruling: `decorArt` takes the terrain record, not one `DecorDef`. Decor draws at feet y − 0.25 so same-row entities win ties. Route and golden tests unchanged. |
| 7 Fish and smoke | `AmbientView` per stage; smoke depth 100 000 (world y reaches ~4900 in interior pockets). One fish roll per second, one in eight fires. |
| 8 Dev hook | `view()` and `jumpFish()`; bridge literals updated in both dev tests. |
| 9 Arm swing | Ruling: contralateral (opposite arm to the lifted leg), the plan agent's same-side table was a gait error. |
| 10 Nameplate | The tab is drawn before the box so the strokes merge. Guard test: every name keeps the tab under 400 px. |
| 11 E2E | `tests/e2e/world.spec.ts`, state-based through `__fimbul.view()`. |
| 12 Docs | Spec, plan, ledger, ARCHITECTURE.md, roadmap. |
