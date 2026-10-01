import { expect, test, type Page } from '@playwright/test';
import { boot, collectErrors, frames, hero, screenId, tap } from './helpers';

/** M4b: Konungshaugr's eyes, hidden floors, grave-gold and King, and Farvegr home. */

const mode = (page: Page) => page.evaluate(() => window.__fimbul?.mode());
const flags = (page: Page) => page.evaluate(() => window.__fimbul?.flags() ?? {});
const tileX = async (page: Page): Promise<number> => Math.floor(((await hero(page))?.x ?? 0) / 16);

test('an arrow strikes the eye across the pits, and the bridge falls to the island', async ({ page }) => {
  const errors = collectErrors(page);
  await boot(page, 'preset=d3boss&screen=d3_r10&at=22,18&nosave');
  await tap(page, 'KeyW');
  await tap(page, 'KeyK');
  await expect.poll(async () => (await flags(page)).w_d3_r10, { timeout: 15_000 }).toBe(true);
  expect(await page.evaluate(() => window.__fimbul?.ammo().arrows)).toBe(29);
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => window.__fimbul?.missingFrames())).toEqual([]);
});

test('the lantern shows the hidden floor over the pits, and it carries Ask to the island', async ({
  page,
}) => {
  const errors = collectErrors(page);
  await boot(page, 'preset=d3&screen=d3_r04&at=8,10&nosave');
  await expect
    .poll(async () => (await page.evaluate(() => window.__fimbul?.view()))?.ghosts ?? 0)
    .toBeGreaterThan(0);
  await page.keyboard.down('KeyD');
  for (let i = 0; i < 400 && (await tileX(page)) < 19; i++) await frames(page);
  await page.keyboard.up('KeyD');
  expect(await tileX(page)).toBeGreaterThanOrEqual(19);
  expect(errors).toEqual([]);
});

test('lifting the grave-gold wakes the dead', async ({ page }) => {
  const errors = collectErrors(page);
  await boot(page, 'preset=d3boss&screen=d3_r11&at=20,10&nosave');
  await tap(page, 'KeyA');
  await tap(page, 'KeyE');
  await expect
    .poll(async () => page.evaluate(() => window.__fimbul?.eventCounts['sfx_wake'] ?? 0))
    .toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test('the Haugbúi King’s bar shows over his hall', async ({ page }) => {
  const errors = collectErrors(page);
  await boot(page, 'preset=d3boss&screen=d3_r19&at=20,16&nosave');
  await expect
    .poll(async () => page.evaluate(() => window.__fimbul?.boss()))
    .toEqual({
      name: 'The Haugbúi King',
      hp: 24,
      maxHp: 24,
      phase: 0,
    });
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => window.__fimbul?.missingFrames())).toEqual([]);
});

test('Farvegr, readied from the pause menu, carries Ask to a woken warp stone', async ({ page }) => {
  const errors = collectErrors(page);
  await boot(page, 'preset=haubow&nosave');
  // The items tab lists the galdr last: up from the top wraps round to Farvegr.
  await tap(page, 'Tab');
  await expect.poll(async () => page.evaluate(() => window.__fimbul?.menu()?.tab)).toBe('items');
  await tap(page, 'ArrowUp');
  await tap(page, 'Enter');
  await tap(page, 'Escape');
  await expect.poll(async () => page.evaluate(() => window.__fimbul?.menu())).toBeNull();
  await tap(page, 'KeyI');
  await expect.poll(async () => page.evaluate(() => window.__fimbul?.story()?.k)).toBe('warps');
  await tap(page, 'Enter');
  await expect.poll(async () => screenId(page), { timeout: 15_000 }).toBe('hau_circle');
  await expect.poll(async () => mode(page)).toBe('play');
  expect(errors).toEqual([]);
});
