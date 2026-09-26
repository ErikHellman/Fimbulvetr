import { expect, test } from '@playwright/test';

test('boots to a canvas without console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/');
  await expect(page.locator('body[data-ready="true"]')).toBeAttached({ timeout: 15_000 });
  await expect(page.locator('#game canvas')).toBeVisible();
  expect(errors).toEqual([]);
});
