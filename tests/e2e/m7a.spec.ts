import { expect, test, type Page } from '@playwright/test';
import { boot, collectErrors, hero, tap, walkUntilScreen } from './helpers';

/** M7a: Sævatn swum with the seal-skin, Embla found on Holmr, and the nykr foals in the open lake. */

const mode = (page: Page) => page.evaluate(() => window.__fimbul?.mode());
const flags = (page: Page) => page.evaluate(() => window.__fimbul?.flags() ?? {});

async function backToPlay(page: Page): Promise<void> {
  for (let i = 0; i < 80 && (await mode(page)) !== 'play'; i++) await tap(page, 'Enter');
  expect(await mode(page)).toBe('play');
}

test('Ask lands on Holmr from the ford and finds Embla on the shore', async ({ page }) => {
  test.setTimeout(90_000);
  const errors = collectErrors(page);
  await boot(page, 'preset=sae&season=summer&nosave');
  await walkUntilScreen(page, 'KeyW', 'sae_holmr');
  await page.keyboard.down('KeyW');
  await expect.poll(async () => mode(page), { timeout: 20_000 }).toBe('story');
  await page.keyboard.up('KeyW');
  await backToPlay(page);
  expect((await flags(page)).st_embla_found).toBe(true);
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => window.__fimbul?.missingFrames())).toEqual([]);
});

test('a nykr foal circles in the open lake, and Ask swims out to it', async ({ page }) => {
  test.setTimeout(60_000);
  const errors = collectErrors(page);
  await boot(page, 'preset=sae&screen=sae_open&at=9,7&season=summer&nosave');
  await expect
    .poll(() => page.evaluate(() => window.__fimbul?.enemies().some((e) => e.def === 'nykr_foal')))
    .toBe(true);
  await page.keyboard.down('KeyD');
  await expect
    .poll(async () => Math.floor(((await hero(page))?.x ?? 0) / 16), { timeout: 10_000 })
    .toBeGreaterThan(13);
  await page.keyboard.up('KeyD');
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => window.__fimbul?.missingFrames())).toEqual([]);
});
