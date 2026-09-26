# SDD ledger — plan: docs/superpowers/plans/2026-09-26-m0-foundations.md

Spec: docs/superpowers/specs/2026-09-26-fimbulvetr-design.md (binding authority).
Workspace: branch `m0-foundations` in the main checkout (not main/master); starting commit 3b89aa6.

## Pre-flight scan

### Cross-task file/interface pairs
| Tasks | Shared file / interface | Producer → consumer | Finding |
| --- | --- | --- | --- |
| T1 → T2, T21, T22 | package.json | T1 pins base deps; later tasks `pnpm add -D -E` exact versions | consistent |
| T1 → T21 → T22 | vite.config.ts | T1 base/alias/build; T21 adds `define.__BUILD_ID__`; T22 full replacement keeps define + adds VitePWA | consistent |
| T1 → T22 | index.html | T22 adds icon links into T1 head | consistent |
| T1/T2/T18/T19/T20/T21/T22 | src/shell/main.ts | each replaces or edits main(); T20+ imports t/UI; T21 adds locks/saves; T22 adds SW | consistent (T19 keeps DEV_TOOLS const local to main.ts) |
| T2 → T18 | src/shell/scale.ts | T2 constants; T18 full replacement adds computeZoom/attachZoom | consistent |
| T2 → T18 → T20 | BootScene.ts | T2 placeholder; T18 replaces; T20 adds registerSfx | consistent |
| T18 → T19 → T20 → T21 | PlayScene.ts | T19/T20 edit; T21 full replacement containing all prior edits | consistent |
| T18 → T19 → T20 → T21 | services.ts | adds dev → settings, muted → saves (T21 full file) | consistent |
| T19 → T20 → T21 | dev/bridge.ts, dev/commands.ts, dev/hook.ts, devCommands.test.ts | settings added T20, saves/restart T21, `void print` removed T21 | consistent |
| T4 → T19 | clock/types.ts, world/screens.ts, flags.ts | T19 appends isSeason/isScreenId/isFlagId | consistent |
| T9 → T12 | test_a.ts `things` | T12 adds dummy at (24,9) (grass) | consistent |
| T3 → T4..T21 | rng/hash/vec/box/dir | signatures used downstream match | consistent |
| T4 → T5 | GameState ↔ validator ↔ v1 fixture | fixture fields = GameState fields; sum 1098b91e precomputed | consistent |
| T6 → T7, T11, T14 | InputFrame, bitsOf, moveVector, EMPTY_FRAME | consistent |
| T8 → T9, T10, T14, T16 | TerrainGrid, parseTextMap, autotile masks | consistent |
| T9 → T14, T19 | tileFeet, indexLayout, neighbourOf, screenOrigin | consistent |
| T10 → T14 | moveBox(box, dx, dy, solidAt, obstacles?, slide?) | T14 call order matches | consistent |
| T11 → T12, T14 | Entity, Machine, Tuning, SimEvent, HERO_MACHINE, createHero(Pick<HeroState>) | consistent |
| T12 → T14 | BEHAVIOURS, createEnemy, EnemyDef{solid, immortal, knockResist}; dummy body 14×10 | T14 test uses DB.enemies.dummy.body.x | consistent |
| T13 → T14, T18 | tickClock(c, rules, tpm), setMinute, setSeason, daylight, grade | consistent |
| T14 → T18, T19 | Sim API (originOf, terrainOf, transition, entities, command, snapshot) | consistent |
| T15 → T16, T17, T18 | Painter/C, draw/outline/grid/raster, packShelves/extrude/frameFor | consistent |
| T16, T17 → T18 | buildTileset/tileIndices, buildSprites/ANIMS | consistent |
| T19 → T21, T22, T24 | tests/e2e/helpers.ts (boot, walkUntilScreen, eventCount) | consistent |

