import { expect, test, type Page } from '@playwright/test';
import { boot, collectErrors, frames, hero, screenId, tap } from './helpers';

/** M4a: the rockfall into Haugar, a warp stone, Styrr's lessons and the barrow-watch. */

const mode = (page: Page) => page.evaluate(() => window.__fimbul?.mode());
const flags = (page: Page) => page.evaluate(() => window.__fimbul?.flags() ?? {});
const opened = (page: Page) => page.evaluate(() => window.__fimbul?.opened() ?? []);
const warps = (page: Page) => page.evaluate(() => window.__fimbul?.warps() ?? []);
const enemies = (page: Page) => page.evaluate(() => window.__fimbul?.enemies() ?? []);
const tileX = async (page: Page): Promise<number> => Math.floor(((await hero(page))?.x ?? 0) / 16);

async function backToPlay(page: Page, key: string): Promise<void> {
  for (let i = 0; i < 60 && (await mode(page)) !== 'play'; i++) await tap(page, key);
  expect(await mode(page)).toBe('play');
}

async function consoleLine(page: Page, line: string): Promise<void> {
  await page.keyboard.press('Backquote');
  const input = page.locator('#dev-console-input');
  await expect(input).toBeFocused();
  await input.fill(line);
  await input.press('Enter');
  await page.keyboard.press('Backquote');
}

test('a bomb opens the rockfall, and past it lies Haugar', async ({ page }) => {
  const errors = collectErrors(page);
  await boot(page, 'preset=hau&screen=hau_gully&at=5,17&nosave');
  await tap(page, 'KeyD');
  await tap(page, 'KeyK');
  // Stand clear of the blast.
  await page.keyboard.down('KeyA');
  for (let i = 0; i < 400 && (await tileX(page)) > 1; i++) await frames(page);
  await page.keyboard.up('KeyA');
  await expect.poll(async () => opened(page), { timeout: 15_000 }).toContain('hau_k_gully');
  await page.keyboard.down('KeyD');
  await expect.poll(async () => mode(page), { timeout: 15_000 }).toBe('story');
  await page.keyboard.up('KeyD');
  await backToPlay(page, 'Enter');
  expect((await flags(page)).st_haugar_reached).toBe(true);
  expect(await screenId(page)).toBe('hau_gully');
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => window.__fimbul?.missingFrames())).toEqual([]);
});

test('the stone circle’s warp stone wakes at a touch', async ({ page }) => {
  const errors = collectErrors(page);
  await boot(page, 'preset=hau&screen=hau_circle&at=20,9&nosave');
  await tap(page, 'KeyW');
  await tap(page, 'KeyE');
  await expect.poll(async () => warps(page)).toEqual(['haugar']);
  await backToPlay(page, 'Enter');
  expect(errors).toEqual([]);
});

test('Styrr teaches the dash thrust for silver, and it lunges out of a roll', async ({ page }) => {
  const errors = collectErrors(page);
  await boot(page, 'preset=hau&screen=hau_int_styrr&at=22,12&nosave');
  await tap(page, 'KeyW');
  await tap(page, 'KeyE');
  await backToPlay(page, 'Enter');
  const f = await flags(page);
  expect(f.t_dash).toBe(true);
  expect(f.q_rs3_watch).toBe(true);
  expect(await page.evaluate(() => window.__fimbul?.silver())).toBe(100);
  // Roll south, and strike in the middle of it.
  await page.keyboard.down('KeyS');
  await tap(page, 'Space');
  await frames(page);
  await tap(page, 'KeyJ');
  await page.keyboard.up('KeyS');
  expect(await page.evaluate(() => window.__fimbul?.eventCounts['sfx_thrust'] ?? 0)).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test('the barrow-watch: three wights at night, and the King’s Barrow opens once they fall', async ({
  page,
}) => {
  const errors = collectErrors(page);
  await boot(page, 'preset=watch&nosave');
  await expect.poll(async () => (await enemies(page)).filter((e) => e.def === 'haugbui').length).toBe(3);
  await consoleLine(page, 'kill');
  await expect.poll(async () => mode(page), { timeout: 15_000 }).toBe('story');
  await backToPlay(page, 'Enter');
  const f = await flags(page);
  expect(f.q_watch_kills).toBe(3);
  expect(f.st_barrow_open).toBe(true);
  expect(errors).toEqual([]);
});
