import { expect, test, type Page } from '@playwright/test';
import { boot, collectErrors, screenId, tap } from './helpers';

const flags = (page: Page) => page.evaluate(() => window.__fimbul?.flags() ?? {});
const story = (page: Page) => page.evaluate(() => window.__fimbul?.story() ?? null);
const hero = (page: Page) => page.evaluate(() => window.__fimbul?.hero());

/** Walks into whatever is ahead long enough to face it (a quick tap can land in the same tick as E). */
async function walk(page: Page, key: string): Promise<void> {
  await page.keyboard.down(key);
  await page.waitForTimeout(250);
  await page.keyboard.up(key);
  await page.waitForTimeout(100);
}

/** Presses Enter until the running script is over. */
async function readOn(page: Page): Promise<void> {
  for (let i = 0; i < 40 && (await story(page)) !== null; i++) await tap(page, 'Enter');
  await expect.poll(() => story(page)).toBeNull();
}

test('a new game wakes in the longhouse, walks out and gets the day’s orders from Halvar', async ({
  page,
}) => {
  const errors = collectErrors(page);
  await boot(page, 'nosave');
  expect(await screenId(page)).toBe('ask_int_longhouse');
  await page.evaluate(() => {
    window.__fimbul?.warp('ask_int_longhouse', 19, 19);
  });
  await page.keyboard.down('KeyS');
  await expect.poll(() => screenId(page), { timeout: 10_000 }).toBe('ask_farmyard');
  await page.keyboard.up('KeyS');
  await page.evaluate(() => {
    window.__fimbul?.warp('ask_farmyard', 14, 11);
  });
  await page.waitForTimeout(200);
  await walk(page, 'KeyW');
  await tap(page, 'KeyE');
  await expect.poll(() => story(page).then((s) => s?.who)).toBe('halvar');
  await readOn(page);
  expect((await flags(page)).st_intro_seen).toBe(true);
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => window.__fimbul?.missingFrames())).toEqual([]);
});

test('the pail is carried to the trough', async ({ page }) => {
  await boot(page, 'nosave&screen=ask_farmyard&at=26,10');
  await walk(page, 'KeyW');
  await tap(page, 'KeyE');
  await expect.poll(() => hero(page).then((h) => h?.fsm)).toBe('carry');
  await page.keyboard.down('KeyS');
  // Polled every animation frame, so the hero stops in front of the trough rather than overshooting.
  await page.waitForFunction(() => Math.floor(((window.__fimbul?.hero().y ?? 0) - 1) / 16) >= 12);
  await page.keyboard.up('KeyS');
  await page.waitForTimeout(100);
  await tap(page, 'KeyE');
  await expect.poll(() => flags(page).then((f) => f.q_water_d1)).toBe(true);
});

test('Sigrún sells Embla’s flatbread', async ({ page }) => {
  await boot(page, 'nosave&preset=day3&screen=ask_int_trader&at=19,12');
  await walk(page, 'KeyW');
  await tap(page, 'KeyE');
  await expect.poll(() => story(page).then((s) => s?.who)).toBe('sigrun');
  for (let i = 0; i < 20 && (await story(page))?.k !== 'shop'; i++) await tap(page, 'Enter');
  await tap(page, 'ArrowDown');
  await tap(page, 'Enter');
  await expect.poll(() => page.evaluate(() => window.__fimbul?.items().flatbread)).toBe(1);
  await tap(page, 'Escape');
  await expect.poll(() => story(page)).toBeNull();
});

test('sleeping on the third night starts the raid', async ({ page }) => {
  const errors = collectErrors(page);
  await boot(page, 'nosave&preset=night3');
  await tap(page, 'KeyE');
  await expect.poll(() => story(page).then((s) => s?.k), { timeout: 10_000 }).toBe('card');
  for (let i = 0; i < 40 && (await page.evaluate(() => window.__fimbul?.mode())) !== 'play'; i++)
    await tap(page, 'Enter');
  await expect.poll(() => page.evaluate(() => window.__fimbul?.mode())).toBe('play');
  expect((await flags(page)).st_raid_begun).toBe(true);
  expect(await page.evaluate(() => window.__fimbul?.clock().season)).toBe('autumn');
  expect(errors).toEqual([]);
});

test('every screen draws without errors or missing art', async ({ page }) => {
  const errors = collectErrors(page);
  await boot(page, 'nosave&preset=m0');
  const ids = await page.evaluate(() => window.__fimbul?.screens() ?? []);
  expect(ids.length).toBeGreaterThan(10);
  for (const id of ids) {
    await page.evaluate((s) => {
      window.__fimbul?.warp(s, 20, 11);
    }, id);
    await expect.poll(() => screenId(page)).toBe(id);
    await page.waitForTimeout(50);
  }
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => window.__fimbul?.missingFrames())).toEqual([]);
});
