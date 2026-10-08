import { expect, test, type Page } from '@playwright/test';
import { boot, collectErrors, tap, walkUntilScreen } from './helpers';

/** M6a: the rime melted into Niflmýrr, Bragi's verse on the pause map, and an Ís stave on the cairns pool. */

const mode = (page: Page) => page.evaluate(() => window.__fimbul?.mode());
const flags = (page: Page) => page.evaluate(() => window.__fimbul?.flags() ?? {});
const items = (page: Page) => page.evaluate(() => window.__fimbul?.items() ?? {});

async function backToPlay(page: Page): Promise<void> {
  for (let i = 0; i < 80 && (await mode(page)) !== 'play'; i++) await tap(page, 'Enter');
  expect(await mode(page)).toBe('play');
}

test('Eldr melts the rime, and the gorge leads on into the fog of Niflmýrr', async ({ page }) => {
  test.setTimeout(90_000);
  const errors = collectErrors(page);
  await boot(page, 'preset=fimbul&screen=hau_pass&at=20,3&nosave');
  await tap(page, 'KeyW');
  await tap(page, 'KeyI');
  await expect.poll(async () => (await flags(page)).st_rime_open, { timeout: 10_000 }).toBe(true);
  await walkUntilScreen(page, 'KeyW', 'nif_gorge');
  await page.keyboard.down('KeyW');
  await expect.poll(async () => mode(page), { timeout: 20_000 }).toBe('story');
  await page.keyboard.up('KeyW');
  await backToPlay(page);
  expect((await flags(page)).st_niflmyrr_reached).toBe(true);
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => window.__fimbul?.missingFrames())).toEqual([]);
});

test('Bragi sells a verse by his fire at night, and the pause map marks its secret', async ({ page }) => {
  const errors = collectErrors(page);
  await boot(page, 'preset=fimbul&screen=nif_camp&at=34,12&time=23:00&nosave');
  await tap(page, 'KeyD');
  await tap(page, 'KeyE');
  await expect.poll(async () => mode(page)).toBe('story');
  await backToPlay(page);
  expect((await flags(page)).w_verse_deadwood).toBe(true);
  await tap(page, 'KeyM');
  await expect.poll(() => page.evaluate(() => window.__fimbul?.menu()?.tab)).toBe('map');
  await tap(page, 'KeyM');
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => window.__fimbul?.missingFrames())).toEqual([]);
});

test('an Ís stave from slot K lays ice on the cairns pool in summer', async ({ page }) => {
  const errors = collectErrors(page);
  await boot(page, 'preset=fimbul&screen=nif_cairns&at=17,5&season=summer&time=12:00&nosave');
  const before = await page.evaluate(() => window.__fimbul?.coverAt(17, 6));
  await page.keyboard.press('Backquote');
  const input = page.locator('#dev-console-input');
  await expect(input).toBeFocused();
  await input.fill('give stave_is 2');
  await input.press('Enter');
  await input.fill('slot 1 stave_is');
  await input.press('Enter');
  await page.keyboard.press('Backquote');
  await expect.poll(async () => (await items(page)).stave_is).toBe(2);
  await expect.poll(() => page.evaluate(() => window.__fimbul?.slots()[0])).toBe('stave_is');
  await tap(page, 'KeyS');
  await tap(page, 'KeyK');
  await expect.poll(async () => (await items(page)).stave_is).toBe(1);
  await expect.poll(async () => page.evaluate(() => window.__fimbul?.coverAt(17, 6))).not.toBe(before);
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => window.__fimbul?.missingFrames())).toEqual([]);
});
