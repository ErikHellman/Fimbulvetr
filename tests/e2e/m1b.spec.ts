import { expect, test, type Page } from '@playwright/test';
import { boot, collectErrors, hero, screenId } from './helpers';

const hook = <T>(page: Page, fn: () => T): Promise<T> => page.evaluate(fn);
const mode = (page: Page) => page.evaluate(() => window.__fimbul?.mode());

async function tap(page: Page, key: string): Promise<void> {
  await page.keyboard.down(key);
  await page.waitForTimeout(60);
  await page.keyboard.up(key);
  await page.waitForTimeout(60);
}

test('the raid night: storm, darkness, fire light and the dead in the yard', async ({ page }) => {
  const errors = collectErrors(page);
  await boot(page, 'nosave&mute&preset=raid');
  expect(await screenId(page)).toBe('ask_int_longhouse');
  await page.evaluate(() => {
    window.__fimbul?.warp('ask_farmyard', 9, 9);
  });
  await expect.poll(() => screenId(page)).toBe('ask_farmyard');
  await expect.poll(() => hook(page, () => window.__fimbul?.view().rain ?? 0)).toBeGreaterThan(20);
  const view = await hook(page, () => window.__fimbul?.view());
  expect(view?.dark).toBeGreaterThan(0.5);
  expect(view?.lights).toBeGreaterThan(10);
  const foes = await hook(page, () =>
    window.__fimbul
      ?.enemies()
      .map((e) => e.def)
      .sort(),
  );
  expect(foes).toEqual(['draugr', 'draugr', 'troll']);
  expect(await hook(page, () => window.__fimbul?.missingFrames())).toEqual([]);
  expect(errors).toEqual([]);
});

test('the pause menu stops the world and puts an item in a slot', async ({ page }) => {
  const errors = collectErrors(page);
  await boot(page, 'nosave&mute&preset=myr');
  expect(await hook(page, () => window.__fimbul?.slots())).toEqual(['lantern', null]);
  await tap(page, 'Tab');
  await expect.poll(() => hook(page, () => window.__fimbul?.menu()?.tab)).toBe('items');
  const minute = await hook(page, () => window.__fimbul?.clock().minute);
  await page.waitForTimeout(1500);
  expect(await hook(page, () => window.__fimbul?.clock().minute)).toBe(minute);
  await tap(page, 'KeyL');
  await expect.poll(() => hook(page, () => window.__fimbul?.slots())).toEqual([null, 'lantern']);
  await tap(page, 'ArrowRight');
  expect(await hook(page, () => window.__fimbul?.menu()?.tab)).toBe('map');
  await tap(page, 'Escape');
  await expect.poll(() => hook(page, () => window.__fimbul?.menu())).toBeNull();
  await expect.poll(() => hook(page, () => window.__fimbul?.clock().minute)).toBeGreaterThan(minute ?? 0);
  expect(errors).toEqual([]);
});

test('falling and rising again', async ({ page }) => {
  const errors = collectErrors(page);
  await boot(page, 'nosave&mute&preset=myr');
  await page.evaluate(() => {
    window.__fimbul?.setHp(0);
  });
  await expect.poll(() => mode(page)).toBe('over');
  // Continue is only accepted once the fall and a short pause have played (sim ticks, not wall time).
  for (let i = 0; i < 60 && (await mode(page)) === 'over'; i++) await tap(page, 'Enter');
  expect(await mode(page)).toBe('play');
  expect((await hero(page))?.hp).toBe(12);
  expect(errors).toEqual([]);
});

test('Myrkviðr: vargar by day, draugr only at night', async ({ page }) => {
  const errors = collectErrors(page);
  await boot(page, 'nosave&mute&preset=myr&screen=myr_deep&at=20,20&time=12:00');
  await expect.poll(() => hook(page, () => window.__fimbul?.enemies().map((e) => e.def))).toEqual(['vargr']);
  await boot(page, 'nosave&mute&preset=myr&screen=myr_deep&at=20,20&time=23:00');
  await expect
    .poll(() =>
      hook(page, () =>
        window.__fimbul
          ?.enemies()
          .map((e) => e.def)
          .sort(),
      ),
    )
    .toEqual(['draugr', 'vargr']);
  expect(await hook(page, () => window.__fimbul?.view().dark)).toBeGreaterThan(0.3);
  expect(await hook(page, () => window.__fimbul?.view().lights)).toBe(1);
  expect(errors).toEqual([]);
});
