# Ledger — M11a Completion

Plan: `docs/superpowers/plans/2026-10-05-m11.md` (Part 1). Brief: `docs/briefs/m11.md`. Branch: `claude/m11-completion`, on top of M10 (`claude/m10-utgard`). Baseline: `pnpm check` green; golden hash unchanged; `SAVE_VERSION` stays 1.

## Tasks

| Task | Rulings |
| --- | --- |
| 1 Counting conditions | `Cond` gains `{ k: 'pieces'; gte }` and `{ k: 'warps'; gte }`, pure reads of `world.pieces` and `world.warps`. Tests in `story.test.ts`. |
| 2 Achievements | `core/progress/achievements.ts` (`earned`, `fresh`); 24 ids appended to `ACHIEVEMENTS` in `content/ids.ts` (append-only, since browsers store them); `content/achievements.ts` with the defs, `PIECE_TOTAL` (36), `WARP_TOTAL` (counted from the screens, 8) and `SIDE_QUESTS` (25). A test per def. |
| 3 Store, toast, page, footer | `shell/platform/achievements.ts` (unknown ids dropped, storage errors swallowed); a toast queue of three seconds each; the title menu's Achievements row (last) and its two-column page; the quest page's footer (quest lines cut to 21 to make room). PlayScene publishes `document.body.dataset.achievements` for e2e. |
| 4 The rune-record | `q_record` (an int up to 4) from Gyða after Halvar's confession; a stone script per bauta latches its own `st_bauta_*` flag. **Ruling:** the Sævatn stone stands at (32,10), off the landing's spawn point. Gyða gives `hp_record`. Test: `record`. |
| 5 The spring feast | `q_feast` from Halvar after `st_game_done`. **Ruling:** the cask comes from Dvalinn (the brief's "Refuge keeper" was a slip; Dvalinn keeps the dwarves' ale). **Ruling:** Halvar's spring line now waits on `q_farm ≥ 2`, so the feast never blocks the farm build. `end_feast` sits Ask at the longhouse table at 20:00 (Embla's line only if she stayed). Test: `feast`. |
| 6 Pieces and verses | **Finding:** the M6a verse names `hp_nif_gjoll`, but the piece and its posts were never placed; both are placed now (posts at (9,2) and (16,3), the piece at (3,2)). Four new pieces: `hp_hau_sinkhole` (grapple), `hp_dvg_store` (hammer stake `dvg_k_ledges`), `hp_dvg_slag` (Ís over a lava ring), `hp_hrf_thaw` (a dive, after the thaw). Spawn points in `hau_gully` and `dvg_slag` moved off the new terrain. Bragi sings 7 verses now. Tests: `solver_m11` (each piece unreachable without its tool), `thaw_piece`, `skald`. |
| 7 Exit | `tests/sim/routes/m11a.ts` (`playM11a` from the M10b save): the trader and the warp stone in the village, Gyða, the four stones, the gully, the Gjöll, the ledges, the slag, the saddle and the cairn, then the three hand-overs and the feast. 18087 ticks, 26 pieces at the end. `v1-m11a.json` (in the longhouse after the feast), its fixture test, and `m11a.spec.ts` (a late save earns its achievements and the browser keeps them). |
