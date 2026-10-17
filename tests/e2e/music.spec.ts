import { expect, test } from '@playwright/test';
import { boot } from './helpers';

// WebKit's headless runner has no audio output to unlock, so the music is checked in Chromium.
test.skip(({ browserName }) => browserName !== 'chromium', 'Chromium only');

test('the title plays the main theme once a key unlocks sound', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.locator('body[data-title="press"]')).toBeAttached({ timeout: 15_000 });
  await page.keyboard.press('Space');
  await expect(page.locator('body[data-music="music_title"]')).toBeAttached({ timeout: 20_000 });
  expect(errors).toEqual([]);
});

test('the field plays its region theme, and the winter variant in winter', async ({ page }) => {
  await boot(page, 'nosave&screen=ask_field&time=12:00&season=summer');
  await page.keyboard.press('Shift');
  await expect(page.locator('body[data-music="music_askdalr"]')).toBeAttached({ timeout: 20_000 });
  await boot(page, 'nosave&screen=ask_field&time=12:00&season=winter');
  await page.keyboard.press('Shift');
  await expect(page.locator('body[data-music="music_askdalr_winter"]')).toBeAttached({ timeout: 20_000 });
});
