import { expect, test } from '@playwright/test';
import { boot, clock, collectErrors, eventCount, hero, screenId, walkUntilScreen } from './helpers';

const waitForMove = async (page: import('@playwright/test').Page): Promise<void> => {
  await expect.poll(async () => (await hero(page))?.fsm).toBe('move');
};

test('M0 exit: move, fight, roll, shield, cross screens, tints, save and import', async ({ page }) => {
  // Three boots, each building every frame of art: with two workers under SwiftShader this passes 30 s.
  test.setTimeout(90_000);
  const errors = collectErrors(page);
  await boot(page, 'preset=m0&screen=test_a&at=13,11');

  // Held keys are sampled once per rendered frame, so polling hook state (rather than a fixed
  // wall-clock sleep) is what makes these waits robust under a slow or throttled test browser.
  const x0 = (await hero(page))?.x ?? 0;
  await page.keyboard.down('KeyD');
  await expect.poll(async () => (await hero(page))?.x ?? 0).toBeGreaterThan(x0 + 20);
  await page.keyboard.up('KeyD');

  await page.evaluate(() => {
    window.__fimbul?.warp('test_a', 23, 9);
  });
  await expect.poll(async () => (await hero(page))?.x).toBe(23 * 16 + 8);
  await page.keyboard.press('KeyJ');
  await expect.poll(() => eventCount(page, 'hit')).toBeGreaterThan(0);
  await waitForMove(page);

  await page.keyboard.press('Space');
  await expect.poll(() => eventCount(page, 'sfx_roll')).toBe(1);
  await waitForMove(page);

  await page.keyboard.down('ShiftLeft');
  await expect.poll(async () => (await hero(page))?.shielding).toBe(true);
  await page.keyboard.up('ShiftLeft');
  await expect.poll(async () => (await hero(page))?.shielding).toBe(false);

  await page.evaluate(() => {
    window.__fimbul?.warp('test_a', 37, 11);
  });
  await walkUntilScreen(page, 'KeyD', 'test_b');
  await page.evaluate(() => {
    window.__fimbul?.warp('test_b', 19, 19);
  });
  await walkUntilScreen(page, 'KeyS', 'test_c');
  await walkUntilScreen(page, 'KeyW', 'test_b');
  await page.evaluate(() => {
    window.__fimbul?.warp('test_b', 2, 11);
  });
  await walkUntilScreen(page, 'KeyA', 'test_a');

  await page.evaluate(() => window.__fimbul?.setTime('00:00'));
  await expect.poll(() => page.evaluate(() => window.__fimbul?.light() ?? 1)).toBeLessThan(0.05);
  expect((await page.evaluate(() => window.__fimbul?.appliedGrade() ?? []))[0]).toBeLessThan(0.6);
  await page.evaluate(() => window.__fimbul?.setTime('12:00'));
  await expect.poll(() => page.evaluate(() => window.__fimbul?.appliedGrade()[0] ?? 0)).toBeGreaterThan(0.9);
  await page.evaluate(() => window.__fimbul?.setSeason('winter'));
  await expect.poll(async () => (await clock(page))?.season).toBe('winter');

  await page.evaluate(() => {
    window.__fimbul?.warp('test_b', 20, 11);
  });
  await expect.poll(() => screenId(page)).toBe('test_b');
  await page.evaluate(() => window.__fimbul?.flushSave());
  await boot(page);
  expect(await screenId(page)).toBe('test_b');
  expect((await clock(page))?.season).toBe('winter');

  const json = await page.evaluate(() => window.__fimbul?.exportSaveJson() ?? '');
  await boot(page, 'nosave&preset=m0&screen=test_c&at=20,5');
  expect(await page.evaluate((text) => window.__fimbul?.importSaveJson(text), json)).toBe('import_ok');
  await expect.poll(() => screenId(page)).toBe('test_b');

  expect(await page.evaluate(() => window.__fimbul?.missingFrames() ?? [])).toEqual([]);
  expect(errors).toEqual([]);
});
