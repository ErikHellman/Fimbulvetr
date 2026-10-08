import { expect, test, type Page } from '@playwright/test';
import { boot, collectErrors, hero, tap } from './helpers';

/** M7b: the dive down into Sökkva Hof, Nykr's fall freeing Oddr and Hallbera, and the Norns at their loom. */

const mode = (page: Page) => page.evaluate(() => window.__fimbul?.mode());
const flags = (page: Page) => page.evaluate(() => window.__fimbul?.flags() ?? {});
const screen = (page: Page) => page.evaluate(() => window.__fimbul?.screenId());

async function backToPlay(page: Page): Promise<void> {
  for (let i = 0; i < 80 && (await mode(page)) !== 'play'; i++) await tap(page, 'Enter');
  expect(await mode(page)).toBe('play');
}

async function devCommand(page: Page, line: string): Promise<void> {
  await page.keyboard.press('Backquote');
  const input = page.locator('#dev-console-input');
  await expect(input).toBeFocused();
  await input.fill(line);
  await input.press('Enter');
  await page.keyboard.press('Backquote');
}

test('Ask swims off the spire and dives down into Sökkva Hof', async ({ page }) => {
  test.setTimeout(90_000);
  const errors = collectErrors(page);
  await boot(page, 'preset=sae&screen=sae_drowned&at=18,9&season=summer&nosave');
  await page.keyboard.down('KeyD');
  await expect.poll(async () => ((await hero(page))?.x ?? 0) > 19 * 16 + 4, { timeout: 10_000 }).toBe(true);
  await tap(page, 'Space');
  await expect.poll(async () => screen(page), { timeout: 10_000 }).toBe('d5_r01');
  await page.keyboard.up('KeyD');
  await expect.poll(async () => mode(page), { timeout: 20_000 }).toBe('story');
  await backToPlay(page);
  expect((await flags(page)).st_d5_entered).toBe(true);
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => window.__fimbul?.missingFrames())).toEqual([]);
});

test('Nykr falls, and Oddr and Hallbera are freed', async ({ page }) => {
  test.setTimeout(90_000);
  const errors = collectErrors(page);
  await boot(page, 'preset=hof&screen=d5_r19&at=20,12&nosave');
  await expect
    .poll(() => page.evaluate(() => window.__fimbul?.enemies().some((e) => e.def === 'nykr')))
    .toBe(true);
  await devCommand(page, 'kill');
  await expect.poll(async () => (await flags(page)).st_d5_boss_dead, { timeout: 20_000 }).toBe(true);
  expect(await flags(page)).toMatchObject({
    st_thane_nykr: true,
    st_freed_oddr: true,
    st_freed_hallbera: true,
    q_thanes: 2,
    q_captives: 4,
  });
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => window.__fimbul?.missingFrames())).toEqual([]);
});

test('Urðr weaves the three Norn-threads at the loom under the well', async ({ page }) => {
  test.setTimeout(90_000);
  const errors = collectErrors(page);
  await boot(page, 'preset=hof&screen=sae_int_well&at=20,8&nosave');
  await devCommand(page, 'give norn_thread 3');
  await tap(page, 'KeyW');
  await tap(page, 'KeyE');
  await expect.poll(async () => mode(page), { timeout: 10_000 }).toBe('story');
  await backToPlay(page);
  expect((await flags(page)).st_loom_woven).toBe(true);
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => window.__fimbul?.missingFrames())).toEqual([]);
});
