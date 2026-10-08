import { expect, test } from '@playwright/test';
import { boot, collectErrors } from './helpers';

/** M10b: the binding hall: Hrímnir wakes, and Embla's ring of binding burns round Ask and closes in. */

test('Hrímnir rises in the binding hall, and the ring of binding closes in', async ({ page }) => {
  test.setTimeout(90_000);
  const errors = collectErrors(page);
  await boot(page, 'preset=d8king&nosave');
  expect(await page.evaluate(() => window.__fimbul?.screenId())).toBe('d8_r12');
  await expect
    .poll(() => page.evaluate(() => window.__fimbul?.boss()?.name), { timeout: 10_000 })
    .toBe('Hrímnir, the Rime King');
  await expect
    .poll(() => page.evaluate(() => window.__fimbul?.ring()?.r ?? 0), { timeout: 15_000 })
    .toBeGreaterThan(0);
  const first = (await page.evaluate(() => window.__fimbul?.ring()?.r)) ?? 0;
  await expect.poll(() => page.evaluate(() => window.__fimbul?.ring()?.r ?? 0)).toBeLessThan(first);
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => window.__fimbul?.missingFrames())).toEqual([]);
});
