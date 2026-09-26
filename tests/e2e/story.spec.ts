import { expect, test } from '@playwright/test';
import { boot, collectErrors, screenId } from './helpers';

const story = (page: import('@playwright/test').Page) =>
  page.evaluate(() => window.__fimbul?.story() ?? null);

async function tap(page: import('@playwright/test').Page, key: string): Promise<void> {
  await page.keyboard.down(key);
  await page.waitForTimeout(60);
  await page.keyboard.up(key);
  await page.waitForTimeout(60);
}

/** Walks into whatever is ahead long enough to face it. */
async function walk(page: import('@playwright/test').Page, key: string): Promise<void> {
  await page.keyboard.down(key);
  await page.waitForTimeout(250);
  await page.keyboard.up(key);
  await page.waitForTimeout(100);
}

test('a sign opens a text box that closes on confirm', async ({ page }) => {
  const errors = collectErrors(page);
  await boot(page, 'nosave&preset=m0&screen=test_b&at=22,13');
  await walk(page, 'KeyW');
  await tap(page, 'KeyE');
  await expect.poll(() => story(page).then((s) => s?.k)).toBe('text');
  expect((await story(page))?.text).toContain('hut door');
  await tap(page, 'Enter');
  await tap(page, 'Enter');
  await expect.poll(() => story(page)).toBeNull();
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => window.__fimbul?.missingFrames())).toEqual([]);
});

test('a door fades into the hut and back out', async ({ page }) => {
  const errors = collectErrors(page);
  await boot(page, 'nosave&preset=m0&screen=test_b&at=26,15');
  await page.keyboard.down('KeyW');
  await expect.poll(() => screenId(page), { timeout: 10_000 }).toBe('test_int');
  await page.keyboard.up('KeyW');
  await page.keyboard.down('KeyS');
  await expect.poll(() => screenId(page), { timeout: 10_000 }).toBe('test_b');
  await page.keyboard.up('KeyS');
  expect(errors).toEqual([]);
});

test('the stall sells a lantern', async ({ page }) => {
  await boot(page, 'nosave&preset=m0&screen=test_int&at=25,8');
  await walk(page, 'KeyW');
  await tap(page, 'KeyE');
  await expect.poll(() => story(page).then((s) => s?.k)).toBe('text');
  await tap(page, 'Enter');
  await tap(page, 'Enter');
  await expect.poll(() => story(page).then((s) => s?.k)).toBe('shop');
  await tap(page, 'Enter');
  expect(await page.evaluate(() => window.__fimbul?.items().lantern)).toBeUndefined();
  await tap(page, 'Escape');
  await expect.poll(() => story(page)).toBeNull();
});

test('pots can be lifted and thrown', async ({ page }) => {
  await boot(page, 'nosave&preset=m0&screen=test_b&at=30,15');
  await walk(page, 'KeyW');
  await tap(page, 'KeyE');
  await expect.poll(() => page.evaluate(() => window.__fimbul?.hero().fsm)).toBe('carry');
  await page.keyboard.down('KeyS');
  await tap(page, 'KeyE');
  await page.keyboard.up('KeyS');
  await expect
    .poll(() => page.evaluate(() => window.__fimbul?.actors().filter((a) => a.def === 'pot').length))
    .toBe(1);
});
