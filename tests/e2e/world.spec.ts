import { expect, test } from '@playwright/test';
import { boot, collectErrors, walkUntilScreen } from './helpers';

const view = (page: import('@playwright/test').Page) => page.evaluate(() => window.__fimbul?.view());
const missing = (page: import('@playwright/test').Page) =>
  page.evaluate(() => window.__fimbul?.missingFrames());

test('the village stands its houses, trees and well as sprites with smoking chimneys', async ({ page }) => {
  const errors = collectErrors(page);
  await boot(page, 'nosave&screen=ask_village&at=20,11');
  const v = await view(page);
  expect(v?.screens).toBe(1);
  expect(v?.decor).toBeGreaterThan(50);
  expect(v?.animatedDecor).toBe(1);
  expect(v?.emitters).toBe(4);
  expect(v?.animatedTiles).toBeGreaterThan(0);
  expect(await missing(page)).toEqual([]);
  expect(errors).toEqual([]);
});

test('the brook runs with open water where a fish can jump', async ({ page }) => {
  const errors = collectErrors(page);
  await boot(page, 'nosave&screen=ask_brook&at=20,11');
  expect((await view(page))?.openWater).toBeGreaterThan(0);
  const before = (await view(page))?.fishJumps ?? 0;
  await page.evaluate(() => {
    window.__fimbul?.jumpFish();
  });
  await expect.poll(async () => (await view(page))?.fishAlive).toBe(1);
  await expect.poll(async () => (await view(page))?.fishAlive, { timeout: 5_000 }).toBe(0);
  expect((await view(page))?.fishJumps).toBeGreaterThan(before);
  expect(await missing(page)).toEqual([]);
  expect(errors).toEqual([]);
});

test('the longhouse has its beds, hearth and tables and no smoke indoors', async ({ page }) => {
  const errors = collectErrors(page);
  await boot(page, 'nosave&screen=ask_int_longhouse&at=19,15');
  const v = await view(page);
  expect(v?.decor).toBeGreaterThanOrEqual(6);
  expect(v?.animatedDecor).toBe(1);
  expect(v?.emitters).toBe(0);
  expect(await missing(page)).toEqual([]);
  expect(errors).toEqual([]);
});

test('sliding to the next screen drops the old stage', async ({ page }) => {
  const errors = collectErrors(page);
  await boot(page, 'nosave&screen=ask_farmyard&at=38,11');
  await walkUntilScreen(page, 'KeyD', 'ask_village');
  await expect.poll(async () => (await view(page))?.screens).toBe(1);
  expect((await view(page))?.emitters).toBe(4);
  expect(await missing(page)).toEqual([]);
  expect(errors).toEqual([]);
});
