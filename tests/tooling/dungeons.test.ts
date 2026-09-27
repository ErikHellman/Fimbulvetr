import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? files(p) : p.endsWith('.ts') ? [p] : [];
  });
}

describe('dungeon state', () => {
  it('is only read through dungeonOf, which fills in dungeons an old save lacks', () => {
    const offenders = files('src/core')
      .filter((f) => !f.endsWith('state/dungeons.ts'))
      .filter((f) => /\.dungeons\[/.test(readFileSync(f, 'utf8')));
    expect(offenders).toEqual([]);
  });
});
