import { expect, test } from '@playwright/test';
import { collectErrors } from './helpers';

/**
 * The Android TV app: a fake `FimbulvetrHost` stands in for the native bridge. The game must read the
 * controller through it, hide file import and export, and ask the host to close on Back at the title.
 */
test('the TV host drives the title screen with its pad and exits on Back', async ({ page }) => {
  const errors = collectErrors(page);
  await page.addInitScript(() => {
    const w = window as unknown as { __pad: string; __exited: boolean; FimbulvetrHost: unknown };
    w.__pad = '0,0,0';
    w.__exited = false;
    w.FimbulvetrHost = {
      platform: () => 'androidtv',
      pad: () => w.__pad,
      exit: () => {
        w.__exited = true;
      },
    };
  });
  const setPad = (s: string) =>
    page.evaluate((v) => {
      (window as unknown as { __pad: string }).__pad = v;
    }, s);
  await page.goto('/?rolled=0');
  await expect(page.locator('body[data-title="press"]')).toBeAttached({ timeout: 20_000 });
  await setPad(`${1 << 0},0,0`); // A
  await expect(page.locator('body[data-title="main"]')).toBeAttached();
  await setPad('0,0,0');
  const rows = (await page.locator('body').getAttribute('data-title-rows'))?.split(',') ?? [];
  expect(rows).not.toContain('import');
  expect(rows).not.toContain('export');
  await page.keyboard.press('Escape'); // what the app turns the remote's Back into
  await page.waitForFunction(() => (window as unknown as { __exited: boolean }).__exited);
  expect(errors).toEqual([]);
});