### Per-task self-consistency
| Task | Check | Finding |
| --- | --- | --- |
| T1 | tests vs eslint.boundaries.js; tsconfig includes vs files present | consistent (pure include of missing src/core is fine while src/content has a file) |
| T2 | smoke expects body[data-ready] ← BootScene placeholder sets it | consistent |
| T3 | tests ↔ code (FNV values, dirFromVec rules) | consistent |
| T4 | tests ↔ newGame/i18n/name tables | consistent |
| T5 | fixture sum ↔ canonicalJson; test detail strings ↔ validator messages | consistent |
| T6 | advance caps/clamps ↔ tests | consistent |
| T7 | toggle/blur/pad tests ↔ mapper | consistent |
| T8 | MapError messages ↔ tests | consistent |
| T9 | seams ↔ generated maps (verified by script) | consistent |
| T10 | snapToWall + nudge ↔ corner/flush tests | consistent (hand-traced) |
| T11 | tick counts in hero tests ↔ state durations | consistent (hand-traced) |
| T12 | resolveHit ↔ tests | consistent |
| T13 | clock rules ↔ isNight/daylight/cycling tests | consistent |
| T14 | combo 3 hits with enemyIframes 6 ↔ sword window timing | consistent (hand-traced) |
| T15–T17 | art tests ↔ code | consistent |
| T18 | computeZoom tests ↔ code | consistent |
| T19 | query warnings ≥6; commands replies ↔ tests | consistent; `void print;` interim line (see ruling) |
| T20–T24 | tests ↔ code | consistent |

### Pre-flight rulings
- Ruling: T19's `void print;` placeholder line in commands.ts stays until T21 removes it — it keeps the planned `runCommand(b, line, print)` signature stable across T19–T21 without an unused-arg lint error — cost if wrong: one trivial line reviewers may flag as Minor.
- Ruling: execution happens on branch `m0-foundations` in the main checkout rather than a separate worktree — the branch is already isolated from main, clean, and holds only this plan's commits — cost if wrong: none beyond sharing the checkout with the user's editor.

