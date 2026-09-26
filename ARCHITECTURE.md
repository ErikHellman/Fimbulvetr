# Architecture

Fimbulvetr is a deterministic pure-TypeScript simulation wrapped in a thin Phaser 4 shell. The rationale is in `docs/superpowers/specs/2026-09-26-fimbulvetr-design.md`.

## Frame loop

```
keyboard/gamepad ─► InputMapper ─► InputLatch ──► Sim.step(frame) ×0–4 @ 60 Hz ──► GameState + SimEvents
                                                        ▲                                   │
                        Commands (dev console, menus) ──┘          ┌────────────────────────┤
                                                                    ▼                        ▼
                      EntityViews / ScreenView / ColorMatrix (state, alpha)   AudioDirector · autosave · dev hook
```

- **Fixed step.** `advance()` turns frame time into 0–4 fixed 1/60 s steps plus an interpolation alpha. After a long hitch it drops the backlog.
- **State is truth.** Views are rebuilt from `Sim` state every frame. Events are one-shots only: sound, autosave, screen changes.
- **Deterministic.** Pure layers never read `Math.random`, `Date` or engine trig. `tests/sim/determinism.test.ts` guards this.

## Layers

| Layer | Folder | May import | Holds |
| --- | --- | --- | --- |
| core | `src/core` | core, `import type` from content | math, clock and weather, state and save, input frames, world (text maps, auto-tile masks, collision, layout), actors (state machines, hero, enemies), combat, sim, dev query |
| content | `src/content` | core, content | ids, flags, names (en/sv), terrain, legend, screens, layout, tuning, clock rules, bindings, `DB` |
| art | `src/art` | core, content, art | rasters, grids, outlines, painters, packing, animations, colour grading, tiles, sprites, SFX synth |
| shell | `src/shell` | anything | Phaser scenes, texture registration, views, input devices, audio, storage (IndexedDB, localStorage), PWA, dev tools |

The layers are enforced by `tsconfig.pure.json` (no DOM types) and `eslint.boundaries.js`, which is covered by `tests/tooling/boundaries.test.ts`.

## Key modules
- **`src/core/sim/sim.ts`** — `Sim`: stepping, flip-screen transitions (30 ticks), commands, sword resolution, `hash()`.
- **`src/core/world/collision.ts`** — pixel-stepped AABB against the tile grid, with a 6 px corner slide.
- **`src/core/actors/hero.ts`** — the hero's state machine: move, attack (3-hit combo), charge → spin, roll (12 i-frames), shield, hurt.
- **`src/core/clock/*`** — the world clock:
  - Hybrid seasons: `held` or `cycling` policy, with `setSeason` for story beats.
  - Daylight ramps and stateless weather.
- **`src/core/state/save.ts`** — `SaveData` with version, checksum, migrations and validation. Every version has a fixture in `tests/fixtures/saves/`.
- **`src/art/*`** — all placeholder pixels and sounds, as pure functions:
  - Frame names follow `<art>_<anim>_<dir>_<n>`.
  - East frames are baked mirrors of west.
- **`src/shell/scenes/BootScene.ts`** — packs generated frames into canvas textures, builds the tileset and renders the SFX.
- **`src/shell/scenes/PlayScene.ts`** — owns the Sim, input, views, the camera ColorMatrix, audio and autosave triggers.
- **`src/shell/platform/*`**:
  - Settings in `localStorage['fimbulvetr.settings.v1']`.
  - IndexedDB `fimbulvetr` (stores `saves`: auto, auto_prev, s1–s3; and `meta`).
  - Export/import as JSON, a Web Locks single-tab guard, and the PWA service worker.

## How to…
- **Add a screen:**
  1. Add the id to `SCREEN_IDS`.
  2. Create `src/content/world/<region>/<id>.ts` (40×22 legend characters and a `purpose`).
  3. Register it in `registry.ts`, and place it in `layout.ts` if it is on the overworld.
  4. `tests/content/integrity.test.ts` checks the map size, legend, seams and placements.
- **Add an enemy:**
  1. Add the id to `ENEMIES`.
  2. Write the behaviour machine in `src/core/actors/enemies/` and register it in `BEHAVIOURS`.
  3. Add its definition in `src/content/enemies.ts`.
  4. Add frames and animations in `src/art/sprites/`.
- **Add art:** draw frames named by convention. A real atlas later replaces frames with the same names.
- **Change the save format:**
  1. Bump `SAVE_VERSION`.
  2. Add `MIGRATIONS[old]`.
  3. Commit `tests/fixtures/saves/v<new>.json`.

## Dev and test tools
- **Query string** (dev and `--mode test` builds): `?screen=&at=x,y&season=&time=HH:MM|day|night&seed=&lang=&nosave&mute`.
- **F1:** the overlay.
- **Backquote:** the console. Commands: warp, time, season, flag, lang, volume, save, export, import, help.
- **`window.__fimbul`:** the Playwright hook.
- **Tests:**
  - `pnpm test`: Vitest for core, art, content, shell units and headless sim scenarios.
  - `pnpm e2e`: Playwright on Chromium and WebKit.
  - `pnpm budget`: the gzipped JS budget (730 KB).
