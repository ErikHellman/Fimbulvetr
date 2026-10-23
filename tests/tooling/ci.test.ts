import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string): string => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

describe('CI workflow', () => {
  it('runs e2e in the Playwright image that matches @playwright/test', () => {
    const pkg = JSON.parse(read('package.json')) as { devDependencies: Record<string, string> };
    const tag = /mcr\.microsoft\.com\/playwright:v([\d.]+)-/.exec(read('.github/workflows/ci.yml'))?.[1];
    expect(tag).toBe(pkg.devDependencies['@playwright/test']);
  });
});
