import { expect, test } from '@playwright/test';
import { boot, clock, collectErrors, screenId } from './helpers';

test('the dev query string places the hero and sets season and time', async ({ page }) => {
  const errors = collectErrors(page);
  await boot(page, 'nosave&screen=test_b&at=20,11&season=winter&time=23:00');
  expect(await screenId(page)).toBe('test_b');
  const c = await clock(page);
  expect(c?.season).toBe('winter');
  expect(c?.minute).toBeGreaterThanOrEqual(23 * 60);
  expect(await page.evaluate(() => window.__fimbul?.light())).toBeLessThan(0.05);
  const applied = await page.evaluate(() => window.__fimbul?.appliedGrade() ?? []);
  expect(applied[0]).toBeLessThan(0.6);
  expect(errors).toEqual([]);
});

test('F1 toggles the debug overlay', async ({ page }) => {
  await boot(page, 'nosave&screen=test_a&at=13,11');
  await page.keyboard.press('F1');
  await expect(page.locator('#dev-overlay')).toBeVisible();
  await expect(page.locator('#dev-overlay')).toContainText('screen test_a');
  await page.keyboard.press('F1');
  await expect(page.locator('#dev-overlay')).toBeHidden();
});

test('the console runs commands', async ({ page }) => {
  await boot(page, 'nosave&screen=test_a&at=13,11');
  await page.keyboard.press('Backquote');
  const input = page.locator('#dev-console-input');
  await expect(input).toBeFocused();
  await input.fill('season autumn');
  await input.press('Enter');
  await expect.poll(async () => (await clock(page))?.season).toBe('autumn');
  await input.fill('warp test_c 20 5');
  await input.press('Enter');
  await expect.poll(() => screenId(page)).toBe('test_c');
});
