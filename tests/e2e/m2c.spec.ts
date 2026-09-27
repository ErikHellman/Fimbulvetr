import { expect, test, type Page } from '@playwright/test';
import { boot, collectErrors, tap } from './helpers';

/** M2c: the huldra's bargain at night, the völva's brews, and a troll caught by the sunrise. */

const story = (page: Page) => page.evaluate(() => window.__fimbul?.story() ?? null);
const mode = (page: Page) => page.evaluate(() => window.__fimbul?.mode());
const items = (page: Page) => page.evaluate(() => window.__fimbul?.items() ?? {});
const actors = (page: Page) => page.evaluate(() => window.__fimbul?.actors() ?? []);

async function backToPlay(page: Page, key: string): Promise<void> {
  for (let i = 0; i < 40 && (await mode(page)) !== 'play'; i++) await tap(page, key);
  expect(await mode(page)).toBe('play');
}

test('the huldra waits in the glade at night and trades her cloak for a promise', async ({ page }) => {
  const errors = collectErrors(page);
  await boot(page, 'preset=uppvik&screen=myr_glade&at=20,12&time=23:00&nosave');
  const huldra = (await actors(page)).find((a) => a.kind === 'npc' && a.def === 'huldra');
  expect(huldra).toBeDefined();
  await tap(page, 'KeyE');
  // Read on to her question; the first answer is the promise.
  for (let i = 0; i < 20 && ((await story(page))?.choices.length ?? 0) === 0; i++) await tap(page, 'Enter');
  expect((await story(page))?.choices.length).toBe(2);
  await tap(page, 'Enter');
  await backToPlay(page, 'Enter');
  expect(await items(page)).toMatchObject({ winter_cloak: 1 });
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => window.__fimbul?.missingFrames())).toEqual([]);
});

test('Heiðr gives a horn and sells red mead across her table', async ({ page }) => {
  const errors = collectErrors(page);
  await boot(page, 'preset=uppvik&screen=myr_int_volva&at=22,13&nosave');
  await tap(page, 'KeyW');
  await tap(page, 'KeyE');
  for (let i = 0; i < 40 && (await story(page))?.k !== 'shop'; i++) await tap(page, 'Enter');
  expect((await story(page))?.k).toBe('shop');
  await tap(page, 'Enter');
  await expect.poll(async () => (await items(page)).mead_red).toBe(1);
  expect((await items(page)).horn).toBe(1);
  await backToPlay(page, 'Escape');
  expect(errors).toEqual([]);
});

test('a forest troll in the troll wood turns to stone at sunrise', async ({ page }) => {
  test.setTimeout(90_000);
  const errors = collectErrors(page);
  await boot(page, 'preset=uppvik&screen=myr_trollskog&at=4,13&time=04:59&nosave');
  expect((await actors(page)).filter((a) => a.def === 'forest_troll').length).toBeGreaterThan(0);
  await expect
    .poll(async () => (await actors(page)).filter((a) => a.def === 'forest_troll').length, {
      timeout: 60_000,
    })
    .toBe(0);
  // Two new stones where the trolls stood, besides the one in the ring's gap.
  expect((await actors(page)).filter((a) => a.def === 'troll_stone').length).toBe(3);
  expect(errors).toEqual([]);
});
