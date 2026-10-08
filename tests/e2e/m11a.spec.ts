import { expect, test } from '@playwright/test';
import { boot, collectErrors } from './helpers';

/** M11a: achievements are checked in play, kept in the browser and announced with a toast. */

test('a late save earns its achievements in play and keeps them in the browser', async ({ page }) => {
  test.setTimeout(60_000);
  const errors = collectErrors(page);
  await boot(page, 'preset=d8king&nosave');
  await expect
    .poll(() => page.evaluate(() => document.body.dataset.achievements ?? ''), { timeout: 10_000 })
    .toContain('ach_raid');
  const stored = await page.evaluate(() => localStorage.getItem('fimbulvetr.achievements.v1') ?? '');
  expect(stored).toContain('ach_raid');
  expect(errors).toEqual([]);
});
