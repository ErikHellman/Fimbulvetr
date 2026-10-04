import { expect, test, type Page } from '@playwright/test';
import { boot, collectErrors, eventCount, tap } from './helpers';

/** M5a: the pass opens into the Fimbulvetr, Bragð flies, and Askdalr lies in rime and ruin. */

const story = (page: Page) => page.evaluate(() => window.__fimbul?.story() ?? null);
const flags = (page: Page) => page.evaluate(() => window.__fimbul?.flags() ?? {});

test('three stones lit, the pass opens: the breath, the card, the credits and winter', async ({ page }) => {
  test.setTimeout(90_000);
  const errors = collectErrors(page);
  await boot(page, 'preset=haubow&screen=hau_pass&at=20,8&nosave');
  await page.keyboard.down('KeyW');
  await expect.poll(async () => (await story(page))?.k, { timeout: 20_000 }).toBeDefined();
  await page.keyboard.up('KeyW');
  const seen = new Set<string>();
  for (let i = 0; i < 400 && !seen.has('credits'); i++) {
    const s = await story(page);
    if (s !== null) seen.add(s.k);
    if (s?.k === 'text' || s?.k === 'card') await tap(page, 'Enter');
    else await page.waitForTimeout(100);
  }
  expect(seen).toContain('breath');
  expect(seen).toContain('credits');
  expect((await flags(page)).st_pass_open).toBe(true);
  expect((await page.evaluate(() => window.__fimbul?.clock()))?.season).toBe('winter');
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => window.__fimbul?.missingFrames())).toEqual([]);
});

test('Bragð, readied from the pause menu, sends a beam from the blade', async ({ page }) => {
  const errors = collectErrors(page);
  await boot(page, 'preset=fimbul&screen=hau_circle&at=20,12&nosave');
  // The items tab lists the galdr last: up from the top wraps round to Bragð.
  await tap(page, 'Tab');
  await expect.poll(async () => page.evaluate(() => window.__fimbul?.menu()?.tab)).toBe('items');
  await tap(page, 'ArrowUp');
  await tap(page, 'Enter');
  await tap(page, 'Escape');
  await expect.poll(async () => page.evaluate(() => window.__fimbul?.menu())).toBeNull();
  await tap(page, 'KeyI');
  await expect.poll(async () => eventCount(page, 'sfx_bragd')).toBeGreaterThan(0);
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => window.__fimbul?.missingFrames())).toEqual([]);
});

test('home in the Fimbulvetr: Askdalr in rime, and the raid’s ruins still standing', async ({ page }) => {
  const errors = collectErrors(page);
  await boot(page, 'preset=fimbul&screen=ask_farmyard&at=20,18&nosave');
  await expect.poll(async () => (await story(page))?.text ?? '').toMatch(/Askdalr lies white/);
  const scenery = await page.evaluate(
    () => window.__fimbul?.actors().filter((a) => a.def === 'scenery').length ?? 0,
  );
  expect(scenery).toBeGreaterThan(0);
  for (let i = 0; i < 20 && (await story(page)) !== null; i++) await tap(page, 'Enter');
  await expect.poll(async () => (await flags(page)).st_home_winter).toBe(true);
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => window.__fimbul?.missingFrames())).toEqual([]);
});
