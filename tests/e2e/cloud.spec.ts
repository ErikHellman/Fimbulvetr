import { expect, test } from '@playwright/test';
import { boot, collectErrors, tap } from './helpers';

/** Cloud saves: connecting Dropbox through the popup, with Dropbox itself stood in for by routes. */

test('connects Dropbox in a popup and syncs from the title screen', async ({ page, context }) => {
  const errors = collectErrors(page);
  const uploads: string[] = [];
  let authorize: URL | null = null;
  await context.route('https://www.dropbox.com/oauth2/authorize**', async (route) => {
    authorize = new URL(route.request().url());
    const back = new URL(authorize.searchParams.get('redirect_uri') ?? '');
    back.searchParams.set('code', 'test-code');
    back.searchParams.set('state', authorize.searchParams.get('state') ?? '');
    await route.fulfill({ status: 302, headers: { location: back.href } });
  });
  await context.route('https://api.dropboxapi.com/**', (route) => {
    const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' };
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    const listing = route.request().url().endsWith('/list_folder');
    return route.fulfill({
      headers: cors,
      json: listing
        ? { entries: [], has_more: false }
        : { access_token: 'at', expires_in: 14400, refresh_token: 'rt' },
    });
  });
  await context.route('https://content.dropboxapi.com/**', async (route) => {
    const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' };
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    if (route.request().url().endsWith('/upload')) {
      uploads.push(route.request().headers()['dropbox-api-arg'] ?? '');
      return route.fulfill({ headers: cors, json: {} });
    }
    return route.fulfill({ status: 409, headers: cors, json: { error_summary: 'path/not_found/' } });
  });

  await page.goto('/?title=1&rolled=0');
  await expect(page.locator('body[data-title="press"]')).toBeAttached({ timeout: 20_000 });
  await tap(page, 'Space');
  await expect(page.locator('body[data-title="main"]')).toBeAttached();
  const rows = (await page.locator('body').getAttribute('data-title-rows'))?.split(',') ?? [];
  expect(rows).toContain('cloud');
  for (let i = 0; i < rows.indexOf('cloud'); i++) await tap(page, 'ArrowDown');
  await tap(page, 'Enter');
  await expect(page.locator('body[data-title="cloud"]')).toBeAttached();

  const popup = page.waitForEvent('popup');
  await tap(page, 'Enter');
  await popup;
  await page.waitForFunction(() => localStorage.getItem('fimbulvetr.cloud.v1') !== null);
  const stored: unknown = JSON.parse(
    (await page.evaluate(() => localStorage.getItem('fimbulvetr.cloud.v1'))) ?? '{}',
  );
  expect(stored).toMatchObject({ provider: 'dropbox', tokens: { access: 'at', refresh: 'rt' } });
  const asked = authorize as URL | null;
  expect(asked?.searchParams.get('code_challenge_method')).toBe('S256');
  expect(asked?.searchParams.get('redirect_uri')).toMatch(/\/oauth-callback\.html$/);
  // The first sync finds nothing in Dropbox and nothing here to send.
  await expect.poll(() => page.evaluate(() => document.body.dataset.title)).toBe('cloud');
  expect(uploads).toEqual([]);
  expect(errors).toEqual([]);
});

test('connects Google Drive through the token flow and sends a save', async ({ page, context }) => {
  const errors = collectErrors(page);
  const created: string[] = [];
  await context.route('https://accounts.google.com/o/oauth2/v2/auth**', async (route) => {
    const asked = new URL(route.request().url());
    expect(asked.searchParams.get('scope')).toBe('https://www.googleapis.com/auth/drive.appdata');
    const back = new URL(asked.searchParams.get('redirect_uri') ?? '');
    back.hash = new URLSearchParams({
      access_token: 'gt',
      expires_in: '3599',
      token_type: 'Bearer',
      state: asked.searchParams.get('state') ?? '',
    }).toString();
    await route.fulfill({ status: 302, headers: { location: back.href } });
  });
  await context.route('https://www.googleapis.com/**', async (route) => {
    const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' };
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    if (route.request().url().includes('/upload/')) {
      created.push(route.request().url());
      return route.fulfill({ headers: cors, json: { id: 'f1' } });
    }
    return route.fulfill({ headers: cors, json: { files: [] } });
  });

  // An autosave to send: start a game, then go back to the title screen.
  await boot(page);
  await page.evaluate(() => window.__fimbul?.flushSave());
  await page.goto('/?title=1&rolled=0');
  await expect(page.locator('body[data-title="press"]')).toBeAttached({ timeout: 20_000 });
  await tap(page, 'Space');
  // The rows settle once the slots are read: wait for Continue.
  await page.waitForFunction(() => document.body.dataset.titleRows?.split(',').includes('continue'));
  const rows = (await page.locator('body').getAttribute('data-title-rows'))?.split(',') ?? [];
  for (let i = 0; i < rows.indexOf('cloud'); i++) await tap(page, 'ArrowDown');
  await tap(page, 'Enter');
  await expect(page.locator('body[data-title="cloud"]')).toBeAttached();
  await tap(page, 'ArrowDown');
  const popup = page.waitForEvent('popup');
  await tap(page, 'Enter');
  await popup;
  await page.waitForFunction(() => localStorage.getItem('fimbulvetr.cloud.v1') !== null);
  expect(
    JSON.parse((await page.evaluate(() => localStorage.getItem('fimbulvetr.cloud.v1'))) ?? '{}'),
  ).toMatchObject({ provider: 'google', tokens: { access: 'gt' } });
  // The sync after signing in finds the cloud empty and sends the autosave.
  await expect.poll(() => created.length).toBe(1);
  expect(errors).toEqual([]);
});
