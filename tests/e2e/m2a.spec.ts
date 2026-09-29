import { expect, test, type Page } from '@playwright/test';
import { boot, collectErrors, screenId, tap } from './helpers';

/** M2a: the title screen and slots, the settings menu, the weathers and the turning seasons. */

const story = (page: Page) => page.evaluate(() => window.__fimbul?.story()?.k ?? null);
const mode = (page: Page) => page.evaluate(() => window.__fimbul?.mode());
/** Waits until the save-slot picker takes input (it ignores the first frames after opening). */
const armed = (page: Page) =>
  page.waitForFunction(() => window.__fimbul?.picker()?.armed === true, undefined, { timeout: 5_000 });

test('the title screen starts a new game in the longhouse', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/?title=1&rolled=0');
  await expect(page.locator('body[data-title="press"]')).toBeAttached({ timeout: 20_000 });
  await tap(page, 'Space');
  await expect(page.locator('body[data-title="main"]')).toBeAttached();
  await tap(page, 'Enter');
  // The introduction lists the controls; Enter begins.
  await expect(page.locator('body[data-title="intro"]')).toBeAttached();
  await tap(page, 'Enter');
  await page.waitForFunction(() => window.__fimbul?.ready === true);
  expect(await screenId(page)).toBe('ask_int_longhouse');
  expect(errors).toEqual([]);
});

test('"don’t show this again" keeps the introduction away from later new games', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/?title=1&rolled=0');
  await expect(page.locator('body[data-title="press"]')).toBeAttached({ timeout: 20_000 });
  await tap(page, 'Space');
  await tap(page, 'Enter');
  await expect(page.locator('body[data-title="intro"]')).toBeAttached();
  // Up to the box, tick it, down to Begin.
  await tap(page, 'ArrowUp');
  await tap(page, 'Enter');
  await tap(page, 'ArrowDown');
  await tap(page, 'Enter');
  await page.waitForFunction(() => window.__fimbul?.ready === true);
  const stored: unknown = JSON.parse(
    (await page.evaluate(() => localStorage.getItem('fimbulvetr.settings.v1'))) ?? '{}',
  );
  expect(stored).toMatchObject({ showIntro: false });
  await page.goto('/?title=1&rolled=0');
  await expect(page.locator('body[data-title="press"]')).toBeAttached({ timeout: 20_000 });
  await tap(page, 'Space');
  await expect(page.locator('body[data-title="main"]')).toBeAttached();
  const rows = (await page.locator('body').getAttribute('data-title-rows'))?.split(',') ?? [];
  for (let i = 0; i < rows.indexOf('new'); i++) await tap(page, 'ArrowDown');
  await tap(page, 'Enter');
  // With an autosave the title asks first; either way the game starts without the introduction.
  if (rows.includes('continue')) {
    await expect(page.locator('body[data-title="confirmNew"]')).toBeAttached();
    await tap(page, 'Enter');
  }
  await page.waitForFunction(() => window.__fimbul?.ready === true);
  expect(await screenId(page)).toBe('ask_int_longhouse');
  expect(errors).toEqual([]);
});

test('settings change at once and survive a reload: colour-blind aid and a remapped sword', async ({
  page,
}) => {
  const errors = collectErrors(page);
  await boot(page, 'preset=myr&nosave');
  const plain = await page.evaluate(() => window.__fimbul?.appliedGrade());
  // Tab → the Game tab → Settings.
  await tap(page, 'Tab');
  await tap(page, 'ArrowLeft');
  await tap(page, 'ArrowDown');
  await tap(page, 'Enter');
  // Down to the colour-blind aid and switch it on.
  for (let i = 0; i < 7; i++) await tap(page, 'ArrowDown');
  await tap(page, 'Enter');
  // Past the introduction toggle to Controls…: the sword (fifth row) to U.
  await tap(page, 'ArrowDown');
  await tap(page, 'ArrowDown');
  await tap(page, 'Enter');
  for (let i = 0; i < 4; i++) await tap(page, 'ArrowDown');
  await tap(page, 'Enter');
  await tap(page, 'KeyU');
  // Back out to the game.
  await tap(page, 'Escape');
  await tap(page, 'Escape');
  await tap(page, 'Escape');
  await expect.poll(() => page.evaluate(() => window.__fimbul?.menu())).toBeNull();
  await expect.poll(() => page.evaluate(() => window.__fimbul?.appliedGrade())).not.toEqual(plain);
  await page.keyboard.down('KeyU');
  await expect.poll(() => page.evaluate(() => window.__fimbul?.hero().fsm)).toBe('attack');
  await page.keyboard.up('KeyU');
  await page.reload();
  await page.waitForFunction(() => window.__fimbul?.ready === true);
  const stored: unknown = JSON.parse(
    (await page.evaluate(() => localStorage.getItem('fimbulvetr.settings.v1'))) ?? '{}',
  );
  expect(stored).toMatchObject({ colourBlind: true, keys: { sword: ['KeyU'] } });
  expect(errors).toEqual([]);
});

