import { expect, test } from '@playwright/test';
import { boot, collectErrors } from './helpers';

/** M9a: Hrímfjöll: the beacon hill under the frost, and the glacier's glaze east of the high road. */

test('the beacon hill draws and Ask can walk north to the saddle', async ({ page }) => {
  test.setTimeout(90_000);
  const errors = collectErrors(page);
  await boot(page, 'preset=hrf&at=19,3&nosave');
  expect(await page.evaluate(() => window.__fimbul?.screenId())).toBe('hrf_beacon');
  await page.keyboard.down('KeyW');
  await expect
    .poll(() => page.evaluate(() => window.__fimbul?.screenId()), { timeout: 15_000 })
    .toBe('hrf_saddle');
  await page.keyboard.up('KeyW');
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => window.__fimbul?.missingFrames())).toEqual([]);
});

test('a step onto the glacier’s glaze slides Ask on across it', async ({ page }) => {
  test.setTimeout(90_000);
  const errors = collectErrors(page);
  await boot(page, 'preset=hrf&screen=hrf_glacier&at=5,12&nosave');
  const x0 = await page.evaluate(() => window.__fimbul?.hero().x ?? 0);
  await page.keyboard.down('KeyD');
  await expect
    .poll(() => page.evaluate(() => window.__fimbul?.hero().x ?? 0), { timeout: 5_000 })
    .toBeGreaterThan(x0 + 10);
  await page.keyboard.up('KeyD');
  // Let go: the glaze carries Ask on to the rock past the middle of the glacier.
  await expect
    .poll(() => page.evaluate(() => window.__fimbul?.hero().x ?? 0), { timeout: 5_000 })
    .toBeGreaterThan(x0 + 100);
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => window.__fimbul?.missingFrames())).toEqual([]);
});
