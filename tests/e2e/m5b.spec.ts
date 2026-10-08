import { expect, test, type Page } from '@playwright/test';
import { boot, collectErrors, eventCount, tap } from './helpers';

/** M5b: Styrr's duel, Hlíf, the farm's two stages and a side quest, end to end in the browser. */

const mode = (page: Page) => page.evaluate(() => window.__fimbul?.mode());
const flags = (page: Page) => page.evaluate(() => window.__fimbul?.flags() ?? {});
const items = (page: Page) => page.evaluate(() => window.__fimbul?.items() ?? {});

async function backToPlay(page: Page): Promise<void> {
  for (let i = 0; i < 60 && (await mode(page)) !== 'play'; i++) await tap(page, 'Enter');
  expect(await mode(page)).toBe('play');
}

/** Turns to the one standing north, speaks, and reads to the end, taking the first choice offered. */
async function talkNorth(page: Page): Promise<void> {
  await tap(page, 'KeyW');
  await tap(page, 'KeyE');
  await expect.poll(async () => mode(page)).toBe('story');
  await backToPlay(page);
}

async function consoleLine(page: Page, line: string): Promise<void> {
  await page.keyboard.press('Backquote');
  const input = page.locator('#dev-console-input');
  await expect(input).toBeFocused();
  await input.fill(line);
  await input.press('Enter');
  await page.keyboard.press('Backquote');
}

test('Styrr’s duel: accepted in his cottage, fought in the yard, and a lost duel costs no life', async ({
  page,
}) => {
  test.setTimeout(90_000);
  const errors = collectErrors(page);
  await boot(page, 'preset=haubow&screen=hau_int_styrr&at=22,12&nosave');
  await talkNorth(page);
  expect((await flags(page)).ev_duel_on).toBe(true);
  await consoleLine(page, 'warp hau_huscarl 23 14');
  await expect
    .poll(async () => page.evaluate(() => window.__fimbul?.boss()?.name), { timeout: 10_000 })
    .toBe('Styrr');
  // Ask stands still in the yard: Styrr's blows bring Ask to one heart, and the duel is lost, not the game.
  await expect.poll(async () => (await flags(page)).ev_duel_on, { timeout: 60_000 }).toBe(false);
  if ((await mode(page)) === 'story') await backToPlay(page);
  expect(await mode(page)).toBe('play');
  expect((await page.evaluate(() => window.__fimbul?.hero()))?.hp).toBeGreaterThan(4);
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => window.__fimbul?.missingFrames())).toEqual([]);
});

test('Hlíf: Sölvi teaches it after the pass, and sung it wards Ask', async ({ page }) => {
  const errors = collectErrors(page);
  await boot(page, 'preset=fimbul&screen=upp_int_runehall&at=19,11&nosave');
  await talkNorth(page);
  expect((await page.evaluate(() => window.__fimbul?.gear()))?.galdr).toContain('hlif');
  // The items tab lists the galdr last: up from the top wraps round to Hlíf.
  await tap(page, 'Tab');
  await expect.poll(async () => page.evaluate(() => window.__fimbul?.menu()?.tab)).toBe('items');
  await tap(page, 'ArrowUp');
  await tap(page, 'Enter');
  await tap(page, 'Escape');
  await expect.poll(async () => page.evaluate(() => window.__fimbul?.menu())).toBeNull();
  await tap(page, 'KeyI');
  await expect.poll(async () => eventCount(page, 'sfx_ward')).toBeGreaterThan(0);
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => window.__fimbul?.missingFrames())).toEqual([]);
});

test('the farm: the longhouse roof, then the fold and byre, each bought from Halvar', async ({ page }) => {
  test.setTimeout(60_000);
  const errors = collectErrors(page);
  await boot(page, 'preset=farm&time=12:00&nosave');
  await talkNorth(page);
  expect((await flags(page)).q_farm).toBe(1);
  expect(await page.evaluate(() => window.__fimbul?.silver())).toBe(250);
  // Roofed, Halvar is up and working the yard by day.
  await consoleLine(page, 'warp ask_farmyard 14 11');
  await expect
    .poll(async () => page.evaluate(() => window.__fimbul?.actors().some((a) => a.def === 'halvar')))
    .toBe(true);
  await talkNorth(page);
  expect((await flags(page)).q_farm).toBe(2);
  expect(await page.evaluate(() => window.__fimbul?.silver())).toBe(0);
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => window.__fimbul?.missingFrames())).toEqual([]);
});

test('a side quest: Þórdís’s wild honey, smoked out of the pines and brought to the mead hall', async ({
  page,
}) => {
  test.setTimeout(60_000);
  const errors = collectErrors(page);
  await boot(page, 'preset=fimbul&screen=myr_pines&at=30,6&season=autumn&time=12:00&nosave');
  await consoleLine(page, 'flag q_honey_asked');
  await talkNorth(page);
  expect((await items(page)).honey).toBe(1);
  const horns = (await items(page)).horn ?? 0;
  await consoleLine(page, 'warp upp_int_meadhall 19 7');
  await expect.poll(async () => page.evaluate(() => window.__fimbul?.screenId())).toBe('upp_int_meadhall');
  await talkNorth(page);
  expect((await flags(page)).q_honey_done).toBe(true);
  expect((await items(page)).horn).toBe(horns + 1);
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => window.__fimbul?.missingFrames())).toEqual([]);
});
