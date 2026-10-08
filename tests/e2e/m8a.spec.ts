import { expect, test, type Page } from '@playwright/test';
import { boot, collectErrors, tap } from './helpers';

/** M8a: Dvergagröf's camp, Sindri's forge for ore, and Hekla's escort through the old workings. */

const mode = (page: Page) => page.evaluate(() => window.__fimbul?.mode());
const flags = (page: Page) => page.evaluate(() => window.__fimbul?.flags() ?? {});

async function backToPlay(page: Page): Promise<void> {
  for (let i = 0; i < 80 && (await mode(page)) !== 'play'; i++) await tap(page, 'Enter');
  expect(await mode(page)).toBe('play');
}

test('Dvalinn asks after his crew at the camp', async ({ page }) => {
  test.setTimeout(90_000);
  const errors = collectErrors(page);
  await boot(page, 'preset=dvg&screen=dvg_camp&at=22,9&nosave');
  await tap(page, 'KeyW');
  await tap(page, 'KeyE');
  await expect.poll(async () => mode(page), { timeout: 10_000 }).toBe('story');
  await backToPlay(page);
  expect((await flags(page)).q_foreman).toBe(1);
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => window.__fimbul?.missingFrames())).toEqual([]);
});

test('Sindri takes the sail-needle and opens his forge', async ({ page }) => {
  test.setTimeout(90_000);
  const errors = collectErrors(page);
  await boot(page, 'preset=dvg&screen=dvg_int_forge&at=22,10&nosave');
  await tap(page, 'KeyW');
  await tap(page, 'KeyE');
  const story = () => page.evaluate(() => window.__fimbul?.story() ?? null);
  for (let i = 0; i < 40 && (await story())?.k !== 'shop'; i++) await tap(page, 'Enter');
  expect((await story())?.k).toBe('shop');
  expect((await flags(page)).q_trade).toBe(6);
  expect((await page.evaluate(() => window.__fimbul?.items() ?? {})).trade_lens).toBe(1);
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => window.__fimbul?.missingFrames())).toEqual([]);
});

async function devCommand(page: Page, line: string): Promise<void> {
  await page.keyboard.press('Backquote');
  const input = page.locator('#dev-console-input');
  await expect(input).toBeFocused();
  await input.fill(line);
  await input.press('Enter');
  await page.keyboard.press('Backquote');
}

test('Hekla follows Ask once the escort starts', async ({ page }) => {
  test.setTimeout(90_000);
  const errors = collectErrors(page);
  await boot(page, 'preset=dvg&screen=dvg_minehead&at=22,7&nosave');
  await devCommand(page, 'flag q_foreman 3');
  await page.evaluate(() => {
    window.__fimbul?.warp('dvg_minehead', 22, 7);
  });
  await expect
    .poll(() => page.evaluate(() => window.__fimbul?.actors().some((a) => a.def === 'hekla')), {
      timeout: 10_000,
    })
    .toBe(true);
  await tap(page, 'KeyW');
  await tap(page, 'KeyE');
  await expect.poll(async () => mode(page), { timeout: 10_000 }).toBe('story');
  await backToPlay(page);
  // West along the road: she keeps up behind Ask.
  const hekla = () => page.evaluate(() => window.__fimbul?.actors().find((a) => a.def === 'hekla')?.x ?? 0);
  const from = await hekla();
  await page.keyboard.down('KeyA');
  await page.waitForTimeout(3000);
  await page.keyboard.up('KeyA');
  await expect.poll(hekla, { timeout: 10_000 }).toBeLessThan(from - 16);
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => window.__fimbul?.missingFrames())).toEqual([]);
});
