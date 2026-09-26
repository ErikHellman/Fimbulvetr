# M0 Foundations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A browser-playable skeleton. The hero walks, attacks, rolls and shields on three code-drawn text-map screens joined by flip-screen slides, under a day/night and season tint. Saves go to IndexedDB with export/import; the app is offline-capable (PWA), and CI plus a Pages workflow is ready.

**Architecture:**
- All rules live in a pure-TypeScript core (`src/core`) that has no Phaser or DOM access. It steps a deterministic simulation at a fixed 60 Hz.
- `src/content` holds typed game data, and `src/art` generates placeholder pixels and sounds as plain buffers.
- A thin Phaser 4 shell (`src/shell`) turns sim state into sprites and tilemaps. It feeds keyboard and gamepad input in, and handles storage, audio and dev tools.

**Tech Stack:** Phaser 4.2.1, TypeScript 6.0.3 (strict), Vite 8.3.1, Vitest 5.0.2, Playwright 1.63.0, ESLint 10.11 + typescript-eslint 8.70.1, Prettier 3.9.9, vite-plugin-pwa 1.3.0, fake-indexeddb 6.2.5, pnpm 10.13.1, Node 22.14+.

**Spec:** `docs/superpowers/specs/2026-09-26-fimbulvetr-design.md` (design and architecture). `Fimbulvetr-game-design-document.md` holds the game design.

## Global Constraints

- **Versions:** pin every dependency exactly (no `^`). typescript-eslint 8.70.1 supports TypeScript `<6.1.0`, so use TypeScript **6.0.3**, not 7.x.
- **Layers:**
  - `src/core` imports only core, plus `import type` from content.
  - `src/content` imports core and content.
  - `src/art` imports core, content and art.
  - `src/shell` imports anything.
  - Enforced by `tsconfig.pure.json` (no DOM types) and `eslint.boundaries.js`.
- **Determinism:** pure layers never call `Math.random`, `Date.now` or `new Date()`. The core additionally avoids `Math.sin`, `Math.cos`, `Math.tan`, `Math.atan2` and `Math.hypot`; use `Math.sqrt`.
- **Screen geometry:**
  - Canvas 640×360, `pixelArt: true`, `type: Phaser.WEBGL`, with no Canvas fallback.
  - Playfield 640×352 = 40×22 tiles of 16 px; world camera viewport `(0, 4, 640, 352)`.
- **Text:** every player-facing string is `L10n = { en, sv }`, and both languages must be written.
- **Frame names:** `<art>_<anim>_<dir>_<n>`, e.g. `hero_walk_s_0`. East-facing frames are baked (mirrored from west), not flipped at runtime.
- **Persisted ids** (flags, items, screens, save fields) are never renamed without a migration and a new fixture.
- **Storage:** IndexedDB database `fimbulvetr` (stores `saves`, `meta`); settings in `localStorage['fimbulvetr.settings.v1']`. No network requests besides loading the app itself.
- **Git:** work on branch `m0-foundations`, one commit per task, messages in imperative mood ending with the line `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. **Never push or create PRs without asking the user.**
- **Before each commit,** run `pnpm check` (typecheck + lint + Prettier check + Vitest); it must be green. Run `pnpm format` first if Prettier complains.

## Review Focus

1. **Window loses focus while a key is held** (Alt-Tab mid-walk). The player expects the hero to stop, not keep walking forever. Test: `KeyboardState.clear()` on blur → released bits (Task 7).
2. **Browser window smaller than 640×360**, or an odd device pixel ratio. The player expects the game to shrink to fit, never to vanish at zoom 0. Test: `computeZoom` fallback (Task 18).
3. **IndexedDB or localStorage unavailable or throwing** (private mode, blocked site data). The player expects the game to start with saving disabled and a notice, and settings at defaults. Tests: `openSaveStoreSafely` returns null; `loadSettings` survives a throwing storage (Tasks 20, 21).
4. **Importing a file that is not JSON, not a Fimbulvetr save, damaged, or from a newer version.** The player expects a clear message and the current game untouched. Tests: `parseSaveJson` / `loadSave` error codes (Task 5); import message mapping (Task 21).
5. **Tab backgrounded for minutes, then refocused**, delivering one huge frame delta. The player expects no fast-forward burst or clock jump. Test: `advance` caps the steps at 4 and drops the rest (Task 6).

## File Structure

```
package.json, pnpm-lock.yaml, .gitignore, .prettierrc.json, .prettierignore
tsconfig.base.json      shared strict options + path aliases (@core @content @art @shell)
tsconfig.pure.json      src/core, src/content, src/art — lib ES2023 only (no DOM)
tsconfig.shell.json     src/** with DOM + vite/client types
tsconfig.json           everything incl. tests/scripts (editor + ESLint project)
aliases.config.ts       alias map shared by vite.config.ts and vitest.config.ts
vite.config.ts, vitest.config.ts, playwright.config.ts
eslint.config.js        typescript-eslint strictTypeChecked + prettier + boundaries
eslint.boundaries.js    layer/determinism rules (also used by a test)
index.html
CLAUDE.md, ARCHITECTURE.md, docs/roadmap.md
src/core/
  math/{rng,hash,vec,box,dir}.ts
  i18n/t.ts
  clock/{types,clock,weather,rules}.ts
  state/{flags,gameState,validate,migrations,save}.ts
  input/actions.ts            ACTIONS, InputFrame, InputLatch, moveVector
  sim/{loop,events,commands,db,sim}.ts
  world/{dims,terrain,textmap,autotile,screen,collision}.ts
  actors/{entity,fsm,tuning,hero}.ts  actors/enemies/{defs,dummy,index}.ts
  combat/hit.ts
  dev/query.ts
src/content/
  meta.ts ids.ts flags.ts items.ts galdr.ts gear.ts start.ts tuning.ts clock.ts
  enemies.ts terrain.ts bindings.ts index.ts (DB) i18n/ui.ts
  world/{screens,legend,layout,registry}.ts  world/testlands/{test_a,test_b,test_c}.ts
src/art/
  raster.ts palette.ts grid.ts outline.ts painter.ts pack.ts anims.ts grading.ts
  tiles/{blob,terrain,tileset,indices}.ts
  sprites/{hero,dummy,missing,index}.ts
  sfx/{synth,bank}.ts
src/shell/
  main.ts scale.ts services.ts env.d.ts
  boot/{webgl,message}.ts
  scenes/{BootScene,PlayScene}.ts
  gfx/{frameIndex,textures}.ts
  view/{screenView,entityViews}.ts
  input/{keyboard,gamepad,mapper}.ts
  audio/sfx.ts
  platform/{settings,idb,saveStore,autosave,saveService,exportImport,tabLock,pwa}.ts
  dev/{enabled,bridge,stats,hook,overlay,console,index}.ts
tests/
  tooling/boundaries.test.ts
  unit/core/*.test.ts  unit/art/*.test.ts  unit/shell/*.test.ts
  content/{text,integrity}.test.ts
  sim/{harness.ts,sim.test.ts,determinism.test.ts}
  fixtures/saves/v1.json
  e2e/{smoke,dev,saves,pwa,m0}.spec.ts
scripts/{icons.mjs,check-budget.mjs}
public/icons/*.png
.github/workflows/{ci.yml,deploy.yml}
```

---

### Task 1: Project scaffold, strict tsconfigs, lint boundaries, Vitest

**Files:**
- Create: `package.json`, `.gitignore`, `.prettierrc.json`, `.prettierignore`, `tsconfig.base.json`, `tsconfig.pure.json`, `tsconfig.shell.json`, `tsconfig.json`, `aliases.config.ts`, `vite.config.ts`, `vitest.config.ts`, `eslint.boundaries.js`, `eslint.config.js`, `index.html`, `src/content/meta.ts`, `src/shell/main.ts`
- Test: `tests/tooling/boundaries.test.ts`

**Interfaces:**
- Produces: path aliases `@core/*`, `@content/*`, `@art/*`, `@shell/*`; scripts `pnpm dev|build|build:test|preview|typecheck|lint|format|test|check|e2e|budget|icons`; `boundaryConfigs` (ESLint flat-config array) from `eslint.boundaries.js`; `GAME_TITLE` from `@content/meta`.

- [ ] **Step 1: Create `package.json` and `.gitignore`**

```json
{
  "name": "fimbulvetr",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "packageManager": "pnpm@10.13.1",
  "engines": { "node": ">=22.14" },
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "build:test": "vite build --mode test",
    "preview": "vite preview",
    "typecheck": "tsc -p tsconfig.pure.json && tsc -p tsconfig.shell.json && tsc -p tsconfig.json",
    "lint": "eslint . && prettier --check .",
    "format": "prettier --write .",
    "test": "vitest run",
    "check": "pnpm typecheck && pnpm lint && pnpm test",
    "e2e": "playwright test",
    "budget": "node scripts/check-budget.mjs",
    "icons": "node scripts/icons.mjs"
  },
  "dependencies": {
    "phaser": "4.2.1"
  },
  "devDependencies": {
    "@eslint/js": "10.0.1",
    "@types/node": "22.20.4",
    "eslint": "10.11.0",
    "eslint-config-prettier": "10.1.8",
    "prettier": "3.9.9",
    "typescript": "6.0.3",
    "typescript-eslint": "8.70.1",
    "vite": "8.3.1",
    "vitest": "5.0.2"
  }
}
```

`.gitignore`:

```
node_modules/
dist/
dev-dist/
coverage/
playwright-report/
test-results/
*.tsbuildinfo
.DS_Store
```

- [ ] **Step 2: Install**

Run: `pnpm install`
Expected: `pnpm-lock.yaml` created, no errors.

- [ ] **Step 3: TypeScript configs and aliases**

`tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "noEmit": true,
    "paths": {
      "@core/*": ["./src/core/*"],
      "@content/*": ["./src/content/*"],
      "@art/*": ["./src/art/*"],
      "@shell/*": ["./src/shell/*"]
    }
  }
}
```

`tsconfig.pure.json` (no DOM: any `window`, `document`, `localStorage`, `performance`, `setTimeout` in these layers is a compile error):

```json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": { "lib": ["ES2023"], "types": [] },
  "include": ["src/core", "src/content", "src/art"]
}
```

`tsconfig.shell.json`:

```json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": { "lib": ["ES2023", "DOM", "DOM.Iterable"], "types": ["vite/client"] },
  "include": ["src"]
}
```

`tsconfig.json` (editor + ESLint + tests):

```json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "types": ["node", "vite/client"],
    "allowJs": true,
    "checkJs": false
  },
  "include": ["src", "tests", "*.config.ts", "eslint.boundaries.js"]
}
```

`aliases.config.ts`:

```ts
import { fileURLToPath } from 'node:url';

const dir = (path: string): string => fileURLToPath(new URL(path, import.meta.url));

/** Import aliases shared by Vite and Vitest. Keep in sync with `paths` in tsconfig.base.json. */
export const aliases = {
  '@core': dir('./src/core'),
  '@content': dir('./src/content'),
  '@art': dir('./src/art'),
  '@shell': dir('./src/shell'),
};
```

`vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import { aliases } from './aliases.config';

export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  resolve: { alias: aliases },
  build: { target: 'es2022', chunkSizeWarningLimit: 2000 },
});
```

`vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import { aliases } from './aliases.config';

export default defineConfig({
  resolve: { alias: aliases },
  test: { include: ['tests/**/*.test.ts'], environment: 'node' },
});
```

- [ ] **Step 4: Prettier config**

`.prettierrc.json`:

```json
{ "singleQuote": true, "printWidth": 110, "trailingComma": "all" }
```

`.prettierignore`:

```
dist
dev-dist
coverage
playwright-report
test-results
public
pnpm-lock.yaml
*.md
```

- [ ] **Step 5: Page shell and first sources**

`index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="theme-color" content="#1b1522" />
    <title>Fimbulvetr</title>
    <style>
      html,
      body {
        margin: 0;
        height: 100%;
        background: #000;
        overflow: hidden;
      }
      #game {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      #game canvas {
        image-rendering: pixelated;
      }
      #msg {
        position: fixed;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        max-width: 32rem;
        padding: 1.25rem 1.5rem;
        background: #1b1522;
        color: #f2ead8;
        font: 16px/1.5 system-ui, sans-serif;
        border: 2px solid #d9b34a;
        border-radius: 6px;
        text-align: center;
        z-index: 10;
      }
      #msg[hidden] {
        display: none;
      }
      #msg button {
        margin: 0.75rem 0.25rem 0;
        padding: 0.4rem 1rem;
        font: inherit;
        background: #d9b34a;
        color: #1b1522;
        border: 0;
        border-radius: 4px;
        cursor: pointer;
      }
    </style>
  </head>
  <body>
    <div id="game"></div>
    <div id="msg" role="status" hidden></div>
    <script type="module" src="/src/shell/main.ts"></script>
  </body>
</html>
```

`src/content/meta.ts`:

```ts
export const GAME_TITLE = 'Fimbulvetr';
```

`src/shell/main.ts` (replaced in Task 2):

```ts
import { GAME_TITLE } from '@content/meta';

document.title = GAME_TITLE;
```

- [ ] **Step 6: Write the failing boundary test**

`tests/tooling/boundaries.test.ts`:

```ts
import { ESLint } from 'eslint';
import tseslint from 'typescript-eslint';
import { describe, expect, it } from 'vitest';
import { boundaryConfigs } from '../../eslint.boundaries.js';

const eslint = new ESLint({
  overrideConfigFile: true,
  overrideConfig: [{ files: ['**/*.ts'], languageOptions: { parser: tseslint.parser } }, ...boundaryConfigs],
});

async function ruleIds(code: string, filePath: string): Promise<string[]> {
  const [result] = await eslint.lintText(code, { filePath });
  return (result?.messages ?? []).map((m) => m.ruleId ?? m.message);
}

describe('layer boundaries', () => {
  it('rejects phaser in core', async () => {
    const ids = await ruleIds("import * as Phaser from 'phaser';\nexport const x = Phaser;\n", 'src/core/probe.ts');
    expect(ids).toContain('no-restricted-imports');
  });

  it('rejects the shell in art', async () => {
    const ids = await ruleIds("import { x } from '@shell/main';\nexport const y = x;\n", 'src/art/probe.ts');
    expect(ids).toContain('no-restricted-imports');
  });

  it('rejects art in content', async () => {
    const ids = await ruleIds("import { x } from '@art/raster';\nexport const y = x;\n", 'src/content/probe.ts');
    expect(ids).toContain('no-restricted-imports');
  });

  it('rejects value imports of content in core', async () => {
    const ids = await ruleIds(
      "import { GAME_TITLE } from '@content/meta';\nexport const t = GAME_TITLE;\n",
      'src/core/probe.ts',
    );
    expect(ids).toContain('no-restricted-imports');
  });

  it('allows type imports of content in core', async () => {
    const ids = await ruleIds(
      "import type { Foo } from '@content/meta';\nexport type Bar = Foo;\n",
      'src/core/probe.ts',
    );
    expect(ids).toEqual([]);
  });

  it('rejects Math.random and Date.now in core', async () => {
    const ids = await ruleIds('export const a = Math.random() + Date.now();\n', 'src/core/probe.ts');
    expect(ids.filter((id) => id === 'no-restricted-properties')).toHaveLength(2);
  });

  it('rejects engine trig in core but allows it in art', async () => {
    expect(await ruleIds('export const a = Math.sin(1);\n', 'src/core/probe.ts')).toContain(
      'no-restricted-properties',
    );
    expect(await ruleIds('export const a = Math.sin(1);\n', 'src/art/probe.ts')).toEqual([]);
  });

  it('allows phaser in the shell', async () => {
    const ids = await ruleIds("import * as Phaser from 'phaser';\nexport const x = Phaser;\n", 'src/shell/probe.ts');
    expect(ids).toEqual([]);
  });
});
```

- [ ] **Step 7: Run it to verify it fails**

Run: `pnpm vitest run tests/tooling/boundaries.test.ts`
Expected: FAIL — cannot find module `../../eslint.boundaries.js`.

- [ ] **Step 8: Write the boundary rules**

`eslint.boundaries.js`:

```js
// @ts-check
/** Layer and determinism rules for src/. Used by eslint.config.js and tests/tooling/boundaries.test.ts. */

const noShell = { regex: '^@shell/|(^|/)shell/', message: 'Only src/shell may import the shell layer.' };
const noPhaser = { regex: '^phaser($|/)', message: 'Phaser is only allowed in src/shell.' };
const noArt = { regex: '^@art/|(^|/)art/', message: 'This layer must not depend on art.' };
const contentTypesOnly = {
  regex: '^@content/|(^|/)content/',
  allowTypeImports: true,
  message: 'core may only import types from content (use `import type`).',
};

const noEntropy = [
  { object: 'Math', property: 'random', message: 'Use the seeded Rng from @core/math/rng.' },
  { object: 'Date', property: 'now', message: 'No wall-clock time in pure layers; pass time in.' },
];
const noEngineTrig = ['sin', 'cos', 'tan', 'atan2', 'hypot'].map((property) => ({
  object: 'Math',
  property,
  message: `Math.${property} can differ between browsers; the core must stay deterministic.`,
}));
const noNewDate = {
  selector: "NewExpression[callee.name='Date']",
  message: 'No wall-clock time in pure layers; pass time in.',
};

/** @type {import('eslint').Linter.Config[]} */
export const boundaryConfigs = [
  {
    files: ['src/core/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [noShell, noPhaser, noArt, contentTypesOnly] }],
      'no-restricted-properties': ['error', ...noEntropy, ...noEngineTrig],
      'no-restricted-syntax': ['error', noNewDate],
    },
  },
  {
    files: ['src/content/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [noShell, noPhaser, noArt] }],
      'no-restricted-properties': ['error', ...noEntropy],
      'no-restricted-syntax': ['error', noNewDate],
    },
  },
  {
    files: ['src/art/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [noShell, noPhaser] }],
      'no-restricted-properties': ['error', ...noEntropy],
      'no-restricted-syntax': ['error', noNewDate],
    },
  },
];
```

`eslint.config.js`:

```js
// @ts-check
import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettier from 'eslint-config-prettier/flat';
import tseslint from 'typescript-eslint';
import { boundaryConfigs } from './eslint.boundaries.js';

export default defineConfig([
  globalIgnores(['dist/', 'dev-dist/', 'coverage/', 'playwright-report/', 'test-results/', 'public/']),
  {
    files: ['**/*.ts'],
    extends: [js.configs.recommended, tseslint.configs.strictTypeChecked],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['**/*.js', '**/*.mjs'],
    extends: [js.configs.recommended],
    languageOptions: {
      sourceType: 'module',
      globals: { process: 'readonly', console: 'readonly', Buffer: 'readonly', URL: 'readonly' },
    },
  },
  ...boundaryConfigs,
  prettier,
]);
```

- [ ] **Step 9: Run the boundary test**

Run: `pnpm vitest run tests/tooling/boundaries.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 10: Run the full gate**

Run: `pnpm format && pnpm check`
Expected: typecheck of all three projects passes, ESLint and Prettier are clean, and Vitest passes.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "Scaffold Vite + TypeScript project with layer boundaries

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Browser boot, WebGL gate, Playwright smoke, project docs

**Files:**
- Create: `src/shell/boot/webgl.ts`, `src/shell/boot/message.ts`, `src/shell/scale.ts`, `src/shell/scenes/BootScene.ts`, `playwright.config.ts`, `tests/e2e/smoke.spec.ts`, `CLAUDE.md`, `ARCHITECTURE.md`, `docs/roadmap.md`
- Modify: `src/shell/main.ts`, `package.json` (dev dep)

**Interfaces:**
- Produces: `hasWebGL(doc?: Document): boolean`; `showMessage(text: string, actions?: readonly MessageAction[]): () => void` with `MessageAction { label: string; run: () => void }`; constants `GAME_W = 640`, `GAME_H = 360`, `LETTERBOX = 4` in `@shell/scale`; `BootScene` (key `'boot'`). The page signals readiness with `document.body.dataset.ready = 'true'`.

- [ ] **Step 1: Add Playwright**

Run: `pnpm add -D -E @playwright/test@1.63.0 && pnpm exec playwright install chromium webkit`
Expected: browsers downloaded.

- [ ] **Step 2: Write the failing smoke test**

`playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: 'http://localhost:4173', trace: 'retain-on-failure' },
  webServer: {
    command: 'pnpm build:test && pnpm preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] },
      },
    },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
```

`tests/e2e/smoke.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('boots to a canvas without console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/');
  await expect(page.locator('body[data-ready="true"]')).toBeAttached({ timeout: 15_000 });
  await expect(page.locator('#game canvas')).toBeVisible();
  expect(errors).toEqual([]);
});
```

Run: `pnpm e2e`
Expected: FAIL — `body[data-ready="true"]` never appears.

- [ ] **Step 3: Boot Phaser behind a WebGL check**

`src/shell/boot/webgl.ts`:

```ts
/** Phaser 4 filters (tints, day-night) need WebGL; there is deliberately no Canvas fallback. */
export function hasWebGL(doc: Document = document): boolean {
  try {
    return doc.createElement('canvas').getContext('webgl') !== null;
  } catch {
    return false;
  }
}
```

`src/shell/boot/message.ts`:

```ts
export interface MessageAction {
  readonly label: string;
  readonly run: () => void;
}

/** Shows a centred message over the game (the `#msg` element). Returns a function that hides it. */
export function showMessage(text: string, actions: readonly MessageAction[] = []): () => void {
  const found = document.getElementById('msg');
  if (!found) throw new Error('#msg element missing from index.html');
  const box: HTMLElement = found;
  const hide = (): void => {
    box.hidden = true;
    box.replaceChildren();
  };
  box.replaceChildren();
  const p = document.createElement('p');
  p.textContent = text;
  box.append(p);
  for (const action of actions) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = action.label;
    button.addEventListener('click', () => {
      hide();
      action.run();
    });
    box.append(button);
  }
  box.hidden = false;
  return hide;
}
```

`src/shell/scale.ts`:

```ts
export const GAME_W = 640;
export const GAME_H = 360;
/** Vertical letterbox above and below the 640×352 playfield. */
export const LETTERBOX = 4;
```

`src/shell/scenes/BootScene.ts` (replaced in Task 18):

```ts
import * as Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  create(): void {
    document.body.dataset.ready = 'true';
  }
}
```

`src/shell/main.ts`:

```ts
import * as Phaser from 'phaser';
import { GAME_TITLE } from '@content/meta';
import { showMessage } from '@shell/boot/message';
import { hasWebGL } from '@shell/boot/webgl';
import { GAME_H, GAME_W } from '@shell/scale';
import { BootScene } from '@shell/scenes/BootScene';

document.title = GAME_TITLE;

if (!hasWebGL()) {
  showMessage('Fimbulvetr needs WebGL, which this browser has turned off or does not support.');
} else {
  const game = new Phaser.Game({
    type: Phaser.WEBGL,
    parent: 'game',
    width: GAME_W,
    height: GAME_H,
    pixelArt: true,
    backgroundColor: '#000000',
    banner: false,
    scale: { mode: Phaser.Scale.NONE, autoCenter: Phaser.Scale.NO_CENTER },
    input: { keyboard: false, gamepad: false },
    scene: [BootScene],
  });
  game.canvas.setAttribute('aria-label', GAME_TITLE);
}
```

- [ ] **Step 4: Run the smoke test**

Run: `pnpm e2e`
Expected: PASS on chromium and webkit.

- [ ] **Step 5: Write the project docs**

`CLAUDE.md`:

````markdown
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
````

`ARCHITECTURE.md`:

````markdown
# Architecture

Fimbulvetr is a pure-TypeScript simulation wrapped in a thin Phaser 4 shell. The full rationale is in `docs/superpowers/specs/2026-09-26-fimbulvetr-design.md`.

```
input devices ──► InputMapper ──► InputLatch ──► Sim.step(frame) ×N @60 Hz ──► state + one-shot events
                                                     ▲                                 │
                          Commands (menus, dev) ─────┘                                 ▼
                                             views.sync(state, alpha) · audio · autosave · dev hook
```

| Layer | Folder | Contents |
| --- | --- | --- |
| core | `src/core` | math, clock, state and save, input frames, world (maps, collision), actors (state machines), combat, the sim |
| content | `src/content` | ids, flags, items, screens, tuning, clock rules, bindings, the `DB` object |
| art | `src/art` | raster ops, sprite painters, tile painters, colour grading, SFX synth |
| shell | `src/shell` | Phaser scenes, texture registration, views, input devices, storage, PWA, dev tools |

Sections are added as systems land (see `docs/roadmap.md`).
````

`docs/roadmap.md`:

```markdown
# Roadmap

Full plan: `docs/superpowers/specs/2026-09-26-fimbulvetr-design.md` §4. Detailed M0 plan: `docs/superpowers/plans/2026-09-26-m0-foundations.md`.

## M0 — Foundations
- [x] Project scaffold, strict tsconfigs, lint boundaries, Vitest
- [x] Browser boot, WebGL gate, Playwright smoke, docs
- [ ] Core math
- [ ] Ids, registries, i18n, GameState v1
- [ ] Save format (checksum, validation, migrations)
- [ ] Fixed-step loop and input latch
- [ ] Shell input devices and bindings
- [ ] Text maps, legend, blob-47 autotile
- [ ] World layout, test screens, content integrity
- [ ] Tile collision with corner slide
- [ ] State machines, hero, tuning
- [ ] Combat and training dummy
- [ ] World clock, weather, colour grading
- [ ] Sim: step loop, transitions, commands, determinism
- [ ] Art primitives and packing
- [ ] Terrain tiles
- [ ] Hero and dummy sprites
- [ ] Shell rendering (boot, play scene, views, scaling, slide, tint)
- [ ] Dev tools (query string, hook, overlay, console)
- [ ] Settings, language, synthesized SFX
- [ ] Browser saves (IndexedDB, autosave, export/import, tab lock)
- [ ] PWA and icons
- [ ] Budget, CI and Pages workflows
- [ ] M0 exit test, ARCHITECTURE.md, user playtest

## Later milestones
- [ ] M1 Vertical slice · [ ] M2 Uppvík + turning world · [ ] M3 Mýrland + D2 · [ ] M4 Haugar + D3 · [ ] M5 Act I finale (demo)
- [ ] M6 Niflmýrr + D4 · [ ] M7 Sævatn + Refuge + D5 · [ ] M8 Dvergagröf + D6 · [ ] M9 Hrímfjöll + D7 · [ ] M10 Útgarðr + ending · [ ] M11 Completion + ship
```

- [ ] **Step 6: Run the gate**

Run: `pnpm format && pnpm check && pnpm e2e`
Expected: all green.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Boot Phaser behind a WebGL check with a Playwright smoke test

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Core math

**Files:**
- Create: `src/core/math/rng.ts`, `src/core/math/hash.ts`, `src/core/math/vec.ts`, `src/core/math/box.ts`, `src/core/math/dir.ts`
- Test: `tests/unit/core/math.test.ts`

**Interfaces:**
- Produces:
  - `RngState { s: number }`; `createRng(seed): RngState`; `nextU32(rng): number`; `nextFloat(rng): number` returns a value in [0, 1); `nextInt(rng, min, maxExclusive): number`.
  - `fnv1a(text): number`; `hashInts(...values: readonly number[]): number`; `unitFromHash(h): number`; `hex8(n): string`.
  - `Vec { x; y }`; `vec`, `ZERO`, `add`, `sub`, `scale`, `dot`, `length`, `normalize`, `lerp`.
  - `Box { x; y; w; h }`; `overlaps(a, b)`; `translate(b, dx, dy)`; `at(rel: Box, p: Vec): Box`.
  - `DIRS`; `Dir4 = 'n'|'e'|'s'|'w'`; `DIR_VEC: Record<Dir4, Vec>`; `opposite(d)`; `dirFromVec(v, current): Dir4`.

- [ ] **Step 1: Write the failing tests**

`tests/unit/core/math.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { at, overlaps, translate } from '@core/math/box';
import { DIR_VEC, dirFromVec, opposite } from '@core/math/dir';
import { fnv1a, hashInts, hex8, unitFromHash } from '@core/math/hash';
import { createRng, nextFloat, nextInt, nextU32 } from '@core/math/rng';
import { length, lerp, normalize, vec } from '@core/math/vec';

describe('rng', () => {
  it('is deterministic for a seed', () => {
    const a = createRng(42);
    const b = createRng(42);
    const seqA = [nextU32(a), nextU32(a), nextU32(a)];
    const seqB = [nextU32(b), nextU32(b), nextU32(b)];
    expect(seqA).toEqual(seqB);
  });

  it('differs between seeds', () => {
    expect(nextU32(createRng(1))).not.toBe(nextU32(createRng(2)));
  });

  it('survives a JSON round trip mid-sequence', () => {
    const a = createRng(9);
    nextU32(a);
    const b = JSON.parse(JSON.stringify(a)) as typeof a;
    expect(nextU32(b)).toBe(nextU32(a));
  });

  it('keeps floats in [0, 1) and ints in range', () => {
    const r = createRng(7);
    const seen = new Set<number>();
    for (let i = 0; i < 10_000; i++) {
      const f = nextFloat(r);
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThan(1);
      const n = nextInt(r, 3, 6);
      expect([3, 4, 5]).toContain(n);
      seen.add(n);
    }
    expect(seen.size).toBe(3);
  });
});

describe('hash', () => {
  it('matches known FNV-1a values', () => {
    expect(fnv1a('')).toBe(0x811c9dc5);
    expect(fnv1a('a')).toBe(0xe40c292c);
  });

  it('hashes integer lists order-sensitively', () => {
    expect(hashInts(1, 2)).not.toBe(hashInts(2, 1));
    expect(hashInts(1, 2)).toBe(hashInts(1, 2));
  });

  it('maps hashes into [0, 1)', () => {
    expect(unitFromHash(0)).toBe(0);
    expect(unitFromHash(0xffffffff)).toBeLessThan(1);
  });

  it('formats hex8', () => {
    expect(hex8(255)).toBe('000000ff');
    expect(hex8(0xe40c292c)).toBe('e40c292c');
  });
});

describe('vec', () => {
  it('normalizes and keeps zero at zero', () => {
    expect(length(normalize(vec(3, 4)))).toBeCloseTo(1);
    expect(normalize(vec(0, 0))).toEqual({ x: 0, y: 0 });
  });

  it('lerps', () => {
    expect(lerp(vec(0, 0), vec(10, 20), 0.5)).toEqual({ x: 5, y: 10 });
  });
});

describe('box', () => {
  it('treats touching edges as not overlapping', () => {
    expect(overlaps({ x: 0, y: 0, w: 16, h: 16 }, { x: 16, y: 0, w: 16, h: 16 })).toBe(false);
    expect(overlaps({ x: 0, y: 0, w: 16, h: 16 }, { x: 15, y: 15, w: 4, h: 4 })).toBe(true);
  });

  it('anchors a relative box at a point', () => {
    expect(at({ x: -6, y: -8, w: 12, h: 8 }, vec(100, 50))).toEqual({ x: 94, y: 42, w: 12, h: 8 });
    expect(translate({ x: 1, y: 2, w: 3, h: 4 }, 10, 20)).toEqual({ x: 11, y: 22, w: 3, h: 4 });
  });
});

describe('dir', () => {
  it('knows opposites and vectors', () => {
    expect(opposite('n')).toBe('s');
    expect(opposite('e')).toBe('w');
    expect(DIR_VEC.e).toEqual({ x: 1, y: 0 });
  });

  it('faces the dominant axis', () => {
    expect(dirFromVec(vec(1, 0), 'n')).toBe('e');
    expect(dirFromVec(vec(0, -1), 'e')).toBe('n');
    expect(dirFromVec(vec(0.9, 0.2), 's')).toBe('e');
  });

  it('keeps a compatible facing on diagonals (Zelda-style)', () => {
    expect(dirFromVec(vec(1, 1), 's')).toBe('s');
    expect(dirFromVec(vec(1, 1), 'e')).toBe('e');
    expect(dirFromVec(vec(1, 1), 'n')).toBe('e');
  });

  it('keeps the current facing for no movement', () => {
    expect(dirFromVec(vec(0, 0), 'w')).toBe('w');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm vitest run tests/unit/core/math.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement**

`src/core/math/rng.ts`:

```ts
/** Seeded PRNG (mulberry32). The only source of randomness in the pure layers. Plain JSON, so it is saved. */
export interface RngState {
  s: number;
}

export function createRng(seed: number): RngState {
  return { s: seed >>> 0 };
}

export function nextU32(rng: RngState): number {
  rng.s = (rng.s + 0x6d2b79f5) >>> 0;
  let t = rng.s;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return (t ^ (t >>> 14)) >>> 0;
}

/** Uniform float in [0, 1). */
export function nextFloat(rng: RngState): number {
  return nextU32(rng) / 4294967296;
}

/** Uniform integer in [min, maxExclusive). */
export function nextInt(rng: RngState, min: number, maxExclusive: number): number {
  return min + Math.floor(nextFloat(rng) * (maxExclusive - min));
}
```

`src/core/math/hash.ts`:

```ts
const FNV_OFFSET = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

/** 32-bit FNV-1a over the UTF-16 code units of a string. */
export function fnv1a(text: string): number {
  let h = FNV_OFFSET;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, FNV_PRIME);
  }
  return h >>> 0;
}

/** Order-sensitive 32-bit hash of integers, each folded in as four bytes. */
export function hashInts(...values: readonly number[]): number {
  let h = FNV_OFFSET;
  for (const value of values) {
    const n = value | 0;
    for (let shift = 0; shift < 32; shift += 8) {
      h ^= (n >>> shift) & 0xff;
      h = Math.imul(h, FNV_PRIME);
    }
  }
  return h >>> 0;
}

/** Maps a 32-bit hash to [0, 1). */
export function unitFromHash(h: number): number {
  return (h >>> 0) / 4294967296;
}

export function hex8(n: number): string {
  return (n >>> 0).toString(16).padStart(8, '0');
}
```

`src/core/math/vec.ts`:

```ts
export interface Vec {
  x: number;
  y: number;
}

export const vec = (x: number, y: number): Vec => ({ x, y });
export const ZERO: Readonly<Vec> = Object.freeze({ x: 0, y: 0 });

export const add = (a: Vec, b: Vec): Vec => ({ x: a.x + b.x, y: a.y + b.y });
export const sub = (a: Vec, b: Vec): Vec => ({ x: a.x - b.x, y: a.y - b.y });
export const scale = (a: Vec, k: number): Vec => ({ x: a.x * k, y: a.y * k });
export const dot = (a: Vec, b: Vec): number => a.x * b.x + a.y * b.y;

/** Math.sqrt is correctly rounded everywhere; Math.hypot is not, so it is not used in the core. */
export const length = (a: Vec): number => Math.sqrt(a.x * a.x + a.y * a.y);

/** Unit vector, or the zero vector for zero input. */
export function normalize(a: Vec): Vec {
  const len = length(a);
  return len === 0 ? { x: 0, y: 0 } : { x: a.x / len, y: a.y / len };
}

export const lerp = (a: Vec, b: Vec, t: number): Vec => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
```

`src/core/math/box.ts`:

```ts
import type { Vec } from './vec';

/** Axis-aligned box; (x, y) is the top-left corner. */
export interface Box {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

/** Touching edges do not overlap. */
export const overlaps = (a: Box, b: Box): boolean =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

export const translate = (b: Box, dx: number, dy: number): Box => ({ x: b.x + dx, y: b.y + dy, w: b.w, h: b.h });

/** A box given relative to an anchor point, placed at `p`. */
export const at = (rel: Box, p: Vec): Box => ({ x: p.x + rel.x, y: p.y + rel.y, w: rel.w, h: rel.h });
```

`src/core/math/dir.ts`:

```ts
import type { Vec } from './vec';

export const DIRS = ['n', 'e', 's', 'w'] as const;
export type Dir4 = (typeof DIRS)[number];

export const DIR_VEC: Readonly<Record<Dir4, Vec>> = {
  n: { x: 0, y: -1 },
  e: { x: 1, y: 0 },
  s: { x: 0, y: 1 },
  w: { x: -1, y: 0 },
};

const OPPOSITE: Readonly<Record<Dir4, Dir4>> = { n: 's', e: 'w', s: 'n', w: 'e' };
export const opposite = (d: Dir4): Dir4 => OPPOSITE[d];

/**
 * Facing for a movement vector. A clearly dominant axis wins; on near-diagonals the current facing is kept
 * when it is one of the two components (Zelda-style strafing feel).
 */
export function dirFromVec(v: Vec, current: Dir4): Dir4 {
  if (v.x === 0 && v.y === 0) return current;
  const horiz: Dir4 = v.x > 0 ? 'e' : 'w';
  const vert: Dir4 = v.y > 0 ? 's' : 'n';
  if (v.y === 0) return horiz;
  if (v.x === 0) return vert;
  const ax = Math.abs(v.x);
  const ay = Math.abs(v.y);
  if (ax >= 2 * ay) return horiz;
  if (ay >= 2 * ax) return vert;
  if (current === horiz || current === vert) return current;
  return ax >= ay ? horiz : vert;
}
```

- [ ] **Step 4: Run tests**

Run: `pnpm vitest run tests/unit/core/math.test.ts`
Expected: PASS.

- [ ] **Step 5: Gate and commit**

Run: `pnpm check`

```bash
git add -A
git commit -m "Add deterministic core math: rng, hash, vec, box, dir

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Ids, registries, i18n and GameState v1

**Files:**
- Create: `src/core/i18n/t.ts`, `src/core/clock/types.ts`, `src/core/state/flags.ts`, `src/core/state/gameState.ts`, `src/core/items/defs.ts`, `src/content/ids.ts`, `src/content/flags.ts`, `src/content/items.ts`, `src/content/galdr.ts`, `src/content/gear.ts`, `src/content/i18n/ui.ts`, `src/content/world/screens.ts`, `src/content/start.ts`
- Test: `tests/unit/core/gameState.test.ts`, `tests/unit/core/i18n.test.ts`, `tests/content/text.test.ts`

**Interfaces:**
- Consumes: `Dir4` (Task 3), `RngState`/`createRng` (Task 3).
- Produces:
  - i18n: `LANGS`, `Lang = 'en'|'sv'`, `L10n = Readonly<Record<Lang, string>>`, `t(text, lang, vars?)`.
  - Clock types: `SEASONS`, `Season`, `WEATHER_KINDS`, `WeatherKind`, `ClockState { minute; sub; day; season; seasonDay; epoch; policy: 'held'|'cycling' }`, `ClockEvent`, `newClock()`.
  - Flags: `FlagSpec`, `FlagValue`, `Flags`, `FLAGS`, `FlagId`.
  - Content id arrays with matching types:

    | Array | Type |
    | --- | --- |
    | `REGIONS` | `RegionId` |
    | `DUNGEONS` | `DungeonId` |
    | `SUB_ITEMS` | `SubItemId` |
    | `ITEMS` | `ItemId` |
    | `GALDR` | `GaldrId` |
    | `WEAPONS` | `WeaponId` |
    | `ARMORS` | `ArmorId` |
    | `RINGS` | `RingId` |
    | `ENEMIES` | `EnemyId` |
    | `SFX` | `SfxId` |
    | `SCREEN_IDS` | `ScreenId` |

  - Name tables: `ITEM_NAMES`, `GALDR_DEFS`, `WEAPON_NAMES`, `ARMOR_NAMES`, `RING_NAMES`; `UI` and `UiKey`.
  - Game state: the interfaces `GameState`, `HeroState`, `InventoryState`, `DungeonState`, `WorldState`, `NewGameInit`; `newGame(seed, init): GameState`; `NEW_GAME`.

- [ ] **Step 1: Write the failing tests**

`tests/unit/core/i18n.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { t } from '@core/i18n/t';

describe('t', () => {
  it('picks the language', () => {
    expect(t({ en: 'Save', sv: 'Spara' }, 'sv')).toBe('Spara');
  });

  it('fills variables', () => {
    expect(t({ en: 'Hi {name}', sv: 'Hej {name}' }, 'en', { name: 'Ask' })).toBe('Hi Ask');
  });

  it('leaves unknown variables visible', () => {
    expect(t({ en: 'Hi {missing}', sv: 'Hej {missing}' }, 'en')).toBe('Hi {missing}');
  });
});
```

`tests/unit/core/gameState.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { DUNGEONS } from '@content/ids';
import { NEW_GAME } from '@content/start';
import { newGame } from '@core/state/gameState';

describe('newGame', () => {
  it('is plain JSON', () => {
    const s = newGame(7, NEW_GAME);
    expect(JSON.parse(JSON.stringify(s))).toEqual(s);
  });

  it('starts at the configured place with three hearts (quarter-heart units)', () => {
    const s = newGame(7, NEW_GAME);
    expect(s.hero).toMatchObject({ screen: NEW_GAME.screen, x: NEW_GAME.x, y: NEW_GAME.y, hp: 12, maxHp: 12 });
  });

  it('has a record for every dungeon', () => {
    expect(Object.keys(newGame(7, NEW_GAME).dungeons).sort()).toEqual([...DUNGEONS].sort());
  });

  it('starts the clock held in summer on day 1 at 08:00', () => {
    expect(newGame(7, NEW_GAME).clock).toMatchObject({ season: 'summer', policy: 'held', day: 1, minute: 480 });
  });

  it('seeds the rng from the seed', () => {
    expect(newGame(7, NEW_GAME).rng).toEqual({ s: 7 });
  });
});
```

`tests/content/text.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { L10n } from '@core/i18n/t';
import { GALDR_DEFS } from '@content/galdr';
import { ARMOR_NAMES, RING_NAMES, WEAPON_NAMES } from '@content/gear';
import { UI } from '@content/i18n/ui';
import { ITEM_NAMES } from '@content/items';

const tables: Record<string, Readonly<Record<string, L10n>>> = {
  ITEM_NAMES,
  WEAPON_NAMES,
  ARMOR_NAMES,
  RING_NAMES,
  UI,
  GALDR: Object.fromEntries(Object.entries(GALDR_DEFS).map(([id, def]) => [id, def.name])),
};

describe('player-facing text', () => {
  for (const [table, entries] of Object.entries(tables)) {
    it(`${table} has English and Swedish for every entry`, () => {
      for (const [id, text] of Object.entries(entries)) {
        expect(text.en.trim(), `${table}.${id}.en`).not.toBe('');
        expect(text.sv.trim(), `${table}.${id}.sv`).not.toBe('');
      }
    });
  }
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm vitest run tests/unit/core/i18n.test.ts tests/unit/core/gameState.test.ts tests/content/text.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement core types**

`src/core/i18n/t.ts`:

```ts
export const LANGS = ['en', 'sv'] as const;
export type Lang = (typeof LANGS)[number];

/** Player-facing text in every supported language. A missing language is a compile error. */
export type L10n = Readonly<Record<Lang, string>>;

/** Picks the language and fills `{name}` placeholders; unknown placeholders stay visible. */
export function t(text: L10n, lang: Lang, vars: Readonly<Record<string, string | number>> = {}): string {
  return text[lang].replace(/\{(\w+)\}/g, (whole: string, key: string) => {
    const value = vars[key];
    return value === undefined ? whole : String(value);
  });
}
```

`src/core/clock/types.ts`:

```ts
export const SEASONS = ['summer', 'autumn', 'winter', 'spring'] as const;
export type Season = (typeof SEASONS)[number];

export const WEATHER_KINDS = ['clear', 'rain', 'wind', 'fog', 'snow'] as const;
export type WeatherKind = (typeof WEATHER_KINDS)[number];

export const MINUTES_PER_DAY = 1440;

/** The world clock. `held` seasons only change by story; `cycling` seasons also turn every N days. */
export interface ClockState {
  minute: number;
  sub: number;
  day: number;
  season: Season;
  seasonDay: number;
  epoch: number;
  policy: 'held' | 'cycling';
}

export type ClockEvent =
  | { readonly t: 'dawn' }
  | { readonly t: 'dusk' }
  | { readonly t: 'newDay'; readonly day: number }
  | { readonly t: 'season'; readonly from: Season; readonly to: Season };

export function newClock(): ClockState {
  return { minute: 8 * 60, sub: 0, day: 1, season: 'summer', seasonDay: 0, epoch: 0, policy: 'held' };
}
```

`src/core/state/flags.ts`:

```ts
import type { FlagId } from '@content/flags';

export type FlagSpec = { readonly t: 'bool' } | { readonly t: 'int'; readonly max: number };
export type FlagValue = boolean | number;
export type Flags = Partial<Record<FlagId, FlagValue>>;

/** True for `true` and for positive integers. */
export function isSet(flags: Flags, id: FlagId): boolean {
  const v = flags[id];
  return v === true || (typeof v === 'number' && v > 0);
}
```

`src/core/items/defs.ts`:

```ts
import type { L10n } from '../i18n/t';

export interface GaldrDef {
  readonly name: L10n;
  readonly cost: number;
}
```

`src/core/state/gameState.ts`:

```ts
import type { ArmorId, DungeonId, GaldrId, ItemId, RegionId, RingId, WeaponId } from '@content/ids';
import type { ScreenId } from '@content/world/screens';
import { newClock, type ClockState } from '../clock/types';
import type { Dir4 } from '../math/dir';
import { createRng, type RngState } from '../math/rng';
import type { Flags } from './flags';

export interface HeroState {
  screen: ScreenId;
  x: number;
  y: number;
  facing: Dir4;
  /** Health in quarter hearts. */
  hp: number;
  maxHp: number;
  seidr: number;
  maxSeidr: number;
  silver: number;
  purse: 0 | 1 | 2;
}

export interface InventoryState {
  items: Partial<Record<ItemId, number>>;
  slots: [ItemId | null, ItemId | null];
  galdr: GaldrId[];
  weapon: WeaponId;
  armor: ArmorId;
  ring: RingId | null;
  shield: boolean;
}

export interface DungeonState {
  keys: number;
  bigKey: boolean;
  map: boolean;
  compass: boolean;
  bossDead: boolean;
  doors: string[];
}

export interface CoverSave {
  epoch: number;
  cleared: string;
}

export interface WorldState {
  opened: string[];
  pieces: string[];
  warps: RegionId[];
  visited: ScreenId[];
  cover: Partial<Record<ScreenId, CoverSave>>;
  vars: Record<string, number>;
}

/** Everything that persists. Plain JSON. */
export interface GameState {
  seed: number;
  rng: RngState;
  flags: Flags;
  hero: HeroState;
  inv: InventoryState;
  clock: ClockState;
  world: WorldState;
  dungeons: Record<DungeonId, DungeonState>;
  playTicks: number;
}

export interface NewGameInit {
  readonly screen: ScreenId;
  readonly x: number;
  readonly y: number;
  readonly facing: Dir4;
  readonly weapon: WeaponId;
  readonly shield: boolean;
  readonly dungeons: readonly DungeonId[];
}

export function newGame(seed: number, init: NewGameInit): GameState {
  const dungeons = Object.fromEntries(
    init.dungeons.map((id) => [
      id,
      { keys: 0, bigKey: false, map: false, compass: false, bossDead: false, doors: [] },
    ]),
  ) as Record<DungeonId, DungeonState>;
  return {
    seed: seed >>> 0,
    rng: createRng(seed),
    flags: {},
    hero: {
      screen: init.screen,
      x: init.x,
      y: init.y,
      facing: init.facing,
      hp: 12,
      maxHp: 12,
      seidr: 10,
      maxSeidr: 10,
      silver: 0,
      purse: 0,
    },
    inv: {
      items: {},
      slots: [null, null],
      galdr: [],
      weapon: init.weapon,
      armor: 'wool_tunic',
      ring: null,
      shield: init.shield,
    },
    clock: newClock(),
    world: { opened: [], pieces: [], warps: [], visited: [init.screen], cover: {}, vars: {} },
    dungeons,
    playTicks: 0,
  };
}
```

- [ ] **Step 4: Implement content registries**

`src/content/ids.ts`:

```ts
/** Every id the full game knows about. Adding ids is safe; renaming one needs a save migration. */
export const REGIONS = [
  'askdalr',
  'myrkvidr',
  'myrland',
  'haugar',
  'niflmyrr',
  'saevatn',
  'dvergagrof',
  'hrimfjoll',
] as const;
export type RegionId = (typeof REGIONS)[number];

export const DUNGEONS = ['d1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8'] as const;
export type DungeonId = (typeof DUNGEONS)[number];

export const SUB_ITEMS = ['lantern', 'boomerang', 'bombs', 'bow', 'sealskin', 'grapple', 'hammer', 'mirror'] as const;
export type SubItemId = (typeof SUB_ITEMS)[number];

export const CONSUMABLES = ['mead_red', 'mead_green', 'mead_blue', 'flatbread', 'cheese', 'arrows'] as const;
export const UPGRADES = ['heart_piece', 'heart_container', 'seidr_upgrade', 'quiver', 'bomb_bag', 'purse'] as const;
export const ITEMS = [...SUB_ITEMS, ...CONSUMABLES, ...UPGRADES] as const;
export type ItemId = (typeof ITEMS)[number];

export const GALDR = ['eldr', 'is', 'farvegr', 'hlif', 'skjalfti', 'ljos', 'vindr', 'bragd'] as const;
export type GaldrId = (typeof GALDR)[number];

export const WEAPONS = ['none', 'pitchfork', 'seax', 'uppvik_sword', 'dwarf_blade'] as const;
export type WeaponId = (typeof WEAPONS)[number];

export const ARMORS = ['wool_tunic', 'byrnie', 'ember_byrnie', 'runeplate'] as const;
export type ArmorId = (typeof ARMORS)[number];

export const RINGS = ['ring_stamina', 'ring_thrift', 'ring_beacon', 'ring_berserker'] as const;
export type RingId = (typeof RINGS)[number];

export const ENEMIES = ['dummy'] as const;
export type EnemyId = (typeof ENEMIES)[number];

export const SFX = ['sfx_swing', 'sfx_spin', 'sfx_hit', 'sfx_block', 'sfx_roll', 'sfx_charge'] as const;
export type SfxId = (typeof SFX)[number];
```

`src/content/flags.ts`:

```ts
import type { FlagSpec } from '@core/state/flags';

/** Story and world flags. Prefixes: st_ story, q_ quest, w_ world, n_ npc, ev_ event. */
export const FLAGS = {
  st_intro_seen: { t: 'bool' },
} as const satisfies Record<string, FlagSpec>;

export type FlagId = keyof typeof FLAGS;
```

`src/content/items.ts`:

```ts
import type { L10n } from '@core/i18n/t';
import type { ItemId } from './ids';

export const ITEM_NAMES = {
  lantern: { en: 'Lantern', sv: 'Lykta' },
  boomerang: { en: 'Boomerang', sv: 'Bumerang' },
  bombs: { en: 'Bombs', sv: 'Bomber' },
  bow: { en: 'Bow', sv: 'Pilbåge' },
  sealskin: { en: 'Seal-skin', sv: 'Sälskinn' },
  grapple: { en: 'Grapple chain', sv: 'Änterkedja' },
  hammer: { en: 'Dwarf hammer', sv: 'Dvärghammare' },
  mirror: { en: 'Ice mirror', sv: 'Isspegel' },
  mead_red: { en: 'Red mead', sv: 'Rött mjöd' },
  mead_green: { en: 'Green mead', sv: 'Grönt mjöd' },
  mead_blue: { en: 'Blue mead', sv: 'Blått mjöd' },
  flatbread: { en: "Embla's flatbread", sv: 'Emblas tunnbröd' },
  cheese: { en: 'Cheese', sv: 'Ost' },
  arrows: { en: 'Arrows', sv: 'Pilar' },
  heart_piece: { en: 'Piece of heart', sv: 'Hjärtbit' },
  heart_container: { en: 'Heart container', sv: 'Hjärtbehållare' },
  seidr_upgrade: { en: 'Seiðr vessel', sv: 'Seiðkärl' },
  quiver: { en: 'Larger quiver', sv: 'Större koger' },
  bomb_bag: { en: 'Larger bomb bag', sv: 'Större bombpåse' },
  purse: { en: 'Larger purse', sv: 'Större pung' },
} as const satisfies Record<ItemId, L10n>;
```

`src/content/galdr.ts`:

```ts
import type { GaldrDef } from '@core/items/defs';
import type { GaldrId } from './ids';

export const GALDR_DEFS = {
  eldr: { name: { en: 'Eldr — fire', sv: 'Eldr — eld' }, cost: 2 },
  is: { name: { en: 'Ís — ice', sv: 'Ís — is' }, cost: 3 },
  farvegr: { name: { en: 'Farvegr — the way', sv: 'Farvegr — vägen' }, cost: 4 },
  hlif: { name: { en: 'Hlíf — shelter', sv: 'Hlíf — skydd' }, cost: 3 },
  skjalfti: { name: { en: 'Skjálfti — tremor', sv: 'Skjálfti — skalv' }, cost: 5 },
  ljos: { name: { en: 'Ljós — light', sv: 'Ljós — ljus' }, cost: 2 },
  vindr: { name: { en: 'Vindr — wind', sv: 'Vindr — vind' }, cost: 3 },
  bragd: { name: { en: 'Bragð — sword beam', sv: 'Bragð — svärdsstråle' }, cost: 4 },
} as const satisfies Record<GaldrId, GaldrDef>;
```

`src/content/gear.ts`:

```ts
import type { L10n } from '@core/i18n/t';
import type { ArmorId, RingId, WeaponId } from './ids';

export const WEAPON_NAMES = {
  none: { en: 'Bare hands', sv: 'Tomma händer' },
  pitchfork: { en: 'Pitchfork', sv: 'Högaffel' },
  seax: { en: "Halvar's seax", sv: 'Halvars sax' },
  uppvik_sword: { en: 'Uppvík sword', sv: 'Uppvíksvärd' },
  dwarf_blade: { en: 'Dwarf-forged blade', sv: 'Dvärgsmitt svärd' },
} as const satisfies Record<WeaponId, L10n>;

export const ARMOR_NAMES = {
  wool_tunic: { en: 'Wool tunic', sv: 'Ylletunika' },
  byrnie: { en: 'Byrnie', sv: 'Brynja' },
  ember_byrnie: { en: 'Ember byrnie', sv: 'Glödbrynja' },
  runeplate: { en: 'Runeplate', sv: 'Runpansar' },
} as const satisfies Record<ArmorId, L10n>;

export const RING_NAMES = {
  ring_stamina: { en: 'Arm-ring of stamina', sv: 'Armring av uthållighet' },
  ring_thrift: { en: 'Arm-ring of thrift', sv: 'Armring av sparsamhet' },
  ring_beacon: { en: 'Beacon arm-ring', sv: 'Fyrarmring' },
  ring_berserker: { en: "Berserker's arm-ring", sv: 'Bärsärkarmring' },
} as const satisfies Record<RingId, L10n>;
```

`src/content/i18n/ui.ts`:

```ts
import type { L10n } from '@core/i18n/t';

export const UI = {
  webgl_required: {
    en: 'Fimbulvetr needs WebGL, which this browser has turned off or does not support.',
    sv: 'Fimbulvetr behöver WebGL, som den här webbläsaren har stängt av eller saknar stöd för.',
  },
  already_open: {
    en: 'Fimbulvetr is already open in another tab. Close it there to play here.',
    sv: 'Fimbulvetr är redan öppet i en annan flik. Stäng det där för att spela här.',
  },
  storage_unavailable: {
    en: 'Saving is unavailable in this browser window (private mode or blocked storage). Progress will not be kept.',
    sv: 'Det går inte att spara i det här webbläsarfönstret (privat läge eller blockerad lagring). Framstegen sparas inte.',
  },
  ok: { en: 'OK', sv: 'OK' },
  update_ready: { en: 'A new version of the game is ready. Reload now?', sv: 'En ny version av spelet finns. Ladda om nu?' },
  update_reload: { en: 'Reload', sv: 'Ladda om' },
  update_later: { en: 'Later', sv: 'Senare' },
  import_ok: { en: 'Save imported.', sv: 'Sparfilen importerades.' },
  import_checksum: {
    en: 'The save file was edited or damaged, but it loaded.',
    sv: 'Sparfilen har ändrats eller skadats, men den gick att ladda.',
  },
  import_bad_file: { en: 'That file is not a Fimbulvetr save.', sv: 'Filen är ingen sparfil från Fimbulvetr.' },
  import_too_new: {
    en: 'That save comes from a newer version of the game.',
    sv: 'Sparfilen kommer från en nyare version av spelet.',
  },
  import_invalid: { en: 'That save file is damaged: {detail}', sv: 'Sparfilen är skadad: {detail}' },
} as const satisfies Record<string, L10n>;

export type UiKey = keyof typeof UI;
```

`src/content/world/screens.ts`:

```ts
/** Every screen id. Add the id here, the ScreenDef in its region folder, and the entry in registry.ts. */
export const SCREEN_IDS = ['test_a', 'test_b', 'test_c'] as const;
export type ScreenId = (typeof SCREEN_IDS)[number];
```

`src/content/start.ts`:

```ts
import type { NewGameInit } from '@core/state/gameState';
import { DUNGEONS } from './ids';

/** M0 starts in the test lands with the seax and shield so every move can be tried. M1 replaces this. */
export const NEW_GAME: NewGameInit = {
  screen: 'test_a',
  x: 168,
  y: 190,
  facing: 's',
  weapon: 'seax',
  shield: true,
  dungeons: DUNGEONS,
};
```

- [ ] **Step 5: Run tests**

Run: `pnpm vitest run tests/unit/core tests/content`
Expected: PASS.

- [ ] **Step 6: Gate and commit**

Run: `pnpm check`

```bash
git add -A
git commit -m "Add full-game id registries, bilingual names, i18n and GameState v1

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Save format — checksum, validation, migrations

**Files:**
- Create: `src/core/state/validate.ts`, `src/core/state/migrations.ts`, `src/core/state/save.ts`, `tests/fixtures/saves/v1.json`
- Test: `tests/unit/core/save.test.ts`

**Interfaces:**
- Consumes: `GameState` (Task 4), `fnv1a`/`hex8` (Task 3), `DIRS` (Task 3), `SEASONS` (Task 4).
- Produces:
  - Constants: `SAVE_FORMAT = 'fimbulvetr'`, `SAVE_VERSION = 1`.
  - Types:
    - `SaveData { format; v; build; savedAt; state; sum }`
    - `SaveError { code: 'not-a-save'|'too-new'|'invalid'; detail }`
    - `LoadResult = { ok: true; state; checksumOk; fromVersion } | { ok: false; error }`
  - Functions: `canonicalJson(value)`, `checksum(state)`, `cloneState(state)`, `makeSave(state, build, savedAt)`, `loadSave(raw, knownScreens, migrations?)`, `parseSaveJson(text, knownScreens)`, `validateGameState(value, knownScreens): string[]`.
  - Migrations: `Migration`, `MIGRATIONS`, `migrate(state, from, to, migrations?)`.

- [ ] **Step 1: Add the v1 fixture**

`tests/fixtures/saves/v1.json` (the `sum` is FNV-1a of the canonical state JSON; the test proves it):

```json
{
  "format": "fimbulvetr",
  "v": 1,
  "build": "fixture",
  "savedAt": "2026-09-26T12:00:00.000Z",
  "state": {
    "seed": 12345,
    "rng": { "s": 12345 },
    "flags": { "st_intro_seen": true },
    "hero": {
      "screen": "test_b",
      "x": 328,
      "y": 190,
      "facing": "e",
      "hp": 10,
      "maxHp": 12,
      "seidr": 10,
      "maxSeidr": 10,
      "silver": 25,
      "purse": 0
    },
    "inv": {
      "items": { "lantern": 1 },
      "slots": ["lantern", null],
      "galdr": [],
      "weapon": "seax",
      "armor": "wool_tunic",
      "ring": null,
      "shield": true
    },
    "clock": { "minute": 1215, "sub": 30, "day": 2, "season": "autumn", "seasonDay": 1, "epoch": 1, "policy": "cycling" },
    "world": { "opened": [], "pieces": [], "warps": [], "visited": ["test_a", "test_b"], "cover": {}, "vars": {} },
    "dungeons": {
      "d1": { "keys": 0, "bigKey": false, "map": false, "compass": false, "bossDead": false, "doors": [] },
      "d2": { "keys": 0, "bigKey": false, "map": false, "compass": false, "bossDead": false, "doors": [] },
      "d3": { "keys": 0, "bigKey": false, "map": false, "compass": false, "bossDead": false, "doors": [] },
      "d4": { "keys": 0, "bigKey": false, "map": false, "compass": false, "bossDead": false, "doors": [] },
      "d5": { "keys": 0, "bigKey": false, "map": false, "compass": false, "bossDead": false, "doors": [] },
      "d6": { "keys": 0, "bigKey": false, "map": false, "compass": false, "bossDead": false, "doors": [] },
      "d7": { "keys": 0, "bigKey": false, "map": false, "compass": false, "bossDead": false, "doors": [] },
      "d8": { "keys": 0, "bigKey": false, "map": false, "compass": false, "bossDead": false, "doors": [] }
    },
    "playTicks": 54000
  },
  "sum": "1098b91e"
}
```

- [ ] **Step 2: Write the failing tests**

`tests/unit/core/save.test.ts`:

```ts
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { NEW_GAME } from '@content/start';
import { SCREEN_IDS } from '@content/world/screens';
import { newGame } from '@core/state/gameState';
import { migrate } from '@core/state/migrations';
import {
  SAVE_VERSION,
  canonicalJson,
  cloneState,
  loadSave,
  makeSave,
  parseSaveJson,
  type LoadResult,
} from '@core/state/save';

const known = new Set<string>(SCREEN_IDS);
const fixturePath = (v: number): URL => new URL(`../../fixtures/saves/v${v}.json`, import.meta.url);

function expectError(result: LoadResult, code: string): string {
  if (result.ok) throw new Error('expected a failed load');
  expect(result.error.code).toBe(code);
  return result.error.detail;
}

describe('canonicalJson', () => {
  it('sorts keys recursively and keeps arrays in order', () => {
    expect(canonicalJson({ b: 1, a: { d: 1, c: [2, 1] } })).toBe('{"a":{"c":[2,1],"d":1},"b":1}');
  });
});

describe('save round trip', () => {
  it('loads what it saved, with a valid checksum', () => {
    const state = newGame(99, NEW_GAME);
    const result = loadSave(makeSave(state, 'test', '2026-09-26T00:00:00.000Z'), known);
    if (!result.ok) throw new Error(result.error.detail);
    expect(result.state).toEqual(state);
    expect(result.checksumOk).toBe(true);
    expect(result.fromVersion).toBe(SAVE_VERSION);
  });

  it('copies the state so later changes do not leak into the save', () => {
    const state = newGame(1, NEW_GAME);
    const save = makeSave(state, 'test', 'x');
    state.hero.hp = 1;
    expect(save.state.hero.hp).toBe(12);
    expect(cloneState(state)).toEqual(state);
  });

  it('still loads an edited save but reports the checksum mismatch', () => {
    const save = makeSave(newGame(1, NEW_GAME), 'test', 'x');
    const edited = { ...save, state: { ...save.state, hero: { ...save.state.hero, hp: 4 } } };
    const result = loadSave(edited, known);
    if (!result.ok) throw new Error(result.error.detail);
    expect(result.checksumOk).toBe(false);
  });
});

describe('rejecting bad input', () => {
  it('rejects things that are not saves', () => {
    expectError(loadSave(null, known), 'not-a-save');
    expectError(loadSave({}, known), 'not-a-save');
    expectError(loadSave({ format: 'zelda', v: 1 }, known), 'not-a-save');
    expectError(parseSaveJson('this is not json', known), 'not-a-save');
  });

  it('rejects saves from a newer version', () => {
    const save = makeSave(newGame(1, NEW_GAME), 'test', 'x');
    expectError(loadSave({ ...save, v: SAVE_VERSION + 1 }, known), 'too-new');
  });

  it('rejects invalid values with a path in the detail', () => {
    const save = makeSave(newGame(1, NEW_GAME), 'test', 'x');
    const bad = { ...save, state: { ...save.state, hero: { ...save.state.hero, hp: -1 } } };
    expect(expectError(loadSave(bad, known), 'invalid')).toContain('state.hero.hp');
  });

  it('rejects an unknown hero screen', () => {
    const save = makeSave(newGame(1, NEW_GAME), 'test', 'x');
    const bad = { ...save, state: { ...save.state, hero: { ...save.state.hero, screen: 'nowhere' } } };
    expect(expectError(loadSave(bad, known), 'invalid')).toContain('unknown screen');
  });
});

describe('migrations', () => {
  it('applies steps in order', () => {
    const steps = {
      1: (s: unknown) => ({ ...(s as object), b: 2 }),
      2: (s: unknown) => ({ ...(s as object), c: 3 }),
    };
    expect(migrate({ a: 1 }, 1, 3, steps)).toEqual({ a: 1, b: 2, c: 3 });
  });

  it('throws when a step is missing', () => {
    expect(() => migrate({}, 1, 3, { 1: (s: unknown) => s })).toThrow('no migration from v2');
  });
});

describe('fixtures', () => {
  it('has a fixture for the current SAVE_VERSION', () => {
    expect(existsSync(fixturePath(SAVE_VERSION))).toBe(true);
  });

  it('loads every committed fixture', () => {
    for (let v = 1; v <= SAVE_VERSION; v++) {
      const result = parseSaveJson(readFileSync(fixturePath(v), 'utf8'), known);
      if (!result.ok) throw new Error(`v${v}: ${result.error.detail}`);
      expect(result.checksumOk).toBe(true);
    }
  });
});
```

- [ ] **Step 3: Run to verify failure**

Run: `pnpm vitest run tests/unit/core/save.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 4: Implement**

`src/core/state/migrations.ts`:

```ts
export type Migration = (state: unknown) => unknown;

/**
 * MIGRATIONS[n] upgrades a version-n state to version n+1. Whenever SAVE_VERSION is bumped: add the
 * migration here and commit tests/fixtures/saves/v<new>.json. Old fixtures are never deleted.
 */
export const MIGRATIONS: Readonly<Record<number, Migration>> = {};

export function migrate(
  state: unknown,
  from: number,
  to: number,
  migrations: Readonly<Record<number, Migration>> = MIGRATIONS,
): unknown {
  let current = state;
  for (let v = from; v < to; v++) {
    const step = migrations[v];
    if (step === undefined) throw new Error(`no migration from v${v}`);
    current = step(current);
  }
  return current;
}
```

`src/core/state/validate.ts`:

```ts
import { SEASONS } from '../clock/types';
import { DIRS } from '../math/dir';

type Check = (value: unknown, path: string, errors: string[]) => void;

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const int =
  (min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER): Check =>
  (v, p, e) => {
    if (typeof v !== 'number' || !Number.isInteger(v) || v < min || v > max) {
      e.push(`${p}: expected an integer in [${min}, ${max}]`);
    }
  };

const num =
  (min = -Number.MAX_VALUE, max = Number.MAX_VALUE): Check =>
  (v, p, e) => {
    if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max) {
      e.push(`${p}: expected a number in [${min}, ${max}]`);
    }
  };

const bool: Check = (v, p, e) => {
  if (typeof v !== 'boolean') e.push(`${p}: expected true or false`);
};

const str: Check = (v, p, e) => {
  if (typeof v !== 'string') e.push(`${p}: expected text`);
};

const oneOf =
  (values: readonly string[]): Check =>
  (v, p, e) => {
    if (typeof v !== 'string' || !values.includes(v)) e.push(`${p}: expected one of ${values.join(', ')}`);
  };

const nullable =
  (check: Check): Check =>
  (v, p, e) => {
    if (v !== null) check(v, p, e);
  };

const either =
  (a: Check, b: Check): Check =>
  (v, p, e) => {
    const first: string[] = [];
    a(v, p, first);
    if (first.length === 0) return;
    const second: string[] = [];
    b(v, p, second);
    if (second.length > 0) e.push(...first);
  };

const arrayOf =
  (item: Check): Check =>
  (v, p, e) => {
    if (!Array.isArray(v)) {
      e.push(`${p}: expected a list`);
      return;
    }
    v.forEach((x: unknown, i) => {
      item(x, `${p}[${i}]`, e);
    });
  };

const pair =
  (a: Check, b: Check): Check =>
  (v, p, e) => {
    if (!Array.isArray(v) || v.length !== 2) {
      e.push(`${p}: expected two entries`);
      return;
    }
    a(v[0], `${p}[0]`, e);
    b(v[1], `${p}[1]`, e);
  };

const recordOf =
  (item: Check): Check =>
  (v, p, e) => {
    if (!isRecord(v)) {
      e.push(`${p}: expected an object`);
      return;
    }
    for (const [k, x] of Object.entries(v)) item(x, `${p}.${k}`, e);
  };

const shape =
  (fields: Readonly<Record<string, Check>>): Check =>
  (v, p, e) => {
    if (!isRecord(v)) {
      e.push(`${p}: expected an object`);
      return;
    }
    for (const [k, check] of Object.entries(fields)) check(v[k], `${p}.${k}`, e);
  };

const dungeon = shape({
  keys: int(0, 99),
  bigKey: bool,
  map: bool,
  compass: bool,
  bossDead: bool,
  doors: arrayOf(str),
});

const gameState = shape({
  seed: int(0, 0xffffffff),
  rng: shape({ s: int(0, 0xffffffff) }),
  flags: recordOf(either(bool, int())),
  hero: shape({
    screen: str,
    x: num(0, 640),
    y: num(0, 352),
    facing: oneOf(DIRS),
    hp: int(0, 80),
    maxHp: int(4, 80),
    seidr: int(0, 30),
    maxSeidr: int(0, 30),
    silver: int(0, 999),
    purse: int(0, 2),
  }),
  inv: shape({
    items: recordOf(int(0, 999)),
    slots: pair(nullable(str), nullable(str)),
    galdr: arrayOf(str),
    weapon: str,
    armor: str,
    ring: nullable(str),
    shield: bool,
  }),
  clock: shape({
    minute: int(0, 1439),
    sub: int(0, 1000),
    day: int(1),
    season: oneOf(SEASONS),
    seasonDay: int(0),
    epoch: int(0),
    policy: oneOf(['held', 'cycling']),
  }),
  world: shape({
    opened: arrayOf(str),
    pieces: arrayOf(str),
    warps: arrayOf(str),
    visited: arrayOf(str),
    cover: recordOf(shape({ epoch: int(0), cleared: str })),
    vars: recordOf(num()),
  }),
  dungeons: recordOf(dungeon),
  playTicks: int(0),
});

/** Structural validation of an (already migrated) state. Unknown item and flag ids are tolerated. */
export function validateGameState(value: unknown, knownScreens: ReadonlySet<string>): string[] {
  const errors: string[] = [];
  gameState(value, 'state', errors);
  if (errors.length > 0 || !isRecord(value)) return errors;
  const hero = value['hero'];
  if (isRecord(hero)) {
    const screen = hero['screen'];
    if (typeof screen === 'string' && !knownScreens.has(screen)) {
      errors.push(`state.hero.screen: unknown screen '${screen}'`);
    }
    const hp = hero['hp'];
    const maxHp = hero['maxHp'];
    if (typeof hp === 'number' && typeof maxHp === 'number' && hp > maxHp) {
      errors.push('state.hero.hp: more than maxHp');
    }
  }
  return errors;
}
```

`src/core/state/save.ts`:

```ts
import { fnv1a, hex8 } from '../math/hash';
import type { GameState } from './gameState';
import { MIGRATIONS, migrate, type Migration } from './migrations';
import { validateGameState } from './validate';

export const SAVE_FORMAT = 'fimbulvetr';
export const SAVE_VERSION = 1;

export interface SaveData {
  readonly format: typeof SAVE_FORMAT;
  readonly v: number;
  readonly build: string;
  readonly savedAt: string;
  readonly state: GameState;
  /** FNV-1a of canonicalJson(state). Detects corruption and edits; it is not security. */
  readonly sum: string;
}

export type SaveErrorCode = 'not-a-save' | 'too-new' | 'invalid';

export interface SaveError {
  readonly code: SaveErrorCode;
  readonly detail: string;
}

export type LoadResult =
  | { readonly ok: true; readonly state: GameState; readonly checksumOk: boolean; readonly fromVersion: number }
  | { readonly ok: false; readonly error: SaveError };

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (typeof value === 'object' && value !== null) {
    const source = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(source).sort()) out[key] = sortKeys(source[key]);
    return out;
  }
  return value;
}

/** JSON with object keys sorted at every level, so equal states always hash equally. */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

export function checksum(state: unknown): string {
  return hex8(fnv1a(canonicalJson(state)));
}

export function cloneState(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state)) as GameState;
}

/** `savedAt` is passed in because the core never reads the wall clock. */
export function makeSave(state: GameState, build: string, savedAt: string): SaveData {
  const copy = cloneState(state);
  return { format: SAVE_FORMAT, v: SAVE_VERSION, build, savedAt, state: copy, sum: checksum(copy) };
}

const fail = (code: SaveErrorCode, detail: string): LoadResult => ({ ok: false, error: { code, detail } });

export function loadSave(
  raw: unknown,
  knownScreens: ReadonlySet<string>,
  migrations: Readonly<Record<number, Migration>> = MIGRATIONS,
): LoadResult {
  if (typeof raw !== 'object' || raw === null || (raw as Record<string, unknown>)['format'] !== SAVE_FORMAT) {
    return fail('not-a-save', 'missing the fimbulvetr format marker');
  }
  const record = raw as Record<string, unknown>;
  const v = record['v'];
  if (typeof v !== 'number' || !Number.isInteger(v) || v < 1) return fail('invalid', 'bad version number');
  if (v > SAVE_VERSION) return fail('too-new', `save version ${v} is newer than ${SAVE_VERSION}`);
  const checksumOk = typeof record['sum'] === 'string' && record['sum'] === checksum(record['state']);
  let state: unknown;
  try {
    state = migrate(record['state'], v, SAVE_VERSION, migrations);
  } catch (e) {
    return fail('invalid', `migration failed: ${String(e)}`);
  }
  const errors = validateGameState(state, knownScreens);
  if (errors.length > 0) return fail('invalid', errors.slice(0, 3).join('; '));
  return { ok: true, state: state as GameState, checksumOk, fromVersion: v };
}

export function parseSaveJson(text: string, knownScreens: ReadonlySet<string>): LoadResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return fail('not-a-save', 'not JSON');
  }
  return loadSave(raw, knownScreens);
}
```

- [ ] **Step 5: Run tests**

Run: `pnpm vitest run tests/unit/core/save.test.ts`
Expected: PASS. If the fixture checksum test fails, your `canonicalJson` differs from the spec above. Fix the code; never regenerate the fixture's `sum`.

- [ ] **Step 6: Gate and commit**

Run: `pnpm check`

```bash
git add -A
git commit -m "Add versioned, checksummed save format with validation and migrations

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 6: Fixed-step loop and input latch

**Files:**
- Create: `src/core/sim/loop.ts`, `src/core/input/actions.ts`
- Test: `tests/unit/core/loop.test.ts`, `tests/unit/core/input.test.ts`

**Interfaces:**
- Consumes: `Vec`, `normalize`, `length` (Task 3).
- Produces:
  - Loop: `STEP_MS`, `MAX_STEPS = 4`, `Accumulator { acc }`, `advance(acc, deltaMs, maxSteps?) → { steps, alpha }`.
  - Actions: `ACTIONS`, `Action`, `bit(a)`, `bitsOf(actions)`.
  - Input frames: `InputFrame { held; pressed; released; mx; my }`, `EMPTY_FRAME`, `isHeld`, `wasPressed`, `wasReleased`, `quantize`, `moveVector(frame): Vec`.
  - `class InputLatch { report(held, mx, my): void; consume(): InputFrame }`.

- [ ] **Step 1: Write the failing tests**

`tests/unit/core/loop.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { MAX_STEPS, STEP_MS, advance } from '@core/sim/loop';

describe('advance', () => {
  it('runs one step per 60 Hz frame', () => {
    expect(advance({ acc: 0 }, STEP_MS).steps).toBe(1);
  });

  it('accumulates short frames (120 Hz display)', () => {
    const a = { acc: 0 };
    const first = advance(a, STEP_MS / 2);
    expect(first.steps).toBe(0);
    expect(first.alpha).toBeCloseTo(0.5);
    expect(advance(a, STEP_MS / 2).steps).toBe(1);
  });

  it('caps a huge hitch (tab was in the background) and drops the rest', () => {
    const a = { acc: 0 };
    const r = advance(a, 60_000);
    expect(r.steps).toBe(MAX_STEPS);
    expect(r.alpha).toBe(0);
    expect(a.acc).toBe(0);
  });

  it('ignores negative and non-finite deltas', () => {
    const a = { acc: 0 };
    expect(advance(a, -50).steps).toBe(0);
    expect(advance(a, Number.NaN).steps).toBe(0);
    expect(a.acc).toBe(0);
  });

  it('keeps alpha in [0, 1)', () => {
    const a = { acc: 0 };
    for (const d of [3, 17, 16.6, 40, 1, 33.3, 8]) {
      const { alpha } = advance(a, d);
      expect(alpha).toBeGreaterThanOrEqual(0);
      expect(alpha).toBeLessThan(1);
    }
  });
});
```

`tests/unit/core/input.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  InputLatch,
  bit,
  bitsOf,
  isHeld,
  moveVector,
  quantize,
  wasPressed,
  wasReleased,
} from '@core/input/actions';
import { length } from '@core/math/vec';

describe('InputLatch', () => {
  it('reports a press once, then only held', () => {
    const latch = new InputLatch();
    latch.report(bit('sword'), 0, 0);
    const a = latch.consume();
    const b = latch.consume();
    expect(wasPressed(a, 'sword')).toBe(true);
    expect(isHeld(a, 'sword')).toBe(true);
    expect(wasPressed(b, 'sword')).toBe(false);
    expect(isHeld(b, 'sword')).toBe(true);
  });

  it('never loses a tap that starts and ends between two ticks', () => {
    const latch = new InputLatch();
    latch.report(bit('roll'), 0, 0);
    latch.report(0, 0, 0);
    const f = latch.consume();
    expect(wasPressed(f, 'roll')).toBe(true);
    expect(isHeld(f, 'roll')).toBe(true);
    expect(wasReleased(f, 'roll')).toBe(true);
    const g = latch.consume();
    expect(isHeld(g, 'roll')).toBe(false);
    expect(wasPressed(g, 'roll')).toBe(false);
  });

  it('reports releases', () => {
    const latch = new InputLatch();
    latch.report(bit('shield'), 0, 0);
    latch.consume();
    latch.report(0, 0, 0);
    expect(wasReleased(latch.consume(), 'shield')).toBe(true);
  });

  it('quantises analog movement to 1/64 steps', () => {
    const latch = new InputLatch();
    latch.report(0, 0.33333, -2);
    const f = latch.consume();
    expect(f.mx).toBe(quantize(0.33333));
    expect(f.mx * 64).toBe(Math.round(f.mx * 64));
    expect(f.my).toBe(-1);
  });
});

describe('moveVector', () => {
  it('clamps diagonals to length 1', () => {
    const v = moveVector({ held: bitsOf(['right', 'down']), pressed: 0, released: 0, mx: 1, my: 1 });
    expect(length(v)).toBeCloseTo(1);
  });

  it('keeps gentle analog input below 1', () => {
    const v = moveVector({ held: 0, pressed: 0, released: 0, mx: 0.5, my: 0 });
    expect(v).toEqual({ x: 0.5, y: 0 });
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm vitest run tests/unit/core/loop.test.ts tests/unit/core/input.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement**

`src/core/sim/loop.ts`:

```ts
/** The simulation always steps at exactly 60 Hz; rendering interpolates with `alpha`. */
export const STEP_MS = 1000 / 60;
/** At most this many steps per rendered frame; the rest of a long hitch is dropped, never fast-forwarded. */
export const MAX_STEPS = 4;
const MAX_DELTA_MS = 250;

export interface Accumulator {
  acc: number;
}

export function advance(
  a: Accumulator,
  deltaMs: number,
  maxSteps: number = MAX_STEPS,
): { steps: number; alpha: number } {
  const delta = Number.isFinite(deltaMs) ? Math.min(Math.max(deltaMs, 0), MAX_DELTA_MS) : 0;
  a.acc += delta;
  let steps = Math.floor(a.acc / STEP_MS);
  if (steps > maxSteps) {
    steps = maxSteps;
    a.acc = 0;
  } else {
    a.acc -= steps * STEP_MS;
  }
  return { steps, alpha: a.acc / STEP_MS };
}
```

`src/core/input/actions.ts`:

```ts
import { length, normalize, type Vec } from '../math/vec';

export const ACTIONS = [
  'up',
  'down',
  'left',
  'right',
  'sword',
  'item1',
  'item2',
  'galdr',
  'roll',
  'shield',
  'interact',
  'menu',
  'map',
  'confirm',
  'cancel',
] as const;
export type Action = (typeof ACTIONS)[number];

const BITS = Object.fromEntries(ACTIONS.map((a, i) => [a, 1 << i])) as Readonly<Record<Action, number>>;

export const bit = (a: Action): number => BITS[a];
export const bitsOf = (actions: Iterable<Action>): number => {
  let bits = 0;
  for (const a of actions) bits |= BITS[a];
  return bits;
};

/** One tick of input. `mx`/`my` are in [-1, 1], quantised so recorded replays are exact. */
export interface InputFrame {
  readonly held: number;
  readonly pressed: number;
  readonly released: number;
  readonly mx: number;
  readonly my: number;
}

export const EMPTY_FRAME: InputFrame = { held: 0, pressed: 0, released: 0, mx: 0, my: 0 };

export const isHeld = (f: InputFrame, a: Action): boolean => (f.held & BITS[a]) !== 0;
export const wasPressed = (f: InputFrame, a: Action): boolean => (f.pressed & BITS[a]) !== 0;
export const wasReleased = (f: InputFrame, a: Action): boolean => (f.released & BITS[a]) !== 0;

export function quantize(v: number): number {
  const clamped = Math.max(-1, Math.min(1, v));
  return Math.round(clamped * 64) / 64;
}

/** Movement intent, clamped to length ≤ 1 (so diagonals are not faster). */
export function moveVector(f: InputFrame): Vec {
  const v = { x: f.mx, y: f.my };
  return length(v) > 1 ? normalize(v) : v;
}

/**
 * Collects device state between sim ticks. `report` may be called any number of times per frame;
 * `consume` is called once per tick. A tap that starts and ends between two ticks is still seen.
 */
export class InputLatch {
  private held = 0;
  private pressed = 0;
  private released = 0;
  private mx = 0;
  private my = 0;

  report(held: number, mx: number, my: number): void {
    this.pressed |= held & ~this.held;
    this.released |= this.held & ~held;
    this.held = held;
    this.mx = mx;
    this.my = my;
  }

  consume(): InputFrame {
    const frame: InputFrame = {
      held: this.held | this.pressed,
      pressed: this.pressed,
      released: this.released,
      mx: quantize(this.mx),
      my: quantize(this.my),
    };
    this.pressed = 0;
    this.released = 0;
    return frame;
  }
}
```

- [ ] **Step 4: Run tests**

Run: `pnpm vitest run tests/unit/core/loop.test.ts tests/unit/core/input.test.ts`
Expected: PASS.

- [ ] **Step 5: Gate and commit**

Run: `pnpm check`

```bash
git add -A
git commit -m "Add fixed-step accumulator and tick-latched input frames

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Shell input devices and bindings

**Files:**
- Create: `src/content/bindings.ts`, `src/shell/input/keyboard.ts`, `src/shell/input/gamepad.ts`, `src/shell/input/mapper.ts`
- Test: `tests/unit/shell/input.test.ts`

**Interfaces:**
- Consumes: `ACTIONS`, `Action`, `bit`, `InputLatch` (Task 6).
- Produces:
  - Bindings: `Bindings { kb; pad }`, `DEFAULT_BINDINGS`.
  - Keyboard: `KeyEventLike`, `isTextInput(target)`, `class KeyboardState { down(e); up(e); clear(); codes() }`, `attachKeyboard(win, keys): () => void`.
  - Gamepad: `GamepadLike`, `PadSnapshot { buttons; ax; ay }`, `readPad(pads): PadSnapshot | null`, `deadzone(x, y, dz?)`.
  - Mapper: `class InputMapper { constructor(bindings, latch, options: { holdToggleShield }); sample(keys, pad): void }`.

- [ ] **Step 1: Write the failing tests**

`tests/unit/shell/input.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { DEFAULT_BINDINGS } from '@content/bindings';
import { InputLatch, isHeld, wasPressed, wasReleased } from '@core/input/actions';
import { deadzone, readPad, type GamepadLike } from '@shell/input/gamepad';
import { KeyboardState, isTextInput } from '@shell/input/keyboard';
import { InputMapper } from '@shell/input/mapper';

function key(code: string, target: unknown = null): { code: string; target: EventTarget | null; preventDefault(): void; prevented: boolean } {
  const e = {
    code,
    target: target as EventTarget | null,
    prevented: false,
    preventDefault() {
      e.prevented = true;
    },
  };
  return e;
}

function setup(holdToggleShield = false): { keys: KeyboardState; latch: InputLatch; mapper: InputMapper } {
  const keys = new KeyboardState();
  const latch = new InputLatch();
  return { keys, latch, mapper: new InputMapper(DEFAULT_BINDINGS, latch, { holdToggleShield }) };
}

function pad(buttons: number[], axes: [number, number] = [0, 0]): GamepadLike {
  return {
    connected: true,
    mapping: 'standard',
    axes,
    buttons: Array.from({ length: 17 }, (_, i) => ({ pressed: buttons.includes(i), value: buttons.includes(i) ? 1 : 0 })),
  };
}

describe('KeyboardState', () => {
  it('tracks physical keys and captures browser-scrolling keys', () => {
    const keys = new KeyboardState();
    const space = key('Space');
    keys.down(space);
    keys.down(key('KeyW'));
    expect([...keys.codes()].sort()).toEqual(['KeyW', 'Space']);
    expect(space.prevented).toBe(true);
    keys.up({ code: 'KeyW' });
    expect([...keys.codes()]).toEqual(['Space']);
  });

  it('ignores keys typed into text fields', () => {
    const keys = new KeyboardState();
    keys.down(key('KeyD', { tagName: 'INPUT' }));
    expect(keys.codes().size).toBe(0);
    expect(isTextInput({ tagName: 'TEXTAREA' })).toBe(true);
    expect(isTextInput({ tagName: 'CANVAS' })).toBe(false);
  });
});

describe('InputMapper', () => {
  it('maps WASD to actions and a digital move vector', () => {
    const { keys, latch, mapper } = setup();
    keys.down(key('KeyW'));
    keys.down(key('KeyD'));
    mapper.sample(keys.codes(), null);
    const f = latch.consume();
    expect(isHeld(f, 'up') && isHeld(f, 'right')).toBe(true);
    expect([f.mx, f.my]).toEqual([1, -1]);
  });

  it('releases everything when the window loses focus', () => {
    const { keys, latch, mapper } = setup();
    keys.down(key('KeyD'));
    mapper.sample(keys.codes(), null);
    latch.consume();
    keys.clear();
    mapper.sample(keys.codes(), null);
    const f = latch.consume();
    expect(wasReleased(f, 'right')).toBe(true);
    expect(f.held).toBe(0);
    expect(f.mx).toBe(0);
  });

  it('uses the standard gamepad layout and prefers the analog stick', () => {
    const { latch, mapper } = setup();
    mapper.sample(new Set(), readPad([pad([2, 5], [0.9, 0])]));
    const f = latch.consume();
    expect(wasPressed(f, 'sword')).toBe(true);
    expect(wasPressed(f, 'roll')).toBe(true);
    expect(f.mx).toBeGreaterThan(0.8);
  });

  it('turns shield into a toggle when hold-to-toggle is on', () => {
    const { keys, latch, mapper } = setup(true);
    keys.down(key('ShiftLeft'));
    mapper.sample(keys.codes(), null);
    keys.up({ code: 'ShiftLeft' });
    mapper.sample(keys.codes(), null);
    expect(isHeld(latch.consume(), 'shield')).toBe(true);
    keys.down(key('ShiftLeft'));
    mapper.sample(keys.codes(), null);
    keys.up({ code: 'ShiftLeft' });
    mapper.sample(keys.codes(), null);
    latch.consume();
    expect(isHeld(latch.consume(), 'shield')).toBe(false);
  });
});

describe('gamepad', () => {
  it('ignores a disconnected or absent pad', () => {
    expect(readPad([])).toBeNull();
    expect(readPad([null, { ...pad([0]), connected: false }])).toBeNull();
  });

  it('applies a radial dead zone and rescales outside it', () => {
    expect(deadzone(0.1, 0.1)).toEqual([0, 0]);
    const [x, y] = deadzone(1, 0);
    expect(x).toBeCloseTo(1);
    expect(y).toBe(0);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm vitest run tests/unit/shell/input.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement**

`src/content/bindings.ts`:

```ts
import type { Action } from '@core/input/actions';

export interface Bindings {
  /** KeyboardEvent.code values (physical keys, layout-independent). */
  readonly kb: Readonly<Record<Action, readonly string[]>>;
  /** Standard-mapping button indices: 0 A, 1 B, 2 X, 3 Y, 4 LB, 5 RB, 6 LT, 7 RT, 8 Select, 9 Start, 12–15 d-pad. */
  readonly pad: Readonly<Record<Action, readonly number[]>>;
}

export const DEFAULT_BINDINGS: Bindings = {
  kb: {
    up: ['KeyW', 'ArrowUp'],
    down: ['KeyS', 'ArrowDown'],
    left: ['KeyA', 'ArrowLeft'],
    right: ['KeyD', 'ArrowRight'],
    sword: ['KeyJ'],
    item1: ['KeyK'],
    item2: ['KeyL'],
    galdr: ['KeyI'],
    roll: ['Space'],
    shield: ['ShiftLeft', 'ShiftRight'],
    interact: ['KeyE'],
    menu: ['Tab'],
    map: ['KeyM'],
    confirm: ['Enter', 'KeyE'],
    cancel: ['Escape', 'Backspace'],
  },
  pad: {
    up: [12],
    down: [13],
    left: [14],
    right: [15],
    sword: [2],
    item1: [1],
    item2: [3],
    galdr: [7],
    roll: [5],
    shield: [4],
    interact: [0],
    menu: [9],
    map: [8],
    confirm: [0],
    cancel: [1],
  },
};
```

`src/shell/input/keyboard.ts`:

```ts
export interface KeyEventLike {
  readonly code: string;
  readonly target: EventTarget | null;
  preventDefault(): void;
}

/** Keys the browser would otherwise use to scroll or move focus. */
const CAPTURED = new Set(['Tab', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

/** True for elements that take text input (the dev console); the game ignores keys typed there. */
export function isTextInput(target: unknown): boolean {
  if (typeof target !== 'object' || target === null) return false;
  const el = target as { tagName?: unknown; isContentEditable?: unknown };
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable === true;
}

/** Physical keys currently held, by KeyboardEvent.code, so WASD works on every keyboard layout. */
export class KeyboardState {
  private readonly held = new Set<string>();

  down(e: KeyEventLike): void {
    if (isTextInput(e.target)) return;
    this.held.add(e.code);
    if (CAPTURED.has(e.code)) e.preventDefault();
  }

  up(e: Pick<KeyEventLike, 'code'>): void {
    this.held.delete(e.code);
  }

  /** Call when the window loses focus: key-ups that happen in another window never arrive. */
  clear(): void {
    this.held.clear();
  }

  codes(): ReadonlySet<string> {
    return this.held;
  }
}

export function attachKeyboard(win: Window, keys: KeyboardState): () => void {
  const onDown = (e: KeyboardEvent): void => {
    keys.down(e);
  };
  const onUp = (e: KeyboardEvent): void => {
    keys.up(e);
  };
  const onBlur = (): void => {
    keys.clear();
  };
  const onVisibility = (): void => {
    if (win.document.visibilityState === 'hidden') keys.clear();
  };
  win.addEventListener('keydown', onDown);
  win.addEventListener('keyup', onUp);
  win.addEventListener('blur', onBlur);
  win.document.addEventListener('visibilitychange', onVisibility);
  return () => {
    win.removeEventListener('keydown', onDown);
    win.removeEventListener('keyup', onUp);
    win.removeEventListener('blur', onBlur);
    win.document.removeEventListener('visibilitychange', onVisibility);
  };
}
```

`src/shell/input/gamepad.ts`:

```ts
export interface GamepadLike {
  readonly connected: boolean;
  readonly mapping: string;
  readonly buttons: readonly { readonly pressed: boolean; readonly value: number }[];
  readonly axes: readonly number[];
}

export interface PadSnapshot {
  readonly buttons: ReadonlySet<number>;
  readonly ax: number;
  readonly ay: number;
}

export const DEADZONE = 0.25;

/** Radial dead zone; input outside it is rescaled so movement starts smoothly from zero. */
export function deadzone(x: number, y: number, dz: number = DEADZONE): [number, number] {
  const len = Math.sqrt(x * x + y * y);
  if (len < dz) return [0, 0];
  const k = Math.min(1, (len - dz) / (1 - dz)) / len;
  return [x * k, y * k];
}

/** Reads the first connected pad, preferring one with the standard mapping. */
export function readPad(pads: readonly (GamepadLike | null)[]): PadSnapshot | null {
  const connected = pads.filter((p): p is GamepadLike => p !== null && p.connected);
  const pad = connected.find((p) => p.mapping === 'standard') ?? connected[0];
  if (pad === undefined) return null;
  const buttons = new Set<number>();
  pad.buttons.forEach((b, i) => {
    if (b.pressed || b.value > 0.5) buttons.add(i);
  });
  const [ax, ay] = deadzone(pad.axes[0] ?? 0, pad.axes[1] ?? 0);
  return { buttons, ax, ay };
}
```

`src/shell/input/mapper.ts`:

```ts
import type { Bindings } from '@content/bindings';
import { ACTIONS, bit, type InputLatch } from '@core/input/actions';
import type { PadSnapshot } from './gamepad';

export interface MapperOptions {
  readonly holdToggleShield: boolean;
}

/** Turns raw device state into action bits for the latch. Accessibility transforms live here, not in the core. */
export class InputMapper {
  private shieldOn = false;
  private shieldWasDown = false;

  constructor(
    private readonly bindings: Bindings,
    private readonly latch: InputLatch,
    private readonly options: MapperOptions,
  ) {}

  sample(keys: ReadonlySet<string>, pad: PadSnapshot | null): void {
    let held = 0;
    for (const action of ACTIONS) {
      const onKey = this.bindings.kb[action].some((code) => keys.has(code));
      const onPad = pad !== null && this.bindings.pad[action].some((b) => pad.buttons.has(b));
      if (onKey || onPad) held |= bit(action);
    }
    held = this.shieldToggle(held);
    let mx = pad?.ax ?? 0;
    let my = pad?.ay ?? 0;
    if (mx === 0 && my === 0) {
      mx = ((held & bit('right')) !== 0 ? 1 : 0) - ((held & bit('left')) !== 0 ? 1 : 0);
      my = ((held & bit('down')) !== 0 ? 1 : 0) - ((held & bit('up')) !== 0 ? 1 : 0);
    }
    this.latch.report(held, mx, my);
  }

  private shieldToggle(held: number): number {
    if (!this.options.holdToggleShield) return held;
    const shield = bit('shield');
    const down = (held & shield) !== 0;
    if (down && !this.shieldWasDown) this.shieldOn = !this.shieldOn;
    this.shieldWasDown = down;
    return this.shieldOn ? held | shield : held & ~shield;
  }
}
```

- [ ] **Step 4: Run tests**

Run: `pnpm vitest run tests/unit/shell/input.test.ts`
Expected: PASS.

- [ ] **Step 5: Gate and commit**

Run: `pnpm check`

```bash
git add -A
git commit -m "Add keyboard and gamepad input with remappable bindings

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Text maps, legend and blob-47 auto-tiling

**Files:**
- Create: `src/core/world/dims.ts`, `src/core/world/terrain.ts`, `src/core/world/textmap.ts`, `src/core/world/autotile.ts`, `src/content/terrain.ts`, `src/content/world/legend.ts`
- Test: `tests/unit/core/textmap.test.ts`, `tests/unit/core/autotile.test.ts`

**Interfaces:**
- Produces:
  - Dimensions: `TILE = 16`, `SCREEN_COLS = 40`, `SCREEN_ROWS = 22`, `SCREEN_W = 640`, `SCREEN_H = 352`.
  - Terrain: `TerrainDef { solid }`; `TERRAIN_IDS`, `TerrainId`, `TERRAIN`, `LEGEND`.
  - Text maps: `class MapError`, `TerrainGrid { cols; rows; cells }`, `parseTextMap(lines, legend, cols?, rows?)`, `cellAt(grid, x, y)`.
  - Auto-tiling: the direction bits `N`, `NE`, `E`, `SE`, `S`, `SW`, `W`, `NW`; `reduceMask(m)`, `BLOB_MASKS` (47 entries), `blobIndex(mask)`, `neighbourMask(x, y, cols, rows, same)`.

- [ ] **Step 1: Write the failing tests**

`tests/unit/core/textmap.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { MapError, cellAt, parseTextMap } from '@core/world/textmap';
import { LEGEND } from '@content/world/legend';

const row = (s: string): string => s.padEnd(40, '.');
const map = (rows: string[]): string[] => [...rows.map(row), ...Array.from({ length: 22 - rows.length }, () => row(''))];

describe('parseTextMap', () => {
  it('reads terrain through the legend', () => {
    const g = parseTextMap(map(['#~,T']), LEGEND);
    expect([cellAt(g, 0, 0), cellAt(g, 1, 0), cellAt(g, 2, 0), cellAt(g, 3, 0), cellAt(g, 4, 0)]).toEqual([
      'rock',
      'water',
      'path',
      'tree',
      'grass',
    ]);
    expect(cellAt(g, 40, 0)).toBeUndefined();
  });

  it('names the row and column of an unknown character', () => {
    expect(() => parseTextMap(map(['', '...X']), LEGEND)).toThrow(new MapError("row 2, col 4: unknown map character 'X'"));
  });

  it('rejects wrong sizes', () => {
    expect(() => parseTextMap(map([]).slice(1), LEGEND)).toThrow('expected 22 rows');
    expect(() => parseTextMap(['.'.repeat(39), ...map([]).slice(1)], LEGEND)).toThrow('row 1: expected 40 columns');
  });
});
```

`tests/unit/core/autotile.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { BLOB_MASKS, E, N, NE, S, W, blobIndex, neighbourMask, reduceMask } from '@core/world/autotile';

describe('blob-47', () => {
  it('has exactly 47 distinct reduced masks', () => {
    expect(BLOB_MASKS).toHaveLength(47);
    expect(new Set(BLOB_MASKS).size).toBe(47);
  });

  it('drops diagonals whose two cardinals are not both present', () => {
    expect(reduceMask(NE)).toBe(0);
    expect(reduceMask(N | NE)).toBe(N);
    expect(reduceMask(N | E | NE)).toBe(N | E | NE);
  });

  it('indexes isolated and fully surrounded tiles at the ends', () => {
    expect(blobIndex(0)).toBe(0);
    expect(blobIndex(0xff)).toBe(46);
  });

  it('treats out-of-bounds neighbours as the same terrain', () => {
    const same = (): boolean => false;
    expect(neighbourMask(0, 0, 3, 3, same) & (N | W)).toBe(N | W);
    expect(neighbourMask(1, 1, 3, 3, same)).toBe(0);
    expect(neighbourMask(1, 1, 3, 3, () => true)).toBe(0xff);
    expect(neighbourMask(2, 2, 3, 3, same) & (S | E)).toBe(S | E);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm vitest run tests/unit/core/textmap.test.ts tests/unit/core/autotile.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement**

`src/core/world/dims.ts`:

```ts
export const TILE = 16;
export const SCREEN_COLS = 40;
export const SCREEN_ROWS = 22;
export const SCREEN_W = SCREEN_COLS * TILE;
export const SCREEN_H = SCREEN_ROWS * TILE;
```

`src/core/world/terrain.ts`:

```ts
/** How the rules see a terrain type. Looks are in src/art/tiles. */
export interface TerrainDef {
  readonly solid: boolean;
}
```

`src/content/terrain.ts`:

```ts
import type { TerrainDef } from '@core/world/terrain';

export const TERRAIN_IDS = ['grass', 'path', 'water', 'rock', 'tree'] as const;
export type TerrainId = (typeof TERRAIN_IDS)[number];

export const TERRAIN = {
  grass: { solid: false },
  path: { solid: false },
  water: { solid: true },
  rock: { solid: true },
  tree: { solid: true },
} as const satisfies Record<TerrainId, TerrainDef>;
```

`src/content/world/legend.ts`:

```ts
import type { TerrainId } from '../terrain';

/** One character per terrain in screen text maps. */
export const LEGEND: Readonly<Record<string, TerrainId>> = {
  '.': 'grass',
  ',': 'path',
  '~': 'water',
  '#': 'rock',
  T: 'tree',
};
```

`src/core/world/textmap.ts`:

```ts
import type { TerrainId } from '@content/terrain';
import { SCREEN_COLS, SCREEN_ROWS } from './dims';

export class MapError extends Error {}

export interface TerrainGrid {
  readonly cols: number;
  readonly rows: number;
  readonly cells: readonly TerrainId[];
}

export function parseTextMap(
  lines: readonly string[],
  legend: Readonly<Record<string, TerrainId>>,
  cols: number = SCREEN_COLS,
  rows: number = SCREEN_ROWS,
): TerrainGrid {
  if (lines.length !== rows) throw new MapError(`expected ${rows} rows, got ${lines.length}`);
  const cells: TerrainId[] = [];
  lines.forEach((line, r) => {
    if (line.length !== cols) throw new MapError(`row ${r + 1}: expected ${cols} columns, got ${line.length}`);
    for (let c = 0; c < cols; c++) {
      const ch = line.charAt(c);
      const terrain = legend[ch];
      if (terrain === undefined) throw new MapError(`row ${r + 1}, col ${c + 1}: unknown map character '${ch}'`);
      cells.push(terrain);
    }
  });
  return { cols, rows, cells };
}

export function cellAt(g: TerrainGrid, x: number, y: number): TerrainId | undefined {
  if (x < 0 || y < 0 || x >= g.cols || y >= g.rows) return undefined;
  return g.cells[y * g.cols + x];
}
```

`src/core/world/autotile.ts`:

```ts
export const N = 1;
export const NE = 2;
export const E = 4;
export const SE = 8;
export const S = 16;
export const SW = 32;
export const W = 64;
export const NW = 128;

/** Drops diagonal bits whose two neighbouring cardinals are not both set (they cannot change the look). */
export function reduceMask(m: number): number {
  let r = m & (N | E | S | W);
  if ((m & NE) !== 0 && (m & N) !== 0 && (m & E) !== 0) r |= NE;
  if ((m & SE) !== 0 && (m & S) !== 0 && (m & E) !== 0) r |= SE;
  if ((m & SW) !== 0 && (m & S) !== 0 && (m & W) !== 0) r |= SW;
  if ((m & NW) !== 0 && (m & N) !== 0 && (m & W) !== 0) r |= NW;
  return r;
}

/** The 47 distinct reduced masks, ascending. Index 0 is an isolated tile, 46 a fully surrounded one. */
export const BLOB_MASKS: readonly number[] = (() => {
  const set = new Set<number>();
  for (let m = 0; m < 256; m++) set.add(reduceMask(m));
  return [...set].sort((a, b) => a - b);
})();

const INDEX = new Map(BLOB_MASKS.map((m, i) => [m, i]));

export function blobIndex(mask: number): number {
  const i = INDEX.get(reduceMask(mask));
  if (i === undefined) throw new Error(`no blob index for mask ${mask}`);
  return i;
}

/** 8-neighbour mask of cells where `same` holds. Out of bounds counts as same: terrain continues past the edge. */
export function neighbourMask(
  x: number,
  y: number,
  cols: number,
  rows: number,
  same: (x: number, y: number) => boolean,
): number {
  const s = (dx: number, dy: number): boolean => {
    const nx = x + dx;
    const ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) return true;
    return same(nx, ny);
  };
  return (
    (s(0, -1) ? N : 0) |
    (s(1, -1) ? NE : 0) |
    (s(1, 0) ? E : 0) |
    (s(1, 1) ? SE : 0) |
    (s(0, 1) ? S : 0) |
    (s(-1, 1) ? SW : 0) |
    (s(-1, 0) ? W : 0) |
    (s(-1, -1) ? NW : 0)
  );
}
```

- [ ] **Step 4: Run tests**

Run: `pnpm vitest run tests/unit/core/textmap.test.ts tests/unit/core/autotile.test.ts`
Expected: PASS.

- [ ] **Step 5: Gate and commit**

Run: `pnpm check`

```bash
git add -A
git commit -m "Add text-map parser, terrain legend and blob-47 auto-tile masks

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: World layout, test screens, content integrity

**Files:**
- Create: `src/core/world/screen.ts`, `src/content/world/testlands/test_a.ts`, `src/content/world/testlands/test_b.ts`, `src/content/world/testlands/test_c.ts`, `src/content/world/layout.ts`, `src/content/world/registry.ts`
- Test: `tests/content/integrity.test.ts`

**Interfaces:**
- Consumes: `ScreenId`/`SCREEN_IDS` (Task 4), `EnemyId`/`RegionId` (Task 4), dims/textmap (Task 8), `Dir4`/`DIR_VEC`, `Vec` (Task 3).
- Produces:
  - Types: `TilePos`, `Thing = { k: 'enemy'; id: EnemyId; at: TilePos }` (this union grows in M1), `ScreenDef { id; region; purpose; map; things }`, `WorldLayout { cols; rows; at }`, `LayoutIndex`.
  - Functions: `indexLayout(layout)`, `neighbourOf(index, id, dir)`, `screenOrigin(index, id): Vec`, `tileFeet(at): Vec`.
  - Content: `WORLD_LAYOUT`, `SCREENS: Record<ScreenId, ScreenDef>`.

- [ ] **Step 1: Write the failing integrity test**

`tests/content/integrity.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { NEW_GAME } from '@content/start';
import { TERRAIN } from '@content/terrain';
import { WORLD_LAYOUT } from '@content/world/layout';
import { LEGEND } from '@content/world/legend';
import { SCREENS } from '@content/world/registry';
import { SCREEN_IDS, type ScreenId } from '@content/world/screens';
import { SCREEN_COLS, SCREEN_ROWS, TILE } from '@core/world/dims';
import { indexLayout, neighbourOf } from '@core/world/screen';
import { cellAt, parseTextMap } from '@core/world/textmap';

function walkable(id: ScreenId): (x: number, y: number) => boolean {
  const grid = parseTextMap(SCREENS[id].map, LEGEND);
  return (x, y) => {
    const t = cellAt(grid, x, y);
    return t !== undefined && !TERRAIN[t].solid;
  };
}

describe('screens', () => {
  it.each(SCREEN_IDS)('%s matches its key, has a purpose and a valid map', (id) => {
    const def = SCREENS[id];
    expect(def.id).toBe(id);
    expect(def.purpose.trim()).not.toBe('');
    expect(() => parseTextMap(def.map, LEGEND)).not.toThrow();
  });

  it.each(SCREEN_IDS)('%s places things on walkable tiles', (id) => {
    const ok = walkable(id);
    for (const thing of SCREENS[id].things) {
      expect(ok(thing.at.x, thing.at.y), `${id} ${thing.k} at ${thing.at.x},${thing.at.y}`).toBe(true);
    }
  });
});

describe('world layout', () => {
  it('places screens inside the grid without overlaps', () => {
    expect(() => indexLayout(WORLD_LAYOUT)).not.toThrow();
    for (const [id, pos] of Object.entries(WORLD_LAYOUT.at)) {
      expect(SCREEN_IDS).toContain(id);
      if (pos === undefined) continue;
      expect(pos[0]).toBeGreaterThanOrEqual(0);
      expect(pos[0]).toBeLessThan(WORLD_LAYOUT.cols);
      expect(pos[1]).toBeGreaterThanOrEqual(0);
      expect(pos[1]).toBeLessThan(WORLD_LAYOUT.rows);
    }
  });

  it('has identical walkable seams between neighbouring screens', () => {
    const index = indexLayout(WORLD_LAYOUT);
    for (const id of SCREEN_IDS) {
      const here = walkable(id);
      const east = neighbourOf(index, id, 'e');
      if (east !== null) {
        const there = walkable(east);
        for (let y = 0; y < SCREEN_ROWS; y++) {
          expect(here(SCREEN_COLS - 1, y), `${id} → ${east}, row ${y}`).toBe(there(0, y));
        }
      }
      const south = neighbourOf(index, id, 's');
      if (south !== null) {
        const there = walkable(south);
        for (let x = 0; x < SCREEN_COLS; x++) {
          expect(here(x, SCREEN_ROWS - 1), `${id} → ${south}, col ${x}`).toBe(there(x, 0));
        }
      }
    }
  });
});

describe('new game', () => {
  it('starts on a walkable tile', () => {
    const ok = walkable(NEW_GAME.screen);
    expect(ok(Math.floor(NEW_GAME.x / TILE), Math.floor(NEW_GAME.y / TILE))).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm vitest run tests/content/integrity.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement the screen model**

`src/core/world/screen.ts`:

```ts
import type { EnemyId, RegionId } from '@content/ids';
import type { ScreenId } from '@content/world/screens';
import { DIR_VEC, type Dir4 } from '../math/dir';
import type { Vec } from '../math/vec';
import { SCREEN_H, SCREEN_W, TILE } from './dims';

export interface TilePos {
  readonly x: number;
  readonly y: number;
}

/** Things placed on a screen. The union grows with each milestone (npc, chest, door, secret, trigger…). */
export type Thing = { readonly k: 'enemy'; readonly id: EnemyId; readonly at: TilePos };

export interface ScreenDef {
  readonly id: ScreenId;
  readonly region: RegionId;
  /** Design note: why this screen exists ("every screen has a reason"). Not shown to players. */
  readonly purpose: string;
  /** 22 rows of 40 legend characters. */
  readonly map: readonly string[];
  readonly things: readonly Thing[];
}

export interface WorldLayout {
  readonly cols: number;
  readonly rows: number;
  readonly at: Readonly<Partial<Record<ScreenId, readonly [number, number]>>>;
}

export interface LayoutIndex {
  pos(id: ScreenId): readonly [number, number] | undefined;
  idAt(gx: number, gy: number): ScreenId | undefined;
}

export function indexLayout(layout: WorldLayout): LayoutIndex {
  const byPos = new Map<string, ScreenId>();
  for (const [id, pos] of Object.entries(layout.at) as [ScreenId, readonly [number, number] | undefined][]) {
    if (pos === undefined) continue;
    const key = `${pos[0]},${pos[1]}`;
    const taken = byPos.get(key);
    if (taken !== undefined) throw new Error(`layout: ${taken} and ${id} both at ${key}`);
    byPos.set(key, id);
  }
  return {
    pos: (id) => layout.at[id],
    idAt: (gx, gy) => byPos.get(`${gx},${gy}`),
  };
}

export function neighbourOf(index: LayoutIndex, id: ScreenId, dir: Dir4): ScreenId | null {
  const pos = index.pos(id);
  if (pos === undefined) return null;
  const d = DIR_VEC[dir];
  return index.idAt(pos[0] + d.x, pos[1] + d.y) ?? null;
}

/** World-pixel origin of a screen on the overworld grid. */
export function screenOrigin(index: LayoutIndex, id: ScreenId): Vec {
  const pos = index.pos(id);
  if (pos === undefined) throw new Error(`screen ${id} is not on the world layout`);
  return { x: pos[0] * SCREEN_W, y: pos[1] * SCREEN_H };
}

/** Where something standing on a tile has its feet: horizontally centred, 2 px above the tile's bottom. */
export function tileFeet(at: TilePos): Vec {
  return { x: at.x * TILE + TILE / 2, y: at.y * TILE + TILE - 2 };
}
```

- [ ] **Step 4: Add the three test screens, layout and registry**

`src/content/world/testlands/test_a.ts`:

```ts
import type { ScreenDef } from '@core/world/screen';

export const testA: ScreenDef = {
  id: 'test_a',
  region: 'askdalr',
  purpose: 'M0 test field: pond, trees, a path to the east exit, and room to practise the sword.',
  things: [],
  map: [
    '########################################',
    '#TTT...................................#',
    '#T.....................................#',
    '#.....~~~~.....T..................TT...#',
    '#...~~~~~~~~..............TT...........#',
    '#...~~~~~~~~...............T...........#',
    '#...~~~~~~~~...........................#',
    '#.....~~~~.............................#',
    '#.......................................',
    '#.......................................',
    '#.......................................',
    '#...........,,,,,,,,,,,,,,,,,,,,,,,,,,,,',
    '#...........,...........................',
    '#...........,...........................',
    '#...........,..........................#',
    '#...........,........#........TT.......#',
    '#...........,.......###........T.......#',
    '#.......TT..,........##................#',
    '#.......T...,..........................#',
    '#......................................#',
    '#......................................#',
    '########################################',
  ],
};
```

`src/content/world/testlands/test_b.ts`:

```ts
import type { ScreenDef } from '@core/world/screen';

export const testB: ScreenDef = {
  id: 'test_b',
  region: 'askdalr',
  purpose: 'M0 junction: west exit back to the field, south exit to the lake, a tarn and rocks to walk around.',
  things: [],
  map: [
    '########################################',
    '#......................................#',
    '#.........TT...........................#',
    '#...TT.................................#',
    '#...T.........T............~~~~~~~.....#',
    '#........................~~~~~~~~~~~...#',
    '#........................~~~~~~~~~~~...#',
    '#........................~~~~~~~~~~~...#',
    '...........................~~~~~~~.....#',
    '.......................................#',
    '.......................................#',
    ',,,,,,,,,,,,,,,,,,,,...................#',
    '...................,....###............#',
    '...................,....##.............#',
    '#..................,...................#',
    '#..................,.............TT....#',
    '#.......TT.........,..............T....#',
    '#........T.........,......T............#',
    '#..................,...................#',
    '#..................,...................#',
    '#..................,...................#',
    '#################..,...#################',
  ],
};
```

`src/content/world/testlands/test_c.ts`:

```ts
import type { ScreenDef } from '@core/world/screen';

export const testC: ScreenDef = {
  id: 'test_c',
  region: 'askdalr',
  purpose: 'M0 dead end: a lake to walk around, testing north-south transitions and water collision.',
  things: [],
  map: [
    '#################..,...#################',
    '#..................,...................#',
    '#..................,...................#',
    '#..TT..............,...................#',
    '#..T...............,...............TT..#',
    '#..................,................T..#',
    '#...........T......,........T..........#',
    '#..................,...................#',
    '#..................,...................#',
    '#......................................#',
    '#........##...................##.......#',
    '#.........#......~~~~~~~...............#',
    '#.............~~~~~~~~~~~~~............#',
    '#............~~~~~~~~~~~~~~~...........#',
    '#............~~~~~~~~~~~~~~~...........#',
    '#............~~~~~~~~~~~~~~~...........#',
    '#.............~~~~~~~~~~~~~............#',
    '#.....TT.........~~~~~~~...............#',
    '#................................TT....#',
    '#......................................#',
    '#......................................#',
    '########################################',
  ],
};
```

`src/content/world/layout.ts`:

```ts
import type { WorldLayout } from '@core/world/screen';

/** Screens on the 16×12 overworld grid. Interiors and dungeon rooms are not on it. */
export const WORLD_LAYOUT: WorldLayout = {
  cols: 16,
  rows: 12,
  at: { test_a: [0, 0], test_b: [1, 0], test_c: [1, 1] },
};
```

`src/content/world/registry.ts`:

```ts
import type { ScreenDef } from '@core/world/screen';
import type { ScreenId } from './screens';
import { testA } from './testlands/test_a';
import { testB } from './testlands/test_b';
import { testC } from './testlands/test_c';

export const SCREENS: Readonly<Record<ScreenId, ScreenDef>> = {
  test_a: testA,
  test_b: testB,
  test_c: testC,
};
```

- [ ] **Step 5: Run tests**

Run: `pnpm vitest run tests/content/integrity.test.ts`
Expected: PASS.

- [ ] **Step 6: Gate and commit**

Run: `pnpm check`

```bash
git add -A
git commit -m "Add world layout, three test screens and content integrity checks

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Tile collision with corner slide

**Files:**
- Create: `src/core/world/collision.ts`
- Test: `tests/unit/core/collision.test.ts`

**Interfaces:**
- Consumes: `Box`, `overlaps` (Task 3), `TILE` (Task 8), `TerrainGrid`/`TerrainDef`/`TerrainId` (Task 8).
- Produces:
  - Constants: `SOLID`, `CORNER_SLIDE = 6`.
  - Types: `CollisionGrid { cols; rows; flags: Uint8Array }`, `SolidAt = (tx, ty) => boolean`, `MoveResult { x; y; blockedX; blockedY }`.
  - Functions: `buildCollision(grid, defs)`, `gridSolidAt(grid, outside)`, `boxHitsSolid(box, solidAt, obstacles?)`, `moveBox(box, dx, dy, solidAt, obstacles?, slide?)`.

- [ ] **Step 1: Write the failing tests**

`tests/unit/core/collision.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { TERRAIN } from '@content/terrain';
import type { Box } from '@core/math/box';
import { buildCollision, gridSolidAt, moveBox, type SolidAt } from '@core/world/collision';

/** '#' is solid; anything outside the strings is solid too. */
function solidFrom(rows: string[]): SolidAt {
  return (tx, ty) => {
    const row = rows[ty];
    if (row === undefined || tx < 0 || tx >= row.length) return true;
    return row.charAt(tx) === '#';
  };
}

function repeat(box: Box, dx: number, dy: number, solidAt: SolidAt, times: number): Box {
  let b = box;
  for (let i = 0; i < times; i++) {
    const r = moveBox(b, dx, dy, solidAt);
    b = { ...b, x: r.x, y: r.y };
  }
  return b;
}

describe('moveBox', () => {
  it('moves freely in open space, including sub-pixel steps', () => {
    const r = moveBox({ x: 20, y: 20, w: 12, h: 8 }, 1.5, -0.5, solidFrom(['.....', '.....', '.....']));
    expect([r.x, r.y, r.blockedX, r.blockedY]).toEqual([21.5, 19.5, false, false]);
  });

  it('stops flush against a wall', () => {
    const r = moveBox({ x: 10, y: 4, w: 12, h: 8 }, 20, 0, solidFrom(['..#', '..#']));
    expect(r.x).toBe(20);
    expect(r.blockedX).toBe(true);
  });

  it('never tunnels through a wall, however fast', () => {
    const r = moveBox({ x: 0, y: 2, w: 12, h: 8 }, 40, 0, solidFrom(['.#.']));
    expect(r.x).toBe(4);
  });

  it('slides around a corner it clips by up to 6 px (Zelda-style)', () => {
    const solid = solidFrom(['.#', '..']);
    const end = repeat({ x: 2, y: 12, w: 12, h: 8 }, 1.5, 0, solid, 12);
    expect(end.y).toBeGreaterThanOrEqual(16);
    expect(end.x).toBeGreaterThan(5);
  });

  it('does not slide when the overlap is larger than 6 px', () => {
    const solid = solidFrom(['.#', '..']);
    const end = repeat({ x: 2, y: 4, w: 12, h: 8 }, 1.5, 0, solid, 12);
    expect(end.y).toBe(4);
    expect(end.x).toBe(4);
  });

  it('does not slide while moving diagonally', () => {
    const r = moveBox({ x: 4, y: 12, w: 12, h: 8 }, 1, 0.5, solidFrom(['.#', '..', '..']));
    expect(r.blockedX).toBe(true);
    expect(r.x).toBe(4);
    expect(r.y).toBe(12.5);
  });

  it('treats obstacle boxes like walls', () => {
    const r = moveBox({ x: 0, y: 0, w: 10, h: 10 }, 10, 0, solidFrom(['...']), [{ x: 15, y: 0, w: 5, h: 10 }]);
    expect(r.x).toBe(5);
  });
});

describe('collision grid', () => {
  it('marks solid terrain and asks `outside` beyond the edges', () => {
    const grid = buildCollision({ cols: 2, rows: 1, cells: ['grass', 'rock'] }, TERRAIN);
    const solidAt = gridSolidAt(grid, (tx) => tx >= 2);
    expect([solidAt(0, 0), solidAt(1, 0), solidAt(-1, 0), solidAt(2, 0)]).toEqual([false, true, false, true]);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm vitest run tests/unit/core/collision.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

`src/core/world/collision.ts`:

```ts
import type { TerrainId } from '@content/terrain';
import { overlaps, type Box } from '../math/box';
import { TILE } from './dims';
import type { TerrainDef } from './terrain';
import type { TerrainGrid } from './textmap';

export const SOLID = 1;
/** How far (px) a blocked mover is nudged sideways around a corner it only clips. */
export const CORNER_SLIDE = 6;
const EPS = 1e-6;

export interface CollisionGrid {
  readonly cols: number;
  readonly rows: number;
  readonly flags: Uint8Array;
}

export type SolidAt = (tx: number, ty: number) => boolean;

export function buildCollision(grid: TerrainGrid, defs: Readonly<Record<TerrainId, TerrainDef>>): CollisionGrid {
  const flags = new Uint8Array(grid.cols * grid.rows);
  grid.cells.forEach((terrain, i) => {
    flags[i] = defs[terrain].solid ? SOLID : 0;
  });
  return { cols: grid.cols, rows: grid.rows, flags };
}

/** Solidity lookup for a grid; tiles outside it are answered by `outside`. */
export function gridSolidAt(g: CollisionGrid, outside: SolidAt): SolidAt {
  return (tx, ty) => {
    if (tx < 0 || ty < 0 || tx >= g.cols || ty >= g.rows) return outside(tx, ty);
    return ((g.flags[ty * g.cols + tx] ?? 0) & SOLID) !== 0;
  };
}

export function boxHitsSolid(b: Box, solidAt: SolidAt, obstacles: readonly Box[] = []): boolean {
  const x0 = Math.floor(b.x / TILE);
  const x1 = Math.floor((b.x + b.w - EPS) / TILE);
  const y0 = Math.floor(b.y / TILE);
  const y1 = Math.floor((b.y + b.h - EPS) / TILE);
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      if (solidAt(tx, ty)) return true;
    }
  }
  return obstacles.some((o) => overlaps(b, o));
}

export interface MoveResult {
  readonly x: number;
  readonly y: number;
  readonly blockedX: boolean;
  readonly blockedY: boolean;
}

/**
 * Moves a box by (dx, dy) against solid tiles and obstacle boxes: X first, then Y, at most one pixel per
 * step so nothing tunnels. When blocked while moving along a single axis, it corner-slides (see `nudge`).
 */
export function moveBox(
  box: Box,
  dx: number,
  dy: number,
  solidAt: SolidAt,
  obstacles: readonly Box[] = [],
  slide: number = CORNER_SLIDE,
): MoveResult {
  const free = (x: number, y: number): boolean => !boxHitsSolid({ x, y, w: box.w, h: box.h }, solidAt, obstacles);
  let x = box.x;
  let y = box.y;
  let blockedX = false;
  let blockedY = false;

  let rest = dx;
  while (rest !== 0) {
    const step = Math.abs(rest) >= 1 ? Math.sign(rest) : rest;
    if (free(x + step, y)) {
      x += step;
      rest -= step;
      continue;
    }
    blockedX = true;
    x += snapToWall(x, step, (to) => free(to, y));
    if (dy === 0) y += nudge(x, y, Math.sign(step), 0, free, slide);
    break;
  }

  rest = dy;
  while (rest !== 0) {
    const step = Math.abs(rest) >= 1 ? Math.sign(rest) : rest;
    if (free(x, y + step)) {
      y += step;
      rest -= step;
      continue;
    }
    blockedY = true;
    y += snapToWall(y, step, (to) => free(x, to));
    if (dx === 0) x += nudge(x, y, 0, Math.sign(step), free, slide);
    break;
  }

  return { x, y, blockedX, blockedY };
}

/** From a fractional position, a whole-pixel step can be blocked while the rest of the pixel is free. */
function snapToWall(pos: number, step: number, freeAt: (to: number) => boolean): number {
  const snap = step > 0 ? Math.ceil(pos) - pos : Math.floor(pos) - pos;
  return snap !== 0 && freeAt(pos + snap) ? snap : 0;
}

/**
 * Blocked while moving along one axis (sx or sy is ±1): if shifting up to `slide` px sideways would clear
 * the obstacle, return a 1 px step toward that side; otherwise 0.
 */
function nudge(
  x: number,
  y: number,
  sx: number,
  sy: number,
  free: (x: number, y: number) => boolean,
  slide: number,
): number {
  for (let k = 1; k <= slide; k++) {
    for (const side of [-1, 1]) {
      const ox = sy !== 0 ? side * k : 0;
      const oy = sx !== 0 ? side * k : 0;
      const clears = free(x + ox, y + oy) && free(x + ox + sx, y + oy + sy);
      const firstStepFree = free(x + Math.sign(ox), y + Math.sign(oy));
      if (clears && firstStepFree) return side;
    }
  }
  return 0;
}
```

- [ ] **Step 4: Run tests**

Run: `pnpm vitest run tests/unit/core/collision.test.ts`
Expected: PASS.

- [ ] **Step 5: Gate and commit**

Run: `pnpm check`

```bash
git add -A
git commit -m "Add pixel-stepped tile collision with Zelda corner sliding

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 11: State machines, hero and tuning

**Files:**
- Create: `src/core/actors/entity.ts`, `src/core/actors/fsm.ts`, `src/core/actors/tuning.ts`, `src/core/actors/hero.ts`, `src/core/sim/events.ts`, `src/content/tuning.ts`
- Test: `tests/unit/core/fsm.test.ts`, `tests/unit/core/hero.test.ts`

**Interfaces:**
- Consumes: `InputFrame`, `isHeld`, `wasPressed`, `moveVector`, `bitsOf` (Task 6); math (Task 3); `SfxId`, `ScreenId` (Task 4); `ClockEvent` (Task 4); `HeroState` of `GameState` (Task 4).
- Produces:
  - Entities: `Faction`, `EntityKind`, `Entity`, `createEntity(init)`, `setAnim(e, anim)`, `mem(e, key)`.
  - State machines: `StateDef<S, C>`, `Machine<S, C>`, `runFsm(m, e, c)`, `changeState(m, e, next, c)`.
  - Tuning: `HeroTuning`, `SwordTuning`, `Tuning`, `TUNING`.
  - Events: `SimEvent` (`sfx`, `hit`, `screenTransition`, `screenEntered`, `clock`).
  - Hero:
    - Types: `HeroMode`, `HeroCtx { input; tuning; hasShield; emit }`.
    - Values: `HERO_MACHINE`, `heroPreTick(e)`, `createHero(id, hero, tuning)`, `heroSwordBox(e, tuning): Box | null`, `heroSwordDamage(e, tuning)`.
    - Hero memory keys: `swing`, `combo`, `swordOn`, `spinOn`, `charged`, `rollCd`, `rollDx`, `rollDy`, `shielding`.

- [ ] **Step 1: Write the failing tests**

`tests/unit/core/fsm.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createEntity } from '@core/actors/entity';
import { changeState, runFsm, type Machine } from '@core/actors/fsm';

type S = 'a' | 'b';
const log: string[] = [];
const machine: Machine<S, null> = {
  a: {
    enter: () => log.push('enter a'),
    tick: (e) => (e.fsm.t >= 1 ? 'b' : undefined),
    exit: () => log.push('exit a'),
  },
  b: { enter: () => log.push('enter b'), tick: () => undefined },
};

const entity = (state: string) =>
  createEntity({
    id: 1,
    kind: 'enemy',
    def: 'probe',
    art: 'probe',
    pos: { x: 0, y: 0 },
    facing: 's',
    body: { x: 0, y: 0, w: 1, h: 1 },
    hurt: { x: 0, y: 0, w: 1, h: 1 },
    faction: 'enemy',
    hp: 1,
    maxHp: 1,
    state,
  });

describe('state machines', () => {
  it('counts ticks in a state and switches with exit/enter', () => {
    log.length = 0;
    const e = entity('a');
    runFsm(machine, e, null);
    expect(e.fsm).toEqual({ s: 'a', t: 1 });
    runFsm(machine, e, null);
    expect(e.fsm).toEqual({ s: 'b', t: 0 });
    expect(log).toEqual(['exit a', 'enter b']);
  });

  it('can be switched from outside', () => {
    log.length = 0;
    const e = entity('b');
    changeState(machine, e, 'a', null);
    expect(e.fsm.s).toBe('a');
    expect(log).toEqual(['enter a']);
  });

  it('throws on an unknown state', () => {
    expect(() => {
      runFsm(machine, entity('zzz'), null);
    }).toThrow("probe: unknown state 'zzz'");
  });
});
```

`tests/unit/core/hero.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { TUNING } from '@content/tuning';
import { mem, type Entity } from '@core/actors/entity';
import { runFsm } from '@core/actors/fsm';
import { HERO_MACHINE, createHero, heroPreTick, heroSwordBox } from '@core/actors/hero';
import { bitsOf, type Action, type InputFrame } from '@core/input/actions';
import { length } from '@core/math/vec';
import type { SimEvent } from '@core/sim/events';

function frame(held: Action[] = [], pressed: Action[] = []): InputFrame {
  const all = [...held, ...pressed];
  const has = (a: Action): boolean => all.includes(a);
  return {
    held: bitsOf(all),
    pressed: bitsOf(pressed),
    released: 0,
    mx: (has('right') ? 1 : 0) - (has('left') ? 1 : 0),
    my: (has('down') ? 1 : 0) - (has('up') ? 1 : 0),
  };
}

function setup(hasShield = true): { e: Entity; events: SimEvent[]; run: (frames: InputFrame[]) => void; idle: (n: number) => void } {
  const e = createHero(1, { x: 100, y: 100, facing: 's', hp: 12, maxHp: 12 }, TUNING);
  const events: SimEvent[] = [];
  const run = (frames: InputFrame[]): void => {
    for (const input of frames) {
      heroPreTick(e);
      runFsm(HERO_MACHINE, e, { input, tuning: TUNING, hasShield, emit: (ev) => events.push(ev) });
    }
  };
  const idle = (n: number): void => {
    run(Array.from({ length: n }, () => frame()));
  };
  return { e, events, run, idle };
}

const sfx = (events: SimEvent[], id: string): number => events.filter((ev) => ev.t === 'sfx' && ev.id === id).length;

describe('hero movement', () => {
  it('walks and faces the direction of travel', () => {
    const { e, run } = setup();
    run([frame(['right'])]);
    expect(e.vel).toEqual({ x: TUNING.hero.walkSpeed, y: 0 });
    expect(e.facing).toBe('e');
    expect(e.anim).toBe('walk');
  });

  it('is not faster diagonally', () => {
    const { e, run } = setup();
    run([frame(['right', 'down'])]);
    expect(length(e.vel)).toBeCloseTo(TUNING.hero.walkSpeed);
  });
});

describe('sword', () => {
  it('swings with an active window, then returns to moving', () => {
    const { e, events, run, idle } = setup();
    run([frame([], ['sword'])]);
    expect(e.fsm.s).toBe('attack');
    expect(sfx(events, 'sfx_swing')).toBe(1);
    idle(3);
    expect(mem(e, 'swordOn')).toBe(1);
    expect(heroSwordBox(e, TUNING)).not.toBeNull();
    idle(11);
    expect(e.fsm.s).toBe('move');
    expect(heroSwordBox(e, TUNING)).toBeNull();
  });

  it('chains a three-hit combo when pressed inside the window', () => {
    const { e, run, idle } = setup();
    run([frame([], ['sword'])]);
    idle(6);
    run([frame([], ['sword'])]);
    expect(mem(e, 'combo')).toBe(2);
    expect(e.anim).toBe('attack2');
    idle(6);
    run([frame([], ['sword'])]);
    expect(mem(e, 'combo')).toBe(3);
    expect(e.anim).toBe('attack3');
    expect(mem(e, 'swing')).toBe(3);
  });

  it('ignores a press before the combo window opens', () => {
    const { e, run, idle } = setup();
    run([frame([], ['sword'])]);
    idle(2);
    run([frame([], ['sword'])]);
    expect(mem(e, 'combo')).toBe(1);
  });

  it('charges while held and spins on release', () => {
    const { e, events, run } = setup();
    run([frame(['sword'], ['sword'])]);
    run(Array.from({ length: 14 }, () => frame(['sword'])));
    expect(e.fsm.s).toBe('charge');
    run(Array.from({ length: TUNING.hero.chargeTicks }, () => frame(['sword'])));
    expect(sfx(events, 'sfx_charge')).toBe(1);
    run([frame()]);
    expect(e.fsm.s).toBe('spin');
    expect(mem(e, 'spinOn')).toBe(1);
    run(Array.from({ length: TUNING.hero.spinTicks }, () => frame()));
    expect(e.fsm.s).toBe('move');
  });

  it('does not spin when released before fully charged', () => {
    const { e, run } = setup();
    run([frame(['sword'], ['sword'])]);
    run(Array.from({ length: 20 }, () => frame(['sword'])));
    run([frame()]);
    expect(e.fsm.s).toBe('move');
  });
});

describe('roll', () => {
  it('rolls in the facing direction with i-frames, then cools down', () => {
    const { e, run, idle } = setup();
    run([frame([], ['roll'])]);
    expect(e.fsm.s).toBe('roll');
    expect(e.iframes).toBe(TUNING.hero.rollIframes);
    idle(1);
    expect(e.vel).toEqual({ x: 0, y: TUNING.hero.rollSpeed });
    idle(TUNING.hero.rollTicks - 1);
    expect(e.fsm.s).toBe('move');
    run([frame([], ['roll'])]);
    expect(e.fsm.s).toBe('move');
    idle(TUNING.hero.rollCooldown);
    run([frame([], ['roll'])]);
    expect(e.fsm.s).toBe('roll');
  });
});

describe('shield', () => {
  it('slows the hero and locks facing while held', () => {
    const { e, run } = setup();
    run([frame(['shield'])]);
    expect(e.fsm.s).toBe('shield');
    run([frame(['shield', 'left'])]);
    expect(mem(e, 'shielding')).toBe(1);
    expect(e.facing).toBe('s');
    expect(e.vel.x).toBe(-TUNING.hero.shieldSpeed);
    run([frame()]);
    expect(e.fsm.s).toBe('move');
    expect(mem(e, 'shielding')).toBe(0);
  });

  it('cannot shield without a shield', () => {
    const { e, run } = setup(false);
    run([frame(['shield'])]);
    expect(e.fsm.s).toBe('move');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm vitest run tests/unit/core/fsm.test.ts tests/unit/core/hero.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement entities, state machines, tuning and events**

`src/core/actors/entity.ts`:

```ts
import type { Box } from '../math/box';
import type { Dir4 } from '../math/dir';
import type { Vec } from '../math/vec';

export type Faction = 'hero' | 'enemy' | 'neutral' | 'env';
export type EntityKind = 'hero' | 'enemy';

export interface FsmState {
  s: string;
  t: number;
}

/**
 * A live actor. Plain data so it can be cloned, hashed and inspected; behaviour lives in state machines.
 * `pos` is the feet point; `body` (collision) and `hurt` (can be hit) are relative to it.
 */
export interface Entity {
  readonly id: number;
  readonly kind: EntityKind;
  readonly def: string;
  readonly art: string;
  pos: Vec;
  prev: Vec;
  vel: Vec;
  knock: Vec;
  facing: Dir4;
  readonly body: Box;
  readonly hurt: Box;
  readonly faction: Faction;
  hp: number;
  maxHp: number;
  iframes: number;
  flash: number;
  fsm: FsmState;
  anim: string;
  animT: number;
  mem: Record<string, number>;
}

export interface EntityInit {
  readonly id: number;
  readonly kind: EntityKind;
  readonly def: string;
  readonly art: string;
  readonly pos: Vec;
  readonly facing: Dir4;
  readonly body: Box;
  readonly hurt: Box;
  readonly faction: Faction;
  readonly hp: number;
  readonly maxHp: number;
  readonly state: string;
}

export function createEntity(i: EntityInit): Entity {
  return {
    id: i.id,
    kind: i.kind,
    def: i.def,
    art: i.art,
    pos: { ...i.pos },
    prev: { ...i.pos },
    vel: { x: 0, y: 0 },
    knock: { x: 0, y: 0 },
    facing: i.facing,
    body: i.body,
    hurt: i.hurt,
    faction: i.faction,
    hp: i.hp,
    maxHp: i.maxHp,
    iframes: 0,
    flash: 0,
    fsm: { s: i.state, t: 0 },
    anim: 'idle',
    animT: 0,
    mem: {},
  };
}

/** Switches animation, restarting its clock only when it actually changes. */
export function setAnim(e: Entity, anim: string): void {
  if (e.anim !== anim) {
    e.anim = anim;
    e.animT = 0;
  }
}

export const mem = (e: Entity, key: string): number => e.mem[key] ?? 0;
```

`src/core/actors/fsm.ts`:

```ts
import type { Entity } from './entity';

export interface StateDef<S extends string, C> {
  enter?(e: Entity, c: C): void;
  /** Return the next state's name to switch, or undefined to stay. */
  tick(e: Entity, c: C): S | undefined;
  exit?(e: Entity, c: C): void;
}

export type Machine<S extends string, C> = { readonly [K in S]: StateDef<S, C> };

function current<S extends string, C>(m: Machine<S, C>, e: Entity): StateDef<S, C> {
  const def = (m as Readonly<Record<string, StateDef<S, C> | undefined>>)[e.fsm.s];
  if (def === undefined) throw new Error(`${e.def}: unknown state '${e.fsm.s}'`);
  return def;
}

/** Runs one tick. `fsm.t` counts ticks since the state was entered and is 0 on the first tick. */
export function runFsm<S extends string, C>(m: Machine<S, C>, e: Entity, c: C): void {
  const next = current(m, e).tick(e, c);
  e.fsm.t += 1;
  if (next !== undefined && next !== e.fsm.s) changeState(m, e, next, c);
}

export function changeState<S extends string, C>(m: Machine<S, C>, e: Entity, next: S, c: C): void {
  const from = (m as Readonly<Record<string, StateDef<S, C> | undefined>>)[e.fsm.s];
  from?.exit?.(e, c);
  e.fsm = { s: next, t: 0 };
  m[next].enter?.(e, c);
}
```

`src/core/actors/tuning.ts`:

```ts
import type { Box } from '../math/box';
import type { Dir4 } from '../math/dir';

/** All numbers are per 60 Hz tick or pixels; damage and hp are quarter hearts. */
export interface HeroTuning {
  readonly walkSpeed: number;
  readonly shieldSpeed: number;
  readonly chargeSpeed: number;
  readonly rollSpeed: number;
  readonly rollTicks: number;
  readonly rollIframes: number;
  readonly rollCooldown: number;
  readonly attackTicks: number;
  readonly finisherTicks: number;
  readonly comboWindow: number;
  readonly swordActiveFrom: number;
  readonly swordActiveTo: number;
  readonly chargeTicks: number;
  readonly spinTicks: number;
  readonly hurtTicks: number;
  readonly hurtIframes: number;
  readonly body: Box;
  readonly hurt: Box;
}

export interface SwordTuning {
  readonly comboDamage: readonly [number, number, number];
  readonly spinDamage: number;
  readonly knock: number;
  readonly boxes: Readonly<Record<Dir4, Box>>;
  readonly spinBox: Box;
}

export interface Tuning {
  readonly hero: HeroTuning;
  readonly sword: SwordTuning;
  readonly enemyIframes: number;
  readonly knockDecay: number;
}
```

`src/content/tuning.ts`:

```ts
import type { Tuning } from '@core/actors/tuning';

export const TUNING: Tuning = {
  hero: {
    walkSpeed: 1.5,
    shieldSpeed: 0.75,
    chargeSpeed: 0.75,
    rollSpeed: 3,
    rollTicks: 18,
    rollIframes: 12,
    rollCooldown: 20,
    attackTicks: 14,
    finisherTicks: 20,
    comboWindow: 8,
    swordActiveFrom: 2,
    swordActiveTo: 8,
    chargeTicks: 40,
    spinTicks: 24,
    hurtTicks: 12,
    hurtIframes: 60,
    body: { x: -6, y: -8, w: 12, h: 8 },
    hurt: { x: -7, y: -26, w: 14, h: 26 },
  },
  sword: {
    comboDamage: [2, 2, 4],
    spinDamage: 4,
    knock: 4,
    boxes: {
      e: { x: 2, y: -24, w: 20, h: 20 },
      w: { x: -22, y: -24, w: 20, h: 20 },
      n: { x: -10, y: -40, w: 20, h: 22 },
      s: { x: -10, y: -8, w: 20, h: 20 },
    },
    spinBox: { x: -26, y: -36, w: 52, h: 44 },
  },
  enemyIframes: 6,
  knockDecay: 0.8,
};
```

`src/core/sim/events.ts`:

```ts
import type { SfxId } from '@content/ids';
import type { ScreenId } from '@content/world/screens';
import type { ClockEvent } from '../clock/types';
import type { Dir4 } from '../math/dir';

/** One-shot happenings of a tick. State is the truth; events only trigger effects (sound, particles, autosave). */
export type SimEvent =
  | { readonly t: 'sfx'; readonly id: SfxId }
  | { readonly t: 'hit'; readonly target: number; readonly blocked: boolean; readonly dealt: number }
  | { readonly t: 'screenTransition'; readonly from: ScreenId; readonly to: ScreenId; readonly dir: Dir4 }
  | { readonly t: 'screenEntered'; readonly screen: ScreenId }
  | { readonly t: 'clock'; readonly e: ClockEvent };
```

- [ ] **Step 4: Implement the hero**

`src/core/actors/hero.ts`:

```ts
import { isHeld, moveVector, wasPressed, type InputFrame } from '../input/actions';
import { at, type Box } from '../math/box';
import { DIR_VEC, dirFromVec } from '../math/dir';
import { normalize, scale } from '../math/vec';
import type { SimEvent } from '../sim/events';
import type { HeroState } from '../state/gameState';
import { createEntity, mem, setAnim, type Entity } from './entity';
import type { Machine, StateDef } from './fsm';
import type { Tuning } from './tuning';

export type HeroMode = 'move' | 'attack' | 'charge' | 'spin' | 'roll' | 'shield' | 'hurt';

export interface HeroCtx {
  readonly input: InputFrame;
  readonly tuning: Tuning;
  readonly hasShield: boolean;
  emit(event: SimEvent): void;
}

type HeroDef = StateDef<HeroMode, HeroCtx>;

const still = (e: Entity): void => {
  e.vel = { x: 0, y: 0 };
};

const moving = (e: Entity): boolean => e.vel.x !== 0 || e.vel.y !== 0;

function steer(e: Entity, c: HeroCtx, speed: number, turn: boolean): void {
  const m = moveVector(c.input);
  e.vel = scale(m, speed);
  if (turn) e.facing = dirFromVec(m, e.facing);
}

function swing(e: Entity, c: HeroCtx, anim: string, sound: 'sfx_swing' | 'sfx_spin'): void {
  e.mem['swing'] = mem(e, 'swing') + 1;
  setAnim(e, anim);
  c.emit({ t: 'sfx', id: sound });
}

const move: HeroDef = {
  tick(e, c) {
    if (wasPressed(c.input, 'roll') && mem(e, 'rollCd') === 0) return 'roll';
    if (wasPressed(c.input, 'sword')) return 'attack';
    if (isHeld(c.input, 'shield') && c.hasShield) return 'shield';
    steer(e, c, c.tuning.hero.walkSpeed, true);
    setAnim(e, moving(e) ? 'walk' : 'idle');
    return undefined;
  },
};

const attack: HeroDef = {
  enter(e, c) {
    e.mem['combo'] = 1;
    still(e);
    swing(e, c, 'attack1', 'sfx_swing');
  },
  tick(e, c) {
    const h = c.tuning.hero;
    const combo = mem(e, 'combo');
    const t = e.fsm.t;
    const duration = combo === 3 ? h.finisherTicks : h.attackTicks;
    still(e);
    e.mem['swordOn'] = t >= h.swordActiveFrom && t <= h.swordActiveTo ? 1 : 0;
    if (combo < 3 && t >= duration - h.comboWindow && wasPressed(c.input, 'sword')) {
      e.mem['combo'] = combo + 1;
      e.mem['swordOn'] = 0;
      e.fsm.t = -1;
      swing(e, c, `attack${combo + 1}`, 'sfx_swing');
      return undefined;
    }
    if (t >= duration - 1) return isHeld(c.input, 'sword') ? 'charge' : 'move';
    return undefined;
  },
  exit(e) {
    e.mem['swordOn'] = 0;
    e.mem['combo'] = 0;
  },
};

const charge: HeroDef = {
  enter(e) {
    e.mem['charged'] = 0;
    setAnim(e, 'charge');
  },
  tick(e, c) {
    steer(e, c, c.tuning.hero.chargeSpeed, false);
    if (e.fsm.t + 1 >= c.tuning.hero.chargeTicks && mem(e, 'charged') === 0) {
      e.mem['charged'] = 1;
      c.emit({ t: 'sfx', id: 'sfx_charge' });
    }
    if (!isHeld(c.input, 'sword')) return mem(e, 'charged') === 1 ? 'spin' : 'move';
    return undefined;
  },
  exit(e) {
    e.mem['charged'] = 0;
  },
};

const spin: HeroDef = {
  enter(e, c) {
    still(e);
    swing(e, c, 'spin', 'sfx_spin');
    e.mem['spinOn'] = 1;
  },
  tick(e, c) {
    still(e);
    return e.fsm.t >= c.tuning.hero.spinTicks - 1 ? 'move' : undefined;
  },
  exit(e) {
    e.mem['spinOn'] = 0;
  },
};

const roll: HeroDef = {
  enter(e, c) {
    const m = moveVector(c.input);
    const d = m.x === 0 && m.y === 0 ? DIR_VEC[e.facing] : normalize(m);
    e.mem['rollDx'] = d.x;
    e.mem['rollDy'] = d.y;
    e.facing = dirFromVec(d, e.facing);
    e.iframes = Math.max(e.iframes, c.tuning.hero.rollIframes);
    setAnim(e, 'roll');
    c.emit({ t: 'sfx', id: 'sfx_roll' });
  },
  tick(e, c) {
    const h = c.tuning.hero;
    e.vel = scale({ x: mem(e, 'rollDx'), y: mem(e, 'rollDy') }, h.rollSpeed);
    return e.fsm.t >= h.rollTicks - 1 ? 'move' : undefined;
  },
  exit(e, c) {
    e.mem['rollCd'] = c.tuning.hero.rollCooldown;
    still(e);
  },
};

const shield: HeroDef = {
  enter(e) {
    e.mem['shielding'] = 1;
    setAnim(e, 'shield');
  },
  tick(e, c) {
    if (!isHeld(c.input, 'shield')) return 'move';
    if (wasPressed(c.input, 'sword')) return 'attack';
    if (wasPressed(c.input, 'roll') && mem(e, 'rollCd') === 0) return 'roll';
    steer(e, c, c.tuning.hero.shieldSpeed, false);
    setAnim(e, moving(e) ? 'shieldwalk' : 'shield');
    return undefined;
  },
  exit(e) {
    e.mem['shielding'] = 0;
  },
};

const hurt: HeroDef = {
  enter(e) {
    still(e);
    setAnim(e, 'hurt');
  },
  tick(e, c) {
    still(e);
    return e.fsm.t >= c.tuning.hero.hurtTicks - 1 ? 'move' : undefined;
  },
};

export const HERO_MACHINE: Machine<HeroMode, HeroCtx> = { move, attack, charge, spin, roll, shield, hurt };

/** Per-tick bookkeeping that is independent of the current state. */
export function heroPreTick(e: Entity): void {
  const cd = mem(e, 'rollCd');
  if (cd > 0) e.mem['rollCd'] = cd - 1;
}

export function createHero(
  id: number,
  hero: Pick<HeroState, 'x' | 'y' | 'facing' | 'hp' | 'maxHp'>,
  t: Tuning,
): Entity {
  return createEntity({
    id,
    kind: 'hero',
    def: 'hero',
    art: 'hero',
    pos: { x: hero.x, y: hero.y },
    facing: hero.facing,
    body: t.hero.body,
    hurt: t.hero.hurt,
    faction: 'hero',
    hp: hero.hp,
    maxHp: hero.maxHp,
    state: 'move',
  });
}

/** The hero's live sword hitbox in screen pixels, or null when the sword cannot hit. */
export function heroSwordBox(e: Entity, t: Tuning): Box | null {
  if (mem(e, 'spinOn') === 1) return at(t.sword.spinBox, e.pos);
  if (mem(e, 'swordOn') === 1) return at(t.sword.boxes[e.facing], e.pos);
  return null;
}

export function heroSwordDamage(e: Entity, t: Tuning): number {
  if (mem(e, 'spinOn') === 1) return t.sword.spinDamage;
  const combo = Math.min(3, Math.max(1, mem(e, 'combo')));
  return t.sword.comboDamage[combo - 1] ?? t.sword.comboDamage[0];
}
```

- [ ] **Step 5: Run tests**

Run: `pnpm vitest run tests/unit/core/fsm.test.ts tests/unit/core/hero.test.ts`
Expected: PASS.

- [ ] **Step 6: Gate and commit**

Run: `pnpm check`

```bash
git add -A
git commit -m "Add data-driven state machines and the hero's move set

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Combat and the training dummy

**Files:**
- Create: `src/core/combat/hit.ts`, `src/core/actors/enemies/defs.ts`, `src/core/actors/enemies/dummy.ts`, `src/core/actors/enemies/index.ts`, `src/content/enemies.ts`
- Modify: `src/content/world/testlands/test_a.ts` (add the dummy)
- Test: `tests/unit/core/combat.test.ts`

**Interfaces:**
- Consumes: `Entity`, `setAnim`, `createEntity` (Task 11); `Machine` (Task 11); `Tuning` (Task 11); `SimEvent` (Task 11); `DIR_VEC`, `dot`, `scale` (Task 3).
- Produces:
  - Combat: `Element`, `HEAVY`, `PIERCE_SHIELD`, `HitData`, `HitResult { outcome: 'ignored'|'blocked'|'damaged'|'killed'; dealt }`, `HitOptions { shielding; iframes; knockResist }`, `resolveHit(target, hit, options)`.
  - Enemies: `EnemyDef`, `EnemyCtx`, `DUMMY_MACHINE`, `BEHAVIOURS`, `BehaviourId`, `createEnemy(id, def, pos)`, `ENEMY_DEFS`.

- [ ] **Step 1: Write the failing tests**

`tests/unit/core/combat.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { ENEMY_DEFS } from '@content/enemies';
import { TUNING } from '@content/tuning';
import { runFsm } from '@core/actors/fsm';
import { BEHAVIOURS, createEnemy } from '@core/actors/enemies';
import { HEAVY, resolveHit, type HitData } from '@core/combat/hit';

const dummy = () => createEnemy(1, ENEMY_DEFS.dummy, { x: 100, y: 100 });
const opts = { shielding: false, iframes: 6, knockResist: 0 };
const hit = (over: Partial<HitData> = {}): HitData => ({
  amount: 2,
  element: 'none',
  knock: 4,
  dir: { x: 1, y: 0 },
  faction: 'hero',
  tags: 0,
  ...over,
});

describe('resolveHit', () => {
  it('damages, flashes, knocks back and grants i-frames', () => {
    const e = dummy();
    const r = resolveHit(e, hit(), opts);
    expect(r).toEqual({ outcome: 'damaged', dealt: 2 });
    expect(e.hp).toBe(ENEMY_DEFS.dummy.hp - 2);
    expect(e.iframes).toBe(6);
    expect(e.flash).toBeGreaterThan(0);
    expect(e.knock).toEqual({ x: 4, y: 0 });
  });

  it('ignores friendly fire and targets with i-frames', () => {
    const e = dummy();
    expect(resolveHit(e, hit({ faction: 'enemy' }), opts).outcome).toBe('ignored');
    e.iframes = 3;
    expect(resolveHit(e, hit(), opts).outcome).toBe('ignored');
  });

  it('blocks frontal hits on a raised shield, but not hits from behind or heavy hits', () => {
    const e = dummy();
    e.facing = 'w';
    const shielded = { ...opts, shielding: true };
    expect(resolveHit(e, hit({ dir: { x: 1, y: 0 } }), shielded).outcome).toBe('blocked');
    expect(e.hp).toBe(ENEMY_DEFS.dummy.hp);
    expect(resolveHit(e, hit({ dir: { x: -1, y: 0 } }), shielded).outcome).toBe('damaged');
    e.iframes = 0;
    expect(resolveHit(e, hit({ dir: { x: 1, y: 0 }, tags: HEAVY }), shielded).outcome).toBe('damaged');
  });

  it('reports a kill and never takes hp below zero', () => {
    const e = dummy();
    const r = resolveHit(e, hit({ amount: 999 }), opts);
    expect(r.outcome).toBe('killed');
    expect(r.dealt).toBe(ENEMY_DEFS.dummy.hp);
    expect(e.hp).toBe(0);
  });

  it('scales knockback by resistance', () => {
    const e = dummy();
    resolveHit(e, hit(), { ...opts, knockResist: 1 });
    expect(e.knock).toEqual({ x: 0, y: 0 });
  });
});

describe('training dummy', () => {
  it('wobbles after a hit, then settles', () => {
    const e = dummy();
    const ctx = { tuning: TUNING, emit: () => undefined };
    resolveHit(e, hit(), opts);
    runFsm(BEHAVIOURS.dummy, e, ctx);
    expect(e.fsm.s).toBe('hurt');
    expect(e.anim).toBe('hurt');
    for (let i = 0; i < 12; i++) runFsm(BEHAVIOURS.dummy, e, ctx);
    expect(e.fsm.s).toBe('idle');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm vitest run tests/unit/core/combat.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement**

`src/core/combat/hit.ts`:

```ts
import type { Entity, Faction } from '../actors/entity';
import { DIR_VEC } from '../math/dir';
import { dot, scale, type Vec } from '../math/vec';

export type Element = 'none' | 'fire' | 'ice' | 'wind' | 'force' | 'holy';

/** Hit tags (bit flags). */
export const HEAVY = 1;
export const PIERCE_SHIELD = 2;

/** One damage path for swords, arrows, galdr, fire spread and traps. */
export interface HitData {
  readonly amount: number;
  readonly element: Element;
  readonly knock: number;
  /** Unit vector in the direction the hit travels (attacker → target). */
  readonly dir: Vec;
  readonly faction: Faction;
  readonly tags: number;
}

export interface HitOptions {
  readonly shielding: boolean;
  readonly iframes: number;
  readonly knockResist: number;
}

export interface HitResult {
  readonly outcome: 'ignored' | 'blocked' | 'damaged' | 'killed';
  readonly dealt: number;
}

const FLASH_TICKS = 12;

export function resolveHit(target: Entity, hit: HitData, options: HitOptions): HitResult {
  if (target.faction === hit.faction || target.iframes > 0) return { outcome: 'ignored', dealt: 0 };
  const knock = hit.knock * (1 - options.knockResist);
  const frontal = dot(hit.dir, DIR_VEC[target.facing]) < 0;
  if (options.shielding && frontal && (hit.tags & (HEAVY | PIERCE_SHIELD)) === 0) {
    target.knock = scale(hit.dir, knock / 2);
    return { outcome: 'blocked', dealt: 0 };
  }
  const dealt = Math.min(target.hp, hit.amount);
  target.hp -= dealt;
  target.iframes = options.iframes;
  target.flash = FLASH_TICKS;
  target.knock = scale(hit.dir, knock);
  return { outcome: target.hp <= 0 ? 'killed' : 'damaged', dealt };
}
```

`src/core/actors/enemies/defs.ts`:

```ts
import type { EnemyId } from '@content/ids';
import type { Box } from '../../math/box';
import type { SimEvent } from '../../sim/events';
import type { Tuning } from '../tuning';
import type { BehaviourId } from './index';

export interface EnemyDef {
  readonly id: EnemyId;
  readonly art: string;
  readonly hp: number;
  readonly body: Box;
  readonly hurt: Box;
  readonly behaviour: BehaviourId;
  /** 0 = full knockback, 1 = immovable. */
  readonly knockResist: number;
  /** Refills its health instead of dying (training dummy). */
  readonly immortal: boolean;
  /** Blocks the hero like a wall. */
  readonly solid: boolean;
}

export interface EnemyCtx {
  readonly tuning: Tuning;
  emit(event: SimEvent): void;
}
```

`src/core/actors/enemies/dummy.ts`:

```ts
import { setAnim } from '../entity';
import type { Machine } from '../fsm';
import type { EnemyCtx } from './defs';

export type DummyState = 'idle' | 'hurt';

const WOBBLE_TICKS = 12;

export const DUMMY_MACHINE: Machine<DummyState, EnemyCtx> = {
  idle: {
    enter(e) {
      setAnim(e, 'idle');
    },
    tick(e) {
      return e.flash > 0 ? 'hurt' : undefined;
    },
  },
  hurt: {
    enter(e) {
      setAnim(e, 'hurt');
    },
    tick(e) {
      return e.fsm.t >= WOBBLE_TICKS - 1 ? 'idle' : undefined;
    },
  },
};
```

`src/core/actors/enemies/index.ts`:

```ts
import type { Vec } from '../../math/vec';
import { createEntity, type Entity } from '../entity';
import type { Machine } from '../fsm';
import type { EnemyCtx, EnemyDef } from './defs';
import { DUMMY_MACHINE } from './dummy';

/** Behaviour code by id. Content refers to these ids; an unknown id is a compile error. */
export const BEHAVIOURS = {
  dummy: DUMMY_MACHINE,
} satisfies Record<string, Machine<string, EnemyCtx>>;

export type BehaviourId = keyof typeof BEHAVIOURS;

export function createEnemy(id: number, def: EnemyDef, pos: Vec): Entity {
  return createEntity({
    id,
    kind: 'enemy',
    def: def.id,
    art: def.art,
    pos,
    facing: 's',
    body: def.body,
    hurt: def.hurt,
    faction: 'enemy',
    hp: def.hp,
    maxHp: def.hp,
    state: 'idle',
  });
}
```

`src/content/enemies.ts`:

```ts
import type { EnemyDef } from '@core/actors/enemies/defs';
import type { EnemyId } from './ids';

export const ENEMY_DEFS = {
  dummy: {
    id: 'dummy',
    art: 'prop_dummy',
    hp: 40,
    /** 10 px tall so the hero's 6 px corner-slide cannot slip around it. */
    body: { x: -7, y: -10, w: 14, h: 10 },
    hurt: { x: -8, y: -26, w: 16, h: 26 },
    behaviour: 'dummy',
    knockResist: 1,
    immortal: true,
    solid: true,
  },
} as const satisfies Record<EnemyId, EnemyDef>;
```

In `src/content/world/testlands/test_a.ts`, replace `things: [],` with:

```ts
  things: [{ k: 'enemy', id: 'dummy', at: { x: 24, y: 9 } }],
```

- [ ] **Step 4: Run tests**

Run: `pnpm vitest run tests/unit/core/combat.test.ts tests/content`
Expected: PASS (the integrity test confirms the dummy stands on grass).

- [ ] **Step 5: Gate and commit**

Run: `pnpm check`

```bash
git add -A
git commit -m "Add hit resolution with shields and i-frames, and a training dummy

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 13: World clock, weather and colour grading

**Files:**
- Create: `src/core/clock/rules.ts`, `src/core/clock/clock.ts`, `src/core/clock/weather.ts`, `src/content/clock.ts`, `src/art/grading.ts`
- Test: `tests/unit/core/clock.test.ts`, `tests/unit/core/weather.test.ts`, `tests/unit/art/grading.test.ts`

**Interfaces:**
- Consumes: `ClockState`, `ClockEvent`, `Season`, `SEASONS`, `WeatherKind`, `WEATHER_KINDS`, `MINUTES_PER_DAY` (Task 4); `fnv1a`, `hashInts`, `unitFromHash` (Task 3); `RegionId` (Task 4).
- Produces:
  - Rules: `ClockRules { ticksPerMinute; seasonDays; sunrise; daylight; twilight; weather; fixedSeason }`, `CLOCK_RULES`.
  - Clock functions: `tickClock(c, rules, ticksPerMinute?) → ClockEvent[]`, `setSeason(c, s)`, `setPolicy(c, p)`, `setMinute(c, m)`, `isNight(c, rules)`, `daylight(c, rules)` (a value in 0..1), `seasonAt(c, region, rules)`.
  - Weather: `weatherAt(seed, day, minute, region, season, rules)`.
  - Grading: `Matrix`, `IDENTITY`, `multiply`, `lerpMatrix`, `applyMatrix`, `grade(season, light, weather): number[]` (20 values; offsets are 0–255).

- [ ] **Step 1: Write the failing tests**

`tests/unit/core/clock.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { CLOCK_RULES } from '@content/clock';
import { daylight, isNight, seasonAt, setMinute, setSeason, tickClock } from '@core/clock/clock';
import { newClock, type ClockEvent, type ClockState } from '@core/clock/types';

function minutes(c: ClockState, n: number): ClockEvent[] {
  const out: ClockEvent[] = [];
  for (let i = 0; i < n * CLOCK_RULES.ticksPerMinute; i++) out.push(...tickClock(c, CLOCK_RULES));
  return out;
}

describe('world clock', () => {
  it('advances one minute per 60 ticks', () => {
    const c = newClock();
    for (let i = 0; i < 59; i++) tickClock(c, CLOCK_RULES);
    expect(c.minute).toBe(480);
    tickClock(c, CLOCK_RULES);
    expect(c.minute).toBe(481);
  });

  it('honours a slower tick rate (long day)', () => {
    const c = newClock();
    for (let i = 0; i < 60; i++) tickClock(c, CLOCK_RULES, 120);
    expect(c.minute).toBe(480);
  });

  it('rolls over to a new day', () => {
    const c = newClock();
    setMinute(c, 1439);
    expect(minutes(c, 1)).toContainEqual({ t: 'newDay', day: 2 });
    expect([c.minute, c.day]).toEqual([0, 2]);
  });

  it('announces dawn and dusk once each', () => {
    const c = newClock();
    setMinute(c, 0);
    const events = minutes(c, 1440);
    expect(events.filter((e) => e.t === 'dawn')).toHaveLength(1);
    expect(events.filter((e) => e.t === 'dusk')).toHaveLength(1);
  });

  it('keeps a held season, and turns a cycling one after seasonDays', () => {
    const held = newClock();
    minutes(held, 1440 * 10);
    expect(held.season).toBe('summer');

    const cycling = { ...newClock(), policy: 'cycling' as const };
    const events = minutes(cycling, 1440 * CLOCK_RULES.seasonDays);
    expect(cycling.season).toBe('autumn');
    expect(cycling.epoch).toBe(1);
    expect(events).toContainEqual({ t: 'season', from: 'summer', to: 'autumn' });
  });

  it('lets the story set the season', () => {
    const c = newClock();
    expect(setSeason(c, 'winter')).toEqual([{ t: 'season', from: 'summer', to: 'winter' }]);
    expect(c.epoch).toBe(1);
    expect(setSeason(c, 'winter')).toEqual([]);
  });

  it('knows night by season', () => {
    const c = { ...newClock(), season: 'winter' as const };
    setMinute(c, 6 * 60 + 30);
    expect(isNight(c, CLOCK_RULES)).toBe(true);
    setMinute(c, 7 * 60 + 30);
    expect(isNight(c, CLOCK_RULES)).toBe(false);
    setMinute(c, 19 * 60 + 30);
    expect(isNight(c, CLOCK_RULES)).toBe(true);
  });

  it('ramps daylight smoothly through dawn', () => {
    const c = newClock();
    setMinute(c, 12 * 60);
    expect(daylight(c, CLOCK_RULES)).toBe(1);
    setMinute(c, 0);
    expect(daylight(c, CLOCK_RULES)).toBe(0);
    const sunrise = CLOCK_RULES.sunrise.summer;
    setMinute(c, sunrise);
    expect(daylight(c, CLOCK_RULES)).toBeCloseTo(0.5);
    let last = -1;
    for (let m = sunrise - 60; m <= sunrise + 60; m++) {
      setMinute(c, m);
      const d = daylight(c, CLOCK_RULES);
      expect(d).toBeGreaterThanOrEqual(last);
      last = d;
    }
  });

  it('keeps Hrímfjöll in winter', () => {
    expect(seasonAt(newClock(), 'hrimfjoll', CLOCK_RULES)).toBe('winter');
    expect(seasonAt(newClock(), 'askdalr', CLOCK_RULES)).toBe('summer');
  });
});
```

`tests/unit/core/weather.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { CLOCK_RULES } from '@content/clock';
import { weatherAt } from '@core/clock/weather';

describe('weather', () => {
  it('is a pure function of seed, day, minute and region', () => {
    expect(weatherAt(5, 3, 600, 'myrkvidr', 'autumn', CLOCK_RULES)).toBe(
      weatherAt(5, 3, 600, 'myrkvidr', 'autumn', CLOCK_RULES),
    );
  });

  it('never rolls weather the season does not allow', () => {
    for (let day = 1; day <= 1000; day++) {
      expect(weatherAt(1, day, 900, 'askdalr', 'winter', CLOCK_RULES)).not.toBe('rain');
      expect(weatherAt(1, day, 900, 'askdalr', 'summer', CLOCK_RULES)).not.toBe('snow');
    }
  });

  it('follows the season table in the morning', () => {
    const counts = { clear: 0, rain: 0, wind: 0, fog: 0, snow: 0 };
    const days = 10_000;
    for (let day = 1; day <= days; day++) counts[weatherAt(9, day, 480, 'askdalr', 'summer', CLOCK_RULES)] += 1;
    expect(counts.clear / days).toBeCloseTo(0.6, 1);
    expect(counts.rain / days).toBeCloseTo(0.25, 1);
    expect(counts.wind / days).toBeCloseTo(0.15, 1);
  });
});
```

`tests/unit/art/grading.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { IDENTITY, applyMatrix, grade, multiply } from '@art/grading';

const luminance = ([r, g, b]: readonly number[]): number =>
  0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);

describe('colour grading', () => {
  it('multiplies with identity as a neutral element', () => {
    const g = grade('autumn', 1, 'clear');
    expect(multiply(IDENTITY, g)).toEqual(g);
    expect(multiply(g, IDENTITY)).toEqual(g);
  });

  it('produces 20 finite values', () => {
    const g = grade('winter', 0.3, 'fog');
    expect(g).toHaveLength(20);
    expect(g.every(Number.isFinite)).toBe(true);
  });

  it('makes night much darker than day', () => {
    const grey = [128, 128, 128] as const;
    const day = luminance(applyMatrix(grade('summer', 1, 'clear'), grey));
    const night = luminance(applyMatrix(grade('summer', 0, 'clear'), grey));
    expect(night).toBeLessThan(day * 0.6);
  });

  it('changes smoothly with light', () => {
    for (let l = 0; l < 1; l += 0.05) {
      const a = grade('spring', l, 'clear');
      const b = grade('spring', l + 0.01, 'clear');
      a.forEach((v, i) => {
        expect(Math.abs(v - (b[i] ?? 0))).toBeLessThan(2);
      });
    }
  });

  it('tints winter bluer than summer', () => {
    const grey = [128, 128, 128] as const;
    const [sr, , sb] = applyMatrix(grade('summer', 1, 'clear'), grey);
    const [wr, , wb] = applyMatrix(grade('winter', 1, 'clear'), grey);
    expect(wb - wr).toBeGreaterThan(sb - sr);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm vitest run tests/unit/core/clock.test.ts tests/unit/core/weather.test.ts tests/unit/art/grading.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement the clock**

`src/core/clock/rules.ts`:

```ts
import type { RegionId } from '@content/ids';
import type { Season, WeatherKind } from './types';

export interface ClockRules {
  /** Sim ticks per game minute (60 → one game day is 24 real minutes). */
  readonly ticksPerMinute: number;
  /** Days per season while the season policy is `cycling`. */
  readonly seasonDays: number;
  /** Minute of the day the sun rises, per season. */
  readonly sunrise: Readonly<Record<Season, number>>;
  /** Minutes of daylight, per season. */
  readonly daylight: Readonly<Record<Season, number>>;
  /** Length (minutes) of the dawn and dusk ramps. */
  readonly twilight: number;
  /** Weather weights (percent) per season. */
  readonly weather: Readonly<Record<Season, Readonly<Partial<Record<WeatherKind, number>>>>>;
  /** Regions whose season never follows the calendar. */
  readonly fixedSeason: Readonly<Partial<Record<RegionId, Season>>>;
}
```

`src/content/clock.ts`:

```ts
import type { ClockRules } from '@core/clock/rules';

export const CLOCK_RULES: ClockRules = {
  ticksPerMinute: 60,
  seasonDays: 6,
  sunrise: { summer: 3 * 60, autumn: 5 * 60, winter: 7 * 60, spring: 5 * 60 },
  daylight: { summer: 18 * 60, autumn: 16 * 60, winter: 12 * 60, spring: 16 * 60 },
  twilight: 90,
  weather: {
    summer: { clear: 60, rain: 25, wind: 15 },
    autumn: { clear: 35, rain: 30, wind: 25, fog: 10 },
    winter: { clear: 30, wind: 20, fog: 10, snow: 40 },
    spring: { clear: 40, rain: 40, wind: 15, fog: 5 },
  },
  fixedSeason: { hrimfjoll: 'winter' },
};
```

`src/core/clock/clock.ts`:

```ts
import type { RegionId } from '@content/ids';
import type { ClockRules } from './rules';
import { MINUTES_PER_DAY, SEASONS, type ClockEvent, type ClockState, type Season } from './types';

const mod = (a: number, n: number): number => ((a % n) + n) % n;
const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

function nextSeason(s: Season): Season {
  const i = SEASONS.indexOf(s);
  return SEASONS[(i + 1) % SEASONS.length] ?? 'summer';
}

/** The only way seasons change; bumps the epoch so ground cover regrows. */
export function setSeason(c: ClockState, to: Season): ClockEvent[] {
  const from = c.season;
  if (from === to) return [];
  c.season = to;
  c.seasonDay = 0;
  c.epoch += 1;
  return [{ t: 'season', from, to }];
}

export function setPolicy(c: ClockState, policy: ClockState['policy']): void {
  c.policy = policy;
}

export function setMinute(c: ClockState, minute: number): void {
  c.minute = mod(Math.floor(minute), MINUTES_PER_DAY);
  c.sub = 0;
}

function advanceMinute(c: ClockState, rules: ClockRules): ClockEvent[] {
  const events: ClockEvent[] = [];
  c.minute += 1;
  if (c.minute >= MINUTES_PER_DAY) {
    c.minute = 0;
    c.day += 1;
    events.push({ t: 'newDay', day: c.day });
    if (c.policy === 'cycling') {
      c.seasonDay += 1;
      if (c.seasonDay >= rules.seasonDays) events.push(...setSeason(c, nextSeason(c.season)));
    }
  }
  const sunrise = rules.sunrise[c.season];
  const sunset = mod(sunrise + rules.daylight[c.season], MINUTES_PER_DAY);
  if (c.minute === sunrise) events.push({ t: 'dawn' });
  if (c.minute === sunset) events.push({ t: 'dusk' });
  return events;
}

/** One sim tick of world time. The sim does not call this in dungeons, menus, cutscenes or transitions. */
export function tickClock(c: ClockState, rules: ClockRules, ticksPerMinute: number = rules.ticksPerMinute): ClockEvent[] {
  c.sub += 1;
  if (c.sub < ticksPerMinute) return [];
  c.sub = 0;
  return advanceMinute(c, rules);
}

export function isNight(c: ClockState, rules: ClockRules): boolean {
  const since = mod(c.minute - rules.sunrise[c.season], MINUTES_PER_DAY);
  return since >= rules.daylight[c.season];
}

/** 1 in full day, 0 in full night, with linear ramps of `twilight` minutes centred on sunrise and sunset. */
export function daylight(c: ClockState, rules: ClockRules): number {
  const half = rules.twilight / 2;
  const length = rules.daylight[c.season];
  let since = mod(c.minute + c.sub / rules.ticksPerMinute - rules.sunrise[c.season], MINUTES_PER_DAY);
  if (since > MINUTES_PER_DAY - half) since -= MINUTES_PER_DAY;
  const rising = clamp01((since + half) / rules.twilight);
  const falling = clamp01((length + half - since) / rules.twilight);
  return Math.min(rising, falling);
}

export function seasonAt(c: ClockState, region: RegionId, rules: ClockRules): Season {
  return rules.fixedSeason[region] ?? c.season;
}
```

`src/core/clock/weather.ts`:

```ts
import type { RegionId } from '@content/ids';
import { fnv1a, hashInts, unitFromHash } from '../math/hash';
import type { ClockRules } from './rules';
import { WEATHER_KINDS, type Season, type WeatherKind } from './types';

const CHANGE_CHANCE = 0.3;
const EARLIEST_CHANGE = 10 * 60;
const CHANGE_SPAN = 8 * 60;

function pick(table: Readonly<Partial<Record<WeatherKind, number>>>, u: number): WeatherKind {
  let total = 0;
  for (const k of WEATHER_KINDS) total += table[k] ?? 0;
  let x = u * total;
  for (const k of WEATHER_KINDS) {
    const w = table[k] ?? 0;
    if (x < w) return k;
    x -= w;
  }
  return 'clear';
}

/**
 * Weather for a region: rolled each morning from (seed, day, region) and possibly changing once between
 * 10:00 and 18:00. Stateless, so combat randomness never changes the weather and tests stay stable.
 */
export function weatherAt(
  seed: number,
  day: number,
  minute: number,
  region: RegionId,
  season: Season,
  rules: ClockRules,
): WeatherKind {
  const table = rules.weather[season];
  const base = hashInts(seed, day, fnv1a(region));
  const morning = pick(table, unitFromHash(base));
  if (unitFromHash(hashInts(base, 1)) >= CHANGE_CHANCE) return morning;
  const changeAt = EARLIEST_CHANGE + Math.floor(unitFromHash(hashInts(base, 2)) * CHANGE_SPAN);
  return minute < changeAt ? morning : pick(table, unitFromHash(hashInts(base, 3)));
}
```

- [ ] **Step 4: Implement grading**

`src/art/grading.ts`:

```ts
import type { Season, WeatherKind } from '@core/clock/types';

/** 4×5 colour matrix, row-major, as Phaser's ColorMatrix expects (offset column in 0–255). */
export type Matrix = readonly number[];

export const IDENTITY: Matrix = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0];

const at = (m: Matrix, i: number): number => m[i] ?? 0;

/** a ∘ b: apply b first, then a. */
export function multiply(a: Matrix, b: Matrix): number[] {
  const out: number[] = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 5; c++) {
      let v = c === 4 ? at(a, r * 5 + 4) : 0;
      for (let k = 0; k < 4; k++) v += at(a, r * 5 + k) * at(b, k * 5 + c);
      out.push(v);
    }
  }
  return out;
}

export function lerpMatrix(a: Matrix, b: Matrix, t: number): number[] {
  return a.map((v, i) => v + (at(b, i) - v) * t);
}

export function applyMatrix(m: Matrix, rgb: readonly [number, number, number]): [number, number, number] {
  const [r, g, b] = rgb;
  const row = (i: number): number => at(m, i * 5) * r + at(m, i * 5 + 1) * g + at(m, i * 5 + 2) * b + at(m, i * 5 + 3) * 255 + at(m, i * 5 + 4);
  return [row(0), row(1), row(2)];
}

function channels(r: number, g: number, b: number, or = 0, og = 0, ob = 0): Matrix {
  return [r, 0, 0, 0, or, 0, g, 0, 0, og, 0, 0, b, 0, ob, 0, 0, 0, 1, 0];
}

function saturation(s: number): Matrix {
  const lr = 0.2126 * (1 - s);
  const lg = 0.7152 * (1 - s);
  const lb = 0.0722 * (1 - s);
  return [lr + s, lg, lb, 0, 0, lr, lg + s, lb, 0, 0, lr, lg, lb + s, 0, 0, 0, 0, 0, 1, 0];
}

const SEASON: Readonly<Record<Season, Matrix>> = {
  summer: channels(1.04, 1.02, 0.94),
  autumn: multiply(channels(1.08, 0.98, 0.86), saturation(0.9)),
  winter: multiply(channels(0.94, 0.99, 1.12, 0, 4, 10), saturation(0.72)),
  spring: channels(0.98, 1.05, 0.98),
};

const NIGHT: Matrix = channels(0.3, 0.36, 0.6, 0, 0, 8);
const DUSK: Matrix = channels(1.12, 0.9, 0.78);

const WEATHER: Readonly<Record<WeatherKind, Matrix>> = {
  clear: IDENTITY,
  wind: IDENTITY,
  rain: multiply(channels(0.85, 0.87, 0.93), saturation(0.75)),
  fog: multiply(channels(0.85, 0.85, 0.87, 28, 28, 30), saturation(0.6)),
  snow: multiply(channels(1.02, 1.04, 1.08), saturation(0.8)),
};

/** The world camera's colour matrix for a season, a daylight level (0 night … 1 day) and weather. */
export function grade(season: Season, light: number, weather: WeatherKind): number[] {
  const duskAmount = (1 - Math.abs(2 * light - 1)) * 0.6;
  const timeOfDay = multiply(lerpMatrix(IDENTITY, DUSK, duskAmount), lerpMatrix(NIGHT, IDENTITY, light));
  return multiply(WEATHER[weather], multiply(timeOfDay, SEASON[season]));
}
```

- [ ] **Step 5: Run tests**

Run: `pnpm vitest run tests/unit/core/clock.test.ts tests/unit/core/weather.test.ts tests/unit/art/grading.test.ts`
Expected: PASS.

- [ ] **Step 6: Gate and commit**

Run: `pnpm check`

```bash
git add -A
git commit -m "Add world clock with hybrid seasons, stateless weather and colour grading

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 14: Sim — step loop, screen transitions, commands, determinism

**Files:**
- Create: `src/core/sim/db.ts`, `src/core/sim/commands.ts`, `src/core/sim/sim.ts`, `src/content/index.ts`, `tests/sim/harness.ts`
- Test: `tests/sim/sim.test.ts`, `tests/sim/determinism.test.ts`

**Interfaces:**
- Consumes: everything in core so far; content `SCREENS`, `WORLD_LAYOUT`, `TERRAIN`, `LEGEND`, `ENEMY_DEFS`, `TUNING`, `CLOCK_RULES`.
- Produces:
  - Types: `ContentDb`, `Command` (`warp` / `setMinute` / `setSeason` / `setFlag`), `Mode`, `Transition`, `LoadedScreen`, `SimOptions`, `TRANSITION_TICKS = 30`.
  - The `Sim` class:
    - Fields: `state`, `mode`, `screen`, `hero`, `enemies`, `transition`, `tick`, and the getter `entities`.
    - Methods: `step(input)`, `command(c)`, `drainEvents()`, `terrainOf(id)`, `originOf(id)`, `snapshot()`, `hash()`.
  - `entryPoint(dir, from, body)`; `DB`.
  - Test helpers: `Harness`, `frameOf(held, pressed?, released?)`.

- [ ] **Step 1: Write the harness and failing tests**

`tests/sim/harness.ts`:

```ts
import { DB } from '@content/index';
import { NEW_GAME } from '@content/start';
import type { ScreenId } from '@content/world/screens';
import type { Season } from '@core/clock/types';
import { bitsOf, type Action, type InputFrame } from '@core/input/actions';
import type { Dir4 } from '@core/math/dir';
import type { ContentDb } from '@core/sim/db';
import type { SimEvent } from '@core/sim/events';
import { Sim } from '@core/sim/sim';
import { newGame } from '@core/state/gameState';
import { tileFeet } from '@core/world/screen';

export interface HarnessOptions {
  readonly screen?: ScreenId;
  readonly tile?: readonly [number, number];
  readonly facing?: Dir4;
  readonly minute?: number;
  readonly season?: Season;
  readonly seed?: number;
  readonly db?: ContentDb;
}

export function frameOf(
  held: readonly Action[],
  pressed: readonly Action[] = [],
  released: readonly Action[] = [],
): InputFrame {
  const has = (a: Action): boolean => held.includes(a);
  return {
    held: bitsOf(held),
    pressed: bitsOf(pressed),
    released: bitsOf(released),
    mx: (has('right') ? 1 : 0) - (has('left') ? 1 : 0),
    my: (has('down') ? 1 : 0) - (has('up') ? 1 : 0),
  };
}

/** Drives a real Sim headlessly with scripted input. */
export class Harness {
  readonly sim: Sim;
  readonly events: SimEvent[] = [];

  constructor(o: HarnessOptions = {}) {
    const state = newGame(o.seed ?? 1, NEW_GAME);
    if (o.screen !== undefined) state.hero.screen = o.screen;
    if (o.tile !== undefined) {
      const p = tileFeet({ x: o.tile[0], y: o.tile[1] });
      state.hero.x = p.x;
      state.hero.y = p.y;
    }
    if (o.facing !== undefined) state.hero.facing = o.facing;
    if (o.minute !== undefined) state.clock.minute = o.minute;
    if (o.season !== undefined) state.clock.season = o.season;
    this.sim = new Sim(o.db ?? DB, state);
  }

  step(frame: InputFrame): this {
    this.sim.step(frame);
    this.events.push(...this.sim.drainEvents());
    return this;
  }

  idle(ticks: number): this {
    for (let i = 0; i < ticks; i++) this.step(frameOf([]));
    return this;
  }

  /** Holds actions for `ticks` ticks (pressed on the first), then releases them for one tick. */
  hold(actions: readonly Action[], ticks: number): this {
    for (let i = 0; i < ticks; i++) this.step(frameOf(actions, i === 0 ? actions : []));
    return this.step(frameOf([], [], actions));
  }

  press(actions: readonly Action[]): this {
    return this.hold(actions, 1);
  }

  until(pred: (sim: Sim) => boolean, maxTicks: number, frame: InputFrame = frameOf([])): this {
    for (let i = 0; i < maxTicks; i++) {
      if (pred(this.sim)) return this;
      this.step(frame);
    }
    if (pred(this.sim)) return this;
    throw new Error(`condition not met within ${maxTicks} ticks`);
  }

  count(t: SimEvent['t']): number {
    return this.events.filter((e) => e.t === t).length;
  }
}
```

`tests/sim/sim.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { TUNING } from '@content/tuning';
import { at } from '@core/math/box';
import type { SimEvent } from '@core/sim/events';
import { SCREEN_W } from '@core/world/dims';
import { Harness, frameOf } from './harness';

const hits = (events: SimEvent[]): number[] =>
  events.flatMap((e) => (e.t === 'hit' ? [e.dealt] : []));

describe('Sim', () => {
  it('walks the hero along the path', () => {
    const h = new Harness({ tile: [13, 11] });
    const x0 = h.sim.hero.pos.x;
    h.hold(['right'], 60);
    expect(h.sim.hero.pos.x).toBeCloseTo(x0 + TUNING.hero.walkSpeed * 60);
  });

  it('stops at the rock border', () => {
    const h = new Harness({ tile: [2, 19] });
    h.hold(['left'], 60);
    const body = at(h.sim.hero.body, h.sim.hero.pos);
    expect(body.x).toBe(16);
  });

  it('slides to the neighbouring screen', () => {
    const h = new Harness({ screen: 'test_a', tile: [37, 11] });
    h.until((s) => s.mode === 'transition', 120, frameOf(['right']));
    expect(h.sim.transition?.to).toBe('test_b');
    expect(h.count('screenTransition')).toBe(1);
    h.until((s) => s.mode === 'play', 60);
    expect(h.sim.screen.id).toBe('test_b');
    expect(h.sim.hero.pos.x).toBe(10);
    expect(h.count('screenEntered')).toBe(1);
    expect(h.sim.state.world.visited).toContain('test_b');
    expect(h.sim.state.hero.screen).toBe('test_b');
  });

  it('crosses north-south seams too', () => {
    const h = new Harness({ screen: 'test_b', tile: [19, 19] });
    h.until((s) => s.screen.id === 'test_c' && s.mode === 'play', 200, frameOf(['down']));
    h.until((s) => s.screen.id === 'test_b' && s.mode === 'play', 200, frameOf(['up']));
    expect(h.count('screenEntered')).toBe(2);
  });

  it('treats a screen edge without a neighbour as a wall', () => {
    const open = Array.from({ length: 22 }, () => '.'.repeat(40));
    const db = {
      ...DB,
      screens: { ...DB.screens, test_a: { ...DB.screens.test_a, map: open, things: [] } },
      layout: { cols: 16, rows: 12, at: { test_a: [0, 0] as const } },
    };
    const h = new Harness({ db, tile: [38, 11] });
    h.hold(['right'], 60);
    expect(h.sim.mode).toBe('play');
    expect(at(h.sim.hero.body, h.sim.hero.pos).x + TUNING.hero.body.w).toBe(SCREEN_W);
  });

  it('hits the training dummy once per swing', () => {
    const h = new Harness({ tile: [23, 9], facing: 'e' });
    h.press(['sword']).idle(20);
    expect(hits(h.events)).toEqual([2]);
    expect(h.sim.enemies[0]?.hp).toBe(DB.enemies.dummy.hp - 2);
  });

  it('lands all three hits of a combo', () => {
    const h = new Harness({ tile: [23, 9], facing: 'e' });
    h.press(['sword']).idle(5).press(['sword']).idle(5).press(['sword']).idle(30);
    expect(hits(h.events)).toEqual([2, 2, 4]);
  });

  it('cannot walk through the solid dummy', () => {
    const h = new Harness({ tile: [21, 9] });
    h.hold(['right'], 60);
    const body = at(h.sim.hero.body, h.sim.hero.pos);
    const dummyFeetX = 24 * 16 + 8;
    expect(body.x + body.w).toBe(dummyFeetX + DB.enemies.dummy.body.x);
  });

  it('advances the clock one minute per 60 ticks of play', () => {
    const h = new Harness();
    const m0 = h.sim.state.clock.minute;
    h.idle(60);
    expect(h.sim.state.clock.minute).toBe(m0 + 1);
  });

  it('warps on command', () => {
    const h = new Harness();
    h.sim.command({ t: 'warp', screen: 'test_c', x: 100, y: 100 });
    h.idle(1);
    expect(h.sim.screen.id).toBe('test_c');
    expect(h.sim.hero.pos).toEqual({ x: 100, y: 100 });
    expect(h.count('screenEntered')).toBe(1);
  });

  it('sets the season and time on command', () => {
    const h = new Harness();
    h.sim.command({ t: 'setSeason', season: 'winter' });
    h.sim.command({ t: 'setMinute', minute: 22 * 60 });
    h.idle(1);
    expect(h.sim.state.clock.season).toBe('winter');
    expect(h.sim.state.clock.minute).toBe(22 * 60);
    expect(h.events).toContainEqual({ t: 'clock', e: { t: 'season', from: 'summer', to: 'winter' } });
  });

  it('keeps the saved hero in sync every tick', () => {
    const h = new Harness({ tile: [13, 11] });
    h.hold(['right'], 10);
    expect(h.sim.state.hero.x).toBe(h.sim.hero.pos.x);
    expect(h.sim.state.hero.facing).toBe('e');
    expect(h.sim.snapshot()).toEqual(h.sim.state);
  });
});
```

`tests/sim/determinism.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { Harness } from './harness';

function script(h: Harness): Harness {
  return h
    .hold(['right'], 40)
    .press(['sword'])
    .idle(10)
    .hold(['down', 'right'], 30)
    .press(['roll'])
    .idle(25)
    .hold(['shield', 'left'], 20)
    .hold(['sword'], 60)
    .idle(40);
}

describe('determinism', () => {
  it('gives identical results for identical input', () => {
    const a = script(new Harness({ tile: [10, 11] }));
    const b = script(new Harness({ tile: [10, 11] }));
    expect(a.sim.tick).toBeGreaterThan(200);
    expect(a.sim.hash()).toBe(b.sim.hash());
  });

  it('diverges when the input differs', () => {
    const a = script(new Harness({ tile: [10, 11] }));
    const b = script(new Harness({ tile: [10, 11] }).idle(1));
    expect(a.sim.hash()).not.toBe(b.sim.hash());
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm vitest run tests/sim`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement the database type, commands and content index**

`src/core/sim/db.ts`:

```ts
import type { EnemyId } from '@content/ids';
import type { TerrainId } from '@content/terrain';
import type { ScreenId } from '@content/world/screens';
import type { EnemyDef } from '../actors/enemies/defs';
import type { Tuning } from '../actors/tuning';
import type { ClockRules } from '../clock/rules';
import type { ScreenDef, WorldLayout } from '../world/screen';
import type { TerrainDef } from '../world/terrain';

/** Everything the simulation reads from content. The shell passes `DB`; tests may pass variations. */
export interface ContentDb {
  readonly screens: Readonly<Record<ScreenId, ScreenDef>>;
  readonly layout: WorldLayout;
  readonly terrain: Readonly<Record<TerrainId, TerrainDef>>;
  readonly legend: Readonly<Record<string, TerrainId>>;
  readonly enemies: Readonly<Record<EnemyId, EnemyDef>>;
  readonly tuning: Tuning;
  readonly clock: ClockRules;
}
```

`src/core/sim/commands.ts`:

```ts
import type { FlagId } from '@content/flags';
import type { ScreenId } from '@content/world/screens';
import type { Season } from '../clock/types';
import type { FlagValue } from '../state/flags';

/** Out-of-band requests (menus, shops, saves, dev tools), applied at the start of the next tick. */
export type Command =
  | { readonly t: 'warp'; readonly screen: ScreenId; readonly x: number; readonly y: number }
  | { readonly t: 'setMinute'; readonly minute: number }
  | { readonly t: 'setSeason'; readonly season: Season }
  | { readonly t: 'setFlag'; readonly flag: FlagId; readonly value: FlagValue };
```

`src/content/index.ts`:

```ts
import type { ContentDb } from '@core/sim/db';
import { CLOCK_RULES } from './clock';
import { ENEMY_DEFS } from './enemies';
import { TERRAIN } from './terrain';
import { TUNING } from './tuning';
import { WORLD_LAYOUT } from './world/layout';
import { LEGEND } from './world/legend';
import { SCREENS } from './world/registry';

export const DB: ContentDb = {
  screens: SCREENS,
  layout: WORLD_LAYOUT,
  terrain: TERRAIN,
  legend: LEGEND,
  enemies: ENEMY_DEFS,
  tuning: TUNING,
  clock: CLOCK_RULES,
};
```

- [ ] **Step 4: Implement the Sim**

`src/core/sim/sim.ts`:

```ts
import type { EnemyId } from '@content/ids';
import type { ScreenId } from '@content/world/screens';
import { BEHAVIOURS, createEnemy } from '../actors/enemies';
import type { EnemyCtx, EnemyDef } from '../actors/enemies/defs';
import { mem, setAnim, type Entity } from '../actors/entity';
import { changeState, runFsm } from '../actors/fsm';
import { HERO_MACHINE, createHero, heroPreTick, heroSwordBox, heroSwordDamage, type HeroCtx } from '../actors/hero';
import { setMinute, setSeason, tickClock } from '../clock/clock';
import { resolveHit } from '../combat/hit';
import { EMPTY_FRAME, type InputFrame } from '../input/actions';
import { at, overlaps, type Box } from '../math/box';
import { DIR_VEC, DIRS, type Dir4 } from '../math/dir';
import { fnv1a } from '../math/hash';
import { length, normalize, scale, sub, type Vec } from '../math/vec';
import type { GameState } from '../state/gameState';
import { canonicalJson, cloneState } from '../state/save';
import { buildCollision, gridSolidAt, moveBox, type CollisionGrid, type SolidAt } from '../world/collision';
import { SCREEN_H, SCREEN_W } from '../world/dims';
import { indexLayout, neighbourOf, screenOrigin, tileFeet, type LayoutIndex } from '../world/screen';
import { parseTextMap, type TerrainGrid } from '../world/textmap';
import type { Command } from './commands';
import type { ContentDb } from './db';
import type { SimEvent } from './events';

export type Mode = 'play' | 'transition';

export interface Transition {
  readonly from: ScreenId;
  readonly to: ScreenId;
  readonly dir: Dir4;
  t: number;
  readonly dur: number;
  readonly heroFrom: Vec;
  readonly heroTo: Vec;
}

export interface LoadedScreen {
  readonly id: ScreenId;
  readonly terrain: TerrainGrid;
  readonly collision: CollisionGrid;
  readonly neighbours: Readonly<Record<Dir4, ScreenId | null>>;
}

export interface SimOptions {
  /** Accessibility "long day": world time runs at half speed. */
  readonly longDay: boolean;
}

export const TRANSITION_TICKS = 30;
const EDGE_INSET = 4;
const KNOCK_EPSILON = 0.1;

/** Where the hero stands on the new screen after crossing an edge in direction `dir`. */
export function entryPoint(dir: Dir4, from: Vec, body: Box): Vec {
  switch (dir) {
    case 'e':
      return { x: EDGE_INSET - body.x, y: from.y };
    case 'w':
      return { x: SCREEN_W - EDGE_INSET - (body.x + body.w), y: from.y };
    case 's':
      return { x: from.x, y: EDGE_INSET - body.y };
    case 'n':
      return { x: from.x, y: SCREEN_H - EDGE_INSET - (body.y + body.h) };
  }
}

/** The whole game rules engine. Deterministic: same state + same inputs ⇒ same result. */
export class Sim {
  readonly state: GameState;
  mode: Mode = 'play';
  screen: LoadedScreen;
  readonly hero: Entity;
  enemies: Entity[];
  transition: Transition | null = null;
  tick = 0;
  private events: SimEvent[] = [];
  private readonly queue: Command[] = [];
  private nextId = 1;
  private readonly layout: LayoutIndex;
  private readonly ticksPerMinute: number;
  private readonly terrainCache = new Map<ScreenId, TerrainGrid>();

  constructor(
    private readonly db: ContentDb,
    state: GameState,
    options: SimOptions = { longDay: false },
  ) {
    this.state = state;
    this.layout = indexLayout(db.layout);
    this.ticksPerMinute = db.clock.ticksPerMinute * (options.longDay ? 2 : 1);
    this.screen = this.load(state.hero.screen);
    this.hero = createHero(this.newId(), state.hero, db.tuning);
    this.enemies = this.spawn();
    this.markVisited(this.screen.id);
  }

  get entities(): readonly Entity[] {
    return [this.hero, ...this.enemies];
  }

  command(c: Command): void {
    this.queue.push(c);
  }

  drainEvents(): SimEvent[] {
    const out = this.events;
    this.events = [];
    return out;
  }

  terrainOf(id: ScreenId): TerrainGrid {
    let grid = this.terrainCache.get(id);
    if (grid === undefined) {
      grid = parseTextMap(this.db.screens[id].map, this.db.legend);
      this.terrainCache.set(id, grid);
    }
    return grid;
  }

  originOf(id: ScreenId): Vec {
    return screenOrigin(this.layout, id);
  }

  snapshot(): GameState {
    return cloneState(this.state);
  }

  /** Hash of everything that changes during play; equal hashes mean identical simulations. */
  hash(): number {
    return fnv1a(
      canonicalJson({
        state: this.state,
        mode: this.mode,
        tick: this.tick,
        transition: this.transition,
        entities: this.entities,
      }),
    );
  }

  step(input: InputFrame): void {
    for (const c of this.queue.splice(0)) this.apply(c);
    for (const e of this.entities) e.prev = { ...e.pos };
    if (this.mode === 'transition') this.stepTransition();
    else this.stepPlay(input);
    this.syncHero();
    this.state.playTicks += 1;
    this.tick += 1;
  }

  private stepPlay(input: InputFrame): void {
    for (const e of tickClock(this.state.clock, this.db.clock, this.ticksPerMinute)) this.emit({ t: 'clock', e });
    heroPreTick(this.hero);
    runFsm(HERO_MACHINE, this.hero, this.heroCtx(input));
    const enemyCtx: EnemyCtx = {
      tuning: this.db.tuning,
      emit: (ev) => {
        this.emit(ev);
      },
    };
    for (const e of this.enemies) runFsm(BEHAVIOURS[this.enemyDef(e).behaviour], e, enemyCtx);
    this.moveAll();
    this.resolveSword();
    this.tickTimers();
    this.checkEdges();
  }

  private stepTransition(): void {
    const tr = this.transition;
    if (tr === null) {
      this.mode = 'play';
      return;
    }
    tr.t += 1;
    this.hero.animT += 1;
    if (tr.t < tr.dur) return;
    this.transition = null;
    this.mode = 'play';
    this.markVisited(tr.to);
    this.emit({ t: 'screenEntered', screen: tr.to });
  }

  private heroCtx(input: InputFrame): HeroCtx {
    return {
      input,
      tuning: this.db.tuning,
      hasShield: this.state.inv.shield,
      emit: (ev) => {
        this.emit(ev);
      },
    };
  }

  private enemyDef(e: Entity): EnemyDef {
    return this.db.enemies[e.def as EnemyId];
  }

  private moveAll(): void {
    const obstacles = this.enemies.filter((e) => this.enemyDef(e).solid).map((e) => at(e.body, e.pos));
    this.moveEntity(this.hero, this.heroSolidAt(), obstacles);
    const walls = gridSolidAt(this.screen.collision, () => true);
    for (const e of this.enemies) this.moveEntity(e, walls, []);
  }

  private moveEntity(e: Entity, solidAt: SolidAt, obstacles: readonly Box[]): void {
    const dx = e.vel.x + e.knock.x;
    const dy = e.vel.y + e.knock.y;
    if (dx !== 0 || dy !== 0) {
      const box = at(e.body, e.pos);
      const r = moveBox(box, dx, dy, solidAt, obstacles);
      e.pos = { x: e.pos.x + (r.x - box.x), y: e.pos.y + (r.y - box.y) };
    }
    e.knock = scale(e.knock, this.db.tuning.knockDecay);
    if (length(e.knock) < KNOCK_EPSILON) e.knock = { x: 0, y: 0 };
  }

  /** Off-screen tiles are open where a neighbouring screen exists, solid elsewhere. */
  private heroSolidAt(): SolidAt {
    const { collision, neighbours } = this.screen;
    return gridSolidAt(collision, (tx, ty) => {
      const outX: Dir4 | null = tx < 0 ? 'w' : tx >= collision.cols ? 'e' : null;
      const outY: Dir4 | null = ty < 0 ? 'n' : ty >= collision.rows ? 's' : null;
      if (outX !== null && outY !== null) return true;
      const dir = outX ?? outY;
      return dir === null ? false : neighbours[dir] === null;
    });
  }

  private resolveSword(): void {
    const box = heroSwordBox(this.hero, this.db.tuning);
    if (box === null) return;
    const swing = mem(this.hero, 'swing');
    const spinning = mem(this.hero, 'spinOn') === 1;
    for (const e of [...this.enemies]) {
      if (mem(e, 'hitSwing') === swing || !overlaps(box, at(e.hurt, e.pos))) continue;
      e.mem['hitSwing'] = swing;
      const def = this.enemyDef(e);
      const away = normalize(sub(e.pos, this.hero.pos));
      const dir = spinning && (away.x !== 0 || away.y !== 0) ? away : DIR_VEC[this.hero.facing];
      const result = resolveHit(
        e,
        {
          amount: heroSwordDamage(this.hero, this.db.tuning),
          element: 'none',
          knock: this.db.tuning.sword.knock,
          dir,
          faction: 'hero',
          tags: 0,
        },
        { shielding: false, iframes: this.db.tuning.enemyIframes, knockResist: def.knockResist },
      );
      if (result.outcome === 'ignored') continue;
      this.emit({ t: 'hit', target: e.id, blocked: result.outcome === 'blocked', dealt: result.dealt });
      this.emit({ t: 'sfx', id: result.outcome === 'blocked' ? 'sfx_block' : 'sfx_hit' });
      if (result.outcome === 'killed') {
        if (def.immortal) e.hp = e.maxHp;
        else this.enemies = this.enemies.filter((x) => x !== e);
      }
    }
  }

  private tickTimers(): void {
    for (const e of this.entities) {
      if (e.iframes > 0) e.iframes -= 1;
      if (e.flash > 0) e.flash -= 1;
      e.animT += 1;
    }
  }

  private checkEdges(): void {
    const b = at(this.hero.body, this.hero.pos);
    let dir: Dir4 | null = null;
    if (b.x < 0) dir = 'w';
    else if (b.x + b.w > SCREEN_W) dir = 'e';
    else if (b.y < 0) dir = 'n';
    else if (b.y + b.h > SCREEN_H) dir = 's';
    if (dir === null) return;
    const to = this.screen.neighbours[dir];
    if (to !== null) this.beginTransition(dir, to);
  }

  private beginTransition(dir: Dir4, to: ScreenId): void {
    const from = this.screen.id;
    const heroFrom = { ...this.hero.pos };
    const heroTo = entryPoint(dir, heroFrom, this.db.tuning.hero.body);
    this.screen = this.load(to);
    this.enemies = this.spawn();
    this.placeHero(heroTo);
    setAnim(this.hero, 'walk');
    this.transition = { from, to, dir, t: 0, dur: TRANSITION_TICKS, heroFrom, heroTo };
    this.mode = 'transition';
    this.emit({ t: 'screenTransition', from, to, dir });
  }

  private apply(c: Command): void {
    switch (c.t) {
      case 'warp':
        this.transition = null;
        this.mode = 'play';
        this.screen = this.load(c.screen);
        this.enemies = this.spawn();
        this.placeHero({ x: c.x, y: c.y });
        this.markVisited(c.screen);
        this.emit({ t: 'screenEntered', screen: c.screen });
        break;
      case 'setMinute':
        setMinute(this.state.clock, c.minute);
        break;
      case 'setSeason':
        for (const e of setSeason(this.state.clock, c.season)) this.emit({ t: 'clock', e });
        break;
      case 'setFlag':
        this.state.flags[c.flag] = c.value;
        break;
    }
  }

  private placeHero(p: Vec): void {
    this.hero.pos = { ...p };
    this.hero.prev = { ...p };
    this.hero.vel = { x: 0, y: 0 };
    this.hero.knock = { x: 0, y: 0 };
    changeState(HERO_MACHINE, this.hero, 'move', this.heroCtx(EMPTY_FRAME));
  }

  private load(id: ScreenId): LoadedScreen {
    const terrain = this.terrainOf(id);
    const neighbours = Object.fromEntries(DIRS.map((d) => [d, neighbourOf(this.layout, id, d)])) as Record<
      Dir4,
      ScreenId | null
    >;
    return { id, terrain, collision: buildCollision(terrain, this.db.terrain), neighbours };
  }

  private spawn(): Entity[] {
    const out: Entity[] = [];
    for (const thing of this.db.screens[this.screen.id].things) {
      switch (thing.k) {
        case 'enemy':
          out.push(createEnemy(this.newId(), this.db.enemies[thing.id], tileFeet(thing.at)));
          break;
      }
    }
    return out;
  }

  private syncHero(): void {
    const h = this.state.hero;
    h.screen = this.screen.id;
    h.x = this.hero.pos.x;
    h.y = this.hero.pos.y;
    h.facing = this.hero.facing;
    h.hp = this.hero.hp;
  }

  private markVisited(id: ScreenId): void {
    if (!this.state.world.visited.includes(id)) this.state.world.visited.push(id);
  }

  private emit(ev: SimEvent): void {
    this.events.push(ev);
  }

  private newId(): number {
    const id = this.nextId;
    this.nextId += 1;
    return id;
  }
}
```

- [ ] **Step 5: Run tests**

Run: `pnpm vitest run tests/sim`
Expected: PASS. If "cannot walk through the solid dummy" fails, check that `moveAll` passes the dummy's body as an obstacle. The dummy's feet are at x = 392 and its body spans 385–399, so the hero's right body edge must stop at 385.

- [ ] **Step 6: Gate and commit**

Run: `pnpm check`

```bash
git add -A
git commit -m "Add deterministic Sim with flip-screen transitions and commands

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 15: Art primitives and packing

**Files:**
- Create: `src/art/raster.ts`, `src/art/palette.ts`, `src/art/draw.ts`, `src/art/grid.ts`, `src/art/outline.ts`, `src/art/painter.ts`, `src/art/pack.ts`, `src/art/anims.ts`
- Test: `tests/unit/art/raster.test.ts`, `tests/unit/art/pack.test.ts`, `tests/unit/art/anims.test.ts`

**Interfaces:**
- Consumes: `createRng`, `nextFloat`, `RngState` (Task 3); `Dir4` (Task 3).
- Produces:
  - Raster: `Raster { w; h; data: Uint8ClampedArray }`, `Rgba`, `TRANSPARENT`, and the functions `createRaster`, `hex`, `setPixel`, `getPixel`, `alphaAt`, `copyRaster`, `blit`, `flipX`, `extrude`, `countOpaque`, `rastersEqual`.
  - Palette: `C` (named colours).
  - Drawing: `Fill`, `rect`, `ellipse`, `line`.
  - Grids: `GridPalette`, `decodeGrid(rows, pal)`.
  - Outline: `outline(src, color, width)`.
  - Tile painter: `Painter { r; rng; fill; px; rect; speckle }`, `createPainter(w, h, seed)`.
  - Packing: `PackInput`, `Placement`, `PackResult { pageW; heights; placements }`, `packShelves(items, pageSize?, pad?)`.
  - Animations: `AnimDef`, `AnimTable`, `frameName(art, anim, dir, i)`, `frameFor(table, art, anim, facing, animT)`.

- [ ] **Step 1: Write the failing tests**

`tests/unit/art/raster.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { decodeGrid } from '@art/grid';
import { outline } from '@art/outline';
import { countOpaque, createRaster, extrude, flipX, getPixel, hex, setPixel } from '@art/raster';

describe('raster', () => {
  it('parses hex colours', () => {
    expect(hex('#ff8000')).toEqual([255, 128, 0, 255]);
    expect(() => hex('red')).toThrow("bad colour 'red'");
  });

  it('ignores writes outside the raster', () => {
    const r = createRaster(2, 2);
    setPixel(r, 5, 5, [1, 2, 3, 255]);
    setPixel(r, 1, 0, [1, 2, 3, 255]);
    expect(countOpaque(r)).toBe(1);
    expect(getPixel(r, -1, 0)).toEqual([0, 0, 0, 0]);
  });

  it('mirrors horizontally', () => {
    const r = createRaster(3, 1);
    setPixel(r, 0, 0, [9, 9, 9, 255]);
    expect(getPixel(flipX(r), 2, 0)).toEqual([9, 9, 9, 255]);
  });

  it('extrudes edge pixels outward', () => {
    const r = createRaster(2, 2);
    setPixel(r, 0, 0, [5, 5, 5, 255]);
    const e = extrude(r, 1);
    expect([e.w, e.h]).toEqual([4, 4]);
    expect(getPixel(e, 0, 0)).toEqual([5, 5, 5, 255]);
    expect(getPixel(e, 1, 1)).toEqual([5, 5, 5, 255]);
  });
});

describe('grids', () => {
  it('decodes palette-indexed rows', () => {
    const r = decodeGrid(['.a', 'a.'], { '.': null, a: '#010203' });
    expect(getPixel(r, 1, 0)).toEqual([1, 2, 3, 255]);
    expect(getPixel(r, 0, 0)[3]).toBe(0);
  });

  it('reports ragged rows and unknown colours', () => {
    expect(() => decodeGrid(['..', '.'], { '.': null })).toThrow('grid row 1: expected width 2, got 1');
    expect(() => decodeGrid(['.x'], { '.': null })).toThrow("grid row 0, col 1: unknown colour 'x'");
  });
});

describe('outline', () => {
  it('adds a 1 px ring (4-neighbour)', () => {
    const r = createRaster(5, 5);
    setPixel(r, 2, 2, [255, 255, 255, 255]);
    expect(countOpaque(outline(r, [0, 0, 0, 255], 1))).toBe(5);
  });

  it('adds a 2 px ring as a diamond', () => {
    const r = createRaster(7, 7);
    setPixel(r, 3, 3, [255, 255, 255, 255]);
    expect(countOpaque(outline(r, [0, 0, 0, 255], 2))).toBe(13);
  });
});
```

`tests/unit/art/pack.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { packShelves } from '@art/pack';

const items = Array.from({ length: 60 }, (_, i) => ({ name: `f${i}`, w: 16 + (i % 3) * 16, h: 16 + (i % 4) * 8 }));

describe('packShelves', () => {
  it('places every item inside a page without overlaps', () => {
    const result = packShelves(items, 256, 1);
    const boxes = items.map((it) => {
      const p = result.placements.get(it.name);
      if (p === undefined) throw new Error(`missing ${it.name}`);
      expect(p.x + it.w).toBeLessThanOrEqual(256);
      expect(p.y + it.h).toBeLessThanOrEqual(result.heights[p.page] ?? 0);
      return { ...p, w: it.w, h: it.h };
    });
    for (const a of boxes) {
      for (const b of boxes) {
        if (a === b || a.page !== b.page) continue;
        const overlap = a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
        expect(overlap).toBe(false);
      }
    }
  });

  it('opens more pages when needed and is deterministic', () => {
    const a = packShelves(items, 64, 1);
    const b = packShelves(items, 64, 1);
    expect(a.heights.length).toBeGreaterThan(1);
    expect([...a.placements.entries()]).toEqual([...b.placements.entries()]);
  });

  it('rejects an item larger than a page', () => {
    expect(() => packShelves([{ name: 'big', w: 300, h: 10 }], 256)).toThrow("frame 'big' (300×10) does not fit");
  });
});
```

`tests/unit/art/anims.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { frameFor, frameName, type AnimTable } from '@art/anims';

const table: AnimTable = {
  hero: {
    walk: { frames: 4, fps: 8, loop: true, dirs: ['s', 'n', 'w', 'e'] },
    roll: { frames: 4, fps: 12, loop: false, dirs: ['s'] },
  },
};

describe('frameFor', () => {
  it('names frames by convention', () => {
    expect(frameName('hero', 'walk', 's', 2)).toBe('hero_walk_s_2');
  });

  it('loops looping animations', () => {
    expect(frameFor(table, 'hero', 'walk', 'e', 0)).toBe('hero_walk_e_0');
    expect(frameFor(table, 'hero', 'walk', 'e', 30)).toBe('hero_walk_e_0');
    expect(frameFor(table, 'hero', 'walk', 'e', 8)).toBe('hero_walk_e_1');
  });

  it('holds the last frame of one-shots and falls back to the first direction', () => {
    expect(frameFor(table, 'hero', 'roll', 'w', 999)).toBe('hero_roll_s_3');
  });

  it('points unknown animations at a missing frame name', () => {
    expect(frameFor(table, 'hero', 'dance', 's', 0)).toBe('hero_dance_missing');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm vitest run tests/unit/art`
Expected: FAIL — modules not found (the grading test from Task 13 keeps passing).

- [ ] **Step 3: Implement**

`src/art/raster.ts`:

```ts
/** RGBA pixels, row-major. The art layer's only output format; the shell turns these into textures. */
export interface Raster {
  readonly w: number;
  readonly h: number;
  readonly data: Uint8ClampedArray;
}

export type Rgba = readonly [number, number, number, number];

export const TRANSPARENT: Rgba = [0, 0, 0, 0];

export function createRaster(w: number, h: number): Raster {
  return { w, h, data: new Uint8ClampedArray(w * h * 4) };
}

export function hex(color: string): Rgba {
  const m = /^#([0-9a-f]{6})$/i.exec(color);
  if (m === null) throw new Error(`bad colour '${color}'`);
  const n = Number.parseInt(m[1] ?? '', 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff, 255];
}

const inside = (r: Raster, x: number, y: number): boolean => x >= 0 && y >= 0 && x < r.w && y < r.h;

export function setPixel(r: Raster, x: number, y: number, c: Rgba): void {
  if (!inside(r, x, y)) return;
  const i = (y * r.w + x) * 4;
  r.data[i] = c[0];
  r.data[i + 1] = c[1];
  r.data[i + 2] = c[2];
  r.data[i + 3] = c[3];
}

export function getPixel(r: Raster, x: number, y: number): Rgba {
  if (!inside(r, x, y)) return TRANSPARENT;
  const i = (y * r.w + x) * 4;
  return [r.data[i] ?? 0, r.data[i + 1] ?? 0, r.data[i + 2] ?? 0, r.data[i + 3] ?? 0];
}

export const alphaAt = (r: Raster, x: number, y: number): number =>
  inside(r, x, y) ? (r.data[(y * r.w + x) * 4 + 3] ?? 0) : 0;

export function copyRaster(src: Raster): Raster {
  return { w: src.w, h: src.h, data: new Uint8ClampedArray(src.data) };
}

/** Draws `src` onto `dst` at (dx, dy), skipping transparent pixels. */
export function blit(dst: Raster, src: Raster, dx: number, dy: number): void {
  for (let y = 0; y < src.h; y++) {
    for (let x = 0; x < src.w; x++) {
      const c = getPixel(src, x, y);
      if (c[3] > 0) setPixel(dst, dx + x, dy + y, c);
    }
  }
}

export function flipX(src: Raster): Raster {
  const out = createRaster(src.w, src.h);
  for (let y = 0; y < src.h; y++) {
    for (let x = 0; x < src.w; x++) setPixel(out, src.w - 1 - x, y, getPixel(src, x, y));
  }
  return out;
}

/** Copies `src` into a raster `n` px larger on every side, repeating edge pixels (stops tile seams). */
export function extrude(src: Raster, n = 1): Raster {
  const out = createRaster(src.w + 2 * n, src.h + 2 * n);
  for (let y = -n; y < src.h + n; y++) {
    for (let x = -n; x < src.w + n; x++) {
      const sx = Math.min(src.w - 1, Math.max(0, x));
      const sy = Math.min(src.h - 1, Math.max(0, y));
      setPixel(out, x + n, y + n, getPixel(src, sx, sy));
    }
  }
  return out;
}

export function countOpaque(r: Raster): number {
  let n = 0;
  for (let i = 3; i < r.data.length; i += 4) if ((r.data[i] ?? 0) > 0) n += 1;
  return n;
}

export function rastersEqual(a: Raster, b: Raster): boolean {
  if (a.w !== b.w || a.h !== b.h) return false;
  return a.data.every((v, i) => v === b.data[i]);
}
```

`src/art/palette.ts`:

```ts
/** Placeholder palette: flat fills with one darker shade each (cel look). */
export const C = {
  ink: '#1b1522',
  skin: '#e8b796',
  skinShade: '#b77f62',
  hair: '#d9c07a',
  hairShade: '#a88a4a',
  tunic: '#5f8f4e',
  tunicShade: '#3f6437',
  belt: '#6b4a2f',
  pants: '#6d6a5f',
  pantsShade: '#4b4940',
  boot: '#3b2b22',
  steel: '#c9d3dc',
  steelShade: '#8795a3',
  wood: '#8a5a33',
  woodShade: '#5e3b20',
  shield: '#b0453a',
  shieldShade: '#7a2c26',
  shieldRim: '#d9b34a',
  straw: '#d8b85a',
  strawShade: '#a8883a',
  sack: '#c9b18a',
  sackShade: '#9c8663',
  grass: '#6aa84f',
  grassShade: '#4f8a3c',
  grassLight: '#8cc46a',
  dirt: '#b88a5a',
  dirtShade: '#8f6a43',
  water: '#3f7fbf',
  waterShade: '#2f5f99',
  waterLight: '#8fc3ea',
  rock: '#8a8f99',
  rockShade: '#5d626b',
  rockLight: '#b4b9c2',
  leaf: '#3d7a3a',
  leafShade: '#285a2a',
  leafLight: '#5d9a4a',
  trunk: '#6b4a2f',
  missing: '#ff00ff',
} as const;
```

`src/art/draw.ts`:

```ts
import { setPixel, type Raster, type Rgba } from './raster';

export type Fill = Rgba | ((x: number, y: number) => Rgba);

const colourAt = (fill: Fill, x: number, y: number): Rgba => (typeof fill === 'function' ? fill(x, y) : fill);

export function rect(r: Raster, x: number, y: number, w: number, h: number, c: Rgba): void {
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) setPixel(r, xx, yy, c);
}

/** Fills pixels whose centres lie inside the ellipse. */
export function ellipse(r: Raster, cx: number, cy: number, rx: number, ry: number, fill: Fill): void {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x + 0.5 - cx) / rx;
      const dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy <= 1) setPixel(r, x, y, colourAt(fill, x, y));
    }
  }
}

/** Bresenham line between integer points. */
export function line(r: Raster, x0: number, y0: number, x1: number, y1: number, c: Rgba): void {
  let x = Math.round(x0);
  let y = Math.round(y0);
  const tx = Math.round(x1);
  const ty = Math.round(y1);
  const dx = Math.abs(tx - x);
  const dy = -Math.abs(ty - y);
  const sx = x < tx ? 1 : -1;
  const sy = y < ty ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    setPixel(r, x, y, c);
    if (x === tx && y === ty) return;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
}
```

`src/art/grid.ts`:

```ts
import { createRaster, hex, setPixel, type Raster } from './raster';

/** Character → colour ('#rrggbb') or null for transparent. */
export type GridPalette = Readonly<Record<string, string | null>>;

export function decodeGrid(rows: readonly string[], pal: GridPalette): Raster {
  const w = rows[0]?.length ?? 0;
  const r = createRaster(w, rows.length);
  rows.forEach((row, y) => {
    if (row.length !== w) throw new Error(`grid row ${y}: expected width ${w}, got ${row.length}`);
    for (let x = 0; x < w; x++) {
      const ch = row.charAt(x);
      if (!(ch in pal)) throw new Error(`grid row ${y}, col ${x}: unknown colour '${ch}'`);
      const colour = pal[ch];
      if (colour !== null && colour !== undefined) setPixel(r, x, y, hex(colour));
    }
  });
  return r;
}
```

`src/art/outline.ts`:

```ts
import { alphaAt, copyRaster, setPixel, type Raster, type Rgba } from './raster';

/** Adds an outline around opaque pixels, one 4-neighbour ring per pass. The source needs `width` px of margin. */
export function outline(src: Raster, color: Rgba, width: 1 | 2): Raster {
  let current = src;
  for (let pass = 0; pass < width; pass++) {
    const out = copyRaster(current);
    for (let y = 0; y < current.h; y++) {
      for (let x = 0; x < current.w; x++) {
        if (alphaAt(current, x, y) > 0) continue;
        const touches =
          alphaAt(current, x - 1, y) > 0 ||
          alphaAt(current, x + 1, y) > 0 ||
          alphaAt(current, x, y - 1) > 0 ||
          alphaAt(current, x, y + 1) > 0;
        if (touches) setPixel(out, x, y, color);
      }
    }
    current = out;
  }
  return current;
}
```

`src/art/painter.ts`:

```ts
import { createRng, nextFloat, type RngState } from '@core/math/rng';
import { createRaster, hex, setPixel, type Raster, type Rgba } from './raster';

/** A seeded drawing surface for procedural tiles. Same seed ⇒ same pixels. */
export interface Painter {
  readonly r: Raster;
  readonly rng: RngState;
  fill(color: string): void;
  px(x: number, y: number, color: string): void;
  rect(x: number, y: number, w: number, h: number, color: string): void;
  speckle(color: string, density: number): void;
}

export function createPainter(w: number, h: number, seed: number): Painter {
  const r = createRaster(w, h);
  const rng = createRng(seed);
  const cache = new Map<string, Rgba>();
  const rgba = (color: string): Rgba => {
    let c = cache.get(color);
    if (c === undefined) {
      c = hex(color);
      cache.set(color, c);
    }
    return c;
  };
  const px = (x: number, y: number, color: string): void => {
    setPixel(r, x, y, rgba(color));
  };
  const rect = (x: number, y: number, rw: number, rh: number, color: string): void => {
    for (let yy = y; yy < y + rh; yy++) for (let xx = x; xx < x + rw; xx++) px(xx, yy, color);
  };
  return {
    r,
    rng,
    px,
    rect,
    fill: (color) => {
      rect(0, 0, w, h, color);
    },
    speckle: (color, density) => {
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (nextFloat(rng) < density) px(x, y, color);
    },
  };
}
```

`src/art/pack.ts`:

```ts
export interface PackInput {
  readonly name: string;
  readonly w: number;
  readonly h: number;
}

export interface Placement {
  readonly page: number;
  readonly x: number;
  readonly y: number;
}

export interface PackResult {
  readonly pageW: number;
  /** Used height of each page (pages are only as tall as they need to be). */
  readonly heights: readonly number[];
  readonly placements: ReadonlyMap<string, Placement>;
}

/** Shelf packing, tallest first. Deterministic for the same input. */
export function packShelves(items: readonly PackInput[], pageSize = 2048, pad = 1): PackResult {
  const sorted = [...items].sort((a, b) => b.h - a.h || a.name.localeCompare(b.name));
  const placements = new Map<string, Placement>();
  const heights: number[] = [0];
  let page = 0;
  let x = 0;
  let shelfY = 0;
  let shelfH = 0;
  for (const it of sorted) {
    if (it.w + pad > pageSize || it.h + pad > pageSize) {
      throw new Error(`frame '${it.name}' (${it.w}×${it.h}) does not fit a ${pageSize}px page`);
    }
    if (x + it.w + pad > pageSize) {
      shelfY += shelfH;
      x = 0;
      shelfH = 0;
    }
    if (shelfY + it.h + pad > pageSize) {
      page += 1;
      heights.push(0);
      x = 0;
      shelfY = 0;
      shelfH = 0;
    }
    placements.set(it.name, { page, x, y: shelfY });
    x += it.w + pad;
    shelfH = Math.max(shelfH, it.h + pad);
    heights[page] = Math.max(heights[page] ?? 0, shelfY + shelfH);
  }
  return { pageW: pageSize, heights, placements };
}
```

`src/art/anims.ts`:

```ts
import type { Dir4 } from '@core/math/dir';

export interface AnimDef {
  readonly frames: number;
  readonly fps: number;
  readonly loop: boolean;
  /** Directions drawn for this animation; others fall back to the first. */
  readonly dirs: readonly Dir4[];
}

/** art key → animation name → definition. */
export type AnimTable = Readonly<Record<string, Readonly<Record<string, AnimDef>>>>;

export const frameName = (art: string, anim: string, dir: Dir4, i: number): string => `${art}_${anim}_${dir}_${i}`;

/** Frame to show for an entity; `animT` counts 60 Hz ticks since the animation started. */
export function frameFor(table: AnimTable, art: string, anim: string, facing: Dir4, animT: number): string {
  const def = table[art]?.[anim];
  if (def === undefined) return `${art}_${anim}_missing`;
  const dir = def.dirs.includes(facing) ? facing : (def.dirs[0] ?? 's');
  const step = Math.floor((animT * def.fps) / 60);
  const i = def.loop ? step % def.frames : Math.min(def.frames - 1, step);
  return frameName(art, anim, dir, i);
}
```

- [ ] **Step 4: Run tests**

Run: `pnpm vitest run tests/unit/art`
Expected: PASS.

- [ ] **Step 5: Gate and commit**

Run: `pnpm check`

```bash
git add -A
git commit -m "Add pure art primitives: rasters, grids, outlines, painters, packing, animations

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 16: Terrain tiles

**Files:**
- Create: `src/art/tiles/blob.ts`, `src/art/tiles/terrain.ts`, `src/art/tiles/tileset.ts`, `src/art/tiles/indices.ts`
- Test: `tests/unit/art/tiles.test.ts`

**Interfaces:**
- Consumes:
  - From Task 8: `BLOB_MASKS`, `blobIndex`, `neighbourMask`, `reduceMask` and the direction bits; `TERRAIN_IDS`, `TerrainId`, `TerrainGrid`.
  - From Task 15: `createPainter`, `Painter`, `C`.
  - From Task 3: `hashInts`, `nextFloat`.
- Produces:
  - Blob shapes: `insideBlob(mask, x, y, inset)`, `onBlobEdge(mask, x, y, inset)`.
  - Terrain art: `TerrainArt { autotile; variants; paint }`, `TERRAIN_ART`.
  - Tileset: `TilesetEntry { start; count; autotile }`, `Tileset { tiles; entries }`, `buildTileset()`.
  - Indices: `tileIndices(grid, tileset, salt): number[]`.

- [ ] **Step 1: Write the failing tests**

`tests/unit/art/tiles.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { insideBlob, onBlobEdge } from '@art/tiles/blob';
import { tileIndices } from '@art/tiles/indices';
import { buildTileset } from '@art/tiles/tileset';
import { TERRAIN_IDS, type TerrainId } from '@content/terrain';
import { rastersEqual } from '@art/raster';

describe('blob shapes', () => {
  it('fills a fully surrounded tile completely', () => {
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) expect(insideBlob(0xff, x, y, 3)).toBe(true);
  });

  it('insets an isolated tile on every side and rounds its corners', () => {
    expect(insideBlob(0, 1, 8, 3)).toBe(false);
    expect(insideBlob(0, 8, 8, 3)).toBe(true);
    expect(insideBlob(0, 3, 3, 3)).toBe(false);
    expect(onBlobEdge(0, 3, 8, 3)).toBe(true);
    expect(onBlobEdge(0, 8, 8, 3)).toBe(false);
  });
});

describe('tileset', () => {
  const ts = buildTileset();

  it('has an entry for every terrain, with 47 variants for auto-tiled ones', () => {
    for (const id of TERRAIN_IDS) {
      const e = ts.entries[id];
      if (e.autotile) expect(e.count).toBe(47);
      else expect(e.count).toBeGreaterThan(0);
    }
    const total = TERRAIN_IDS.reduce((n, id) => n + ts.entries[id].count, 0);
    expect(ts.tiles).toHaveLength(total);
    expect(ts.tiles.every((t) => t.w === 16 && t.h === 16)).toBe(true);
  });

  it('is deterministic', () => {
    const again = buildTileset();
    expect(ts.tiles.every((t, i) => rastersEqual(t, again.tiles[i] ?? t))).toBe(true);
  });

  it('picks blob variants from neighbours', () => {
    const cells: TerrainId[] = Array.from({ length: 9 }, () => 'grass');
    cells[4] = 'water';
    const lone = tileIndices({ cols: 3, rows: 3, cells }, ts, 1);
    expect(lone[4]).toBe(ts.entries.water.start);
    const pond = tileIndices({ cols: 3, rows: 3, cells: Array.from({ length: 9 }, () => 'water') }, ts, 1);
    expect(pond[4]).toBe(ts.entries.water.start + 46);
  });

  it('keeps plain-terrain variants inside the terrain range', () => {
    const grass = tileIndices({ cols: 40, rows: 22, cells: Array.from({ length: 880 }, () => 'grass') }, ts, 7);
    const { start, count } = ts.entries.grass;
    expect(grass.every((i) => i >= start && i < start + count)).toBe(true);
    expect(new Set(grass).size).toBeGreaterThan(1);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm vitest run tests/unit/art/tiles.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement**

`src/art/tiles/blob.ts`:

```ts
import { E, N, NE, NW, S, SE, SW, W, reduceMask } from '@core/world/autotile';

const TILE = 16;

function neighbourBit(dx: number, dy: number): number {
  if (dy < 0) return dx < 0 ? NW : dx > 0 ? NE : N;
  if (dy > 0) return dx < 0 ? SW : dx > 0 ? SE : S;
  return dx < 0 ? W : E;
}

/**
 * Is pixel (x, y) of a 16×16 tile inside the terrain region for this neighbour mask? The region is inset
 * `inset` px on sides without a same-terrain neighbour, notched at inner corners and rounded at outer ones.
 * Coordinates just outside the tile answer for the neighbour in that direction.
 */
export function insideBlob(mask: number, x: number, y: number, inset: number): boolean {
  const m = reduceMask(mask);
  if (x < 0 || y < 0 || x >= TILE || y >= TILE) {
    const dx = x < 0 ? -1 : x >= TILE ? 1 : 0;
    const dy = y < 0 ? -1 : y >= TILE ? 1 : 0;
    return (m & neighbourBit(dx, dy)) !== 0;
  }
  const n = (m & N) !== 0;
  const e = (m & E) !== 0;
  const s = (m & S) !== 0;
  const w = (m & W) !== 0;
  const far = TILE - 1 - inset;
  if (!n && y < inset) return false;
  if (!s && y > far) return false;
  if (!w && x < inset) return false;
  if (!e && x > far) return false;
  if (n && w && (m & NW) === 0 && x < inset && y < inset) return false;
  if (n && e && (m & NE) === 0 && x > far && y < inset) return false;
  if (s && w && (m & SW) === 0 && x < inset && y > far) return false;
  if (s && e && (m & SE) === 0 && x > far && y > far) return false;
  if (!n && !w && x === inset && y === inset) return false;
  if (!n && !e && x === far && y === inset) return false;
  if (!s && !w && x === inset && y === far) return false;
  if (!s && !e && x === far && y === far) return false;
  return true;
}

/** Inside, but touching the outside on a 4-neighbour: where the terrain's edge colour goes. */
export function onBlobEdge(mask: number, x: number, y: number, inset: number): boolean {
  if (!insideBlob(mask, x, y, inset)) return false;
  return (
    !insideBlob(mask, x - 1, y, inset) ||
    !insideBlob(mask, x + 1, y, inset) ||
    !insideBlob(mask, x, y - 1, inset) ||
    !insideBlob(mask, x, y + 1, inset)
  );
}
```

`src/art/tiles/terrain.ts`:

```ts
import type { TerrainId } from '@content/terrain';
import { nextFloat } from '@core/math/rng';
import { C } from '../palette';
import type { Painter } from '../painter';
import { insideBlob, onBlobEdge } from './blob';

export interface TerrainArt {
  readonly autotile: boolean;
  /** Plain variants (ignored for auto-tiled terrain, which always has 47). */
  readonly variants: number;
  paint(p: Painter, v: { readonly mask: number; readonly variant: number }): void;
}

function grass(p: Painter): void {
  p.fill(C.grass);
  p.speckle(C.grassShade, 0.14);
  p.speckle(C.grassLight, 0.05);
}

function region(p: Painter, mask: number, inset: number, fill: string, edge: string, speck: string, density: number): void {
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      if (!insideBlob(mask, x, y, inset)) continue;
      if (onBlobEdge(mask, x, y, inset)) p.px(x, y, edge);
      else p.px(x, y, nextFloat(p.rng) < density ? speck : fill);
    }
  }
}

function tree(p: Painter, variant: number): void {
  grass(p);
  p.rect(7, 12, 2, 4, C.trunk);
  const cx = 7.5;
  const cy = 6.5;
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > 7) continue;
      if (d > 6) p.px(x, y, C.ink);
      else if (dx + dy > 2) p.px(x, y, C.leafShade);
      else p.px(x, y, C.leaf);
    }
  }
  const hx = 5 + variant;
  p.px(hx, 4, C.leafLight);
  p.px(hx + 1, 4, C.leafLight);
  p.px(hx, 5, C.leafLight);
}

export const TERRAIN_ART: Readonly<Record<TerrainId, TerrainArt>> = {
  grass: { autotile: false, variants: 4, paint: (p) => { grass(p); } },
  path: {
    autotile: true,
    variants: 0,
    paint: (p, v) => {
      grass(p);
      region(p, v.mask, 2, C.dirt, C.dirtShade, C.dirtShade, 0.1);
    },
  },
  water: {
    autotile: true,
    variants: 0,
    paint: (p, v) => {
      grass(p);
      region(p, v.mask, 3, C.water, C.waterLight, C.waterShade, 0.08);
    },
  },
  rock: {
    autotile: true,
    variants: 0,
    paint: (p, v) => {
      grass(p);
      region(p, v.mask, 1, C.rock, C.rockShade, C.rockLight, 0.12);
    },
  },
  tree: { autotile: false, variants: 2, paint: (p, v) => { tree(p, v.variant); } },
};
```

`src/art/tiles/tileset.ts`:

```ts
import { TERRAIN_IDS, type TerrainId } from '@content/terrain';
import { hashInts } from '@core/math/hash';
import { BLOB_MASKS } from '@core/world/autotile';
import { createPainter } from '../painter';
import type { Raster } from '../raster';
import { TERRAIN_ART } from './terrain';

export interface TilesetEntry {
  readonly start: number;
  readonly count: number;
  readonly autotile: boolean;
}

export interface Tileset {
  readonly tiles: readonly Raster[];
  readonly entries: Readonly<Record<TerrainId, TilesetEntry>>;
}

/** Paints every tile variant once, in TERRAIN_IDS order. Auto-tiled terrain gets all 47 blob variants. */
export function buildTileset(): Tileset {
  const tiles: Raster[] = [];
  const entries = {} as Record<TerrainId, TilesetEntry>;
  TERRAIN_IDS.forEach((id, terrainIndex) => {
    const art = TERRAIN_ART[id];
    const start = tiles.length;
    const count = art.autotile ? BLOB_MASKS.length : art.variants;
    for (let i = 0; i < count; i++) {
      const p = createPainter(16, 16, hashInts(terrainIndex, i, 0x7e11));
      art.paint(p, { mask: art.autotile ? (BLOB_MASKS[i] ?? 0) : 0xff, variant: i });
      tiles.push(p.r);
    }
    entries[id] = { start, count, autotile: art.autotile };
  });
  return { tiles, entries };
}
```

`src/art/tiles/indices.ts`:

```ts
import { hashInts } from '@core/math/hash';
import { blobIndex, neighbourMask } from '@core/world/autotile';
import type { TerrainGrid } from '@core/world/textmap';
import type { Tileset } from './tileset';

/** Tileset index for every cell: blob variant for auto-tiled terrain, a stable hashed variant otherwise. */
export function tileIndices(grid: TerrainGrid, tileset: Tileset, salt: number): number[] {
  const out: number[] = [];
  for (let y = 0; y < grid.rows; y++) {
    for (let x = 0; x < grid.cols; x++) {
      const terrain = grid.cells[y * grid.cols + x];
      if (terrain === undefined) throw new Error(`no terrain at ${x},${y}`);
      const entry = tileset.entries[terrain];
      if (entry.autotile) {
        const mask = neighbourMask(x, y, grid.cols, grid.rows, (nx, ny) => grid.cells[ny * grid.cols + nx] === terrain);
        out.push(entry.start + blobIndex(mask));
      } else {
        out.push(entry.start + (hashInts(x, y, salt) % entry.count));
      }
    }
  }
  return out;
}
```

- [ ] **Step 4: Run tests**

Run: `pnpm vitest run tests/unit/art/tiles.test.ts`
Expected: PASS.

- [ ] **Step 5: Gate and commit**

Run: `pnpm check`

```bash
git add -A
git commit -m "Add procedural terrain tiles with 47-variant blob auto-tiling

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 17: Hero and dummy sprites

**Files:**
- Create: `src/art/sprites/types.ts`, `src/art/sprites/hero.ts`, `src/art/sprites/dummy.ts`, `src/art/sprites/missing.ts`, `src/art/sprites/index.ts`
- Test: `tests/unit/art/sprites.test.ts`

**Interfaces:**
- Consumes: Task 15 primitives; `Dir4`.
- Produces:
  - Types: `SpriteFrame { name; raster; ox; oy }`, where `ox`/`oy` is the feet pixel.
  - Functions: `heroFrames()`, `dummyFrames()`, `missingFrame()`, `buildSprites()`.
  - Tables: `HERO_ANIMS`, `DUMMY_ANIMS`, `ANIMS: AnimTable` (keys `hero`, `prop_dummy`).
  - Frame sizes: hero 32×32 with feet at (16, 30); hero attack, charge and spin frames 48×48 with feet at (24, 38).

- [ ] **Step 1: Write the failing tests**

`tests/unit/art/sprites.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { frameName } from '@art/anims';
import { countOpaque, flipX, rastersEqual } from '@art/raster';
import { ANIMS, buildSprites } from '@art/sprites';

const frames = buildSprites();
const byName = new Map(frames.map((f) => [f.name, f]));

function frame(name: string): (typeof frames)[number] {
  const f = byName.get(name);
  if (f === undefined) throw new Error(`missing ${name}`);
  return f;
}

describe('sprites', () => {
  it('has unique frame names', () => {
    expect(byName.size).toBe(frames.length);
  });

  it('draws every frame the animation table refers to', () => {
    for (const [art, anims] of Object.entries(ANIMS)) {
      for (const [anim, def] of Object.entries(anims)) {
        for (const dir of def.dirs) {
          for (let i = 0; i < def.frames; i++) {
            const name = frameName(art, anim, dir, i);
            expect(byName.has(name), name).toBe(true);
          }
        }
      }
    }
  });

  it('draws something in every frame, with the feet inside it', () => {
    for (const f of frames) {
      expect(countOpaque(f.raster), f.name).toBeGreaterThan(20);
      expect(f.ox).toBeGreaterThanOrEqual(0);
      expect(f.ox).toBeLessThanOrEqual(f.raster.w);
      expect(f.oy).toBeGreaterThanOrEqual(0);
      expect(f.oy).toBeLessThanOrEqual(f.raster.h);
    }
  });

  it('bakes east-facing frames as mirrors of west-facing ones', () => {
    expect(rastersEqual(frame('hero_walk_e_2').raster, flipX(frame('hero_walk_w_2').raster))).toBe(true);
    expect(rastersEqual(frame('hero_attack1_e_1').raster, flipX(frame('hero_attack1_w_1').raster))).toBe(true);
  });

  it('uses 48 px frames for sword poses', () => {
    expect(frame('hero_attack2_s_0').raster.w).toBe(48);
    expect(frame('hero_walk_s_0').raster.w).toBe(32);
  });

  it('is deterministic', () => {
    const again = new Map(buildSprites().map((f) => [f.name, f]));
    for (const name of ['hero_idle_s_0', 'hero_spin_s_3', 'prop_dummy_hurt_s_1']) {
      const other = again.get(name);
      expect(other && rastersEqual(frame(name).raster, other.raster)).toBe(true);
    }
  });

  it('includes the missing-art fallback', () => {
    expect(byName.has('missing')).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm vitest run tests/unit/art/sprites.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement**

`src/art/sprites/types.ts`:

```ts
import type { Raster } from '../raster';

/** One named frame. (ox, oy) is the entity's feet point inside the frame, in pixels. */
export interface SpriteFrame {
  readonly name: string;
  readonly raster: Raster;
  readonly ox: number;
  readonly oy: number;
}
```

`src/art/sprites/hero.ts`:

```ts
import type { Dir4 } from '@core/math/dir';
import type { AnimDef } from '../anims';
import { ellipse, line, rect } from '../draw';
import { outline } from '../outline';
import { C } from '../palette';
import { createRaster, flipX, hex, type Raster } from '../raster';
import type { SpriteFrame } from './types';

const P = {
  ink: hex(C.ink),
  skin: hex(C.skin),
  skinShade: hex(C.skinShade),
  hair: hex(C.hair),
  hairShade: hex(C.hairShade),
  tunic: hex(C.tunic),
  tunicShade: hex(C.tunicShade),
  belt: hex(C.belt),
  pants: hex(C.pants),
  pantsShade: hex(C.pantsShade),
  boot: hex(C.boot),
  steel: hex(C.steel),
  steelShade: hex(C.steelShade),
  grip: hex(C.wood),
  shield: hex(C.shield),
  shieldShade: hex(C.shieldShade),
  rim: hex(C.shieldRim),
} as const;

/** Drawn sides; east is baked by mirroring west. */
type Side = 's' | 'n' | 'w';
type ShieldPos = 'none' | 'front' | 'side' | 'back';
type SwordDir = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';

const SMALL = 32;
const LARGE = 48;
const HAND: Readonly<Record<Side, readonly [number, number]>> = { s: [23, 22], w: [12, 21], n: [9, 20] };
const SWORD_VEC: Readonly<Record<SwordDir, readonly [number, number]>> = {
  n: [0, -1],
  ne: [1, -1],
  e: [1, 0],
  se: [1, 1],
  s: [0, 1],
  sw: [-1, 1],
  w: [-1, 0],
  nw: [-1, -1],
};
const RESTING: Readonly<Record<Side, ShieldPos>> = { s: 'none', w: 'none', n: 'back' };
const RAISED: Readonly<Record<Side, ShieldPos>> = { s: 'front', w: 'side', n: 'back' };
const FORWARD: Readonly<Record<Side, SwordDir>> = { s: 's', w: 'w', n: 'n' };
const ATTACK_ARCS: Readonly<Record<Side, Readonly<Record<'attack1' | 'attack2' | 'attack3', readonly SwordDir[]>>>> = {
  s: { attack1: ['e', 'se', 's'], attack2: ['w', 'sw', 's'], attack3: ['s', 's', 's'] },
  w: { attack1: ['n', 'nw', 'w'], attack2: ['s', 'sw', 'w'], attack3: ['w', 'w', 'w'] },
  n: { attack1: ['w', 'nw', 'n'], attack2: ['e', 'ne', 'n'], attack3: ['n', 'n', 'n'] },
};
const ROLL_SPOTS: readonly (readonly [number, number])[] = [
  [0, -4],
  [4, 0],
  [0, 4],
  [-4, 0],
];

function legs(r: Raster, o: number, side: Side, phase: number): void {
  if (side === 'w') {
    const swing = [0, 1, 0, -1][phase] ?? 0;
    rect(r, o + 16 - swing, o + 24, 3, 4, P.pantsShade);
    rect(r, o + 16 - swing, o + 28, 4, 2, P.boot);
    rect(r, o + 13 + swing, o + 24, 3, 4, P.pants);
    rect(r, o + 12 + swing, o + 28, 4, 2, P.boot);
    return;
  }
  const liftL = phase === 1 ? 1 : 0;
  const liftR = phase === 3 ? 1 : 0;
  rect(r, o + 12, o + 24, 3, 4 - liftL, P.pants);
  rect(r, o + 11, o + 28 - liftL, 4, 2, P.boot);
  rect(r, o + 17, o + 24, 3, 4 - liftR, P.pantsShade);
  rect(r, o + 17, o + 28 - liftR, 4, 2, P.boot);
}

function torso(r: Raster, o: number, b: number, side: Side): void {
  if (side === 'w') {
    rect(r, o + 11, b + 15, 10, 9, P.tunic);
    rect(r, o + 18, b + 15, 3, 9, P.tunicShade);
    rect(r, o + 11, b + 21, 10, 1, P.belt);
    rect(r, o + 13, b + 16, 3, 6, P.tunicShade);
    rect(r, o + 13, b + 22, 3, 2, P.skin);
    return;
  }
  rect(r, o + 10, b + 15, 12, 9, P.tunic);
  rect(r, o + 19, b + 15, 3, 9, P.tunicShade);
  rect(r, o + 10, b + 21, 12, 1, P.belt);
  rect(r, o + 8, b + 16, 2, 6, P.tunic);
  rect(r, o + 8, b + 22, 2, 2, P.skin);
  rect(r, o + 22, b + 16, 2, 6, P.tunicShade);
  rect(r, o + 22, b + 22, 2, 2, P.skinShade);
}

function head(r: Raster, o: number, b: number, side: Side): void {
  const cx = o + 16;
  const cy = b + 8.5;
  ellipse(r, cx, cy, 6.5, 6.5, (x, y) => {
    const dx = x + 0.5 - cx;
    const dy = y + 0.5 - cy;
    if (side === 'n') return dx > 2.5 ? P.hairShade : P.hair;
    if (side === 's') {
      if (dy < -1.5 || Math.abs(dx) > 5) return dx > 3 ? P.hairShade : P.hair;
      return dx > 2.5 ? P.skinShade : P.skin;
    }
    if (dy < -1.5 || dx > 0.5) return dx > 3.5 ? P.hairShade : P.hair;
    return dy > 3 ? P.skinShade : P.skin;
  });
  if (side === 's') {
    rect(r, o + 13, b + 9, 1, 2, P.ink);
    rect(r, o + 18, b + 9, 1, 2, P.ink);
  }
  if (side === 'w') rect(r, o + 11, b + 9, 1, 2, P.ink);
}

function shield(r: Raster, o: number, b: number, pos: ShieldPos): void {
  const disc = (cx: number, cy: number, rx: number, ry: number): void => {
    ellipse(r, cx, cy, rx, ry, (x, y) => {
      const dx = (x + 0.5 - cx) / rx;
      const dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy > 0.62) return P.rim;
      return dx + dy > 0.3 ? P.shieldShade : P.shield;
    });
  };
  if (pos === 'front') disc(o + 16, b + 19.5, 5.5, 5.5);
  else if (pos === 'side') disc(o + 10, b + 19, 3, 5.5);
  else if (pos === 'back') disc(o + 16, b + 18.5, 5, 5);
}

function sword(r: Raster, hx: number, hy: number, dir: SwordDir): void {
  const [dx, dy] = SWORD_VEC[dir];
  const len = dx !== 0 && dy !== 0 ? 9 : 12;
  const px = -dy;
  const py = dx;
  line(r, hx - dx * 3, hy - dy * 3, hx, hy, P.grip);
  line(r, hx - px * 2, hy - py * 2, hx + px * 2, hy + py * 2, P.grip);
  line(r, hx + dx, hy + dy, hx + dx * len, hy + dy * len, P.steel);
  line(r, hx + dx + px, hy + dy + py, hx + dx * len + px, hy + dy * len + py, P.steelShade);
}

interface Pose {
  readonly side: Side;
  readonly phase: number;
  readonly shield: ShieldPos;
  readonly sword?: SwordDir;
}

function drawPose(pose: Pose, size: number): Raster {
  const r = createRaster(size, size);
  const o = (size - SMALL) / 2;
  const b = o - (pose.phase === 1 || pose.phase === 3 ? 1 : 0);
  const [hx, hy] = HAND[pose.side];
  const behind = pose.side === 'n';
  if (pose.sword !== undefined && behind) sword(r, o + hx, b + hy, pose.sword);
  legs(r, o, pose.side, pose.phase);
  torso(r, o, b, pose.side);
  head(r, o, b, pose.side);
  shield(r, o, b, pose.shield);
  if (pose.sword !== undefined && !behind) sword(r, o + hx, b + hy, pose.sword);
  return outline(r, P.ink, 2);
}

function drawRoll(i: number): Raster {
  const r = createRaster(SMALL, SMALL);
  ellipse(r, 16, 21, 7, 7, (x, y) => (x + y > 38 ? P.tunicShade : P.tunic));
  const [sx, sy] = ROLL_SPOTS[i % ROLL_SPOTS.length] ?? [0, -4];
  ellipse(r, 16 + sx, 21 + sy, 3, 3, P.hair);
  rect(r, 15 - sx, 20 - sy, 3, 2, P.boot);
  return outline(r, P.ink, 2);
}

const frame = (name: string, raster: Raster): SpriteFrame =>
  raster.w === LARGE ? { name, raster, ox: 24, oy: 38 } : { name, raster, ox: 16, oy: 30 };

export function heroFrames(): SpriteFrame[] {
  const out: SpriteFrame[] = [];
  const add = (anim: string, side: Side, i: number, raster: Raster): void => {
    out.push(frame(`hero_${anim}_${side}_${i}`, raster));
    if (side === 'w') out.push(frame(`hero_${anim}_e_${i}`, flipX(raster)));
  };
  for (const side of ['s', 'n', 'w'] as const) {
    add('idle', side, 0, drawPose({ side, phase: 0, shield: RESTING[side] }, SMALL));
    add('hurt', side, 0, drawPose({ side, phase: 0, shield: RESTING[side] }, SMALL));
    add('shield', side, 0, drawPose({ side, phase: 0, shield: RAISED[side] }, SMALL));
    for (let i = 0; i < 4; i++) {
      add('walk', side, i, drawPose({ side, phase: i, shield: RESTING[side] }, SMALL));
      add('shieldwalk', side, i, drawPose({ side, phase: i, shield: RAISED[side] }, SMALL));
    }
    add('charge', side, 0, drawPose({ side, phase: 0, shield: RESTING[side], sword: FORWARD[side] }, LARGE));
    for (const anim of ['attack1', 'attack2', 'attack3'] as const) {
      ATTACK_ARCS[side][anim].forEach((dir, i) => {
        add(anim, side, i, drawPose({ side, phase: 0, shield: RESTING[side], sword: dir }, LARGE));
      });
    }
  }
  const spin: readonly (readonly [Side, boolean])[] = [
    ['s', false],
    ['w', false],
    ['n', false],
    ['w', true],
  ];
  spin.forEach(([side, mirror], i) => {
    const r = drawPose({ side, phase: 0, shield: RESTING[side], sword: FORWARD[side] }, LARGE);
    out.push(frame(`hero_spin_s_${i}`, mirror ? flipX(r) : r));
  });
  for (let i = 0; i < 4; i++) out.push(frame(`hero_roll_s_${i}`, drawRoll(i)));
  return out;
}

const ALL: readonly Dir4[] = ['s', 'n', 'w', 'e'];

export const HERO_ANIMS = {
  idle: { frames: 1, fps: 1, loop: true, dirs: ALL },
  hurt: { frames: 1, fps: 1, loop: true, dirs: ALL },
  walk: { frames: 4, fps: 8, loop: true, dirs: ALL },
  shield: { frames: 1, fps: 1, loop: true, dirs: ALL },
  shieldwalk: { frames: 4, fps: 8, loop: true, dirs: ALL },
  charge: { frames: 1, fps: 1, loop: true, dirs: ALL },
  attack1: { frames: 3, fps: 14, loop: false, dirs: ALL },
  attack2: { frames: 3, fps: 14, loop: false, dirs: ALL },
  attack3: { frames: 3, fps: 10, loop: false, dirs: ALL },
  spin: { frames: 4, fps: 10, loop: false, dirs: ['s'] },
  roll: { frames: 4, fps: 13, loop: false, dirs: ['s'] },
} satisfies Record<string, AnimDef>;
```

`src/art/sprites/dummy.ts`:

```ts
import type { AnimDef } from '../anims';
import { decodeGrid, type GridPalette } from '../grid';
import { outline } from '../outline';
import { C } from '../palette';
import { blit, createRaster, getPixel, hex, setPixel, type Raster } from '../raster';
import type { SpriteFrame } from './types';

const PAL: GridPalette = {
  '.': null,
  k: C.sack,
  K: C.sackShade,
  e: C.ink,
  y: C.straw,
  Y: C.strawShade,
  g: C.wood,
  G: C.woodShade,
};

/** 16×24 straw training dummy. */
const GRID = [
  '......kkkk......',
  '....kkkkkkkK....',
  '...kkkkkkkkkK...',
  '...kkekkkkekK...',
  '...kkkkkkkkkK...',
  '...kkkkeekkkK...',
  '....KkkkkkkK....',
  '.......gG.......',
  'yyyyyyygGyyyyyyY',
  'YyyyyyygGyyyyyYY',
  '.......gG.......',
  '.....yyyyyy.....',
  '....yyyyyyyY....',
  '....yyYyyyyY....',
  '....yyyyyYyY....',
  '....yYyyyyyY....',
  '....yyyyyyyY....',
  '.....YYYYYY.....',
  '.......gG.......',
  '.......gG.......',
  '.......gG.......',
  '.......gG.......',
  '......ggGG......',
  '.....gggGGG.....',
];

const W = 20;
const H = 26;
/** Rows (in the padded raster) that wobble when the dummy is hit: the sack head and the crossbar. */
const WOBBLE_ROWS = 11;

function wobble(src: Raster, dx: number): Raster {
  const out = createRaster(src.w, src.h);
  for (let y = 0; y < src.h; y++) {
    for (let x = 0; x < src.w; x++) setPixel(out, x, y, getPixel(src, y < WOBBLE_ROWS ? x - dx : x, y));
  }
  return out;
}

export function dummyFrames(): SpriteFrame[] {
  const base = createRaster(W, H);
  blit(base, decodeGrid(GRID, PAL), 2, 1);
  const finish = (r: Raster): Raster => outline(r, hex(C.ink), 1);
  return [
    { name: 'prop_dummy_idle_s_0', raster: finish(base), ox: 10, oy: 25 },
    { name: 'prop_dummy_hurt_s_0', raster: finish(wobble(base, -1)), ox: 10, oy: 25 },
    { name: 'prop_dummy_hurt_s_1', raster: finish(wobble(base, 1)), ox: 10, oy: 25 },
  ];
}

export const DUMMY_ANIMS = {
  idle: { frames: 1, fps: 1, loop: true, dirs: ['s'] },
  hurt: { frames: 2, fps: 12, loop: true, dirs: ['s'] },
} satisfies Record<string, AnimDef>;
```

`src/art/sprites/missing.ts`:

```ts
import { line, rect } from '../draw';
import { C } from '../palette';
import { createRaster, hex } from '../raster';
import type { SpriteFrame } from './types';

/** Shown (and reported) whenever a frame name has no art yet. */
export function missingFrame(): SpriteFrame {
  const r = createRaster(16, 16);
  rect(r, 0, 0, 16, 16, hex(C.missing));
  line(r, 0, 0, 15, 15, hex(C.ink));
  line(r, 15, 0, 0, 15, hex(C.ink));
  return { name: 'missing', raster: r, ox: 8, oy: 16 };
}
```

`src/art/sprites/index.ts`:

```ts
import type { AnimTable } from '../anims';
import { DUMMY_ANIMS, dummyFrames } from './dummy';
import { HERO_ANIMS, heroFrames } from './hero';
import { missingFrame } from './missing';
import type { SpriteFrame } from './types';

export type { SpriteFrame } from './types';

export const ANIMS: AnimTable = { hero: HERO_ANIMS, prop_dummy: DUMMY_ANIMS };

export function buildSprites(): SpriteFrame[] {
  return [...heroFrames(), ...dummyFrames(), missingFrame()];
}
```

- [ ] **Step 4: Run tests**

Run: `pnpm vitest run tests/unit/art/sprites.test.ts`
Expected: PASS.

- [ ] **Step 5: Gate and commit**

Run: `pnpm check`

```bash
git add -A
git commit -m "Add code-drawn hero and training-dummy sprites with baked facings

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 18: Shell rendering — boot, play scene, views, scaling, slide, tint

**Files:**
- Create: `src/shell/services.ts`, `src/shell/gfx/frameIndex.ts`, `src/shell/gfx/textures.ts`, `src/shell/view/screenView.ts`, `src/shell/view/entityViews.ts`, `src/shell/scenes/PlayScene.ts`
- Modify: `src/shell/scale.ts`, `src/shell/scenes/BootScene.ts`, `src/shell/main.ts`
- Test: `tests/unit/shell/scale.test.ts`, `tests/unit/shell/frameIndex.test.ts`

**Interfaces:**
- Consumes: `Sim` (Task 14); art `buildSprites`, `ANIMS`, `buildTileset`, `tileIndices`, `grade`, `packShelves`, `extrude`, `frameFor` (Tasks 13–17); input (Tasks 6–7); `advance` (Task 6).
- Produces:
  - Scaling: `Scaling = 'integer'|'fit'`, `computeZoom(winW, winH, dpr, mode)`, `attachZoom(game, mode)`.
  - Frames: `FrameRef`, `class FrameIndex { set; get; missingNames }`, `registerSprites(textures, frames): FrameIndex`, `registerTileset(textures, tileset)`, `TILESET_KEY`.
  - Services: `Services { db; state }`, `RenderAssets { frames; tileset }`, `PlayData`. Tasks 19–21 extend `Services`.
  - Scenes and views: `BootScene(services)`, `PlayScene` (key `'play'`; public `appliedGrade`), `ScreenView`, `EntityViews`.

- [ ] **Step 1: Write the failing tests**

`tests/unit/shell/scale.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { computeZoom } from '@shell/scale';

describe('computeZoom', () => {
  it('picks the largest whole multiple that fits', () => {
    expect(computeZoom(1920, 1080, 1, 'integer')).toBe(3);
    expect(computeZoom(1500, 900, 1, 'integer')).toBe(2);
  });

  it('counts device pixels so high-DPI and 125 % scaling stay crisp', () => {
    expect(computeZoom(1440, 900, 2, 'integer')).toBe(2);
    expect(computeZoom(1536, 864, 1.25, 'integer')).toBeCloseTo(2.4);
  });

  it('never returns zero for a tiny window; it shrinks to fit instead', () => {
    const z = computeZoom(600, 300, 1, 'integer');
    expect(z).toBeGreaterThan(0);
    expect(z).toBeCloseTo(300 / 360);
  });

  it('fills the window in fit mode', () => {
    expect(computeZoom(1500, 900, 1, 'fit')).toBeCloseTo(1500 / 640);
  });
});
```

`tests/unit/shell/frameIndex.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { FrameIndex } from '@shell/gfx/frameIndex';

describe('FrameIndex', () => {
  it('returns registered frames', () => {
    const index = new FrameIndex();
    index.set('hero_idle_s_0', { key: 'sprites_0', frame: 'hero_idle_s_0', ox: 0.5, oy: 0.9 });
    expect(index.get('hero_idle_s_0').key).toBe('sprites_0');
  });

  it('falls back to the missing frame and reports each name once', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const index = new FrameIndex();
    index.set('missing', { key: 'sprites_0', frame: 'missing', ox: 0.5, oy: 1 });
    expect(index.get('nope').frame).toBe('missing');
    index.get('nope');
    expect(error).toHaveBeenCalledTimes(1);
    expect(index.missingNames()).toEqual(['nope']);
    error.mockRestore();
  });
});
```

Run: `pnpm vitest run tests/unit/shell`
Expected: FAIL — `computeZoom` and `FrameIndex` missing.

- [ ] **Step 2: Scaling and frame index**

Replace `src/shell/scale.ts`:

```ts
import type * as Phaser from 'phaser';

export const GAME_W = 640;
export const GAME_H = 360;
/** Vertical letterbox above and below the 640×352 playfield. */
export const LETTERBOX = 4;

export type Scaling = 'integer' | 'fit';

/**
 * CSS zoom for the 640×360 canvas. Integer mode picks the largest whole multiple in *device* pixels, so
 * pixel art stays crisp at any devicePixelRatio; if even 1× does not fit, it shrinks to fit instead.
 */
export function computeZoom(winW: number, winH: number, dpr: number, mode: Scaling): number {
  const fit = Math.min(winW / GAME_W, winH / GAME_H);
  if (mode === 'fit') return fit;
  const whole = Math.floor(Math.min((winW * dpr) / GAME_W, (winH * dpr) / GAME_H));
  return whole < 1 ? fit : whole / dpr;
}

export function attachZoom(game: Phaser.Game, mode: () => Scaling): () => void {
  const apply = (): void => {
    game.scale.setZoom(computeZoom(window.innerWidth, window.innerHeight, window.devicePixelRatio || 1, mode()));
  };
  apply();
  window.addEventListener('resize', apply);
  return () => {
    window.removeEventListener('resize', apply);
  };
}
```

`src/shell/gfx/frameIndex.ts`:

```ts
/** Where a named frame lives: texture key, frame name and normalised origin (feet point). */
export interface FrameRef {
  readonly key: string;
  readonly frame: string;
  readonly ox: number;
  readonly oy: number;
}

export class FrameIndex {
  private readonly refs = new Map<string, FrameRef>();
  private readonly missing = new Set<string>();

  set(name: string, ref: FrameRef): void {
    this.refs.set(name, ref);
  }

  /** Unknown names fall back to the magenta `missing` frame and are reported once (tests fail on it). */
  get(name: string): FrameRef {
    const ref = this.refs.get(name);
    if (ref !== undefined) return ref;
    if (!this.missing.has(name)) {
      this.missing.add(name);
      console.error(`[art] missing frame '${name}'`);
    }
    const fallback = this.refs.get('missing');
    if (fallback === undefined) throw new Error('the missing-art frame is not registered');
    return fallback;
  }

  missingNames(): string[] {
    return [...this.missing];
  }
}
```

Run: `pnpm vitest run tests/unit/shell`
Expected: PASS.

- [ ] **Step 3: Texture registration**

`src/shell/gfx/textures.ts`:

```ts
import type * as Phaser from 'phaser';
import { packShelves } from '@art/pack';
import { extrude, type Raster } from '@art/raster';
import type { SpriteFrame } from '@art/sprites';
import type { Tileset } from '@art/tiles/tileset';
import { TILE } from '@core/world/dims';
import { FrameIndex } from './frameIndex';

export const TILESET_KEY = 'tiles';
/** Each 16 px tile is stored extruded to 18 px, so the tileset uses margin 1 and spacing 2. */
const TILE_CELL = TILE + 2;
const TILESET_COLS = 32;

function canvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function context(c: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = c.getContext('2d');
  if (ctx === null) throw new Error('2D canvas unavailable');
  return ctx;
}

function put(ctx: CanvasRenderingContext2D, r: Raster, x: number, y: number): void {
  ctx.putImageData(new ImageData(new Uint8ClampedArray(r.data), r.w, r.h), x, y);
}

/** Packs code-drawn frames into canvas pages and registers every frame by name. */
export function registerSprites(textures: Phaser.Textures.TextureManager, frames: readonly SpriteFrame[]): FrameIndex {
  const pack = packShelves(frames.map((f) => ({ name: f.name, w: f.raster.w, h: f.raster.h })));
  const pages = pack.heights.map((h) => canvas(pack.pageW, Math.max(1, h)));
  const index = new FrameIndex();
  pages.forEach((page, p) => {
    const ctx = context(page);
    const onPage = frames.filter((f) => pack.placements.get(f.name)?.page === p);
    for (const f of onPage) {
      const at = pack.placements.get(f.name);
      if (at !== undefined) put(ctx, f.raster, at.x, at.y);
    }
    const key = `sprites_${p}`;
    const texture = textures.addCanvas(key, page);
    if (texture === null) throw new Error(`could not add texture ${key}`);
    for (const f of onPage) {
      const at = pack.placements.get(f.name);
      if (at === undefined) continue;
      texture.add(f.name, 0, at.x, at.y, f.raster.w, f.raster.h);
      index.set(f.name, { key, frame: f.name, ox: f.ox / f.raster.w, oy: f.oy / f.raster.h });
    }
  });
  return index;
}

export function registerTileset(textures: Phaser.Textures.TextureManager, tileset: Tileset): void {
  const rows = Math.ceil(tileset.tiles.length / TILESET_COLS);
  const page = canvas(TILESET_COLS * TILE_CELL, rows * TILE_CELL);
  const ctx = context(page);
  tileset.tiles.forEach((tile, i) => {
    put(ctx, extrude(tile, 1), (i % TILESET_COLS) * TILE_CELL, Math.floor(i / TILESET_COLS) * TILE_CELL);
  });
  if (textures.addCanvas(TILESET_KEY, page) === null) throw new Error('could not add the tileset texture');
}
```

- [ ] **Step 4: Views**

`src/shell/view/screenView.ts`:

```ts
import type * as Phaser from 'phaser';
import type { Vec } from '@core/math/vec';
import { SCREEN_COLS, SCREEN_ROWS, TILE } from '@core/world/dims';
import { TILESET_KEY } from '@shell/gfx/textures';

/** One screen's ground as a Phaser tilemap layer, placed at the screen's world origin. */
export class ScreenView {
  private readonly map: Phaser.Tilemaps.Tilemap;

  constructor(scene: Phaser.Scene, origin: Vec, indices: readonly number[]) {
    this.map = scene.make.tilemap({ width: SCREEN_COLS, height: SCREEN_ROWS, tileWidth: TILE, tileHeight: TILE });
    const tileset = this.map.addTilesetImage('tiles', TILESET_KEY, TILE, TILE, 1, 2);
    if (tileset === null) throw new Error('tileset texture missing');
    const layer = this.map.createBlankLayer('ground', tileset, origin.x, origin.y);
    if (layer === null) throw new Error('could not create the ground layer');
    const rows: number[][] = [];
    for (let y = 0; y < SCREEN_ROWS; y++) rows.push(indices.slice(y * SCREEN_COLS, (y + 1) * SCREEN_COLS));
    layer.putTilesAt(rows, 0, 0);
    layer.setDepth(-1);
  }

  destroy(): void {
    this.map.destroy();
  }
}
```

`src/shell/view/entityViews.ts`:

```ts
import * as Phaser from 'phaser';
import { frameFor, type AnimTable } from '@art/anims';
import type { Entity } from '@core/actors/entity';
import type { Vec } from '@core/math/vec';
import type { FrameIndex } from '@shell/gfx/frameIndex';

/** Mirrors sim entities as sprites. Safe to call every frame: views are derived from state only. */
export class EntityViews {
  private readonly sprites = new Map<number, Phaser.GameObjects.Sprite>();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly frames: FrameIndex,
    private readonly anims: AnimTable,
  ) {}

  sync(entities: readonly Entity[], place: (e: Entity) => Vec): void {
    const seen = new Set<number>();
    for (const e of entities) {
      seen.add(e.id);
      const ref = this.frames.get(frameFor(this.anims, e.art, e.anim, e.facing, e.animT));
      let sprite = this.sprites.get(e.id);
      if (sprite === undefined) {
        sprite = this.scene.add.sprite(0, 0, ref.key, ref.frame);
        this.sprites.set(e.id, sprite);
      } else if (sprite.texture.key !== ref.key || sprite.frame.name !== ref.frame) {
        sprite.setTexture(ref.key, ref.frame);
      }
      sprite.setOrigin(ref.ox, ref.oy);
      const p = place(e);
      sprite.setPosition(Math.round(p.x), Math.round(p.y));
      sprite.setDepth(p.y);
      if (e.flash > 0 && Math.floor(e.flash / 2) % 2 === 0) sprite.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
      else sprite.clearTint();
      const blink = e.kind === 'hero' && e.iframes > 0 && e.anim !== 'roll' && Math.floor(e.iframes / 4) % 2 === 0;
      sprite.setAlpha(blink ? 0.35 : 1);
    }
    for (const [id, sprite] of this.sprites) {
      if (!seen.has(id)) {
        sprite.destroy();
        this.sprites.delete(id);
      }
    }
  }
}
```

- [ ] **Step 5: Scenes, services and main**

`src/shell/services.ts`:

```ts
import type { Tileset } from '@art/tiles/tileset';
import type { ContentDb } from '@core/sim/db';
import type { GameState } from '@core/state/gameState';
import type { FrameIndex } from './gfx/frameIndex';

/** What main.ts hands to the scenes. Later tasks add settings, saves and dev tools. */
export interface Services {
  readonly db: ContentDb;
  readonly state: GameState;
}

export interface RenderAssets {
  readonly frames: FrameIndex;
  readonly tileset: Tileset;
}

export interface PlayData extends Services {
  readonly assets: RenderAssets;
}
```

Replace `src/shell/scenes/BootScene.ts`:

```ts
import * as Phaser from 'phaser';
import { buildSprites } from '@art/sprites';
import { buildTileset } from '@art/tiles/tileset';
import { registerSprites, registerTileset } from '@shell/gfx/textures';
import type { PlayData, Services } from '@shell/services';

/** Generates all placeholder art into textures, then starts play. */
export class BootScene extends Phaser.Scene {
  constructor(private readonly services: Services) {
    super('boot');
  }

  create(): void {
    const frames = registerSprites(this.textures, buildSprites());
    const tileset = buildTileset();
    registerTileset(this.textures, tileset);
    const data: PlayData = { ...this.services, assets: { frames, tileset } };
    this.scene.start('play', data);
  }
}
```

`src/shell/scenes/PlayScene.ts`:

```ts
import * as Phaser from 'phaser';
import { grade } from '@art/grading';
import { ANIMS } from '@art/sprites';
import { tileIndices } from '@art/tiles/indices';
import { DEFAULT_BINDINGS } from '@content/bindings';
import type { ScreenId } from '@content/world/screens';
import { daylight } from '@core/clock/clock';
import { InputLatch } from '@core/input/actions';
import { fnv1a } from '@core/math/hash';
import { add, lerp } from '@core/math/vec';
import type { SimEvent } from '@core/sim/events';
import { advance, type Accumulator } from '@core/sim/loop';
import { Sim } from '@core/sim/sim';
import { SCREEN_H, SCREEN_W } from '@core/world/dims';
import { readPad } from '@shell/input/gamepad';
import { KeyboardState, attachKeyboard } from '@shell/input/keyboard';
import { InputMapper } from '@shell/input/mapper';
import { LETTERBOX } from '@shell/scale';
import type { PlayData } from '@shell/services';
import { EntityViews } from '@shell/view/entityViews';
import { ScreenView } from '@shell/view/screenView';

/** Owns the Sim: steps it at 60 Hz, feeds it input, and draws its state. */
export class PlayScene extends Phaser.Scene {
  appliedGrade: readonly number[] = [];
  private services!: PlayData;
  private sim!: Sim;
  private mapper!: InputMapper;
  private views!: EntityViews;
  private colour!: Phaser.Filters.ColorMatrix;
  private readonly latch = new InputLatch();
  private readonly keys = new KeyboardState();
  private readonly acc: Accumulator = { acc: 0 };
  private readonly screens = new Map<ScreenId, ScreenView>();
  private gradeKey = '';

  constructor() {
    super('play');
  }

  create(data: PlayData): void {
    this.services = data;
    this.acc.acc = 0;
    this.gradeKey = '';
    this.screens.clear();
    this.sim = new Sim(data.db, data.state);
    this.mapper = new InputMapper(DEFAULT_BINDINGS, this.latch, { holdToggleShield: false });
    const detach = attachKeyboard(window, this.keys);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      detach();
      this.keys.clear();
    });
    const cam = this.cameras.main;
    cam.setViewport(0, LETTERBOX, SCREEN_W, SCREEN_H);
    cam.setRoundPixels(true);
    this.colour = cam.filters.internal.addColorMatrix();
    this.views = new EntityViews(this, data.assets.frames, ANIMS);
    this.showScreen(this.sim.screen.id);
    this.draw(0);
    document.body.dataset.ready = 'true';
  }

  override update(_time: number, delta: number): void {
    this.mapper.sample(this.keys.codes(), readPad(navigator.getGamepads()));
    const { steps, alpha } = advance(this.acc, delta);
    for (let i = 0; i < steps; i++) this.sim.step(this.latch.consume());
    const events = this.sim.drainEvents();
    for (const ev of events) this.onEvent(ev);
    this.draw(alpha);
  }

  private onEvent(ev: SimEvent): void {
    if (ev.t === 'screenTransition') this.showScreen(ev.to);
    else if (ev.t === 'screenEntered') {
      this.showScreen(ev.screen);
      this.dropScreensExcept(ev.screen);
    }
  }

  private draw(alpha: number): void {
    const tr = this.sim.transition;
    if (tr !== null) {
      const p = Math.min(1, (tr.t + alpha) / tr.dur);
      const from = this.sim.originOf(tr.from);
      const to = this.sim.originOf(tr.to);
      const cam = lerp(from, to, p);
      this.cameras.main.setScroll(Math.round(cam.x), Math.round(cam.y));
      const hero = lerp(add(from, tr.heroFrom), add(to, tr.heroTo), p);
      this.views.sync(this.sim.entities, (e) => (e === this.sim.hero ? hero : add(to, e.pos)));
    } else {
      const origin = this.sim.originOf(this.sim.screen.id);
      this.cameras.main.setScroll(origin.x, origin.y);
      this.views.sync(this.sim.entities, (e) => add(origin, lerp(e.prev, e.pos, alpha)));
    }
    this.applyGrade();
  }

  private applyGrade(): void {
    const clock = this.sim.state.clock;
    const light = daylight(clock, this.services.db.clock);
    const key = `${clock.season}|${Math.round(light * 200)}`;
    if (key === this.gradeKey) return;
    this.gradeKey = key;
    this.appliedGrade = grade(clock.season, light, 'clear');
    this.colour.colorMatrix.set([...this.appliedGrade]);
  }

  private showScreen(id: ScreenId): void {
    if (this.screens.has(id)) return;
    const indices = tileIndices(this.sim.terrainOf(id), this.services.assets.tileset, fnv1a(id));
    this.screens.set(id, new ScreenView(this, this.sim.originOf(id), indices));
  }

  private dropScreensExcept(id: ScreenId): void {
    for (const [key, view] of this.screens) {
      if (key === id) continue;
      view.destroy();
      this.screens.delete(key);
    }
  }
}
```

Replace `src/shell/main.ts`:

```ts
import * as Phaser from 'phaser';
import { DB } from '@content/index';
import { GAME_TITLE } from '@content/meta';
import { NEW_GAME } from '@content/start';
import { newGame } from '@core/state/gameState';
import { showMessage } from '@shell/boot/message';
import { hasWebGL } from '@shell/boot/webgl';
import { GAME_H, GAME_W, attachZoom } from '@shell/scale';
import { BootScene } from '@shell/scenes/BootScene';
import { PlayScene } from '@shell/scenes/PlayScene';
import type { Services } from '@shell/services';

function randomSeed(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0] ?? 1;
}

function startGame(services: Services): void {
  const game = new Phaser.Game({
    type: Phaser.WEBGL,
    parent: 'game',
    width: GAME_W,
    height: GAME_H,
    pixelArt: true,
    backgroundColor: '#000000',
    banner: false,
    scale: { mode: Phaser.Scale.NONE, autoCenter: Phaser.Scale.NO_CENTER },
    input: { keyboard: false, gamepad: false },
    scene: [new BootScene(services), new PlayScene()],
  });
  attachZoom(game, () => 'integer');
}

document.title = GAME_TITLE;
if (!hasWebGL()) {
  showMessage('Fimbulvetr needs WebGL, which this browser has turned off or does not support.');
} else {
  startGame({ db: DB, state: newGame(randomSeed(), NEW_GAME) });
}
```

- [ ] **Step 6: Run everything and look at it**

Run: `pnpm check && pnpm e2e`
Expected: green. The smoke test fails on any `[art] missing frame` console error.

Run: `pnpm dev`, open http://localhost:5173 in the in-app browser, and check:
- The field is drawn with a pond, trees and a path, and the letterbox is 4 px.
- WASD walks, J swings (a hit makes the dummy flash and wobble), Space rolls, Shift raises the shield.
- Walking off the east edge slides to the next screen.
- The canvas scales in whole steps when the window is resized.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Render the sim: generated textures, tilemap screens, entity views, flip-screen slide, day/season tint

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 19: Dev tools — query string, test hook, overlay, console

**Files:**
- Create: `src/core/dev/query.ts`, `src/shell/dev/stats.ts`, `src/shell/dev/bridge.ts`, `src/shell/dev/hook.ts`, `src/shell/dev/overlay.ts`, `src/shell/dev/commands.ts`, `src/shell/dev/console.ts`, `src/shell/dev/index.ts`, `tests/e2e/helpers.ts`
- Modify: `src/core/clock/types.ts` (add `isSeason`), `src/content/world/screens.ts` (add `isScreenId`), `src/content/flags.ts` (add `isFlagId`), `src/shell/services.ts`, `src/shell/scenes/PlayScene.ts`, `src/shell/main.ts`
- Test: `tests/unit/core/devQuery.test.ts`, `tests/unit/shell/devCommands.test.ts`, `tests/e2e/dev.spec.ts`

**Interfaces:**
- Consumes: `Sim`, commands (Task 14); `tileFeet` (Task 9); `FrameIndex` (Task 18).
- Produces:
  - Core: `DevQuery`, `parseDevQuery(search, knownScreens)`, `applyDevQuery(state, q)`, `parseClockTime(text)`.
  - Guards: `isSeason`, `isScreenId`, `isFlagId`.
  - Shell dev plumbing: `FrameStats`, `DevBridge`, `DevTools`, `runCommand(bridge, line, print)`, `createDevTools()`; a `DEV_TOOLS` constant local to `main.ts`.
  - Test hook: `window.__fimbul: FimbulHook`, used by e2e tests.
  - Page elements: `#dev-overlay` (F1) and `#dev-console` with `#dev-console-input` (Backquote).
- Supported query parameters: `screen`, `at=x,y` (tiles), `season`, `time=HH:MM|day|night`, `seed`, `lang`, `nosave`, `mute`.

- [ ] **Step 1: Add the id guards**

Append to `src/core/clock/types.ts`:

```ts
export const isSeason = (s: string): s is Season => (SEASONS as readonly string[]).includes(s);
```

Append to `src/content/world/screens.ts`:

```ts
export const isScreenId = (s: string): s is ScreenId => (SCREEN_IDS as readonly string[]).includes(s);
```

Append to `src/content/flags.ts`:

```ts
export const isFlagId = (s: string): s is FlagId => Object.hasOwn(FLAGS, s);
```

- [ ] **Step 2: Write the failing tests**

`tests/unit/core/devQuery.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { NEW_GAME } from '@content/start';
import { SCREEN_IDS } from '@content/world/screens';
import { applyDevQuery, parseClockTime, parseDevQuery } from '@core/dev/query';
import { newGame } from '@core/state/gameState';

const known = new Set<string>(SCREEN_IDS);

describe('parseDevQuery', () => {
  it('reads every supported parameter', () => {
    const q = parseDevQuery('?screen=test_b&at=20,11&season=winter&time=22:30&seed=42&lang=sv&nosave&mute', known);
    expect(q).toMatchObject({
      screen: 'test_b',
      tile: [20, 11],
      season: 'winter',
      minute: 22 * 60 + 30,
      seed: 42,
      lang: 'sv',
      nosave: true,
      mute: true,
    });
    expect(q.warnings).toEqual([]);
  });

  it('ignores bad values with a warning instead of failing', () => {
    const q = parseDevQuery('screen=nowhere&at=a,b&season=monsoon&time=25:00&seed=-1&lang=de&x=%E0%A4%A', known);
    expect(q.screen).toBeUndefined();
    expect(q.tile).toBeUndefined();
    expect(q.season).toBeUndefined();
    expect(q.minute).toBeUndefined();
    expect(q.seed).toBeUndefined();
    expect(q.lang).toBeUndefined();
    expect(q.warnings.length).toBeGreaterThanOrEqual(6);
  });

  it('parses clock times', () => {
    expect(parseClockTime('day')).toBe(720);
    expect(parseClockTime('night')).toBe(0);
    expect(parseClockTime('7:05')).toBe(425);
    expect(parseClockTime('24:00')).toBeNull();
  });
});

describe('applyDevQuery', () => {
  it('moves the hero and sets the clock', () => {
    const s = newGame(1, NEW_GAME);
    applyDevQuery(s, parseDevQuery('screen=test_c&at=20,5&season=autumn&time=night', known));
    expect(s.hero).toMatchObject({ screen: 'test_c', x: 328, y: 94 });
    expect(s.clock).toMatchObject({ season: 'autumn', minute: 0, epoch: 1 });
    expect(s.world.visited).toContain('test_c');
  });
});
```

`tests/unit/shell/devCommands.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { DevBridge } from '@shell/dev/bridge';
import { runCommand } from '@shell/dev/commands';
import { FrameStats } from '@shell/dev/stats';
import { FrameIndex } from '@shell/gfx/frameIndex';
import { Harness } from '../../sim/harness';

function bridge(): { b: DevBridge; h: Harness } {
  const h = new Harness();
  const b: DevBridge = {
    sim: h.sim,
    frames: new FrameIndex(),
    stats: new FrameStats(),
    appliedGrade: () => [],
    lightLevel: () => 1,
  };
  return { b, h };
}

const run = (b: DevBridge, line: string): string => runCommand(b, line, () => undefined);

describe('dev console commands', () => {
  it('warps, sets time, season and flags through sim commands', () => {
    const { b, h } = bridge();
    expect(run(b, 'warp test_c 20 5')).toBe('warped to test_c 20,5');
    expect(run(b, 'time 21:15')).toBe('time 21:15');
    expect(run(b, 'season winter')).toBe('season winter');
    expect(run(b, 'flag st_intro_seen true')).toBe('flag st_intro_seen = true');
    h.idle(1);
    expect(h.sim.screen.id).toBe('test_c');
    expect(h.sim.state.clock).toMatchObject({ minute: 21 * 60 + 15, season: 'winter' });
    expect(h.sim.state.flags.st_intro_seen).toBe(true);
  });

  it('explains mistakes', () => {
    const { b } = bridge();
    expect(run(b, 'warp nowhere')).toBe("unknown screen 'nowhere'");
    expect(run(b, 'season monsoon')).toBe("unknown season 'monsoon'");
    expect(run(b, 'time soon')).toBe('usage: time HH:MM | day | night');
    expect(run(b, 'flag nope 1')).toBe("unknown flag 'nope'");
    expect(run(b, 'dance')).toBe("unknown command 'dance' — try help");
  });
});

describe('FrameStats', () => {
  it('summarises fps and the 95th percentile frame time', () => {
    const stats = new FrameStats();
    for (let i = 0; i < 100; i++) stats.record(i < 95 ? 16 : 40, 0.1);
    const s = stats.summary();
    expect(s.p95).toBe(40);
    expect(s.fps).toBeGreaterThan(50);
    expect(s.simMs).toBe(0.1);
  });
});
```

Run: `pnpm vitest run tests/unit/core/devQuery.test.ts tests/unit/shell/devCommands.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement the query parser**

`src/core/dev/query.ts`:

```ts
import type { ScreenId } from '@content/world/screens';
import { isSeason, type Season } from '../clock/types';
import { LANGS, type Lang } from '../i18n/t';
import type { GameState } from '../state/gameState';
import { tileFeet } from '../world/screen';

/** Dev/test URL parameters. Only honoured in dev and `--mode test` builds. */
export interface DevQuery {
  readonly screen?: ScreenId;
  readonly tile?: readonly [number, number];
  readonly season?: Season;
  readonly minute?: number;
  readonly seed?: number;
  readonly lang?: Lang;
  readonly nosave: boolean;
  readonly mute: boolean;
  readonly warnings: readonly string[];
}

/** "HH:MM", "day" (12:00) or "night" (00:00) → minute of the day, or null. */
export function parseClockTime(text: string): number | null {
  if (text === 'day') return 12 * 60;
  if (text === 'night') return 0;
  const m = /^(\d{1,2}):(\d{2})$/.exec(text);
  if (m === null) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h > 23 || min > 59 ? null : h * 60 + min;
}

function decode(text: string, warnings: string[]): string | null {
  try {
    return decodeURIComponent(text.replace(/\+/g, ' '));
  } catch {
    warnings.push(`could not decode '${text}'`);
    return null;
  }
}

export function parseDevQuery(search: string, knownScreens: ReadonlySet<string>): DevQuery {
  const warnings: string[] = [];
  const params = new Map<string, string>();
  for (const part of search.replace(/^\?/, '').split('&')) {
    if (part === '') continue;
    const eq = part.indexOf('=');
    const key = decode(eq < 0 ? part : part.slice(0, eq), warnings);
    const value = decode(eq < 0 ? '' : part.slice(eq + 1), warnings);
    if (key !== null && value !== null) params.set(key, value);
  }

  let screen: ScreenId | undefined;
  const s = params.get('screen');
  if (s !== undefined) {
    if (knownScreens.has(s)) screen = s as ScreenId;
    else warnings.push(`unknown screen '${s}'`);
  }

  let tile: [number, number] | undefined;
  const at = params.get('at');
  if (at !== undefined) {
    const m = /^(\d+),(\d+)$/.exec(at);
    if (m === null) warnings.push(`bad at '${at}' (use x,y in tiles)`);
    else tile = [Number(m[1]), Number(m[2])];
  }

  let season: Season | undefined;
  const se = params.get('season');
  if (se !== undefined) {
    if (isSeason(se)) season = se;
    else warnings.push(`unknown season '${se}'`);
  }

  let minute: number | undefined;
  const time = params.get('time');
  if (time !== undefined) {
    const parsed = parseClockTime(time);
    if (parsed === null) warnings.push(`bad time '${time}'`);
    else minute = parsed;
  }

  let seed: number | undefined;
  const sd = params.get('seed');
  if (sd !== undefined) {
    if (/^\d+$/.test(sd)) seed = Number(sd) >>> 0;
    else warnings.push(`bad seed '${sd}'`);
  }

  let lang: Lang | undefined;
  const lg = params.get('lang');
  if (lg !== undefined) {
    const found = LANGS.find((l) => l === lg);
    if (found === undefined) warnings.push(`unknown language '${lg}'`);
    else lang = found;
  }

  return { screen, tile, season, minute, seed, lang, nosave: params.has('nosave'), mute: params.has('mute'), warnings };
}

/** Applies a dev query to a fresh or loaded state before the Sim starts. */
export function applyDevQuery(state: GameState, q: DevQuery): void {
  if (q.screen !== undefined) {
    state.hero.screen = q.screen;
    if (!state.world.visited.includes(q.screen)) state.world.visited.push(q.screen);
  }
  if (q.tile !== undefined) {
    const p = tileFeet({ x: q.tile[0], y: q.tile[1] });
    state.hero.x = p.x;
    state.hero.y = p.y;
  }
  if (q.season !== undefined && q.season !== state.clock.season) {
    state.clock.season = q.season;
    state.clock.seasonDay = 0;
    state.clock.epoch += 1;
  }
  if (q.minute !== undefined) {
    state.clock.minute = q.minute;
    state.clock.sub = 0;
  }
}
```

- [ ] **Step 4: Implement the shell dev tools**

`src/shell/dev/stats.ts`:

```ts
export interface FrameSummary {
  readonly fps: number;
  readonly p95: number;
  readonly simMs: number;
}

/** Rolling frame-time statistics for the overlay and the performance tests. */
export class FrameStats {
  private readonly frames: number[] = [];
  private simMs = 0;

  record(frameMs: number, simMs: number): void {
    this.frames.push(frameMs);
    if (this.frames.length > 120) this.frames.shift();
    this.simMs = simMs;
  }

  summary(): FrameSummary {
    if (this.frames.length === 0) return { fps: 0, p95: 0, simMs: this.simMs };
    const sorted = [...this.frames].sort((a, b) => a - b);
    const mean = sorted.reduce((sum, v) => sum + v, 0) / sorted.length;
    const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))] ?? 0;
    return { fps: mean > 0 ? 1000 / mean : 0, p95, simMs: this.simMs };
  }
}
```

`src/shell/dev/bridge.ts`:

```ts
import type { SimEvent } from '@core/sim/events';
import type { Sim } from '@core/sim/sim';
import type { FrameIndex } from '@shell/gfx/frameIndex';
import type { FrameStats } from './stats';

/** What the running Play scene exposes to dev tools. Extended by later tasks (settings, saves). */
export interface DevBridge {
  readonly sim: Sim;
  readonly frames: FrameIndex;
  readonly stats: FrameStats;
  appliedGrade(): readonly number[];
  lightLevel(): number;
}

export interface DevTools {
  attach(bridge: DevBridge): void;
  onEvents(events: readonly SimEvent[]): void;
}
```

`src/shell/dev/commands.ts`:

```ts
import { isFlagId } from '@content/flags';
import { isScreenId } from '@content/world/screens';
import { isSeason } from '@core/clock/types';
import { parseClockTime } from '@core/dev/query';
import { tileFeet } from '@core/world/screen';
import type { DevBridge } from './bridge';

export const HELP = 'warp <screen> [x y] · time <HH:MM|day|night> · season <name> · flag <id> <value>';

/** Runs one console line. Returns the reply; `print` is for replies that arrive later. */
export function runCommand(b: DevBridge, line: string, print: (text: string) => void): string {
  void print;
  const [cmd = '', ...args] = line.trim().split(/\s+/);
  switch (cmd) {
    case 'help':
      return HELP;
    case 'warp': {
      const [screen = '', x = '20', y = '11'] = args;
      if (!isScreenId(screen)) return `unknown screen '${screen}'`;
      const p = tileFeet({ x: Number(x), y: Number(y) });
      b.sim.command({ t: 'warp', screen, x: p.x, y: p.y });
      return `warped to ${screen} ${x},${y}`;
    }
    case 'time': {
      const text = args[0] ?? '';
      const minute = parseClockTime(text);
      if (minute === null) return 'usage: time HH:MM | day | night';
      b.sim.command({ t: 'setMinute', minute });
      return `time ${text}`;
    }
    case 'season': {
      const s = args[0] ?? '';
      if (!isSeason(s)) return `unknown season '${s}'`;
      b.sim.command({ t: 'setSeason', season: s });
      return `season ${s}`;
    }
    case 'flag': {
      const [id = '', raw = 'true'] = args;
      if (!isFlagId(id)) return `unknown flag '${id}'`;
      const value = raw === 'true' ? true : raw === 'false' ? false : Number(raw);
      if (typeof value === 'number' && !Number.isInteger(value)) return 'value must be true, false or an integer';
      b.sim.command({ t: 'setFlag', flag: id, value });
      return `flag ${id} = ${String(value)}`;
    }
    default:
      return `unknown command '${cmd}' — try help`;
  }
}
```

`src/shell/dev/hook.ts`:

```ts
import { isScreenId } from '@content/world/screens';
import { mem } from '@core/actors/entity';
import { isSeason, type ClockState } from '@core/clock/types';
import { parseClockTime } from '@core/dev/query';
import { tileFeet } from '@core/world/screen';
import type { DevBridge } from './bridge';
import type { FrameSummary } from './stats';

export interface HeroView {
  readonly x: number;
  readonly y: number;
  readonly facing: string;
  readonly fsm: string;
  readonly anim: string;
  readonly hp: number;
  readonly iframes: number;
  readonly shielding: boolean;
}

/** `window.__fimbul` — how Playwright and humans inspect and steer a dev/test build. */
export interface FimbulHook {
  readonly ready: boolean;
  screenId(): string;
  mode(): string;
  hero(): HeroView;
  enemies(): { def: string; hp: number; flash: number }[];
  clock(): ClockState;
  light(): number;
  appliedGrade(): number[];
  readonly eventCounts: Readonly<Record<string, number>>;
  warp(screen: string, tx: number, ty: number): void;
  setTime(text: string): boolean;
  setSeason(season: string): boolean;
  missingFrames(): string[];
  stats(): FrameSummary;
}

declare global {
  interface Window {
    __fimbul?: FimbulHook;
  }
}

export function installHook(current: () => DevBridge | null, counts: Record<string, number>): void {
  const bridge = (): DevBridge => {
    const b = current();
    if (b === null) throw new Error('the game is not running yet');
    return b;
  };
  window.__fimbul = {
    get ready() {
      return current() !== null;
    },
    screenId: () => bridge().sim.screen.id,
    mode: () => bridge().sim.mode,
    hero: () => {
      const h = bridge().sim.hero;
      return {
        x: h.pos.x,
        y: h.pos.y,
        facing: h.facing,
        fsm: h.fsm.s,
        anim: h.anim,
        hp: h.hp,
        iframes: h.iframes,
        shielding: mem(h, 'shielding') === 1,
      };
    },
    enemies: () => bridge().sim.enemies.map((e) => ({ def: e.def, hp: e.hp, flash: e.flash })),
    clock: () => ({ ...bridge().sim.state.clock }),
    light: () => bridge().lightLevel(),
    appliedGrade: () => [...bridge().appliedGrade()],
    eventCounts: counts,
    warp: (screen, tx, ty) => {
      if (!isScreenId(screen)) throw new Error(`unknown screen '${screen}'`);
      const p = tileFeet({ x: tx, y: ty });
      bridge().sim.command({ t: 'warp', screen, x: p.x, y: p.y });
    },
    setTime: (text) => {
      const minute = parseClockTime(text);
      if (minute === null) return false;
      bridge().sim.command({ t: 'setMinute', minute });
      return true;
    },
    setSeason: (season) => {
      if (!isSeason(season)) return false;
      bridge().sim.command({ t: 'setSeason', season });
      return true;
    },
    missingFrames: () => bridge().frames.missingNames(),
    stats: () => bridge().stats.summary(),
  };
}
```

`src/shell/dev/overlay.ts`:

```ts
import { cellAt } from '@core/world/textmap';
import { TILE } from '@core/world/dims';
import type { DevBridge } from './bridge';

export function overlayText(b: DevBridge): string {
  const { sim } = b;
  const h = sim.hero;
  const c = sim.state.clock;
  const s = b.stats.summary();
  const tx = Math.floor(h.pos.x / TILE);
  const ty = Math.floor(h.pos.y / TILE);
  const hh = String(Math.floor(c.minute / 60)).padStart(2, '0');
  const mm = String(c.minute % 60).padStart(2, '0');
  return [
    `screen ${sim.screen.id} (${sim.mode})  tile ${tx},${ty} ${cellAt(sim.screen.terrain, tx, ty) ?? '-'}`,
    `hero ${h.fsm.s}/${h.anim} ${h.facing}  pos ${h.pos.x.toFixed(1)},${h.pos.y.toFixed(1)}  hp ${h.hp}/${h.maxHp}  iframes ${h.iframes}`,
    `day ${c.day} ${hh}:${mm} ${c.season} (${c.policy})  light ${b.lightLevel().toFixed(2)}`,
    `fps ${s.fps.toFixed(0)}  frame p95 ${s.p95.toFixed(1)} ms  sim ${s.simMs.toFixed(2)} ms  entities ${sim.entities.length}`,
  ].join('\n');
}

/** F1 toggles a DOM overlay (DOM so Playwright can read it and it never affects the game's pixels). */
export function createOverlay(current: () => DevBridge | null): void {
  const el = document.createElement('pre');
  el.id = 'dev-overlay';
  el.hidden = true;
  Object.assign(el.style, {
    position: 'fixed',
    left: '4px',
    top: '4px',
    margin: '0',
    padding: '6px 8px',
    font: '11px/1.35 ui-monospace, monospace',
    color: '#f2ead8',
    background: 'rgba(0, 0, 0, 0.65)',
    pointerEvents: 'none',
    zIndex: '20',
  });
  document.body.append(el);
  const render = (): void => {
    const b = current();
    if (el.hidden || b === null) return;
    el.textContent = overlayText(b);
  };
  window.addEventListener('keydown', (e) => {
    if (e.code !== 'F1') return;
    e.preventDefault();
    el.hidden = !el.hidden;
    render();
  });
  window.setInterval(render, 250);
}
```

`src/shell/dev/console.ts`:

```ts
import type { DevBridge } from './bridge';
import { runCommand } from './commands';

/** Backquote toggles a one-line command console. Keys typed into it never reach the game. */
export function createConsole(current: () => DevBridge | null): void {
  const box = document.createElement('div');
  box.id = 'dev-console';
  box.hidden = true;
  Object.assign(box.style, {
    position: 'fixed',
    left: '4px',
    right: '4px',
    bottom: '4px',
    padding: '6px 8px',
    font: '12px/1.4 ui-monospace, monospace',
    color: '#f2ead8',
    background: 'rgba(0, 0, 0, 0.8)',
    zIndex: '21',
  });
  const log = document.createElement('pre');
  log.style.margin = '0 0 4px';
  const input = document.createElement('input');
  input.id = 'dev-console-input';
  input.autocomplete = 'off';
  input.spellcheck = false;
  Object.assign(input.style, { width: '100%', font: 'inherit', color: 'inherit', background: '#1b1522', border: '1px solid #d9b34a' });
  box.append(log, input);
  document.body.append(box);

  const print = (text: string): void => {
    const lines = (log.textContent ?? '').split('\n').filter((l) => l !== '');
    log.textContent = [...lines, text].slice(-6).join('\n');
  };

  window.addEventListener('keydown', (e) => {
    if (e.code !== 'Backquote') return;
    e.preventDefault();
    box.hidden = !box.hidden;
    if (box.hidden) input.blur();
    else input.focus();
  });
  input.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') {
      box.hidden = true;
      input.blur();
      return;
    }
    if (e.code !== 'Enter') return;
    const line = input.value.trim();
    input.value = '';
    const b = current();
    if (line === '' || b === null) return;
    print(`> ${line}`);
    print(runCommand(b, line, print));
  });
}
```

`src/shell/dev/index.ts`:

```ts
import type { DevBridge, DevTools } from './bridge';
import { createConsole } from './console';
import { installHook } from './hook';
import { createOverlay } from './overlay';

/** Loaded with a dynamic import only when DEV_TOOLS is true, so production bundles never contain it. */
export function createDevTools(): DevTools {
  let current: DevBridge | null = null;
  const counts: Record<string, number> = {};
  installHook(() => current, counts);
  createOverlay(() => current);
  createConsole(() => current);
  return {
    attach(bridge) {
      current = bridge;
    },
    onEvents(events) {
      for (const ev of events) {
        const key = ev.t === 'sfx' ? ev.id : ev.t;
        counts[key] = (counts[key] ?? 0) + 1;
      }
    },
  };
}
```

Run: `pnpm vitest run tests/unit/core/devQuery.test.ts tests/unit/shell/devCommands.test.ts`
Expected: PASS.

- [ ] **Step 5: Wire the dev tools into services, the Play scene and main**

In `src/shell/services.ts`, add `import type { DevTools } from './dev/bridge';` and extend `Services`:

```ts
export interface Services {
  readonly db: ContentDb;
  readonly state: GameState;
  readonly dev: DevTools | null;
}
```

In `src/shell/scenes/PlayScene.ts`:
- Add the imports `import type { DevBridge } from '@shell/dev/bridge';` and `import { FrameStats } from '@shell/dev/stats';`.
- Add the field `private readonly stats = new FrameStats();`.
- Make `appliedGrade` private: `private appliedGrade: readonly number[] = [];`.
- At the end of `create`, just before `document.body.dataset.ready = 'true';`, add:

```ts
    data.dev?.attach(this.bridge());
```

Replace `update` with:

```ts
  override update(_time: number, delta: number): void {
    this.mapper.sample(this.keys.codes(), readPad(navigator.getGamepads()));
    const { steps, alpha } = advance(this.acc, delta);
    const started = performance.now();
    for (let i = 0; i < steps; i++) this.sim.step(this.latch.consume());
    this.stats.record(delta, performance.now() - started);
    const events = this.sim.drainEvents();
    for (const ev of events) this.onEvent(ev);
    this.services.dev?.onEvents(events);
    this.draw(alpha);
  }
```

and add the method:

```ts
  private bridge(): DevBridge {
    return {
      sim: this.sim,
      frames: this.services.assets.frames,
      stats: this.stats,
      appliedGrade: () => this.appliedGrade,
      lightLevel: () => daylight(this.sim.state.clock, this.services.db.clock),
    };
  }
```

Replace `src/shell/main.ts`:

```ts
import * as Phaser from 'phaser';
import { DB } from '@content/index';
import { GAME_TITLE } from '@content/meta';
import { NEW_GAME } from '@content/start';
import { SCREEN_IDS } from '@content/world/screens';
import { applyDevQuery, parseDevQuery } from '@core/dev/query';
import { newGame } from '@core/state/gameState';
import { showMessage } from '@shell/boot/message';
import { hasWebGL } from '@shell/boot/webgl';
import { GAME_H, GAME_W, attachZoom } from '@shell/scale';
import { BootScene } from '@shell/scenes/BootScene';
import { PlayScene } from '@shell/scenes/PlayScene';
import type { Services } from '@shell/services';

/**
 * Dev tools and the test hook exist only in `pnpm dev` and `--mode test` builds. Kept in this module so
 * Vite's `import.meta.env` replacement lets the minifier drop the dynamic import from production.
 */
const DEV_TOOLS = import.meta.env.DEV || import.meta.env.MODE === 'test';

function randomSeed(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0] ?? 1;
}

function startGame(services: Services): void {
  const game = new Phaser.Game({
    type: Phaser.WEBGL,
    parent: 'game',
    width: GAME_W,
    height: GAME_H,
    pixelArt: true,
    backgroundColor: '#000000',
    banner: false,
    scale: { mode: Phaser.Scale.NONE, autoCenter: Phaser.Scale.NO_CENTER },
    input: { keyboard: false, gamepad: false },
    scene: [new BootScene(services), new PlayScene()],
  });
  attachZoom(game, () => 'integer');
}

async function main(): Promise<void> {
  document.title = GAME_TITLE;
  const query = DEV_TOOLS ? parseDevQuery(window.location.search, new Set<string>(SCREEN_IDS)) : null;
  for (const warning of query?.warnings ?? []) console.warn(`[dev] ${warning}`);
  if (!hasWebGL()) {
    showMessage('Fimbulvetr needs WebGL, which this browser has turned off or does not support.');
    return;
  }
  const state = newGame(query?.seed ?? randomSeed(), NEW_GAME);
  if (query !== null) applyDevQuery(state, query);
  const dev = DEV_TOOLS ? (await import('@shell/dev/index')).createDevTools() : null;
  startGame({ db: DB, state, dev });
}

void main();
```

- [ ] **Step 6: Write the e2e helpers and dev spec**

`tests/e2e/helpers.ts`:

```ts
import type { Page } from '@playwright/test';

export function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

/** Loads the game (optionally with a dev query string) and waits until the Play scene runs. */
export async function boot(page: Page, query = ''): Promise<void> {
  await page.goto(query === '' ? '/' : `/?${query}`);
  await page.waitForFunction(() => window.__fimbul?.ready === true, undefined, { timeout: 20_000 });
}

export const screenId = (page: Page): Promise<string | undefined> => page.evaluate(() => window.__fimbul?.screenId());
export const clock = (page: Page) => page.evaluate(() => window.__fimbul?.clock());
export const hero = (page: Page) => page.evaluate(() => window.__fimbul?.hero());
export const eventCount = (page: Page, key: string): Promise<number> =>
  page.evaluate((k) => window.__fimbul?.eventCounts[k] ?? 0, key);

/** Holds a key until the hero has fully arrived on `screen`. */
export async function walkUntilScreen(page: Page, key: string, screen: string): Promise<void> {
  await page.keyboard.down(key);
  await page.waitForFunction(
    (s) => window.__fimbul?.screenId() === s && window.__fimbul.mode() === 'play',
    screen,
    { timeout: 15_000 },
  );
  await page.keyboard.up(key);
}
```

`tests/e2e/dev.spec.ts`:

```ts
import { expect, test } from '@playwright/test';
import { boot, clock, collectErrors, screenId } from './helpers';

test('the dev query string places the hero and sets season and time', async ({ page }) => {
  const errors = collectErrors(page);
  await boot(page, 'nosave&screen=test_b&at=20,11&season=winter&time=23:00');
  expect(await screenId(page)).toBe('test_b');
  const c = await clock(page);
  expect(c?.season).toBe('winter');
  expect(c?.minute).toBeGreaterThanOrEqual(23 * 60);
  expect(await page.evaluate(() => window.__fimbul?.light())).toBeLessThan(0.05);
  const applied = await page.evaluate(() => window.__fimbul?.appliedGrade() ?? []);
  expect(applied[0]).toBeLessThan(0.6);
  expect(errors).toEqual([]);
});

test('F1 toggles the debug overlay', async ({ page }) => {
  await boot(page, 'nosave&screen=test_a&at=13,11');
  await page.keyboard.press('F1');
  await expect(page.locator('#dev-overlay')).toBeVisible();
  await expect(page.locator('#dev-overlay')).toContainText('screen test_a');
  await page.keyboard.press('F1');
  await expect(page.locator('#dev-overlay')).toBeHidden();
});

test('the console runs commands', async ({ page }) => {
  await boot(page, 'nosave&screen=test_a&at=13,11');
  await page.keyboard.press('Backquote');
  const input = page.locator('#dev-console-input');
  await expect(input).toBeFocused();
  await input.fill('season autumn');
  await input.press('Enter');
  await expect.poll(async () => (await clock(page))?.season).toBe('autumn');
  await input.fill('warp test_c 20 5');
  await input.press('Enter');
  await expect.poll(() => screenId(page)).toBe('test_c');
});
```

- [ ] **Step 7: Run and commit**

Run: `pnpm check && pnpm e2e`
Expected: green on both browsers.

```bash
git add -A
git commit -m "Add dev query string, window.__fimbul test hook, F1 overlay and console

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 20: Settings, language and synthesized SFX

**Files:**
- Create: `src/shell/platform/settings.ts`, `src/art/sfx/synth.ts`, `src/art/sfx/bank.ts`, `src/shell/audio/sfx.ts`
- Modify: `src/shell/services.ts`, `src/shell/dev/bridge.ts`, `src/shell/dev/commands.ts`, `src/shell/scenes/BootScene.ts`, `src/shell/scenes/PlayScene.ts`, `src/shell/main.ts`
- Test: `tests/unit/shell/settings.test.ts`, `tests/unit/art/synth.test.ts`

**Interfaces:**
- Consumes: `Lang`, `LANGS`, `t` (Task 4); `UI` (Task 4); `SFX`/`SfxId` (Task 4); `Scaling` (Task 18).
- Produces:
  - Settings: `Settings`, `SETTINGS_KEY`, `DEFAULT_SETTINGS`, `StorageLike`, and the functions `parseSettings`, `loadSettings`, `saveSettings`, `browserStorage`, `preferredLang`.
  - Synth: `Wave`, `SynthParams`, `synth(params, sampleRate, seed): Float32Array<ArrayBuffer>`, `SFX_BANK`.
  - Audio: `registerSfx(scene): boolean`, `AudioDirector`.
  - `Services` gains `settings` and `muted`; `DevBridge` gains `settings`; the console gains `lang` and `volume`.

- [ ] **Step 1: Write the failing tests**

`tests/unit/shell/settings.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SETTINGS,
  SETTINGS_KEY,
  loadSettings,
  parseSettings,
  preferredLang,
  saveSettings,
  type StorageLike,
} from '@shell/platform/settings';

function memoryStorage(initial: Record<string, string> = {}): StorageLike & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => data[k] ?? null,
    setItem: (k, v) => {
      data[k] = v;
    },
  };
}

const throwing: StorageLike = {
  getItem: () => {
    throw new Error('SecurityError');
  },
  setItem: () => {
    throw new Error('QuotaExceededError');
  },
};

describe('settings', () => {
  it('uses defaults (with the preferred language) when nothing is stored', () => {
    expect(parseSettings(null, 'sv')).toEqual({ ...DEFAULT_SETTINGS, lang: 'sv' });
  });

  it('survives corrupt JSON and non-objects', () => {
    expect(parseSettings('{oops', 'en')).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('42', 'en')).toEqual(DEFAULT_SETTINGS);
  });

  it('keeps valid fields and replaces invalid ones', () => {
    const s = parseSettings(JSON.stringify({ lang: 'sv', volume: 7, scaling: 'fit', shake: 'yes', textSize: 3 }), 'en');
    expect(s).toMatchObject({ lang: 'sv', volume: DEFAULT_SETTINGS.volume, scaling: 'fit', shake: true, textSize: 3 });
  });

  it('round-trips through storage', () => {
    const storage = memoryStorage();
    const s = { ...DEFAULT_SETTINGS, lang: 'sv' as const, longDay: true };
    expect(saveSettings(storage, s)).toBe(true);
    expect(storage.data[SETTINGS_KEY]).toBeDefined();
    expect(loadSettings(storage, 'en')).toEqual(s);
  });

  it('falls back to defaults when storage throws (private mode, blocked site data)', () => {
    expect(loadSettings(throwing, 'en')).toEqual(DEFAULT_SETTINGS);
    expect(saveSettings(throwing, DEFAULT_SETTINGS)).toBe(false);
    expect(loadSettings(null, 'sv').lang).toBe('sv');
  });

  it('prefers the first supported browser language', () => {
    expect(preferredLang(['sv-SE', 'en'])).toBe('sv');
    expect(preferredLang(['en-US', 'sv'])).toBe('en');
    expect(preferredLang(['de-DE'])).toBe('en');
  });
});
```

`tests/unit/art/synth.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { SFX_BANK } from '@art/sfx/bank';
import { synth, type SynthParams } from '@art/sfx/synth';
import { SFX } from '@content/ids';

const params: SynthParams = { wave: 'noise', freq: 2000, freqEnd: 500, attack: 0.01, sustain: 0.05, release: 0.1, volume: 0.5 };
const peak = (s: Float32Array): number => s.reduce((m, v) => Math.max(m, Math.abs(v)), 0);

describe('synth', () => {
  it('produces the right number of samples within the volume', () => {
    const s = synth(params, 48_000, 1);
    expect(s.length).toBe(Math.round(0.16 * 48_000));
    expect(peak(s)).toBeLessThanOrEqual(0.5 + 1e-6);
    expect(peak(s)).toBeGreaterThan(0.1);
  });

  it('is deterministic per seed', () => {
    expect(synth(params, 22_050, 7)).toEqual(synth(params, 22_050, 7));
    expect(synth(params, 22_050, 7)).not.toEqual(synth(params, 22_050, 8));
  });

  it('has an audible, unclipped recipe for every sound id', () => {
    for (const id of SFX) {
      const s = synth(SFX_BANK[id], 44_100, 1);
      expect(peak(s), id).toBeGreaterThan(0.05);
      expect(peak(s), id).toBeLessThanOrEqual(1);
    }
  });
});
```

Run: `pnpm vitest run tests/unit/shell/settings.test.ts tests/unit/art/synth.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 2: Implement settings**

`src/shell/platform/settings.ts`:

```ts
import { LANGS, type Lang } from '@core/i18n/t';
import type { Scaling } from '@shell/scale';

export interface Settings {
  lang: Lang;
  volume: number;
  scaling: Scaling;
  shake: boolean;
  flash: boolean;
  holdShield: boolean;
  longDay: boolean;
  textSize: 1 | 2 | 3;
}

export const SETTINGS_KEY = 'fimbulvetr.settings.v1';

export const DEFAULT_SETTINGS: Settings = {
  lang: 'en',
  volume: 0.7,
  scaling: 'integer',
  shake: true,
  flash: true,
  holdShield: false,
  longDay: false,
  textSize: 2,
};

export type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

const bool = (v: unknown, fallback: boolean): boolean => (typeof v === 'boolean' ? v : fallback);

/** Stored JSON merged over validated defaults; anything unusable falls back field by field. */
export function parseSettings(raw: string | null, fallbackLang: Lang): Settings {
  const base: Settings = { ...DEFAULT_SETTINGS, lang: fallbackLang };
  if (raw === null) return base;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return base;
  }
  if (typeof data !== 'object' || data === null) return base;
  const d = data as Record<string, unknown>;
  const lang = LANGS.find((l) => l === d['lang']) ?? base.lang;
  const volume = typeof d['volume'] === 'number' && d['volume'] >= 0 && d['volume'] <= 1 ? d['volume'] : base.volume;
  const scaling = d['scaling'] === 'integer' || d['scaling'] === 'fit' ? d['scaling'] : base.scaling;
  const textSize = d['textSize'] === 1 || d['textSize'] === 2 || d['textSize'] === 3 ? d['textSize'] : base.textSize;
  return {
    lang,
    volume,
    scaling,
    shake: bool(d['shake'], base.shake),
    flash: bool(d['flash'], base.flash),
    holdShield: bool(d['holdShield'], base.holdShield),
    longDay: bool(d['longDay'], base.longDay),
    textSize,
  };
}

export function loadSettings(storage: StorageLike | null, fallbackLang: Lang): Settings {
  try {
    return parseSettings(storage?.getItem(SETTINGS_KEY) ?? null, fallbackLang);
  } catch {
    return { ...DEFAULT_SETTINGS, lang: fallbackLang };
  }
}

export function saveSettings(storage: StorageLike | null, settings: Settings): boolean {
  if (storage === null) return false;
  try {
    storage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}

/** localStorage, or null where merely touching it throws (some private modes, blocked site data). */
export function browserStorage(): StorageLike | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function preferredLang(languages: readonly string[]): Lang {
  for (const l of languages) {
    const lower = l.toLowerCase();
    if (lower.startsWith('sv')) return 'sv';
    if (lower.startsWith('en')) return 'en';
  }
  return 'en';
}
```

- [ ] **Step 3: Implement the synth and bank**

`src/art/sfx/synth.ts`:

```ts
import { createRng, nextFloat } from '@core/math/rng';

export type Wave = 'square' | 'saw' | 'triangle' | 'sine' | 'noise';

/** A tiny parametric synth voice: one oscillator, a linear pitch sweep and an attack/sustain/release envelope. */
export interface SynthParams {
  readonly wave: Wave;
  readonly freq: number;
  readonly freqEnd: number;
  readonly attack: number;
  readonly sustain: number;
  readonly release: number;
  readonly volume: number;
  readonly duty?: number;
}

function envelope(t: number, p: SynthParams): number {
  if (t < p.attack) return p.attack > 0 ? t / p.attack : 1;
  if (t < p.attack + p.sustain) return 1;
  return Math.max(0, 1 - (t - p.attack - p.sustain) / Math.max(p.release, 1e-6));
}

export function synth(p: SynthParams, sampleRate: number, seed: number): Float32Array<ArrayBuffer> {
  const total = Math.max(1, Math.round((p.attack + p.sustain + p.release) * sampleRate));
  const out = new Float32Array(total);
  const rng = createRng(seed);
  let phase = 0;
  let noise = 0;
  let noiseStep = -1;
  for (let i = 0; i < total; i++) {
    const t = i / sampleRate;
    const freq = p.freq + (p.freqEnd - p.freq) * (i / total);
    phase = (phase + freq / sampleRate) % 1;
    let s: number;
    switch (p.wave) {
      case 'square':
        s = phase < (p.duty ?? 0.5) ? 1 : -1;
        break;
      case 'saw':
        s = 2 * phase - 1;
        break;
      case 'triangle':
        s = 1 - 4 * Math.abs(phase - 0.5);
        break;
      case 'sine':
        s = Math.sin(2 * Math.PI * phase);
        break;
      case 'noise': {
        const step = Math.floor(t * freq);
        if (step !== noiseStep) {
          noiseStep = step;
          noise = nextFloat(rng) * 2 - 1;
        }
        s = noise;
        break;
      }
    }
    out[i] = s * envelope(t, p) * p.volume;
  }
  return out;
}
```

`src/art/sfx/bank.ts`:

```ts
import type { SfxId } from '@content/ids';
import type { SynthParams } from './synth';

/** Placeholder recipes. Real recordings later replace these by the same SfxId. */
export const SFX_BANK = {
  sfx_swing: { wave: 'noise', freq: 4000, freqEnd: 1200, attack: 0.005, sustain: 0.03, release: 0.08, volume: 0.35 },
  sfx_spin: { wave: 'noise', freq: 2500, freqEnd: 6000, attack: 0.01, sustain: 0.2, release: 0.15, volume: 0.35 },
  sfx_hit: { wave: 'square', freq: 220, freqEnd: 70, attack: 0, sustain: 0.03, release: 0.09, volume: 0.4, duty: 0.3 },
  sfx_block: { wave: 'square', freq: 900, freqEnd: 700, attack: 0, sustain: 0.02, release: 0.06, volume: 0.3 },
  sfx_roll: { wave: 'noise', freq: 900, freqEnd: 300, attack: 0.02, sustain: 0.08, release: 0.12, volume: 0.25 },
  sfx_charge: { wave: 'triangle', freq: 660, freqEnd: 1320, attack: 0.01, sustain: 0.05, release: 0.12, volume: 0.3 },
} as const satisfies Record<SfxId, SynthParams>;
```

Run: `pnpm vitest run tests/unit/shell/settings.test.ts tests/unit/art/synth.test.ts`
Expected: PASS.

- [ ] **Step 4: Play sounds in the shell**

`src/shell/audio/sfx.ts`:

```ts
import * as Phaser from 'phaser';
import { SFX_BANK } from '@art/sfx/bank';
import { synth } from '@art/sfx/synth';
import { SFX } from '@content/ids';
import { fnv1a } from '@core/math/hash';
import type { SimEvent } from '@core/sim/events';

/** Renders every SFX recipe into an AudioBuffer in Phaser's audio cache, under its SfxId. */
export function registerSfx(scene: Phaser.Scene): boolean {
  const sound = scene.sound;
  if (!(sound instanceof Phaser.Sound.WebAudioSoundManager)) return false;
  const ctx = sound.context;
  for (const id of SFX) {
    const samples = synth(SFX_BANK[id], ctx.sampleRate, fnv1a(id));
    const buffer = ctx.createBuffer(1, samples.length, ctx.sampleRate);
    buffer.copyToChannel(samples, 0);
    scene.cache.audio.add(id, buffer);
  }
  return true;
}

/** Plays `sfx` events. Phaser unlocks Web Audio on the first key press or click. */
export class AudioDirector {
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly volume: () => number,
    private readonly muted: boolean,
  ) {}

  handle(events: readonly SimEvent[]): void {
    if (this.muted) return;
    for (const ev of events) {
      if (ev.t === 'sfx' && this.scene.cache.audio.exists(ev.id)) this.scene.sound.play(ev.id, { volume: this.volume() });
    }
  }
}
```

In `src/shell/scenes/BootScene.ts`, add `import { registerSfx } from '@shell/audio/sfx';` and call `registerSfx(this);` as the first line of `create()`.

In `src/shell/services.ts`, import `Settings` and extend:

```ts
import type { Settings } from './platform/settings';

export interface Services {
  readonly db: ContentDb;
  readonly state: GameState;
  readonly settings: Settings;
  readonly dev: DevTools | null;
  /** Dev/test `?mute`. */
  readonly muted: boolean;
}
```

In `src/shell/dev/bridge.ts`, add `import type { Settings } from '@shell/platform/settings';` and the field `readonly settings: Settings;` to `DevBridge`.

In `src/shell/scenes/PlayScene.ts`:
- Import `AudioDirector` from `@shell/audio/sfx`.
- Add the field `private audio!: AudioDirector;`.
- In `create`, replace the Sim and mapper construction with:

```ts
    this.sim = new Sim(data.db, data.state, { longDay: data.settings.longDay });
    this.mapper = new InputMapper(DEFAULT_BINDINGS, this.latch, { holdToggleShield: data.settings.holdShield });
    this.audio = new AudioDirector(this, () => data.settings.volume, data.muted);
```

- In `update`, after the `for (const ev of events) this.onEvent(ev);` line, add `this.audio.handle(events);`.
- In `bridge()`, add `settings: this.services.settings,`.

In `src/shell/dev/commands.ts`:
- Add `import { LANGS } from '@core/i18n/t';` and `import { browserStorage, saveSettings } from '@shell/platform/settings';`.
- Extend `HELP` with ` · lang <en|sv> · volume <0..1>`.
- Add these cases before `default`:

```ts
    case 'lang': {
      const lang = LANGS.find((l) => l === args[0]);
      if (lang === undefined) return `languages: ${LANGS.join(', ')}`;
      b.settings.lang = lang;
      saveSettings(browserStorage(), b.settings);
      return `language ${lang}`;
    }
    case 'volume': {
      const v = Number(args[0]);
      if (!Number.isFinite(v) || v < 0 || v > 1) return 'usage: volume 0..1';
      b.settings.volume = v;
      saveSettings(browserStorage(), b.settings);
      return `volume ${v}`;
    }
```

In `tests/unit/shell/devCommands.test.ts`, add `settings: { ...DEFAULT_SETTINGS }` to the fake bridge (importing `DEFAULT_SETTINGS` from `@shell/platform/settings`), and add:

```ts
  it('changes the language', () => {
    const { b } = bridge();
    expect(run(b, 'lang sv')).toBe('language sv');
    expect(b.settings.lang).toBe('sv');
    expect(run(b, 'lang de')).toBe('languages: en, sv');
  });
```

(`browserStorage()` returns null in Node, because `window` is undefined inside the try, so saving is skipped harmlessly.)

Replace the body of `main()` in `src/shell/main.ts`:
- Add imports for `UI` (`@content/i18n/ui`), `t` (`@core/i18n/t`), and `browserStorage`, `loadSettings`, `preferredLang` (`@shell/platform/settings`).
- Make `startGame` use `attachZoom(game, () => services.settings.scaling)`.

```ts
async function main(): Promise<void> {
  document.title = GAME_TITLE;
  const query = DEV_TOOLS ? parseDevQuery(window.location.search, new Set<string>(SCREEN_IDS)) : null;
  for (const warning of query?.warnings ?? []) console.warn(`[dev] ${warning}`);
  const settings = loadSettings(browserStorage(), preferredLang(navigator.languages));
  if (query?.lang !== undefined) settings.lang = query.lang;
  if (!hasWebGL()) {
    showMessage(t(UI.webgl_required, settings.lang));
    return;
  }
  const state = newGame(query?.seed ?? randomSeed(), NEW_GAME);
  if (query !== null) applyDevQuery(state, query);
  const dev = DEV_TOOLS ? (await import('@shell/dev/index')).createDevTools() : null;
  startGame({ db: DB, state, settings, dev, muted: query?.mute === true });
}
```

- [ ] **Step 5: Run and commit**

Run: `pnpm check && pnpm e2e`
Expected: green. Then check manually in `pnpm dev`: after the first key press, swinging (J), rolling (Space) and hitting the dummy make sounds.

```bash
git add -A
git commit -m "Add settings in localStorage, language selection and synthesized SFX

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 21: Browser saves — IndexedDB, autosave, export/import, tab lock

**Files:**
- Create: `src/shell/platform/idb.ts`, `src/shell/platform/saveStore.ts`, `src/shell/platform/autosave.ts`, `src/shell/platform/exportImport.ts`, `src/shell/platform/saveService.ts`, `src/shell/platform/tabLock.ts`, `src/shell/env.d.ts`
- Modify: `vite.config.ts` (build id), `src/shell/services.ts`, `src/shell/dev/bridge.ts`, `src/shell/dev/hook.ts`, `src/shell/dev/commands.ts`, `src/shell/scenes/PlayScene.ts`, `src/shell/main.ts`, `package.json` (dev dep)
- Test: `tests/unit/shell/saveStore.test.ts`, `tests/unit/shell/autosave.test.ts`, `tests/unit/shell/saveService.test.ts`, `tests/unit/shell/tabLock.test.ts`, `tests/e2e/saves.spec.ts`

**Interfaces:**
- Consumes: `makeSave`, `loadSave`, `parseSaveJson`, `SaveData`, `LoadResult` (Task 5); `UiKey` (Task 4).
- Produces:
  - IndexedDB helpers: `openDatabase`, `request`, `transactionDone`.
  - Store: `SlotId`, `SaveSummary`, `SaveRecord`, `SaveStore { open; get; writeAuto; writeSlot; getMeta; setMeta; close }`, `openSaveStoreSafely(factory)`.
  - Autosave: `Autosaver { request(state); flush() }` with `AutosaveDeps`.
  - Export and import: `saveFileName`, `downloadSave`, `pickSaveFile`, `importMessageKey(result): UiKey`.
  - `SaveService { available; autosaver; loadAuto(); exportJson(state); download(state); importText(text) }`.
  - Tab lock: `acquireTabLock(locks)`.
  - `__BUILD_ID__`.
  - Additions: the hook gains `exportSaveJson`, `importSaveJson`, `flushSave`, `downloadSave`; the console gains `save`, `export`, `import`.

- [ ] **Step 1: Add fake-indexeddb**

Run: `pnpm add -D -E fake-indexeddb@6.2.5`

- [ ] **Step 2: Write the failing tests**

`tests/unit/shell/saveStore.test.ts`:

```ts
import { IDBFactory as FakeIDBFactory } from 'fake-indexeddb';
import { describe, expect, it, vi } from 'vitest';
import { NEW_GAME } from '@content/start';
import { newGame } from '@core/state/gameState';
import { makeSave } from '@core/state/save';
import { SaveStore, openSaveStoreSafely } from '@shell/platform/saveStore';

const factory = (): IDBFactory => new FakeIDBFactory() as unknown as IDBFactory;

const save = (hp: number) => {
  const s = newGame(1, NEW_GAME);
  s.hero.hp = hp;
  return makeSave(s, 'test', '2026-09-26T00:00:00.000Z');
};

describe('SaveStore', () => {
  it('keeps the previous autosave as auto_prev', async () => {
    const store = await SaveStore.open(factory());
    await store.writeAuto(save(12));
    await store.writeAuto(save(8));
    expect((await store.get('auto'))?.save.state.hero.hp).toBe(8);
    expect((await store.get('auto_prev'))?.save.state.hero.hp).toBe(12);
    expect((await store.get('auto'))?.summary).toMatchObject({ screen: 'test_a', hearts: 2, day: 1, season: 'summer' });
    store.close();
  });

  it('writes manual slots and meta values', async () => {
    const store = await SaveStore.open(factory());
    await store.writeSlot('s2', save(10));
    await store.setMeta('persistAsked', true);
    expect((await store.get('s2'))?.save.state.hero.hp).toBe(10);
    expect(await store.getMeta('persistAsked')).toBe(true);
    expect(await store.get('s1')).toBeUndefined();
    store.close();
  });

  it('returns null instead of throwing when IndexedDB is missing or broken', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(await openSaveStoreSafely(undefined)).toBeNull();
    const broken = {
      open: () => {
        throw new Error('blocked');
      },
    } as unknown as IDBFactory;
    expect(await openSaveStoreSafely(broken)).toBeNull();
    warn.mockRestore();
  });
});
```

`tests/unit/shell/autosave.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NEW_GAME } from '@content/start';
import { newGame, type GameState } from '@core/state/gameState';
import { Autosaver } from '@shell/platform/autosave';

const state = (ticks: number): GameState => ({ ...newGame(1, NEW_GAME), playTicks: ticks });

function setup(fail = false): { saver: Autosaver; writes: number[]; errors: unknown[] } {
  const writes: number[] = [];
  const errors: unknown[] = [];
  const saver = new Autosaver({
    write: (s) => {
      if (fail) return Promise.reject(new Error('disk full'));
      writes.push(s.playTicks);
      return Promise.resolve();
    },
    now: () => Date.now(),
    setTimer: (fn, ms) => setTimeout(fn, ms),
    clearTimer: (h) => {
      clearTimeout(h as number);
    },
    minIntervalMs: 4000,
    onError: (e) => errors.push(e),
  });
  return { saver, writes, errors };
}

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('Autosaver', () => {
  it('writes the first request immediately', async () => {
    const { saver, writes } = setup();
    saver.request(state(1));
    await vi.advanceTimersByTimeAsync(0);
    expect(writes).toEqual([1]);
  });

  it('coalesces requests inside the interval into one trailing write of the latest state', async () => {
    const { saver, writes } = setup();
    saver.request(state(1));
    await vi.advanceTimersByTimeAsync(0);
    saver.request(state(2));
    saver.request(state(3));
    expect(writes).toEqual([1]);
    await vi.advanceTimersByTimeAsync(4000);
    expect(writes).toEqual([1, 3]);
  });

  it('flushes a pending state at once (tab hidden, page closing)', async () => {
    const { saver, writes } = setup();
    saver.request(state(1));
    await vi.advanceTimersByTimeAsync(0);
    saver.request(state(2));
    await saver.flush();
    expect(writes).toEqual([1, 2]);
  });

  it('reports write errors instead of throwing', async () => {
    const { saver, errors } = setup(true);
    saver.request(state(1));
    await vi.advanceTimersByTimeAsync(0);
    expect(errors).toHaveLength(1);
  });
});
```

`tests/unit/shell/saveService.test.ts`:

```ts
import { IDBFactory as FakeIDBFactory } from 'fake-indexeddb';
import { describe, expect, it, vi } from 'vitest';
import { NEW_GAME } from '@content/start';
import { SCREEN_IDS, type ScreenId } from '@content/world/screens';
import { newGame } from '@core/state/gameState';
import { makeSave, type LoadResult } from '@core/state/save';
import { importMessageKey, saveFileName } from '@shell/platform/exportImport';
import { SaveService } from '@shell/platform/saveService';
import { SaveStore } from '@shell/platform/saveStore';

const known = new Set<string>(SCREEN_IDS);
const factory = (): IDBFactory => new FakeIDBFactory() as unknown as IDBFactory;

describe('SaveService', () => {
  it('falls back to the previous autosave when the latest one is unusable', async () => {
    const store = await SaveStore.open(factory());
    const service = new SaveService(store, 'test', known);
    const good = newGame(1, NEW_GAME);
    good.hero.hp = 9;
    await store.writeAuto(makeSave(good, 'test', 'x'));
    const bad = newGame(1, NEW_GAME);
    bad.hero.screen = 'nowhere' as ScreenId;
    await store.writeAuto(makeSave(bad, 'test', 'x'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect((await service.loadAuto())?.hero.hp).toBe(9);
    warn.mockRestore();
  });

  it('works without storage', async () => {
    const service = new SaveService(null, 'test', known);
    expect(service.available).toBe(false);
    expect(await service.loadAuto()).toBeNull();
  });

  it('exports JSON that imports again', () => {
    const service = new SaveService(null, 'test', known);
    const result = service.importText(service.exportJson(newGame(3, NEW_GAME)));
    expect(result.ok && result.checksumOk).toBe(true);
  });
});

describe('export/import helpers', () => {
  it('names files by slot and date', () => {
    expect(saveFileName(makeSave(newGame(1, NEW_GAME), 'b', '2026-09-26T10:00:00.000Z'), 'auto')).toBe(
      'fimbulvetr-auto-2026-09-26.json',
    );
  });

  it('maps load results to messages', () => {
    const ok: LoadResult = { ok: true, state: newGame(1, NEW_GAME), checksumOk: true, fromVersion: 1 };
    expect(importMessageKey(ok)).toBe('import_ok');
    expect(importMessageKey({ ...ok, checksumOk: false })).toBe('import_checksum');
    expect(importMessageKey({ ok: false, error: { code: 'not-a-save', detail: '' } })).toBe('import_bad_file');
    expect(importMessageKey({ ok: false, error: { code: 'too-new', detail: '' } })).toBe('import_too_new');
    expect(importMessageKey({ ok: false, error: { code: 'invalid', detail: '' } })).toBe('import_invalid');
  });
});
```

`tests/unit/shell/tabLock.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { acquireTabLock, type LockManagerLike } from '@shell/platform/tabLock';

function fakeLocks(): LockManagerLike {
  const held = new Set<string>();
  return {
    request: (name, _options, callback) => {
      const lock = held.has(name) ? null : { name };
      if (lock !== null) held.add(name);
      return Promise.resolve(callback(lock));
    },
  };
}

describe('acquireTabLock', () => {
  it('lets exactly one tab hold the game', async () => {
    const locks = fakeLocks();
    expect(await acquireTabLock(locks)).toBe(true);
    expect(await acquireTabLock(locks)).toBe(false);
  });

  it('allows play where the Web Locks API is missing', async () => {
    expect(await acquireTabLock(undefined)).toBe(true);
  });
});
```

Run: `pnpm vitest run tests/unit/shell`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement storage**

`src/shell/platform/idb.ts`:

```ts
/** Minimal promise helpers over the plain IndexedDB API (no library). */
export function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => {
      resolve(req.result);
    };
    req.onerror = () => {
      reject(req.error ?? new Error('IndexedDB request failed'));
    };
  });
}

export function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      resolve();
    };
    tx.onerror = () => {
      reject(tx.error ?? new Error('IndexedDB transaction failed'));
    };
    tx.onabort = () => {
      reject(tx.error ?? new Error('IndexedDB transaction aborted'));
    };
  });
}

export function openDatabase(
  factory: IDBFactory,
  name: string,
  version: number,
  upgrade: (db: IDBDatabase) => void,
): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = factory.open(name, version);
    req.onupgradeneeded = () => {
      upgrade(req.result);
    };
    req.onsuccess = () => {
      const db = req.result;
      db.onversionchange = () => {
        db.close();
      };
      resolve(db);
    };
    req.onerror = () => {
      reject(req.error ?? new Error('IndexedDB open failed'));
    };
    req.onblocked = () => {
      reject(new Error('IndexedDB open blocked by another tab'));
    };
  });
}
```

`src/shell/platform/saveStore.ts`:

```ts
import type { Season } from '@core/clock/types';
import type { SaveData } from '@core/state/save';
import { openDatabase, request, transactionDone } from './idb';

export const DB_NAME = 'fimbulvetr';
const DB_VERSION = 1;
const SAVES = 'saves';
const META = 'meta';

export type SlotId = 'auto' | 'auto_prev' | 's1' | 's2' | 's3';

/** Shown on the load screen without parsing the whole save. */
export interface SaveSummary {
  readonly screen: string;
  readonly hearts: number;
  readonly playTicks: number;
  readonly day: number;
  readonly season: Season;
}

export interface SaveRecord {
  readonly slot: SlotId;
  readonly summary: SaveSummary;
  readonly save: SaveData;
}

export function summarize(save: SaveData): SaveSummary {
  const s = save.state;
  return { screen: s.hero.screen, hearts: s.hero.hp / 4, playTicks: s.playTicks, day: s.clock.day, season: s.clock.season };
}

export class SaveStore {
  private constructor(private readonly db: IDBDatabase) {}

  static async open(factory: IDBFactory, name: string = DB_NAME): Promise<SaveStore> {
    const db = await openDatabase(factory, name, DB_VERSION, (d) => {
      if (!d.objectStoreNames.contains(SAVES)) d.createObjectStore(SAVES, { keyPath: 'slot' });
      if (!d.objectStoreNames.contains(META)) d.createObjectStore(META);
    });
    return new SaveStore(db);
  }

  async get(slot: SlotId): Promise<SaveRecord | undefined> {
    const tx = this.db.transaction(SAVES, 'readonly');
    return (await request(tx.objectStore(SAVES).get(slot))) as SaveRecord | undefined;
  }

  /** Writes the autosave and keeps the one before it as `auto_prev`, in a single transaction. */
  async writeAuto(save: SaveData): Promise<void> {
    const tx = this.db.transaction(SAVES, 'readwrite');
    const store = tx.objectStore(SAVES);
    const current = store.get('auto');
    current.onsuccess = () => {
      const previous = current.result as SaveRecord | undefined;
      if (previous !== undefined) store.put({ ...previous, slot: 'auto_prev' } satisfies SaveRecord);
      store.put({ slot: 'auto', summary: summarize(save), save } satisfies SaveRecord);
    };
    await transactionDone(tx);
  }

  /** Manual slots (mead halls, hofs) ask for strict durability. */
  async writeSlot(slot: 's1' | 's2' | 's3', save: SaveData): Promise<void> {
    const tx = this.db.transaction(SAVES, 'readwrite', { durability: 'strict' });
    tx.objectStore(SAVES).put({ slot, summary: summarize(save), save } satisfies SaveRecord);
    await transactionDone(tx);
  }

  async getMeta(key: string): Promise<unknown> {
    const tx = this.db.transaction(META, 'readonly');
    return request(tx.objectStore(META).get(key));
  }

  async setMeta(key: string, value: unknown): Promise<void> {
    const tx = this.db.transaction(META, 'readwrite');
    tx.objectStore(META).put(value, key);
    await transactionDone(tx);
  }

  close(): void {
    this.db.close();
  }
}

/** The game must still start where IndexedDB is missing or refuses to open (private mode, blocked data). */
export async function openSaveStoreSafely(factory: IDBFactory | undefined): Promise<SaveStore | null> {
  if (factory === undefined) return null;
  try {
    return await SaveStore.open(factory);
  } catch (e) {
    console.warn('[save] IndexedDB unavailable:', e);
    return null;
  }
}
```

`src/shell/platform/autosave.ts`:

```ts
import type { GameState } from '@core/state/gameState';

export interface AutosaveDeps {
  write(state: GameState): Promise<void>;
  now(): number;
  setTimer(fn: () => void, ms: number): unknown;
  clearTimer(handle: unknown): void;
  readonly minIntervalMs: number;
  onError(error: unknown): void;
}

/** At most one write per interval; later requests collapse into one trailing write of the newest state. */
export class Autosaver {
  private pending: GameState | null = null;
  private lastWrite = Number.NEGATIVE_INFINITY;
  private timer: unknown = null;
  private writing: Promise<void> | null = null;

  constructor(private readonly deps: AutosaveDeps) {}

  request(state: GameState): void {
    this.pending = state;
    const wait = this.lastWrite + this.deps.minIntervalMs - this.deps.now();
    if (wait <= 0) {
      void this.flush();
    } else if (this.timer === null) {
      this.timer = this.deps.setTimer(() => {
        this.timer = null;
        void this.flush();
      }, wait);
    }
  }

  async flush(): Promise<void> {
    if (this.writing !== null) await this.writing;
    const state = this.pending;
    if (state === null) return;
    this.pending = null;
    this.lastWrite = this.deps.now();
    if (this.timer !== null) {
      this.deps.clearTimer(this.timer);
      this.timer = null;
    }
    this.writing = this.deps
      .write(state)
      .catch((e: unknown) => {
        this.deps.onError(e);
      })
      .finally(() => {
        this.writing = null;
      });
    await this.writing;
  }
}
```

`src/shell/platform/exportImport.ts`:

```ts
import type { UiKey } from '@content/i18n/ui';
import type { LoadResult, SaveData } from '@core/state/save';

export function saveFileName(save: SaveData, slot: string): string {
  return `fimbulvetr-${slot}-${save.savedAt.slice(0, 10)}.json`;
}

/** Offers the save as a file download (works in every browser; no File System Access API needed). */
export function downloadSave(save: SaveData, slot: string): void {
  const blob = new Blob([JSON.stringify(save, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = saveFileName(save, slot);
  document.body.append(a);
  a.click();
  a.remove();
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

/** Lets the player pick a .json file; resolves to its text, or null if cancelled. */
export function pickSaveFile(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (file === undefined) {
        resolve(null);
        return;
      }
      file.text().then(resolve, () => {
        resolve(null);
      });
    });
    input.addEventListener('cancel', () => {
      resolve(null);
    });
    input.click();
  });
}

export function importMessageKey(result: LoadResult): UiKey {
  if (result.ok) return result.checksumOk ? 'import_ok' : 'import_checksum';
  switch (result.error.code) {
    case 'not-a-save':
      return 'import_bad_file';
    case 'too-new':
      return 'import_too_new';
    case 'invalid':
      return 'import_invalid';
  }
}
```

`src/shell/platform/saveService.ts`:

```ts
import type { GameState } from '@core/state/gameState';
import { loadSave, makeSave, parseSaveJson, type LoadResult, type SaveData } from '@core/state/save';
import { Autosaver } from './autosave';
import { downloadSave } from './exportImport';
import type { SaveStore } from './saveStore';

export const AUTOSAVE_INTERVAL_MS = 4000;

/** Everything the game does with saves. Works (as a no-op for storage) when IndexedDB is unavailable. */
export class SaveService {
  readonly autosaver: Autosaver;
  private persistAsked = false;

  constructor(
    private readonly store: SaveStore | null,
    private readonly build: string,
    private readonly knownScreens: ReadonlySet<string>,
  ) {
    this.autosaver = new Autosaver({
      write: (state) => this.writeAuto(state),
      now: () => performance.now(),
      setTimer: (fn, ms) => setTimeout(fn, ms),
      clearTimer: (handle) => {
        clearTimeout(handle as number);
      },
      minIntervalMs: AUTOSAVE_INTERVAL_MS,
      onError: (e) => {
        console.warn('[save] autosave failed:', e);
      },
    });
  }

  get available(): boolean {
    return this.store !== null;
  }

  /** The newest usable autosave, falling back to the one before it. */
  async loadAuto(): Promise<GameState | null> {
    if (this.store === null) return null;
    for (const slot of ['auto', 'auto_prev'] as const) {
      const record = await this.store.get(slot);
      if (record === undefined) continue;
      const result = loadSave(record.save, this.knownScreens);
      if (result.ok) return result.state;
      console.warn(`[save] ${slot} is unusable: ${result.error.detail}`);
    }
    return null;
  }

  exportJson(state: GameState): string {
    return JSON.stringify(this.toSave(state), null, 2);
  }

  download(state: GameState): void {
    downloadSave(this.toSave(state), 'auto');
  }

  importText(text: string): LoadResult {
    return parseSaveJson(text, this.knownScreens);
  }

  private toSave(state: GameState): SaveData {
    return makeSave(state, this.build, new Date().toISOString());
  }

  private async writeAuto(state: GameState): Promise<void> {
    if (this.store === null) return;
    await this.store.writeAuto(this.toSave(state));
    if (this.persistAsked) return;
    this.persistAsked = true;
    if ((await this.store.getMeta('persistAsked')) === true) return;
    await this.store.setMeta('persistAsked', true);
    try {
      // Safari evicts script storage after 7 days without a visit unless it is persistent (or installed).
      await navigator.storage.persist();
    } catch {
      // The Storage API is missing here; export/import remains the safety net.
    }
  }
}
```

`src/shell/platform/tabLock.ts`:

```ts
export interface LockManagerLike {
  request(
    name: string,
    options: { ifAvailable: boolean },
    callback: (lock: unknown) => Promise<void> | undefined,
  ): Promise<unknown>;
}

/** Holds a Web Lock for the page's lifetime so two tabs never race each other's autosaves. */
export function acquireTabLock(locks: LockManagerLike | undefined, name = 'fimbulvetr-game'): Promise<boolean> {
  if (locks === undefined) return Promise.resolve(true);
  return new Promise((resolve) => {
    void locks.request(name, { ifAvailable: true }, (lock) => {
      if (lock === null) {
        resolve(false);
        return undefined;
      }
      resolve(true);
      return new Promise<void>(() => {
        // Never resolves: the lock is released when the tab closes.
      });
    });
  });
}
```

`src/shell/env.d.ts`:

```ts
/** Short git hash (CI) or 'dev'; stamped into every save as `build`. */
declare const __BUILD_ID__: string;
```

In `vite.config.ts`, add a `define` entry:

```ts
  define: { __BUILD_ID__: JSON.stringify(process.env.GITHUB_SHA?.slice(0, 7) ?? 'dev') },
```

Run: `pnpm vitest run tests/unit/shell`
Expected: PASS.

- [ ] **Step 4: Wire saves into the game**

`src/shell/services.ts` becomes:

```ts
import type { Tileset } from '@art/tiles/tileset';
import type { ContentDb } from '@core/sim/db';
import type { GameState } from '@core/state/gameState';
import type { DevTools } from './dev/bridge';
import type { FrameIndex } from './gfx/frameIndex';
import type { SaveService } from './platform/saveService';
import type { Settings } from './platform/settings';

export interface Services {
  readonly db: ContentDb;
  readonly state: GameState;
  readonly settings: Settings;
  readonly saves: SaveService;
  readonly dev: DevTools | null;
  /** Dev/test `?mute`. */
  readonly muted: boolean;
}

export interface RenderAssets {
  readonly frames: FrameIndex;
  readonly tileset: Tileset;
}

export interface PlayData extends Services {
  readonly assets: RenderAssets;
}
```

In `src/shell/dev/bridge.ts`, add `import type { GameState } from '@core/state/gameState';` and `import type { SaveService } from '@shell/platform/saveService';`, then add these to `DevBridge`:

```ts
  readonly saves: SaveService;
  /** Restarts play from another state (used by import). */
  restart(state: GameState): void;
```

In `src/shell/dev/hook.ts`:
- Add `import type { UiKey } from '@content/i18n/ui';` and `import { importMessageKey } from '@shell/platform/exportImport';`.
- Add to the `FimbulHook` interface:

```ts
  exportSaveJson(): string;
  importSaveJson(json: string): UiKey;
  flushSave(): Promise<void>;
  downloadSave(): void;
```

- Add to the object assigned to `window.__fimbul`:

```ts
    exportSaveJson: () => {
      const b = bridge();
      return b.saves.exportJson(b.sim.snapshot());
    },
    importSaveJson: (json) => {
      const b = bridge();
      const result = b.saves.importText(json);
      if (result.ok) {
        b.saves.autosaver.request(result.state);
        b.restart(result.state);
      }
      return importMessageKey(result);
    },
    flushSave: async () => {
      const b = bridge();
      b.saves.autosaver.request(b.sim.snapshot());
      await b.saves.autosaver.flush();
    },
    downloadSave: () => {
      const b = bridge();
      b.saves.download(b.sim.snapshot());
    },
```

In `src/shell/dev/commands.ts`:
- Add `import { UI } from '@content/i18n/ui';`, `import { t } from '@core/i18n/t';` and `import { importMessageKey, pickSaveFile } from '@shell/platform/exportImport';`.
- Remove the `void print;` line.
- Extend `HELP` with ` · save · export · import`.
- Add these cases before `default`:

```ts
    case 'save':
      b.saves.autosaver.request(b.sim.snapshot());
      void b.saves.autosaver.flush().then(() => {
        print('saved');
      });
      return 'saving…';
    case 'export':
      b.saves.download(b.sim.snapshot());
      return 'download started';
    case 'import':
      void pickSaveFile().then((text) => {
        if (text === null) {
          print('import cancelled');
          return;
        }
        const result = b.saves.importText(text);
        const detail = result.ok ? '' : result.error.detail;
        print(t(UI[importMessageKey(result)], b.settings.lang, { detail }));
        if (result.ok) {
          b.saves.autosaver.request(result.state);
          b.restart(result.state);
        }
      });
      return 'choose a save file…';
```

In `tests/unit/shell/devCommands.test.ts`, add to the fake bridge:

```ts
    saves: new SaveService(null, 'test', new Set()),
    restart: () => undefined,
```

(importing `SaveService` from `@shell/platform/saveService`).

Replace `src/shell/scenes/PlayScene.ts` with its complete M0 form:

```ts
import * as Phaser from 'phaser';
import { grade } from '@art/grading';
import { ANIMS } from '@art/sprites';
import { tileIndices } from '@art/tiles/indices';
import { DEFAULT_BINDINGS } from '@content/bindings';
import type { ScreenId } from '@content/world/screens';
import { daylight } from '@core/clock/clock';
import { InputLatch } from '@core/input/actions';
import { fnv1a } from '@core/math/hash';
import { add, lerp } from '@core/math/vec';
import type { SimEvent } from '@core/sim/events';
import { advance, type Accumulator } from '@core/sim/loop';
import { Sim } from '@core/sim/sim';
import type { GameState } from '@core/state/gameState';
import { SCREEN_H, SCREEN_W } from '@core/world/dims';
import { AudioDirector } from '@shell/audio/sfx';
import type { DevBridge } from '@shell/dev/bridge';
import { FrameStats } from '@shell/dev/stats';
import { readPad } from '@shell/input/gamepad';
import { KeyboardState, attachKeyboard } from '@shell/input/keyboard';
import { InputMapper } from '@shell/input/mapper';
import { LETTERBOX } from '@shell/scale';
import type { PlayData } from '@shell/services';
import { EntityViews } from '@shell/view/entityViews';
import { ScreenView } from '@shell/view/screenView';

/** Owns the Sim: steps it at 60 Hz, feeds it input, draws its state, plays its sounds, autosaves. */
export class PlayScene extends Phaser.Scene {
  private services!: PlayData;
  private sim!: Sim;
  private mapper!: InputMapper;
  private views!: EntityViews;
  private audio!: AudioDirector;
  private colour!: Phaser.Filters.ColorMatrix;
  private readonly latch = new InputLatch();
  private readonly keys = new KeyboardState();
  private readonly acc: Accumulator = { acc: 0 };
  private readonly stats = new FrameStats();
  private readonly screens = new Map<ScreenId, ScreenView>();
  private appliedGrade: readonly number[] = [];
  private gradeKey = '';

  constructor() {
    super('play');
  }

  create(data: PlayData): void {
    this.services = data;
    this.acc.acc = 0;
    this.gradeKey = '';
    this.screens.clear();
    this.sim = new Sim(data.db, data.state, { longDay: data.settings.longDay });
    this.mapper = new InputMapper(DEFAULT_BINDINGS, this.latch, { holdToggleShield: data.settings.holdShield });
    this.audio = new AudioDirector(this, () => data.settings.volume, data.muted);

    const detachKeys = attachKeyboard(window, this.keys);
    const flush = (): void => {
      void data.saves.autosaver.flush();
    };
    const onVisibility = (): void => {
      if (document.visibilityState === 'hidden') flush();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', flush);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      detachKeys();
      this.keys.clear();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', flush);
    });

    const cam = this.cameras.main;
    cam.setViewport(0, LETTERBOX, SCREEN_W, SCREEN_H);
    cam.setRoundPixels(true);
    this.colour = cam.filters.internal.addColorMatrix();
    this.views = new EntityViews(this, data.assets.frames, ANIMS);
    this.showScreen(this.sim.screen.id);
    this.draw(0);
    data.dev?.attach(this.bridge());
    document.body.dataset.ready = 'true';
  }

  override update(_time: number, delta: number): void {
    this.mapper.sample(this.keys.codes(), readPad(navigator.getGamepads()));
    const { steps, alpha } = advance(this.acc, delta);
    const started = performance.now();
    for (let i = 0; i < steps; i++) this.sim.step(this.latch.consume());
    this.stats.record(delta, performance.now() - started);
    const events = this.sim.drainEvents();
    for (const ev of events) this.onEvent(ev);
    this.audio.handle(events);
    this.services.dev?.onEvents(events);
    this.draw(alpha);
  }

  private onEvent(ev: SimEvent): void {
    if (ev.t === 'screenTransition') {
      this.showScreen(ev.to);
    } else if (ev.t === 'screenEntered') {
      this.showScreen(ev.screen);
      this.dropScreensExcept(ev.screen);
      this.services.saves.autosaver.request(this.sim.snapshot());
    }
  }

  private draw(alpha: number): void {
    const tr = this.sim.transition;
    if (tr !== null) {
      const p = Math.min(1, (tr.t + alpha) / tr.dur);
      const from = this.sim.originOf(tr.from);
      const to = this.sim.originOf(tr.to);
      const cam = lerp(from, to, p);
      this.cameras.main.setScroll(Math.round(cam.x), Math.round(cam.y));
      const hero = lerp(add(from, tr.heroFrom), add(to, tr.heroTo), p);
      this.views.sync(this.sim.entities, (e) => (e === this.sim.hero ? hero : add(to, e.pos)));
    } else {
      const origin = this.sim.originOf(this.sim.screen.id);
      this.cameras.main.setScroll(origin.x, origin.y);
      this.views.sync(this.sim.entities, (e) => add(origin, lerp(e.prev, e.pos, alpha)));
    }
    this.applyGrade();
  }

  private applyGrade(): void {
    const clock = this.sim.state.clock;
    const light = daylight(clock, this.services.db.clock);
    const key = `${clock.season}|${Math.round(light * 200)}`;
    if (key === this.gradeKey) return;
    this.gradeKey = key;
    this.appliedGrade = grade(clock.season, light, 'clear');
    this.colour.colorMatrix.set([...this.appliedGrade]);
  }

  private showScreen(id: ScreenId): void {
    if (this.screens.has(id)) return;
    const indices = tileIndices(this.sim.terrainOf(id), this.services.assets.tileset, fnv1a(id));
    this.screens.set(id, new ScreenView(this, this.sim.originOf(id), indices));
  }

  private dropScreensExcept(id: ScreenId): void {
    for (const [key, view] of this.screens) {
      if (key === id) continue;
      view.destroy();
      this.screens.delete(key);
    }
  }

  private bridge(): DevBridge {
    return {
      sim: this.sim,
      frames: this.services.assets.frames,
      stats: this.stats,
      settings: this.services.settings,
      saves: this.services.saves,
      appliedGrade: () => this.appliedGrade,
      lightLevel: () => daylight(this.sim.state.clock, this.services.db.clock),
      restart: (state: GameState) => {
        this.scene.restart({ ...this.services, state });
      },
    };
  }
}
```

Replace `main()` in `src/shell/main.ts`. Add imports for `SaveService` (`@shell/platform/saveService`), `openSaveStoreSafely` (`@shell/platform/saveStore`) and `acquireTabLock` (`@shell/platform/tabLock`). Add this helper:

```ts
function indexedDbFactory(): IDBFactory | undefined {
  try {
    return window.indexedDB;
  } catch {
    return undefined;
  }
}
```

and replace `main`:

```ts
async function main(): Promise<void> {
  document.title = GAME_TITLE;
  const query = DEV_TOOLS ? parseDevQuery(window.location.search, new Set<string>(SCREEN_IDS)) : null;
  for (const warning of query?.warnings ?? []) console.warn(`[dev] ${warning}`);
  const settings = loadSettings(browserStorage(), preferredLang(navigator.languages));
  if (query?.lang !== undefined) settings.lang = query.lang;
  const lang = settings.lang;

  if (!hasWebGL()) {
    showMessage(t(UI.webgl_required, lang));
    return;
  }
  if (!(await acquireTabLock(navigator.locks))) {
    showMessage(t(UI.already_open, lang));
    return;
  }

  const wantSaves = query?.nosave !== true;
  const store = wantSaves ? await openSaveStoreSafely(indexedDbFactory()) : null;
  if (wantSaves && store === null) {
    showMessage(t(UI.storage_unavailable, lang), [{ label: t(UI.ok, lang), run: () => undefined }]);
  }
  const saves = new SaveService(store, __BUILD_ID__, new Set<string>(SCREEN_IDS));
  const loaded = query?.screen === undefined ? await saves.loadAuto() : null;
  const state = loaded ?? newGame(query?.seed ?? randomSeed(), NEW_GAME);
  if (query !== null) applyDevQuery(state, query);
  const dev = DEV_TOOLS ? (await import('@shell/dev/index')).createDevTools() : null;
  startGame({ db: DB, state, settings, saves, dev, muted: query?.mute === true });
}
```

- [ ] **Step 5: Write the saves e2e spec**

`tests/e2e/saves.spec.ts`:

```ts
import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { boot, collectErrors, screenId, walkUntilScreen } from './helpers';

test('the autosave made on entering a screen is resumed after a reload', async ({ page }) => {
  const errors = collectErrors(page);
  await boot(page, 'screen=test_a&at=37,11');
  await walkUntilScreen(page, 'KeyD', 'test_b');
  await page.evaluate(() => window.__fimbul?.flushSave());
  await boot(page);
  expect(await screenId(page)).toBe('test_b');
  expect(errors).toEqual([]);
});

test('a save exported from one session imports into another', async ({ page }) => {
  await boot(page, 'nosave&screen=test_b&at=20,11');
  const json = await page.evaluate(() => window.__fimbul?.exportSaveJson() ?? '');
  expect(JSON.parse(json)).toMatchObject({ format: 'fimbulvetr', v: 1 });
  await boot(page, 'nosave&screen=test_c&at=20,5');
  expect(await page.evaluate((text) => window.__fimbul?.importSaveJson(text), json)).toBe('import_ok');
  await expect.poll(() => screenId(page)).toBe('test_b');
});

test('importing something that is not a save changes nothing', async ({ page }) => {
  await boot(page, 'nosave&screen=test_c&at=20,5');
  expect(await page.evaluate(() => window.__fimbul?.importSaveJson('{"hello":"world"}'))).toBe('import_bad_file');
  expect(await page.evaluate(() => window.__fimbul?.importSaveJson('not json at all'))).toBe('import_bad_file');
  expect(await screenId(page)).toBe('test_c');
});

test('the save downloads as a JSON file', async ({ page }) => {
  await boot(page, 'nosave&screen=test_a&at=13,11');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.evaluate(() => {
      window.__fimbul?.downloadSave();
    }),
  ]);
  expect(download.suggestedFilename()).toMatch(/^fimbulvetr-auto-\d{4}-\d{2}-\d{2}\.json$/);
  const saved: unknown = JSON.parse(readFileSync(await download.path(), 'utf8'));
  expect(saved).toMatchObject({ format: 'fimbulvetr' });
});

test('a second tab is told the game is already open', async ({ page, context }) => {
  await boot(page, 'nosave&screen=test_a&at=13,11');
  const second = await context.newPage();
  await second.goto('/?nosave');
  await expect(second.locator('#msg')).toContainText(/already open|redan öppet/);
});
```

- [ ] **Step 6: Run and commit**

Run: `pnpm check && pnpm e2e`
Expected: green on both browsers.

```bash
git add -A
git commit -m "Save to IndexedDB with rolling autosave, export/import and a single-tab lock

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 22: PWA and icons

**Files:**
- Create: `scripts/icons.mjs`, `public/icons/*.png` (generated), `src/shell/platform/pwa.ts`, `tests/e2e/pwa.spec.ts`
- Modify: `vite.config.ts`, `src/shell/env.d.ts`, `index.html`, `src/shell/main.ts`, `package.json` (dev deps)

**Interfaces:**
- Consumes: `showMessage` (Task 2), `UI`/`t` (Task 4).
- Produces: `registerServiceWorker(lang)`; a web manifest and a precaching service worker; icons at `public/icons/icon-192.png`, `icon-512.png`, `icon-maskable-512.png` and `apple-touch-icon.png`.

- [ ] **Step 1: Add the plugin**

Run: `pnpm add -D -E vite-plugin-pwa@1.3.0 workbox-window@7.4.1`

- [ ] **Step 2: Generate icons with a dependency-free script**

`scripts/icons.mjs`:

```js
// Renders the app icons from a 16×16 snowflake grid into PNGs (node:zlib only; no image libraries).
import { mkdirSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const FLAKE = [
  '................',
  '.......ww.......',
  '....w..ww..w....',
  '.....w.ww.w.....',
  '......wwww......',
  '.w.....ww.....w.',
  '..w....ww....w..',
  'wwwwwwwwwwwwwwww',
  'wwwwwwwwwwwwwwww',
  '..w....ww....w..',
  '.w.....ww.....w.',
  '......wwww......',
  '.....w.ww.w.....',
  '....w..ww..w....',
  '.......ww.......',
  '................',
];
const BG = [0x1b, 0x2a, 0x44];
const FG = [0xe8, 0xf1, 0xfa];

const CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function png(size, pixel) {
  const stride = size * 3 + 1;
  const raw = Buffer.alloc(stride * size);
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixel(x, y);
      const i = y * stride + 1 + x * 3;
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([signature, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

function icon(size, padding) {
  const inner = size - 2 * padding;
  return png(size, (x, y) => {
    const gx = Math.floor(((x - padding) / inner) * 16);
    const gy = Math.floor(((y - padding) / inner) * 16);
    const row = FLAKE[gy];
    return row !== undefined && gx >= 0 && gx < 16 && row[gx] === 'w' ? FG : BG;
  });
}

mkdirSync('public/icons', { recursive: true });
writeFileSync('public/icons/icon-192.png', icon(192, 16));
writeFileSync('public/icons/icon-512.png', icon(512, 40));
writeFileSync('public/icons/icon-maskable-512.png', icon(512, 104));
writeFileSync('public/icons/apple-touch-icon.png', icon(180, 20));
console.log('icons written to public/icons');
```

Run: `pnpm icons`
Expected: `icons written to public/icons`, and the four PNGs exist. Open one to check that it shows a white snowflake on dark blue.

- [ ] **Step 3: Configure the PWA**

`vite.config.ts` becomes:

```ts
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { aliases } from './aliases.config';

export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  resolve: { alias: aliases },
  build: { target: 'es2022', chunkSizeWarningLimit: 2000 },
  define: { __BUILD_ID__: JSON.stringify(process.env.GITHUB_SHA?.slice(0, 7) ?? 'dev') },
  plugins: [
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['icons/apple-touch-icon.png'],
      manifest: {
        name: 'Fimbulvetr',
        short_name: 'Fimbulvetr',
        description: 'A Norse action-adventure that runs in your browser.',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        orientation: 'landscape',
        background_color: '#000000',
        theme_color: '#1b1522',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,webmanifest}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        cleanupOutdatedCaches: true,
      },
    }),
  ],
});
```

Add to the top of `src/shell/env.d.ts`:

```ts
/// <reference types="vite-plugin-pwa/client" />
```

In `index.html` `<head>`, after the theme-color meta, add:

```html
    <link rel="icon" href="/icons/icon-192.png" />
    <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
```

`src/shell/platform/pwa.ts`:

```ts
import { registerSW } from 'virtual:pwa-register';
import { UI } from '@content/i18n/ui';
import { t, type Lang } from '@core/i18n/t';
import { showMessage } from '@shell/boot/message';

/** Registers the offline service worker. New versions are offered, never swapped in mid-session. */
export function registerServiceWorker(lang: Lang): void {
  if (!('serviceWorker' in navigator)) return;
  const update = registerSW({
    immediate: true,
    onNeedRefresh() {
      showMessage(t(UI.update_ready, lang), [
        {
          label: t(UI.update_reload, lang),
          run: () => {
            void update(true);
          },
        },
        { label: t(UI.update_later, lang), run: () => undefined },
      ]);
    },
  });
}
```

In `src/shell/main.ts`, import `registerServiceWorker` from `@shell/platform/pwa` and call it right after the tab-lock check:

```ts
  if (!import.meta.env.DEV) registerServiceWorker(lang);
```

- [ ] **Step 4: Write the offline e2e test**

`tests/e2e/pwa.spec.ts`:

```ts
import { test } from '@playwright/test';
import { boot } from './helpers';

test.skip(({ browserName }) => browserName !== 'chromium', 'the offline service-worker check runs on Chromium');

test('keeps working offline after the first visit', async ({ page, context }) => {
  await boot(page, 'nosave');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await context.setOffline(true);
  await page.reload();
  await page.waitForFunction(() => window.__fimbul?.ready === true, undefined, { timeout: 20_000 });
});
```

- [ ] **Step 5: Run and commit**

Run: `pnpm check && pnpm e2e`
Expected: green. Check `dist/manifest.webmanifest` and `dist/sw.js` exist after `pnpm build`.

```bash
git add -A
git commit -m "Make the game an installable, offline-capable PWA

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 23: Budget, CI and Pages workflows

**Files:**
- Create: `scripts/check-budget.mjs`, `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`

**Interfaces:**
- Produces: `pnpm budget`, which fails when the total gzipped JS exceeds 730 KB (Phaser ≤ 380 KB plus app ≤ 350 KB, per the spec). The CI workflow runs the whole gate on every push and PR. The Pages workflow deploys `main` with `BASE_PATH=/Fimbulvetr/`.

- [ ] **Step 1: Budget script**

`scripts/check-budget.mjs`:

```js
// Fails the build when the gzipped JavaScript grows past the budget from the design spec.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const BUDGET_KB = 730;
const dir = 'dist/assets';
let total = 0;
for (const file of readdirSync(dir).filter((f) => f.endsWith('.js')).sort()) {
  const gz = gzipSync(readFileSync(join(dir, file))).length;
  total += gz;
  console.log(`${file.padEnd(48)} ${(gz / 1024).toFixed(1).padStart(7)} KB gz`);
}
console.log(`total ${(total / 1024).toFixed(1)} KB gz (budget ${BUDGET_KB} KB)`);
if (total > BUDGET_KB * 1024) {
  console.error('JavaScript is over budget.');
  process.exit(1);
}
```

Run: `pnpm build && pnpm budget`
Expected: a per-file list and a total under 730 KB.

Run: `grep -l '__fimbul' dist/assets/*.js || echo 'dev tools not in production'`
Expected: `dev tools not in production`. If a file is listed, the `DEV_TOOLS` branch in `main.ts` was not eliminated; keep that constant computed from `import.meta.env` inside `main.ts`.

- [ ] **Step 2: CI workflow**

`.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
  pull_request:

jobs:
  check:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm check
      - run: pnpm build
      - run: pnpm budget
      - run: pnpm exec playwright install --with-deps chromium webkit
      - run: pnpm e2e
      - if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report
          retention-days: 7
```

- [ ] **Step 3: Pages workflow**

`.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
        env:
          BASE_PATH: /Fimbulvetr/
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 4: Check the base-path build locally**

Run: `BASE_PATH=/Fimbulvetr/ pnpm build && grep -o '/Fimbulvetr/[^"]*' dist/index.html | head`
Expected: script, icon and manifest URLs are prefixed with `/Fimbulvetr/`.

Run: `pnpm build` again (restore the root-based build) and `pnpm format && pnpm check`.

- [ ] **Step 5: Commit (do not push)**

```bash
git add -A
git commit -m "Add JS budget check, CI workflow and GitHub Pages deploy workflow

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

Stop and tell the user that the workflows are committed but not pushed. Pushing the branch runs CI on GitHub. Deploying needs Pages enabled (repository Settings → Pages → Source: GitHub Actions) and a merge to `main`. Both are the user's call.

---

### Task 24: M0 exit test, ARCHITECTURE.md, roadmap and playtest

**Files:**
- Create: `tests/e2e/m0.spec.ts`
- Modify: `ARCHITECTURE.md`, `docs/roadmap.md`

**Interfaces:**
- Consumes: the whole of M0 through `window.__fimbul`.

- [ ] **Step 1: Write the exit scenario**

`tests/e2e/m0.spec.ts`:

```ts
import { expect, test } from '@playwright/test';
import { boot, clock, collectErrors, eventCount, hero, screenId, walkUntilScreen } from './helpers';

const waitForMove = async (page: import('@playwright/test').Page): Promise<void> => {
  await expect.poll(async () => (await hero(page))?.fsm).toBe('move');
};

test('M0 exit: move, fight, roll, shield, cross screens, tints, save and import', async ({ page }) => {
  const errors = collectErrors(page);
  await boot(page, 'screen=test_a&at=13,11');

  const x0 = (await hero(page))?.x ?? 0;
  await page.keyboard.down('KeyD');
  await page.waitForTimeout(500);
  await page.keyboard.up('KeyD');
  expect((await hero(page))?.x ?? 0).toBeGreaterThan(x0 + 20);

  await page.evaluate(() => {
    window.__fimbul?.warp('test_a', 23, 9);
  });
  await expect.poll(async () => (await hero(page))?.x).toBe(23 * 16 + 8);
  await page.keyboard.press('KeyJ');
  await expect.poll(() => eventCount(page, 'hit')).toBeGreaterThan(0);
  await waitForMove(page);

  await page.keyboard.press('Space');
  await expect.poll(() => eventCount(page, 'sfx_roll')).toBe(1);
  await waitForMove(page);

  await page.keyboard.down('ShiftLeft');
  await expect.poll(async () => (await hero(page))?.shielding).toBe(true);
  await page.keyboard.up('ShiftLeft');
  await expect.poll(async () => (await hero(page))?.shielding).toBe(false);

  await page.evaluate(() => {
    window.__fimbul?.warp('test_a', 37, 11);
  });
  await walkUntilScreen(page, 'KeyD', 'test_b');
  await page.evaluate(() => {
    window.__fimbul?.warp('test_b', 19, 19);
  });
  await walkUntilScreen(page, 'KeyS', 'test_c');
  await walkUntilScreen(page, 'KeyW', 'test_b');
  await page.evaluate(() => {
    window.__fimbul?.warp('test_b', 2, 11);
  });
  await walkUntilScreen(page, 'KeyA', 'test_a');

  await page.evaluate(() => window.__fimbul?.setTime('00:00'));
  await expect.poll(() => page.evaluate(() => window.__fimbul?.light() ?? 1)).toBeLessThan(0.05);
  expect((await page.evaluate(() => window.__fimbul?.appliedGrade() ?? []))[0]).toBeLessThan(0.6);
  await page.evaluate(() => window.__fimbul?.setTime('12:00'));
  await expect.poll(() => page.evaluate(() => window.__fimbul?.appliedGrade()[0] ?? 0)).toBeGreaterThan(0.9);
  await page.evaluate(() => window.__fimbul?.setSeason('winter'));
  await expect.poll(async () => (await clock(page))?.season).toBe('winter');

  await page.evaluate(() => {
    window.__fimbul?.warp('test_b', 20, 11);
  });
  await expect.poll(() => screenId(page)).toBe('test_b');
  await page.evaluate(() => window.__fimbul?.flushSave());
  await boot(page);
  expect(await screenId(page)).toBe('test_b');
  expect((await clock(page))?.season).toBe('winter');

  const json = await page.evaluate(() => window.__fimbul?.exportSaveJson() ?? '');
  await boot(page, 'nosave&screen=test_c&at=20,5');
  expect(await page.evaluate((text) => window.__fimbul?.importSaveJson(text), json)).toBe('import_ok');
  await expect.poll(() => screenId(page)).toBe('test_b');

  expect(await page.evaluate(() => window.__fimbul?.missingFrames() ?? [])).toEqual([]);
  expect(errors).toEqual([]);
});
```

Run: `pnpm e2e`
Expected: every spec is green on Chromium and WebKit.

- [ ] **Step 2: Bring ARCHITECTURE.md up to date**

Replace `ARCHITECTURE.md` with:

````markdown
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
````

- [ ] **Step 3: Tick the roadmap**

In `docs/roadmap.md`, mark every M0 item `[x]` except "M0 exit test, ARCHITECTURE.md, user playtest". Tick that one only after Step 5.

- [ ] **Step 4: Final gate and commit**

Run: `pnpm format && pnpm check && pnpm build && pnpm budget && pnpm e2e`
Expected: everything green.

```bash
git add -A
git commit -m "Add the M0 exit scenario and document the architecture

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 5: User playtest**

Start `pnpm dev`, open the game in the in-app browser, and ask the user to play for five minutes:
- Walk the three screens with keyboard and gamepad.
- Fight the dummy with the combo and the spin.
- Roll and shield.
- Try `?season=winter&time=night`, F1 and the console.
- Reload to resume, then export and import a save.
- Build with `pnpm build && pnpm preview`, go offline and reload.

Record their feedback in `docs/roadmap.md` under M0, tick the last item, and commit. M0 is done when the user is satisfied. The next step is the M1 brief (`docs/briefs/m1.md`) for their approval.
