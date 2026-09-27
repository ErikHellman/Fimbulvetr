import type { Page } from '@playwright/test';

export function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

/**
 * Loads the game (optionally with a dev query string) and waits until the Play scene runs. Rolled weather
 * and spawn tables are pinned off (`rolled=0`) and the title screen skipped (`title=0`) unless the query
 * names them itself.
 */
export async function boot(page: Page, query = ''): Promise<void> {
  const extra = [/(^|&)rolled=/.test(query) ? '' : 'rolled=0', /(^|&)title=/.test(query) ? '' : 'title=0'];
  const q = [query, ...extra].filter((s) => s !== '').join('&');
  await page.goto(`/?${q}`);
  await page.waitForFunction(() => window.__fimbul?.ready === true, undefined, { timeout: 20_000 });
}

export const screenId = (page: Page): Promise<string | undefined> =>
  page.evaluate(() => window.__fimbul?.screenId());
export const clock = (page: Page) => page.evaluate(() => window.__fimbul?.clock());
export const hero = (page: Page) => page.evaluate(() => window.__fimbul?.hero());
export const eventCount = (page: Page, key: string): Promise<number> =>
  page.evaluate((k) => window.__fimbul?.eventCounts[k] ?? 0, key);

/** Holds a key until the hero has fully arrived on `screen`. */
export async function walkUntilScreen(page: Page, key: string, screen: string): Promise<void> {
  await page.keyboard.down(key);
  await page.waitForFunction(
    (s) => window.__fimbul?.screenId() === s && window.__fimbul.mode() === 'play',
    screen,
    { timeout: 15_000 },
  );
  await page.keyboard.up(key);
}
