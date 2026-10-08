import { expect, test, type Page } from '@playwright/test';
import { boot, collectErrors, hero, tap, walkUntilScreen } from './helpers';

/** M6b: in through Helgrind's black wall, the grapple over the chasm, and Náströnd's fall freeing the captives. */

const mode = (page: Page) => page.evaluate(() => window.__fimbul?.mode());
const flags = (page: Page) => page.evaluate(() => window.__fimbul?.flags() ?? {});

async function backToPlay(page: Page): Promise<void> {
  for (let i = 0; i < 80 && (await mode(page)) !== 'play'; i++) await tap(page, 'Enter');
  expect(await mode(page)).toBe('play');
}

test('the gate in Niflmýrr opens into Helgrind', async ({ page }) => {
  test.setTimeout(90_000);
  const errors = collectErrors(page);
  await boot(page, 'preset=d4&screen=nif_gate&at=20,7&nosave');
  await walkUntilScreen(page, 'KeyW', 'd4_r01');
  await page.keyboard.down('KeyW');
  await expect.poll(async () => mode(page), { timeout: 20_000 }).toBe('story');
  await page.keyboard.up('KeyW');
  await backToPlay(page);
  expect((await flags(page)).st_d4_entered).toBe(true);
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => window.__fimbul?.missingFrames())).toEqual([]);
});

test('the grapple hooks a post and pulls Ask over the chasm', async ({ page }) => {
  const errors = collectErrors(page);
  await boot(page, 'preset=d4boss&screen=d4_r08&at=15,10&nosave');
  await tap(page, 'KeyD');
  await tap(page, 'KeyK');
  await expect.poll(async () => Math.floor(((await hero(page))?.x ?? 0) / 16), { timeout: 10_000 }).toBe(20);
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => window.__fimbul?.missingFrames())).toEqual([]);
});

test('Náströnd falls, and Ulf and Tófa are freed', async ({ page }) => {
  test.setTimeout(90_000);
  const errors = collectErrors(page);
  await boot(page, 'preset=d4boss&screen=d4_r21&at=20,17&nosave');
  await expect
    .poll(() => page.evaluate(() => window.__fimbul?.enemies().some((e) => e.def === 'nastrond')))
    .toBe(true);
  await page.keyboard.press('Backquote');
  const input = page.locator('#dev-console-input');
  await expect(input).toBeFocused();
  await input.fill('kill');
  await input.press('Enter');
  await page.keyboard.press('Backquote');
  await expect.poll(async () => (await flags(page)).st_d4_boss_dead, { timeout: 20_000 }).toBe(true);
  expect(await flags(page)).toMatchObject({
    st_freed_ulf: true,
    st_freed_tofa: true,
    q_thanes: 1,
    q_captives: 2,
  });
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => window.__fimbul?.missingFrames())).toEqual([]);
});
