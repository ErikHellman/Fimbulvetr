import { expect, test } from '@playwright/test';
import { boot, collectErrors } from './helpers';

/** M9b: Hrímturn: the mirror hall's beam, turned onto its crystal eye with the ice mirror. */

test('holding up the ice mirror in the beam lights the crystal eye', async ({ page }) => {
  test.setTimeout(90_000);
  const errors = collectErrors(page);
  await boot(page, 'preset=d7&nosave');
  expect(await page.evaluate(() => window.__fimbul?.screenId())).toBe('d7_r23');
  expect(await page.evaluate(() => window.__fimbul?.flags()['st_d7_eye_r23'])).toBeUndefined();
  await page.keyboard.down('KeyK');
  await page.keyboard.down('KeyD');
  await expect
    .poll(() => page.evaluate(() => window.__fimbul?.flags()['st_d7_eye_r23']), { timeout: 10_000 })
    .toBe(true);
  expect(await page.evaluate(() => window.__fimbul?.hero().fsm)).toBe('mirror');
  await page.keyboard.up('KeyD');
  await page.keyboard.up('KeyK');
  await expect.poll(() => page.evaluate(() => window.__fimbul?.hero().fsm)).toBe('move');
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => window.__fimbul?.missingFrames())).toEqual([]);
});
