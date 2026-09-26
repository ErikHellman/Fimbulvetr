# Fimbulvetr — working agreement for Claude Code

Browser action-adventure: Phaser 4.2.1, strict TypeScript, Vite. Everything runs in the browser, and all state stays local.

- **Design intent:** `Fimbulvetr-game-design-document.md`.
- **Architecture and roadmap:** `docs/superpowers/specs/2026-09-26-fimbulvetr-design.md`, `ARCHITECTURE.md` and `docs/roadmap.md`.

## Commands
- `pnpm dev` — dev server. Dev query string: `?screen=test_a&at=20,11&season=winter&time=22:00&nosave`.
- `pnpm check` — typecheck (pure + shell + tests), ESLint, Prettier check and Vitest. Must be green before every commit.
- `pnpm e2e` — Playwright (Chromium + WebKit) against a `--mode test` build.
- `pnpm build && pnpm budget` — production build plus the JS size budget.

## Layers (enforced by tsconfig.pure.json and eslint.boundaries.js)
| Layer | May import | Purpose |
| --- | --- | --- |
| `src/core` | core, `import type` from content | Rules and simulation. No Phaser, no DOM. No `Math.random`, `Date.now`, `new Date`, `Math.sin`/`cos`/`tan`/`atan2`/`hypot`. |
| `src/content` | core, content | Typed game data: screens, flags, items, dialogue, tuning. |
| `src/art` | core, content, art | Pure placeholder art and sound generation (RGBA / Float32Array buffers). |
| `src/shell` | anything | Phaser, DOM, storage, audio, input devices, dev tools. Keep it thin. |

## Rules
- **Tests first:** TDD for core, content and art — write the failing Vitest test first.
- **Persisted ids:** never rename or remove a persisted id (flag, item, screen, save field) without a migration in `src/core/state/migrations.ts`, a `SAVE_VERSION` bump and a new `tests/fixtures/saves/vN.json`. Old fixtures stay forever.
- **Bilingual text:** every player-facing string is `{ en, sv }`. Write both; the user proofreads the Swedish.
- **Frame names:** `<art>_<anim>_<dir>_<n>`, e.g. `hero_walk_s_0`. Real art must reuse these names.
- **Phaser docs:** before writing shell code, read the matching `node_modules/phaser/skills/<topic>/SKILL.md`. Phaser 4 differs from v3:
  - Filters replace FX.
  - `setTintFill` is gone; use `setTint(c).setTintMode(Phaser.TintModes.FILL)`.
  - ColorMatrix offsets are in the 0–255 range.
  - There is no Canvas fallback.
- **Plan first** before changing core public interfaces (`Sim`, `GameState`, `ContentDb`, `SaveData`).
- **Keep docs current:** update `ARCHITECTURE.md` when adding a system, and tick `docs/roadmap.md`.
- **Git:** one feature branch per milestone or session. Never push or open PRs without asking.
