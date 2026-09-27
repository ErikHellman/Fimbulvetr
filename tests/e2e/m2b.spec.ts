import { expect, test, type Page } from '@playwright/test';
import { boot, collectErrors, hero, screenId } from './helpers';

/** M2b: Uppvík's shops and mead hall, the mead horn, and Eldr setting the forest alight. */

/** Two rendered frames: a key held across them is seen by the game however slow the machine is. */
const frames = (page: Page): Promise<void> =>
  page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            resolve();
          });
        });
      }),
  );

const tap = async (page: Page, key: string): Promise<void> => {
  await page.keyboard.down(key);
  await frames(page);
  await page.keyboard.up(key);
  await frames(page);
};

const story = (page: Page) => page.evaluate(() => window.__fimbul?.story()?.k ?? null);
const mode = (page: Page) => page.evaluate(() => window.__fimbul?.mode());
/** Waits until the save-slot picker takes input (it ignores the first frames after opening). */
const armed = (page: Page) =>
  page.waitForFunction(() => window.__fimbul?.picker()?.armed === true, undefined, { timeout: 5_000 });
const gear = (page: Page) => page.evaluate(() => window.__fimbul?.gear());
const items = (page: Page) => page.evaluate(() => window.__fimbul?.items() ?? {});

/** Reads on with Enter until a story step of kind `k` shows. */
async function readUntil(page: Page, k: string): Promise<void> {
  for (let i = 0; i < 40 && (await story(page)) !== k; i++) await tap(page, 'Enter');
  expect(await story(page)).toBe(k);
}

/** Taps a key until the game is back in play (leaving a shop, or reading to the end). */
async function backToPlay(page: Page, key: string): Promise<void> {
  for (let i = 0; i < 40 && (await mode(page)) !== 'play'; i++) await tap(page, key);
  expect(await mode(page)).toBe('play');
}

test('Ketill sells the Uppvík sword from his anvil', async ({ page }) => {
  const errors = collectErrors(page);
  await boot(page, 'preset=uppvik&screen=upp_smiths&at=15,8&nosave');
  // The anvil is north: turn to it (it is solid, so Ask does not move) and ask.
  await tap(page, 'KeyW');
  await tap(page, 'KeyE');
  await readUntil(page, 'shop');
  await tap(page, 'Enter');
  await expect.poll(async () => (await gear(page))?.weapon).toBe('uppvik_sword');
  expect(await page.evaluate(() => window.__fimbul?.silver())).toBe(20);
  await backToPlay(page, 'Escape');
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => window.__fimbul?.missingFrames())).toEqual([]);
});

test('a horn from Þórdís, red mead from Hrafnkell, drunk from the menu, then a rest and a save', async ({
  page,
}) => {
  const errors = collectErrors(page);
  await boot(page, 'preset=uppvik&screen=upp_int_meadhall&at=19,7');
  await tap(page, 'KeyW');
  await tap(page, 'KeyE');
  await backToPlay(page, 'Enter');
  expect(await items(page)).toMatchObject({ horn: 1 });

  await page.evaluate(() => {
    window.__fimbul?.warp('upp_int_trader', 18, 10);
  });
  await expect.poll(() => screenId(page)).toBe('upp_int_trader');
  await tap(page, 'KeyW');
  await tap(page, 'KeyE');
  await readUntil(page, 'shop');
  await tap(page, 'Enter');
  await expect.poll(async () => (await items(page)).mead_red).toBe(1);
  await backToPlay(page, 'Escape');

  // Tab opens the items page: lantern, boomerang, then the mead.
  await page.evaluate(() => {
    window.__fimbul?.setHp(4);
  });
  await tap(page, 'Tab');
  await tap(page, 'ArrowDown');
  await tap(page, 'ArrowDown');
  await tap(page, 'Enter');
  await expect.poll(async () => (await hero(page))?.hp).toBe(16);
  expect((await items(page)).mead_red ?? 0).toBe(0);
  await tap(page, 'Escape');
  await expect.poll(() => page.evaluate(() => window.__fimbul?.menu())).toBeNull();

  // The benches in the mead hall: rest, then a slot.
  await page.evaluate(() => {
    window.__fimbul?.warp('upp_int_meadhall', 10, 7);
  });
  await expect.poll(() => screenId(page)).toBe('upp_int_meadhall');
  await tap(page, 'KeyA');
  await tap(page, 'KeyE');
  await readUntil(page, 'save');
  await armed(page);
  await tap(page, 'Enter');
  await expect.poll(async () => (await page.evaluate(() => window.__fimbul?.picker()))?.phase).toBe('done');
  await backToPlay(page, 'Enter');
  expect(await screenId(page)).toBe('upp_int_meadhall');
  expect(errors).toEqual([]);
});

test('Eldr sets the leaves alight and draws on the seiðr bar', async ({ page }) => {
  const errors = collectErrors(page);
  await boot(page, 'preset=eldr&at=18,13&nosave');
  const before = await gear(page);
  expect(before?.galdr).toEqual(['eldr']);
  await tap(page, 'KeyI');
  await expect.poll(async () => (await gear(page))?.seidr).toBe((before?.seidr ?? 0) - 2);
  await expect
    .poll(async () => (await page.evaluate(() => window.__fimbul?.view()))?.flames ?? 0)
    .toBeGreaterThan(0);
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => window.__fimbul?.missingFrames())).toEqual([]);
});
