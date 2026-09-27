# Ledger — M2a Turning world

Plan: `docs/superpowers/plans/2026-09-27-m2.md` (Part 1). Brief: `docs/briefs/m2.md`. Branch: `claude/admiring-bardeen-h3rz93`, from `main` after M1 (f84d028). Baseline: `pnpm check` green, 885 tests.

| Task | Notes and rulings |
| --- | --- |
| 1 Docs | M2 brief (`docs/briefs/m2.md`), the plan, this ledger, roadmap rows for M2a/b/c. |
| 2 Pinning | `SimOptions.rolled` (default on) and `SimRt.rolled`: rolled weather and spawn tables. The test `Harness` pins it off unless a test passes `rolled: true`, so golden and the M1 routes keep their code path. Dev query `weather=<kind>` (the starting override) and `rolled=0`; `Services` carries both into PlayScene. The e2e `boot` helper appends `rolled=0` unless the query names `rolled`, and always loads `/?…`. Golden unchanged. |
