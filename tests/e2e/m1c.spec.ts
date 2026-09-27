import { expect, test, type Page } from '@playwright/test';
import { boot, collectErrors, screenId, tap, walkUntilScreen } from './helpers';

const hook = <T>(page: Page, fn: () => T): Promise<T> => page.evaluate(fn);

test('a chest: the found line, and the key counted in the HUD', async ({ page }) => {
  const errors = collectErrors(page);
  await boot(page, 'nosave&mute&preset=d1&screen=d1_r03&at=19,10');
  await expect.poll(() => hook(page, () => window.__fimbul?.dungeon()?.keys)).toBe(0);
  await tap(page, 'ArrowUp');
  await tap(page, 'KeyE');
  await expect.poll(() => hook(page, () => window.__fimbul?.story()?.text ?? '')).toContain('small key');
  for (let i = 0; i < 40 && (await hook(page, () => window.__fimbul?.mode())) !== 'play'; i++)
    await tap(page, 'Enter');
  expect(await hook(page, () => window.__fimbul?.dungeon()?.keys)).toBe(1);
  expect(await hook(page, () => window.__fimbul?.items())).not.toHaveProperty('small_key');
  expect(errors).toEqual([]);
});

test('rooms slide into each other on the dungeon grid', async ({ page }) => {
  const errors = collectErrors(page);
  await boot(page, 'nosave&mute&preset=d1');
  expect(await screenId(page)).toBe('d1_r01');
  await walkUntilScreen(page, 'ArrowUp', 'd1_r04');
  expect(await hook(page, () => window.__fimbul?.dungeon()?.id)).toBe('d1');
  expect(await hook(page, () => window.__fimbul?.missingFrames())).toEqual([]);
  expect(errors).toEqual([]);
});

test('the lair: a boss bar, and the dungeon map with its compass marks', async ({ page }) => {
  const errors = collectErrors(page);
  await boot(page, 'nosave&mute&preset=d1boss');
  await page.evaluate(() => {
    window.__fimbul?.warp('d1_r12', 20, 19);
  });
  await expect.poll(() => screenId(page)).toBe('d1_r12');
  await expect
    .poll(() => hook(page, () => window.__fimbul?.boss()))
    .toEqual({
      name: 'Rótvættr',
      hp: 24,
      maxHp: 24,
      phase: 0,
    });
  expect(await hook(page, () => window.__fimbul?.enemies().filter((e) => e.def === 'rot_bulb').length)).toBe(
    3,
  );
  await tap(page, 'KeyM');
  await expect.poll(() => hook(page, () => window.__fimbul?.menu()?.tab)).toBe('map');
  expect(await hook(page, () => window.__fimbul?.dungeon())).toMatchObject({ map: true, compass: true });
  await tap(page, 'Escape');
  expect(await hook(page, () => window.__fimbul?.missingFrames())).toEqual([]);
  expect(errors).toEqual([]);
});

test('the dark room: only the lantern and the braziers light it', async ({ page }) => {
  const errors = collectErrors(page);
  await boot(page, 'nosave&mute&preset=d1boss&screen=d1_r10&at=19,18');
  await expect.poll(() => hook(page, () => window.__fimbul?.view().dark ?? 0)).toBeGreaterThan(0.8);
  expect(await hook(page, () => window.__fimbul?.view().lights)).toBe(1);
  expect(errors).toEqual([]);
});
