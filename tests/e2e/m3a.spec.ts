import { expect, test, type Page } from '@playwright/test';
import { boot, collectErrors, frames, hero, screenId, tap } from './helpers';

/** M3a: the weir's latch and drawbridge, the spring flood on the shoal, the ferryman, and fishing. */

const story = (page: Page) => page.evaluate(() => window.__fimbul?.story() ?? null);
const mode = (page: Page) => page.evaluate(() => window.__fimbul?.mode());
const flags = (page: Page) => page.evaluate(() => window.__fimbul?.flags() ?? {});
const fish = (page: Page) => page.evaluate(() => window.__fimbul?.fish() ?? null);
const tileY = async (page: Page): Promise<number> => Math.floor(((await hero(page))?.y ?? 0) / 16);

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
  await page.keyboard.down('KeyS');
  await expect.poll(async () => tileY(page)).toBeGreaterThanOrEqual(7);
  await page.keyboard.up('KeyS');
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
  let landed = false;
  for (let tries = 0; tries < 6 && !landed; tries++) {
    await tap(page, 'Enter');
    await expect.poll(async () => (await fish(page))?.phase, { timeout: 15_000 }).toBe('bite');
    await tap(page, 'Enter');
    let holding = false;
    for (let i = 0; i < 4000; i++) {
      const f = await fish(page);
      if (f === null || f.phase !== 'reel') break;
      const want = f.tension < 650 && !f.surging;
      if (want !== holding) {
        if (want) await page.keyboard.down('KeyE');
        else await page.keyboard.up('KeyE');
        holding = want;
      }
      await frames(page);
    }
    if (holding) await page.keyboard.up('KeyE');
    const end = await fish(page);
    landed = end?.result === 'landed';
    // Back to the rod for another cast.
    await expect.poll(async () => (await fish(page))?.phase, { timeout: 5_000 }).toBe('idle');
  }
  expect(landed).toBe(true);
  expect((await flags(page)).q_fish_caught).toBeGreaterThanOrEqual(1);
  await tap(page, 'Escape');
  await expect.poll(async () => mode(page)).toBe('play');
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => window.__fimbul?.missingFrames())).toEqual([]);
});
