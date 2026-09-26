import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { boot, collectErrors, screenId, walkUntilScreen } from './helpers';

test('the autosave made on entering a screen is resumed after a reload', async ({ page }) => {
  const errors = collectErrors(page);
  await boot(page, 'screen=test_a&at=37,11');
  await walkUntilScreen(page, 'KeyD', 'test_b');
  await page.evaluate(() => window.__fimbul?.flushSave());
  await boot(page);
  expect(await screenId(page)).toBe('test_b');
  expect(errors).toEqual([]);
});

test('a save exported from one session imports into another', async ({ page }) => {
  await boot(page, 'nosave&screen=test_b&at=20,11');
  const json = await page.evaluate(() => window.__fimbul?.exportSaveJson() ?? '');
  expect(JSON.parse(json)).toMatchObject({ format: 'fimbulvetr', v: 1 });
  await boot(page, 'nosave&screen=test_c&at=20,5');
  expect(await page.evaluate((text) => window.__fimbul?.importSaveJson(text), json)).toBe('import_ok');
  await expect.poll(() => screenId(page)).toBe('test_b');
});

test('importing something that is not a save changes nothing', async ({ page }) => {
  await boot(page, 'nosave&screen=test_c&at=20,5');
  expect(await page.evaluate(() => window.__fimbul?.importSaveJson('{"hello":"world"}'))).toBe(
    'import_bad_file',
  );
  expect(await page.evaluate(() => window.__fimbul?.importSaveJson('not json at all'))).toBe(
    'import_bad_file',
  );
  expect(await screenId(page)).toBe('test_c');
});

test('the save downloads as a JSON file', async ({ page }) => {
  await boot(page, 'nosave&screen=test_a&at=13,11');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.evaluate(() => {
      window.__fimbul?.downloadSave();
    }),
  ]);
  expect(download.suggestedFilename()).toMatch(/^fimbulvetr-auto-\d{4}-\d{2}-\d{2}\.json$/);
  const saved: unknown = JSON.parse(readFileSync(await download.path(), 'utf8'));
  expect(saved).toMatchObject({ format: 'fimbulvetr' });
});

test('a second tab is told the game is already open', async ({ page, context }) => {
  await boot(page, 'nosave&screen=test_a&at=13,11');
  const second = await context.newPage();
  await second.goto('/?nosave');
  await expect(second.locator('#msg')).toContainText(/already open|redan öppet/);
});
