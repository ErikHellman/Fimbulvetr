import { test } from '@playwright/test';
import { boot } from './helpers';

test.skip(
  ({ browserName }) => browserName !== 'chromium',
  'the offline service-worker check runs on Chromium',
);

test('keeps working offline after the first visit', async ({ page, context }) => {
  await boot(page, 'nosave');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await context.setOffline(true);
  await page.reload();
  await page.waitForFunction(() => window.__fimbul?.ready === true, undefined, { timeout: 20_000 });
});
