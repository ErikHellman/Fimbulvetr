import { expect, test } from '@playwright/test';

test('boots to the title screen without console errors, and a key opens its menu', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/');
  await expect(page.locator('body[data-title="press"]')).toBeAttached({ timeout: 15_000 });
  await expect(page.locator('#game canvas')).toBeVisible();
  await page.keyboard.press('Space');
  await expect(page.locator('body[data-title="main"]')).toBeAttached();
  expect(errors).toEqual([]);
});
