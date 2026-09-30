# Ledger — M3b Sökkva Kvern

Plan: `docs/superpowers/plans/2026-09-30-m3.md` (Part 2, and its "Status" section). Brief: `docs/briefs/m3.md`. Branch: `claude/m3-myrland`, continuing after M3a (3434e78); every push updates PR #11 (the user asked for one M3 PR and no PR watching). Baseline: `pnpm check` green, 1431 tests.

| Task | Notes and rulings |
| --- | --- |
| 1 Ledger | This ledger. Carry-overs from M3a (see the plan's Status): the mill door sign at `myl_mill` (18,13) becomes a door on the plank walk's end (18,14); the crack sites in the north-east of `myl_springs` and `myl_peat`; D2 proofs use `within` and cached solves; "cannot without" proofs remove the item at its source; e2e presses are frame-based; routes drink mead when low and pass `FIMBUL_ROLLED=1`. |
| 2 Ammo | `ItemDef.ammo {bag, step}` and `itemMax(defs, have, id)` (`core/items/defs.ts`): bombs carry 10, plus 10 per `bomb_bag` (up to 30). `giveItem` and the shop's refusal use `itemMax`. `take` leaves ammunition at 0, still in its slot; `equip` lets ammunition sit in a slot at 0. New Cond `{k:'owns', id}` (and `owns()`): in the bag at all, even at 0. `DropKind` gains `bombs` (`DropTable.bombs?`, drawn after seiðr jars, so older tables draw as before). `spillDrop` (used by kills and prop loot) leaves no bombs while none are owned; a bundle gives 4, capped. Found lines for bombs and the bag; icons `item_bombs`, `item_bomb_bag`; `pickup_bombs`. Test: `tests/sim/ammo.test.ts`. |
