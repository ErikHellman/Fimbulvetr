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
    const ids = await ruleIds(
      "import * as Phaser from 'phaser';\nexport const x = Phaser;\n",
      'src/core/probe.ts',
    );
    expect(ids).toContain('no-restricted-imports');
  });

  it('rejects the shell in art', async () => {
    const ids = await ruleIds("import { x } from '@shell/main';\nexport const y = x;\n", 'src/art/probe.ts');
    expect(ids).toContain('no-restricted-imports');
  });

  it('rejects art in content', async () => {
    const ids = await ruleIds(
      "import { x } from '@art/raster';\nexport const y = x;\n",
      'src/content/probe.ts',
    );
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
    const ids = await ruleIds(
      "import * as Phaser from 'phaser';\nexport const x = Phaser;\n",
      'src/shell/probe.ts',
    );
    expect(ids).toEqual([]);
  });
});