test('praying at the hof saves to a slot that the title screen loads', async ({ page }) => {
  const errors = collectErrors(page);
  await boot(page, 'preset=day2&screen=ask_int_hof&at=20,9');
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(100);
  await page.keyboard.up('KeyW');
  await tap(page, 'KeyE');
  for (let i = 0; i < 40 && (await story(page)) !== 'save'; i++) await tap(page, 'Enter');
  expect(await story(page)).toBe('save');
  await armed(page);
  await tap(page, 'ArrowDown');
  await expect.poll(async () => (await page.evaluate(() => window.__fimbul?.picker()))?.cursor).toBe(1);
  await tap(page, 'Enter');
  await expect.poll(async () => (await page.evaluate(() => window.__fimbul?.picker()))?.phase).toBe('done');
  await tap(page, 'Enter');
  for (let i = 0; i < 20 && (await mode(page)) !== 'play'; i++) await tap(page, 'Enter');
  expect(await mode(page)).toBe('play');
  await page.goto('/?title=1&rolled=0');
  await expect(page.locator('body[data-title="press"]')).toBeAttached({ timeout: 20_000 });
  await tap(page, 'Space');
  await expect(page.locator('body[data-title="main"]')).toBeAttached();
  const rows = (await page.locator('body').getAttribute('data-title-rows'))?.split(',') ?? [];
  for (let i = 0; i < rows.indexOf('load'); i++) await tap(page, 'ArrowDown');
  await tap(page, 'Enter');
  await expect(page.locator('body[data-title="load"]')).toBeAttached();
  await tap(page, 'ArrowDown');
  await tap(page, 'Enter');
  await page.waitForFunction(() => window.__fimbul?.ready === true);
  expect(await screenId(page)).toBe('ask_int_hof');
  expect(errors).toEqual([]);
});

test('each kind of weather draws', async ({ page }) => {
  const errors = collectErrors(page);
  const view = () => page.evaluate(() => window.__fimbul?.view());
  await boot(page, 'preset=myr&nosave&weather=rain');
  await expect.poll(async () => (await view())?.rain ?? 0).toBeGreaterThan(20);
  await boot(page, 'preset=myr&nosave&weather=wind');
  await expect.poll(async () => (await view())?.leaves ?? 0).toBeGreaterThan(3);
  await boot(page, 'preset=myr&nosave&weather=fog');
  await expect.poll(async () => (await view())?.fog ?? 0).toBeGreaterThan(0.5);
  await boot(page, 'preset=myr&nosave&weather=snow&season=winter');
  await expect.poll(async () => (await view())?.snow ?? 0).toBeGreaterThan(20);
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => window.__fimbul?.missingFrames())).toEqual([]);
});

test('every screen draws in a winter night and a wet spring day, with rolled foes', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = collectErrors(page);
  await boot(page, 'preset=myr&nosave&rolled=1');
  const ids = await page.evaluate(() => window.__fimbul?.screens() ?? []);
  for (const [season, time] of [
    ['winter', '23:00'],
    ['spring', '12:00'],
  ] as const) {
    await page.evaluate(
      ([s, t]) => {
        window.__fimbul?.setSeason(s);
        window.__fimbul?.setTime(t);
      },
      [season, time] as const,
    );
    for (const id of ids) {
      await page.evaluate((s) => {
        window.__fimbul?.warp(s, 20, 11);
      }, id);
      await expect.poll(() => screenId(page)).toBe(id);
      await page.waitForTimeout(30);
    }
  }
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => window.__fimbul?.missingFrames())).toEqual([]);
});
