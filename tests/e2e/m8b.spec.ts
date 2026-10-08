import { expect, test } from '@playwright/test';
import { boot, collectErrors, tap } from './helpers';

/** M8b: Ívaldi's Forge: its gate hall, the hammer on a stake, and the thane on his throne. */

test('the forge gate hall draws its rooms and Ask can walk on', async ({ page }) => {
  test.setTimeout(90_000);
  const errors = collectErrors(page);
  await boot(page, 'preset=d6&at=5,10&nosave');
  expect(await page.evaluate(() => window.__fimbul?.screenId())).toBe('d6_r25');
  await page.keyboard.down('KeyA');
  await expect
    .poll(() => page.evaluate(() => window.__fimbul?.screenId()), { timeout: 15_000 })
    .toBe('d6_r24');
  await page.keyboard.up('KeyA');
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => window.__fimbul?.missingFrames())).toEqual([]);
});

test('the dwarf hammer drives a stake down for good', async ({ page }) => {
  test.setTimeout(90_000);
  const errors = collectErrors(page);
  await boot(page, 'preset=d6boss&screen=d6_r15&at=30,8&nosave');
  await tap(page, 'KeyW');
  await page.waitForTimeout(200);
  await tap(page, 'KeyK');
  await expect
    .poll(() => page.evaluate(() => window.__fimbul?.opened() ?? []), { timeout: 5_000 })
    .toContain('d6_k_r15n');
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => window.__fimbul?.missingFrames())).toEqual([]);
});

test('Ívaldi rises from his throne behind the great door', async ({ page }) => {
  test.setTimeout(90_000);
  const errors = collectErrors(page);
  await boot(page, 'preset=d6boss&nosave');
  await page.keyboard.down('KeyW');
  await expect
    .poll(() => page.evaluate(() => window.__fimbul?.screenId()), { timeout: 15_000 })
    .toBe('d6_r04');
  await page.keyboard.up('KeyW');
  await expect
    .poll(() => page.evaluate(() => window.__fimbul?.boss()?.name ?? null), { timeout: 10_000 })
    .toBe('Ívaldi');
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => window.__fimbul?.missingFrames())).toEqual([]);
});
