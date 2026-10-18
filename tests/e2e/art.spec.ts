import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { boot, collectErrors } from './helpers';

const FIXTURES = new URL('../fixtures/atlases/', import.meta.url);
const types: Record<string, string> = { png: 'image/png', json: 'application/json' };

// The service worker would answer for the atlas files once installed; routes must see every request.
test.use({ serviceWorkers: 'block' });

test('real art listed in atlases/manifest.json replaces frames and tiles by name', async ({ page }) => {
  const errors = collectErrors(page);
  await page.route('**/atlases/*', (route) => {
    const file = new URL(route.request().url()).pathname.split('/').pop() ?? '';
    const ext = file.split('.').pop() ?? '';
    return route.fulfill({
      body: readFileSync(new URL(file, FIXTURES)),
      contentType: types[ext] ?? 'application/octet-stream',
    });
  });
  await boot(page, 'nosave&preset=m0&screen=test_a&at=13,11');
  const overrides = await page.evaluate(() => window.__fimbul?.artOverrides());
  expect(overrides?.tiles).toEqual(['grass']);
  expect([...(overrides?.frames ?? [])].sort()).toEqual(['hero_axe_idle_s_0', 'hero_idle_s_0']);
  expect(await page.evaluate(() => window.__fimbul?.missingFrames())).toEqual([]);
  expect(errors).toEqual([]);
});

test('the shipped manifest replaces the hero and Embla frames and the Askdalr ground', async ({ page }) => {
  const errors = collectErrors(page);
  await boot(page, 'nosave&preset=m0&screen=test_a&at=13,11');
  const overrides = await page.evaluate(() => window.__fimbul?.artOverrides());
  expect(overrides?.tiles).toEqual(['grass', 'path', 'yard', 'field', 'fence', 'rock', 'roof', 'water']);
  expect(overrides?.frames).toContain('hero_idle_s_0');
  expect(overrides?.frames).toContain('hero_fork_attack1_e_2');
  expect(overrides?.frames).toContain('npc_embla_walk_e_3');
  expect(await page.evaluate(() => window.__fimbul?.missingFrames())).toEqual([]);
  expect(errors).toEqual([]);
});
