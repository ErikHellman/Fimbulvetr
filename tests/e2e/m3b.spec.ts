import { expect, test, type Page } from '@playwright/test';
import { boot, collectErrors, frames, screenId, tap } from './helpers';

/** M3b: the mill's wheels and water, bombs and a crack kept open over a reload, and Lindormr's bar. */

const water = (page: Page) => page.evaluate(() => window.__fimbul?.water() ?? null);
const ammo = (page: Page) => page.evaluate(() => window.__fimbul?.ammo());
const coverAt = (page: Page, x: number, y: number) =>
  page.evaluate(([cx, cy]) => window.__fimbul?.coverAt(cx ?? 0, cy ?? 0) ?? -1, [x, y]);
const opened = (page: Page) => page.evaluate(() => window.__fimbul?.opened() ?? []);

test('a wheel in the wheel-house raises the water: the sluice floods and the planks float', async ({
  page,
}) => {
  const errors = collectErrors(page);
  await boot(page, 'preset=d2&at=25,7&nosave');
  expect(await water(page)).toEqual({ level: 0, flag: 'w_d2_level' });
  expect(await coverAt(page, 5, 10)).toBe(-1);
  expect(await coverAt(page, 33, 10)).toBe(-1);
  await tap(page, 'KeyW');
  await tap(page, 'KeyJ');
  await expect.poll(async () => (await water(page))?.level).toBe(1);
  await expect.poll(async () => coverAt(page, 5, 10)).toBeGreaterThanOrEqual(0);
  expect(await coverAt(page, 33, 10)).toBeGreaterThanOrEqual(0);
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => window.__fimbul?.missingFrames())).toEqual([]);
});

test('a bomb blows the peat bank’s crack open, and it stays open after a reload', async ({ page }) => {
  test.setTimeout(90_000);
  const errors = collectErrors(page);
  await boot(page, 'preset=mylbombs&screen=myl_peat&at=35,6');
  expect(await ammo(page)).toMatchObject({ bombs: 10, max: 10, owned: true });
  await tap(page, 'KeyW');
  await tap(page, 'KeyK');
  expect((await ammo(page))?.bombs).toBe(9);
  // Back off out of the blast and wait for it.
  await page.keyboard.down('KeyS');
  for (let i = 0; i < 20; i++) await frames(page);
  await page.keyboard.up('KeyS');
  await expect.poll(async () => opened(page), { timeout: 20_000 }).toContain('myl_k_peat');
  // A new screen makes an autosave; the reload resumes it with the crack still open.
  await page.evaluate(() => window.__fimbul?.warp('myl_bog', 20, 10));
  await expect.poll(async () => screenId(page)).toBe('myl_bog');
  await page.evaluate(() => window.__fimbul?.flushSave());
  await boot(page);
  expect(await opened(page)).toContain('myl_k_peat');
  expect(errors).toEqual([]);
});

test('Lindormr’s bar shows over its pond, with its four mud mounds', async ({ page }) => {
  const errors = collectErrors(page);
  await boot(page, 'preset=d2boss&screen=d2_r15&at=20,18&nosave');
  await expect
    .poll(async () => page.evaluate(() => window.__fimbul?.boss() ?? null))
    .toMatchObject({
      name: 'Lindormr',
      hp: 24,
    });
  const mounds = await page.evaluate(
    () => window.__fimbul?.actors().filter((a) => a.def === 'lind_mound').length ?? 0,
  );
  expect(mounds).toBe(4);
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => window.__fimbul?.missingFrames())).toEqual([]);
});
