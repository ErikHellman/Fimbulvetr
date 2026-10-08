import { expect, test } from '@playwright/test';
import { boot, collectErrors, walkUntilScreen } from './helpers';

/** M10a: Útgarðr: with all three seals burning, the rime door out of the seal hall has melted. */

test('the three seals open the way into the master key’s vault, where Jötunvörðr waits', async ({ page }) => {
  test.setTimeout(90_000);
  const errors = collectErrors(page);
  await boot(page, 'preset=d8&nosave');
  expect(await page.evaluate(() => window.__fimbul?.screenId())).toBe('d8_r20');
  await walkUntilScreen(page, 'KeyD', 'd8_r21');
  await page.keyboard.up('KeyD');
  await expect.poll(() => page.evaluate(() => window.__fimbul?.boss()?.name)).toBe('Jötunvörðr');
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => window.__fimbul?.missingFrames())).toEqual([]);
});
