import { expect, test, type Page } from '@playwright/test';
import { boot, collectErrors, frames, hero, screenId, tap } from './helpers';

/** M3a: the weir's latch and drawbridge, the spring flood on the shoal, the ferryman, and fishing. */

const story = (page: Page) => page.evaluate(() => window.__fimbul?.story() ?? null);
const mode = (page: Page) => page.evaluate(() => window.__fimbul?.mode());
const flags = (page: Page) => page.evaluate(() => window.__fimbul?.flags() ?? {});
const fish = (page: Page) => page.evaluate(() => window.__fimbul?.fish() ?? null);
/** The tile row Ask's feet stand on (as the game counts it: feet resting on a tile's top edge are above it). */
const tileY = async (page: Page): Promise<number> => Math.floor((((await hero(page))?.y ?? 1) - 1) / 16);

async function backToPlay(page: Page, key: string): Promise<void> {
  for (let i = 0; i < 40 && (await mode(page)) !== 'play'; i++) await tap(page, key);
  expect(await mode(page)).toBe('play');
}

test('the boomerang strikes the weir’s latch and the drawbridge carries Ask into Mýrland', async ({
  page,
}) => {
  const errors = collectErrors(page);
  await boot(page, 'preset=myl&screen=myl_weir&at=28,4&nosave');
  await tap(page, 'KeyA');
  await tap(page, 'KeyK');
  await expect.poll(async () => (await flags(page)).w_myl_bridge).toBe(true);
  // Down to the bridge head and west over the rapids until Mýrland greets Ask.
  // Tap down until Ask's feet stand on the bridge's lower row (7), so all of Ask is between its rails:
  // feet just over into row 6 leave Ask's head in the rapids' row 5, which snags the bank on a slow
  // machine. Taps, not a held key, so a slow frame never carries Ask off the bridge's end (row 8).
  for (let i = 0; i < 200 && (await tileY(page)) < 7; i++) await tap(page, 'KeyS');
  expect(await tileY(page)).toBe(7);
  await page.keyboard.down('KeyA');
  await expect.poll(async () => mode(page), { timeout: 15_000 }).toBe('story');
  await page.keyboard.up('KeyA');
  await backToPlay(page, 'Enter');
  expect((await flags(page)).st_myrland_reached).toBe(true);
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => window.__fimbul?.missingFrames())).toEqual([]);
});

test('the spring flood covers the shoal; in summer Ask wades across', async ({ page }) => {
  const errors = collectErrors(page);
  await boot(page, 'preset=fisher&screen=myl_ford&at=19,9&season=spring&nosave');
  await page.keyboard.down('KeyS');
  for (let i = 0; i < 30; i++) await frames(page);
  await page.keyboard.up('KeyS');
  expect(await tileY(page)).toBeLessThan(11);
  await boot(page, 'preset=fisher&screen=myl_ford&at=19,9&season=summer&nosave');
  await page.keyboard.down('KeyS');
  await expect.poll(async () => tileY(page), { timeout: 15_000 }).toBeGreaterThan(15);
  await page.keyboard.up('KeyS');
  expect(await screenId(page)).toBe('myl_ford');
  expect(errors).toEqual([]);
});

test('Bárðr rows nobody toward the mountains', async ({ page }) => {
  const errors = collectErrors(page);
  await boot(page, 'preset=fisher&screen=myl_ferry&at=22,10&nosave');
  await tap(page, 'KeyW');
  await tap(page, 'KeyE');
  await expect.poll(async () => (await story(page))?.text ?? '').toContain('mountains');
  await backToPlay(page, 'Enter');
  expect((await flags(page)).n_bardr_met).toBe(true);
  expect(await screenId(page)).toBe('myl_ferry');
  expect(errors).toEqual([]);
});

test('fishing off Kári’s jetty: cast, strike the bite, reel within the band, land a fish', async ({
  page,
}) => {
  test.setTimeout(120_000);
  const errors = collectErrors(page);
  await boot(page, 'preset=fisher&nosave');
  await tap(page, 'KeyE');
  await expect.poll(async () => (await fish(page))?.phase).toBe('idle');
  // One frame at a time, as a player would: cast when idle, strike the moment the float goes under (the
  // window is a third of a second), hold the line while it is slack and let go when it strains or surges.
  let landed = false;
  let holding = false;
  const hold = async (want: boolean): Promise<void> => {
    if (want === holding) return;
    if (want) await page.keyboard.down('KeyE');
    else await page.keyboard.up('KeyE');
    holding = want;
  };
  for (let i = 0; i < 20_000 && !landed; i++) {
    const f = await fish(page);
    if (f === null) break;
    if (f.phase === 'result') {
      await hold(false);
      landed = f.result === 'landed';
      if (!landed) await tap(page, 'Enter');
    } else if (f.phase === 'idle') {
      await hold(false);
      await tap(page, 'Enter');
    } else if (f.phase === 'bite') await tap(page, 'Enter');
    else {
      if (f.phase === 'reel') await hold(f.tension < 650 && !f.surging);
      await frames(page);
    }
  }
  await hold(false);
  expect(landed).toBe(true);
  expect((await flags(page)).q_fish_caught).toBeGreaterThanOrEqual(1);
  await tap(page, 'Escape');
  await expect.poll(async () => mode(page)).toBe('play');
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => window.__fimbul?.missingFrames())).toEqual([]);
});
