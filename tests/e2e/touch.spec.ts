import { expect, test, type Page } from '@playwright/test';
import { boot, collectErrors, eventCount, hero } from './helpers';

// A phone held sideways. `touch=1` shows the controls even where the browser reports a mouse.
test.use({ viewport: { width: 844, height: 390 }, hasTouch: true });

/**
 * Touch pointer events, dispatched on the page the way a finger's are. Playwright's touchscreen can only
 * tap, and holding a button or dragging the stick needs separate down, move and up.
 */
const finger = (
  page: Page,
  type: 'pointerdown' | 'pointermove' | 'pointerup',
  id: number,
  x: number,
  y: number,
) =>
  page.evaluate(
    ([t, i, cx, cy]) => {
      const init = {
        pointerId: i,
        pointerType: 'touch',
        clientX: cx,
        clientY: cy,
        bubbles: true,
        isPrimary: i === 1,
      };
      document.body.dispatchEvent(new PointerEvent(t, init));
    },
    [type, id, x, y] as const,
  );

/** The centre of the on-screen button labelled `label`, in CSS pixels. */
async function button(page: Page, label: string): Promise<{ x: number; y: number }> {
  const box = await page.locator('#touch .tb', { hasText: new RegExp(`^${label}$`) }).boundingBox();
  if (box === null) throw new Error(`no ${label} button`);
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

async function press(page: Page, label: string): Promise<void> {
  const { x, y } = await button(page, label);
  await finger(page, 'pointerdown', 2, x, y);
  await page.waitForTimeout(80);
  await finger(page, 'pointerup', 2, x, y);
}

/** A tap at a point of the 640×360 game, through the canvas's place on the page. */
async function tapGame(page: Page, gx: number, gy: number): Promise<void> {
  const box = await page.locator('#game canvas').boundingBox();
  if (box === null) throw new Error('no canvas');
  const x = box.x + (gx * box.width) / 640;
  const y = box.y + (gy * box.height) / 360;
  await finger(page, 'pointerdown', 3, x, y);
  await finger(page, 'pointerup', 3, x, y);
}

test('touch: the stick walks, the buttons fight, and the pause menu answers taps', async ({ page }) => {
  test.setTimeout(60_000);
  const errors = collectErrors(page);
  await boot(page, 'preset=m0&screen=test_a&at=13,11&touch=1');
  await expect(page.locator('#touch')).toBeVisible();
  await expect(page.locator('#touch .tb', { hasText: /^Sword$/ })).toBeVisible();

  // The stick starts where the thumb lands and walks Ask right while it is pushed.
  const x0 = (await hero(page))?.x ?? 0;
  await finger(page, 'pointerdown', 1, 150, 300);
  await finger(page, 'pointermove', 1, 210, 300);
  await expect.poll(async () => (await hero(page))?.x ?? 0, { timeout: 20_000 }).toBeGreaterThan(x0 + 20);
  await finger(page, 'pointerup', 1, 210, 300);
  const stopped = (await hero(page))?.x ?? 0;
  await page.waitForTimeout(200);
  expect(Math.abs(((await hero(page))?.x ?? 0) - stopped)).toBeLessThan(4);

  await press(page, 'Sword');
  await expect.poll(() => eventCount(page, 'sfx_swing')).toBeGreaterThan(0);

  // Menu opens the pause menu; tapping a tab goes there; Back closes it.
  await press(page, 'Menu');
  await expect.poll(() => page.evaluate(() => window.__fimbul?.menu()?.tab)).toBe('items');
  await expect(page.locator('#touch .tb', { hasText: /^Back$/ })).toBeVisible();
  await expect(page.locator('#touch .tb', { hasText: /^Sword$/ })).toHaveCount(0);
  await press(page, '→');
  await expect.poll(() => page.evaluate(() => window.__fimbul?.menu()?.tab)).toBe('gear');
  await press(page, 'Back');
  await expect.poll(() => page.evaluate(() => window.__fimbul?.menu())).toBeNull();

  expect(errors).toEqual([]);
});

test('touch: the title screen starts with a tap and its lines answer taps', async ({ page }) => {
  test.setTimeout(60_000);
  const errors = collectErrors(page);
  await page.goto('/?title=1&nosave&touch=1');
  await page.waitForFunction(() => document.body.dataset.title === 'press', undefined, { timeout: 20_000 });
  await expect(page.locator('#game canvas')).toBeVisible();
  await tapGame(page, 320, 180);
  await expect.poll(() => page.evaluate(() => document.body.dataset.title)).toBe('main');
  // With no saves the rows are New game, Import, Settings, Achievements, from y 150 at 12 px a line.
  const rows = await page.evaluate(() => document.body.dataset.titleRows);
  const settings = (rows ?? '').split(',').indexOf('settings');
  expect(settings).toBeGreaterThan(0);
  // The first tap moves the cursor there (a few frames of presses), the second takes the line.
  await tapGame(page, 320, 150 + settings * 12 + 6);
  await page.waitForTimeout(400);
  await tapGame(page, 320, 150 + settings * 12 + 6);
  await expect.poll(() => page.evaluate(() => document.body.dataset.title)).toBe('settings');
  await press(page, 'Back');
  await expect.poll(() => page.evaluate(() => document.body.dataset.title)).toBe('main');
  expect(errors).toEqual([]);
});
