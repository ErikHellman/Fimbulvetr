# Ledger — M2a Turning world

Plan: `docs/superpowers/plans/2026-09-27-m2.md` (Part 1). Brief: `docs/briefs/m2.md`. Branch: `claude/admiring-bardeen-h3rz93`, from `main` after M1 (f84d028). Baseline: `pnpm check` green, 885 tests.

| Task | Notes and rulings |
| --- | --- |
| 1 Docs | M2 brief (`docs/briefs/m2.md`), the plan, this ledger, roadmap rows for M2a/b/c. |
| 2 Pinning | `SimOptions.rolled` (default on) and `SimRt.rolled`: rolled weather and spawn tables. The test `Harness` pins it off unless a test passes `rolled: true`, so golden and the M1 routes keep their code path. Dev query `weather=<kind>` (the starting override) and `rolled=0`; `Services` carries both into PlayScene. The e2e `boot` helper appends `rolled=0` unless the query names `rolled`, and always loads `/?…`. Golden unchanged. |
| 3 Sky and wind | New `systems/weather.ts`: `skyOf` (dev override → story rules, evaluated without weather so none can recurse → the region roll `weatherAt` with `seasonAt` when `rolled` → clear), `windOf` and `outdoors`. `Sim.weather()` is the sky outdoors and clear indoors/underground; new `Sim.sky()` (indoors too) and `Sim.wind()`. `windAt(seed, day, region, kind)` in `clock/weather.ts`: one of eight hashed directions all day (a constant unit-vector table, no trig), strength per kind (`WIND_STRENGTH`: wind 0.5, storm 0.8, snow 0.2, rain 0.15). New Cond `{k:"weather", is}` read through a lazy `CondCtx.weather` thunk (missing = clear); `condCtx` supplies it. `SimRt.weatherOverride`. Golden unchanged. |