## Progress
- Ruling: Co-Authored-By trailers name the model that actually wrote each commit (subagents follow their own attribution reminder, e.g. "Claude Sonnet 5") instead of the plan's literal "Claude Opus 5.5" — truthful attribution beats uniformity — cost if wrong: cosmetic trailer inconsistency, fixable by rewording commits before merge.
- Task 1: review — spec ✅, 1 Important (plan-mandated): eslint.config.js is outside every tsconfig include so its `// @ts-check` is inert (editor shows import.meta.dirname error).
- Ruling: fix by adding `eslint.config.js` to tsconfig.json `include` so the pragma is enforced by `pnpm typecheck`; if that surfaces only third-party type incompatibilities between eslint/typescript-eslint config types, instead drop `// @ts-check` from eslint.config.js and leave it out of include — spec wants a strict, honest gate; an inert pragma is neither — cost if wrong: a few minutes of config churn.
- Task 1: minor (deferred): extensionless `./aliases.config` import in vite/vitest configs triggers Vite's `configLoader: 'native'` deprecation warning (noise in test/build output).
- Task 1: fix round 1/5 (1 addressed, 0 open; commits 9851d80..093a03a)
- Task 1: complete (commits 3b89aa6..093a03a, review clean after fix round 1)
- Task 2: review — spec ✅, 1 Important (plan-mandated): English-only WebGL message in main.ts violates the bilingual-text constraint.
- Ruling: accept the English literal as interim — i18n (`t`, `UI.webgl_required`) arrives in Task 4 and Task 20 already replaces this call with `t(UI.webgl_required, settings.lang)` — cost if wrong: an English-only error screen on an unreleased branch for a few commits.
- Task 2: minor (deferred): src/shell/boot/webgl.ts and message.ts have no unit tests (only the smoke test's happy path).
- Task 2: complete (commits 093a03a..1e6606f, 1 plan-mandated finding ruled — see above)
- Task 3: minor (deferred): vec.normalize zero branch returns a fresh literal rather than ZERO (fine, undocumented); dirFromVec doc doesn't state the 2:1 ratio; add/sub/scale/dot lack direct tests.
- Task 3: complete (commits 1e6606f..14a7567, review clean)
- Task 4: deviation (accepted by review): newGame dungeons record uses `as unknown as Record<DungeonId, DungeonState>` because Object.fromEntries widens keys; covered by the every-dungeon test.
- Task 4: minor (deferred): isSet() has no direct unit test.
- Task 4: complete (commits 14a7567..5a86bdc, review clean)
- Task 5: review — spec ✅; 1 Important (plan-mandated): loadSave throws TypeError when `sum` present but `state` key missing (checksum(undefined) → fnv1a(undefined)); violates Review Focus #4.
- Ruling: fix in the loop — loadSave rejects a missing/non-object `state` as `invalid` ("missing game state") before computing the checksum, plus a regression test — the spec's never-crash-on-import rule outranks the plan's reference code — cost if wrong: none.
- Task 5: minor (deferred): validateGameState accepts saves missing some of d1..d8 (recordOf only checks present keys; core can't see DUNGEONS); revisit when M1 first reads dungeon state (normalize via migration/fill).
- Task 5: minor (deferred): either(a,b) reports only a's message when both fail.
- Task 5: fix round 1/5 (1 addressed, 0 open; commits b373e79..2e63658)
- Task 5: minor (deferred): save.ts guard uses snake_case local `state_raw` (repo style is camelCase).
- Task 5: complete (commits 5a86bdc..2e63658, review clean after fix round 1)
- Task 6: minor (deferred): advance() internal MAX_DELTA_MS=250 silently caps steps at ~15 whatever maxSteps says (undocumented); no test for custom maxSteps.
- Task 6: complete (commits 2e63658..3355494, review clean)
- Task 7: ⚠️ resolved by controller: attachKeyboard/readPad wiring lands in Task 18 PlayScene.create/update (per plan).
- Task 7: minor (deferred): gamepad axes NaN not guarded (Number.isFinite) before deadzone; attachKeyboard's blur/visibilitychange wiring has no direct test (covered later by e2e only); pad/kb binding overlaps (interact/confirm, item1/cancel) are intentional context design.
- Task 7: complete (commits 3355494..1b85013, review clean)
- Task 8: minor (deferred): MapError doesn't set this.name; blobIndex's throw branch is unreachable (defensive).
- Task 8: complete (commits 1b85013..3c19bde, review clean)
- Task 9: complete (commits 3c19bde..7c52863, review clean)
- Task 10: minor (deferred): moveBox X/Y blocks structurally mirrored (plan-mandated, axis-separated pattern); nudge recomputes firstStepFree per k; side tie-break always prefers -1 (moot for tile walls, may matter for non-tile obstacles).
- Task 10: complete (commits 7c52863..c6cc476, review clean)
- Task 11: ⚠️ resolved by controller: iframes decay is Sim.tickTimers (Task 14); tuning.hero.hurtIframes has no consumer until enemy attacks exist (M1) — carry to M1.
- Task 11: minor (deferred): fsm.ts current()/changeState duplicate the cast lookup; heroSwordDamage untested (Task 14 sim test covers dealt [2,2,4]); hurt state unreachable until M1 damage.
- Task 11: complete (commits c6cc476..e2b18b1, review clean)
- Task 12: ⚠️ resolved by controller: EnemyDef.immortal/solid/behaviour and ScreenDef.things spawning are consumed by the Task 14 Sim (spawn, moveAll obstacles, resolveSword refill).
- Task 12: minor (deferred): PIERCE_SHIELD tag has no test.
- Task 12: complete (commits e2b18b1..6e8f923, review clean)
- Task 13: minor (deferred): applyMatrix's alpha-column term is always 0 (dead); daylight wrap uses `>` not `>=` at since == 1440-half (masked by Math.min for current data); setPolicy untested.
- Task 13: complete (commits 6e8f923..8db7f82, review clean)
- Task 14: deviation (disclosed): Sim.spawn() uses `.map` over things instead of `switch (thing.k)` — a one-variant union makes the discriminant check always-true under no-unnecessary-condition.
- Task 14: Ruling: Important "spawn() loses exhaustiveness when Thing grows" is not fixable now (any discriminant check fails lint on a 1-member union) — carry to M1: when Thing gains a 2nd variant, restore `switch (thing.k)` with a `never` default in Sim.spawn (code comment at sim.ts spawn marks it) — cost if wrong: an M1 variant carrying `id: EnemyId` could be mis-spawned as an enemy until caught by tests.
- Task 14: minor (deferred): diagonal step into a corner can chain two transitions (checkEdges checks one axis per tick); no test asserts the clock is paused during transitions.
- Task 14: complete (commits 8db7f82..4697bf3, 1 Important ruled/carried to M1)
- USER (mid-run): when M0 is complete, commit everything and pause; remaining milestones will run in a cloud session.
- Task 15: ⚠️ resolved by controller: east frames are baked via flipX in Task 17 heroFrames(), never flipped at runtime.
- Task 15: minor (deferred): frameFor unguarded for frames=0 / negative animT; pack rejects exactly page-wide items (reserves trailing pad); no direct tests for blit/copyRaster/rastersEqual/draw/painter.
- Task 15: complete (commits 4697bf3..bac788c, review clean)
- Task 16: minor (deferred): no test for inner-corner notch / single-edge blob masks (verified correct by reviewer brute force).
- Task 16: complete (commits bac788c..daee909, review clean)
- Task 17: review — spec ✅; 1 Important (plan-mandated): walk/shieldwalk phase 1/3 bob moves the body UP 1 px so the head's top row sits at y=1 and the second outline pass is clipped (16 frames show a 1 px top outline).
- Ruling: fix in the loop — bob DOWN instead (`b = o + bob`), keeping ≥2 px headroom; add a sprite test asserting every non-ink opaque pixel stays ≥2 px (hero) / ≥1 px (dummy) from the frame edge — the spec's "2 px outline on characters" is binding, the plan's bob direction is incidental — cost if wrong: walk cycle dips instead of rises (cosmetic).
- Task 17: minor (deferred): implementer report frame counts wrong (actual 96 frames).
- Task 17: fix round 1/5 (1 addressed, 0 open; commits 263fc85..7c0fae8)
- Task 17: complete (commits daee909..7c0fae8, review clean after fix round 1)
- Task 18: controller visual check (dev server, in-app browser): terrain/auto-tiles/sprites render; walking east slides to test_b. OK.
- Task 18: Ruling: restore `game.canvas.setAttribute('aria-label', GAME_TITLE)` in startGame as part of Task 19 (which replaces main.ts again) — accessibility regression from the plan's replacement code; one line — cost if wrong: none.
- Task 18: complete (commits 7c0fae8..3b2d372, review clean)
- Task 19: deviations (accepted by review): commands.ts `void print;` → unused param `_print` (no-meaningless-void-operator); console.ts dropped `?? ''` on textContent (non-nullable in TS 6 DOM lib). Task 21 must rename `_print` back to `print` when it starts using it.
- Task 19: minor (deferred): warp x/y args not validated (NaN possible, dev-only); no e2e test types per-character keys into the console.
- Task 19: complete (commits 84a6214..8b1508d, review clean)
- Task 20: minor (deferred): registerSfx false-branch and AudioDirector muted/cache-miss branches untested; synth output not clamped at function level (bank volumes ≤0.4 keep it safe).
- Task 20: complete (commits 8b1508d..c6320d6, review clean)
- Task 21: deviation (accepted): fake-indexeddb factory helper without the double cast (types structurally identical).
- Task 21: minor (deferred): no Autosaver test for request() during a slow in-flight write; pagehide flush path only exercised via flushSave() in e2e.
- Task 21: complete (commits c6320d6..b5f82f0, review clean)
- Task 22: minor (deferred): registerSW has no onRegisterError diagnostic; no unit test for Reload→update(true)/Later no-op.
- Task 22: complete (commits b5f82f0..b3438f6, review clean)
- Task 23: review — spec ✅; 1 Important (plan-mandated): check-budget.mjs only scans dist/assets/*.js, so dist/sw.js and dist/workbox-*.js (service worker, ~6 KB gz) escape the 730 KB "total gzipped JS" gate.
- Ruling: fix in the loop — scan every .js file under dist/ recursively, and print a one-line "run pnpm build first" error (exit 1) when dist/ is missing — spec budget is total JS; cheap robustness — cost if wrong: none.
- Task 23: minor (deferred): no automated test for the budget script's failure paths; Playwright browsers not cached in CI.
- Task 23: fix round 1/5 (2 addressed, 0 open; commits 4ab1489..44a817f)
- Task 23: complete (commits b3438f6..44a817f, review clean after fix round 1). Workflows committed, NOT pushed.
- Task 24: implementer found a real input defect (outside Task 24's files): a key tap whose keydown+keyup both fall between two rendered frames is lost — PlayScene samples KeyboardState once per frame, so KeyboardState adds and deletes the code before InputMapper.sample() sees it; the InputLatch's tap-latching never gets the press. The exit test works around it with down→poll→up.
- Ruling: load-bearing — fix in the final-review fix wave: KeyboardState must remember codes pressed since the last sample (codes() returns held ∪ tapped; PlayScene clears taps after sampling) or report to the mapper on every key event, plus a unit test (down+up between samples still yields wasPressed) — spec/plan promise "taps between ticks are never lost" — cost if wrong: a few extra lines in shell input.
- Task 24: scope ruling: steps 1–4 only; user playtest (step 5) deferred to the user at the M0 pause; roadmap last item left unticked with a waiting note.
- Task 24: minor (deferred): holding KeyJ in the exit test can pass through charge (level-triggered attack→charge check); harmless.
- Task 24: complete (commits 44a817f..5e2e262, review clean)
- Final review (opus, 3b89aa6..5e2e262): "With fixes". Critical: sub-frame tap loss (already ruled). Important: Web Locks rejection hangs startup. Minors: IDB read failure at boot, NaN axis freeze, getGamepads unguarded, import queues live state, spec items (ledges, ?dev=gallery) dropped unrecorded, deploy not gated, applyDevQuery duplicates clock, <html lang> static, test depth.
- Ruling: fix wave covers F1–F12 (all Critical/Important + cheap minors + T5 state_raw + T19 warp NaN) in ONE dispatch — see final-fix-brief.md — the startup hangs violate Review Focus #3, the NaN freeze is a hang, the rest are one-liners — cost if wrong: a slightly larger final diff.
- Ruling: remaining deferred minors carried per the final reviewer's triage (M1: dungeons fill, hurt/hurtIframes, PIERCE_SHIELD, spawn switch, diagonal double transition, clock-pause test, non-tile nudge tie-break, off-layout screen origins, EnemyCtx needs hero pos/RNG/solidAt, split Sim into systems, test_a–c ids pinned by v1 fixture; M2: SW onRegisterError + Reload/Later tests) — they belong with the features that exercise them — cost if wrong: small rework later.
- Final fix wave: 4 commits 5e2e262..73c28f2; re-review: F1–F7, F8a, F9–F12 ADDRESSED, no new breakage; F8b (ci.yml trigger → [push, workflow_dispatch]) NOT applied — the fixer's permission classifier refused the edit.
- Final: parked — F8b ci.yml trigger change — Ruling: not applied by the controller (the edit was refused by a permission check; routing around it would bypass that decision) — surfaced to the user as a manual one-line change — cost if wrong: PR branches run CI twice.
