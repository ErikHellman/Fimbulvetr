import { expect, test, type Page } from '@playwright/test';
import { boot, collectErrors, tap } from './helpers';

/** M11b: the text-size setting draws dialogue with the larger font, and the box grows to fit it. */

const story = (page: Page) => page.evaluate(() => window.__fimbul?.story() ?? null);

for (const size of ['large', 'larger'] as const)
  test(`dialogue reads at the ${size} text size`, async ({ page }) => {
    const errors = collectErrors(page);
    await page.addInitScript((s) => {
      localStorage.setItem('fimbulvetr.settings.v1', JSON.stringify({ textSize: s }));
    }, size);
    await boot(page, 'nosave&preset=day3&screen=ask_int_trader&at=19,12');
    await page.keyboard.down('KeyW');
    await page.waitForTimeout(250);
    await page.keyboard.up('KeyW');
    await page.waitForTimeout(100);
    await tap(page, 'KeyE');
    await expect.poll(() => story(page).then((s) => s?.who)).toBe('sigrun');
    await expect.poll(() => story(page).then((s) => s?.shown), { timeout: 20_000 }).toBe(1);
    await page.screenshot({ path: `test-results/m11b-text-${size}.png` });
    expect(errors).toEqual([]);
  });

for (const query of ['preset=d8king', 'screen=ask_farmyard&at=20,11'])
  test(`the sim takes a small share of each frame (${query})`, async ({ page }) => {
    const errors = collectErrors(page);
    await boot(page, `${query}&nosave`);
    await page.waitForTimeout(3000);
    const stats = await page.evaluate(() => window.__fimbul?.stats());
    expect(stats?.simMs ?? Infinity).toBeLessThan(4);
    expect(errors).toEqual([]);
  });
