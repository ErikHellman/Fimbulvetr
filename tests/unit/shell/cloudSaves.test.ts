import { createHash } from 'node:crypto';
import { IDBFactory as FakeIDBFactory } from 'fake-indexeddb';
import { describe, expect, it, vi } from 'vitest';
import { NEW_GAME } from '@content/start';
import { SCREEN_IDS } from '@content/world/screens';
import { newGame } from '@core/state/gameState';
import { makeSave } from '@core/state/save';
import {
  CLOUD_KEY,
  CloudSaves,
  PENDING_KEY,
  PUSH_DELAY_MS,
  RESULT_KEY,
  type CloudDeps,
} from '@shell/platform/cloud/cloudSaves';
import { DropboxClient, authorizeUrl } from '@shell/platform/cloud/dropbox';
import { GoogleDriveClient, googleAuthorizeUrl } from '@shell/platform/cloud/google';
import { CloudAuthError } from '@shell/platform/cloud/types';
import { challengeOf, randomToken } from '@shell/platform/cloud/pkce';
import { SaveService } from '@shell/platform/saveService';
import { SaveStore } from '@shell/platform/saveStore';

const known = new Set<string>(SCREEN_IDS);
const REDIRECT = 'https://game.example/oauth-callback.html';

/** Just enough of Dropbox: the token endpoint and the app folder's files. */
class FakeDropbox {
  files = new Map<string, string>();
  calls: string[] = [];
  access = 'a1';
  refreshes = 0;
  rejectRefresh = false;
  lastTokenForm: URLSearchParams | null = null;

  fetch = (url: string, init: RequestInit): Promise<Response> => {
    const path = new URL(url).pathname;
    this.calls.push(path);
    if (path === '/oauth2/token') {
      const form = init.body as URLSearchParams;
      this.lastTokenForm = form;
      if (form.get('grant_type') === 'refresh_token') {
        if (this.rejectRefresh)
          return Promise.resolve(new Response('{"error":"invalid_grant"}', { status: 400 }));
        this.refreshes++;
        this.access = `a${this.refreshes + 1}`;
        return Promise.resolve(Response.json({ access_token: this.access, expires_in: 14400 }));
      }
      return Promise.resolve(
        Response.json({ access_token: this.access, expires_in: 14400, refresh_token: 'r1' }),
      );
    }
    const headers = init.headers as Record<string, string>;
    if (headers['Authorization'] !== `Bearer ${this.access}`) {
      return Promise.resolve(new Response('expired', { status: 401 }));
    }
    const arg = JSON.parse(headers['Dropbox-API-Arg'] ?? '{}') as { path?: string };
    if (path === '/2/files/download') {
      const text = this.files.get(arg.path ?? '');
      return Promise.resolve(
        text === undefined
          ? new Response('{"error_summary":"path/not_found/"}', { status: 409 })
          : new Response(text),
      );
    }
    if (path === '/2/files/upload') {
      this.files.set(arg.path ?? '', init.body as string);
      return Promise.resolve(Response.json({}));
    }
    if (path === '/2/files/list_folder') {
      const entries = [...this.files.keys()].map((k) => ({ '.tag': 'file', name: k.slice(1) }));
      return Promise.resolve(Response.json({ entries, has_more: false }));
    }
    return Promise.resolve(new Response('null'));
  };
}

class MemoryStorage {
  readonly map = new Map<string, string>();
  getItem(k: string): string | null {
    return this.map.get(k) ?? null;
  }
  setItem(k: string, v: string): void {
    this.map.set(k, v);
  }
  removeItem(k: string): void {
    this.map.delete(k);
  }
}

async function setup(opts: { popup?: boolean; now?: number } = {}) {
  const store = await SaveStore.open(new FakeIDBFactory());
  const saves = new SaveService(store, 'test', known);
  const dropbox = new FakeDropbox();
  const storage = new MemoryStorage();
  const timers: (() => void)[] = [];
  const popup = { location: { href: '' }, close: vi.fn() };
  const navigate = vi.fn();
  let now = opts.now ?? 1_000_000;
  const deps: CloudDeps = {
    storage,
    http: { fetch: dropbox.fetch, now: () => now },
    saves,
    clientIds: { dropbox: 'key', google: 'gid' },
    redirectUri: REDIRECT,
    openPopup: () => (opts.popup === false ? null : popup),
    navigate,
    setTimer: (fn) => timers.push(fn),
    clearTimer: () => undefined,
  };
  const runTimers = (): void => {
    for (const fn of timers.splice(0)) fn();
  };
  const cloud = new CloudSaves(deps);
  return {
    store,
    saves,
    dropbox,
    storage,
    popup,
    navigate,
    cloud,
    deps,
    runTimers,
    advance: (ms: number) => (now += ms),
  };
}

/** What `oauth-callback.html` does after Dropbox redirects back. */
function landCallback(storage: MemoryStorage, params: Record<string, string>): void {
  const pending = JSON.parse(storage.getItem(PENDING_KEY) ?? '{}') as { state: string };
  const q = new URLSearchParams({ state: pending.state, ...params });
  storage.setItem(RESULT_KEY, JSON.stringify({ query: `?${q.toString()}` }));
}

async function connected() {
  const s = await setup();
  const result = s.cloud.connect('dropbox');
  await vi.waitFor(() => {
    expect(s.popup.location.href).not.toBe('');
  });
  landCallback(s.storage, { code: 'c1' });
  s.runTimers();
  expect(await result).toBe('connected');
  return s;
}

const save = (hp: number, savedAt: string) => {
  const game = newGame(1, NEW_GAME);
  game.hero.hp = hp;
  return makeSave(game, 'test', savedAt);
};

describe('PKCE and the authorize URL', () => {
  it('builds the S256 challenge: the base64url SHA-256 of the verifier', async () => {
    const verifier = 'dBjftJeZ4CVP-mJ92K9qPPpBnyePBqmRQK4I2nUx8L0';
    expect(await challengeOf(verifier)).toBe(createHash('sha256').update(verifier).digest('base64url'));
    expect(randomToken()).toMatch(/^[\w-]{43}$/);
  });

  it('asks for a code with PKCE and offline access', () => {
    const url = new URL(authorizeUrl('key', REDIRECT, 'ch', 'st'));
    expect(url.origin + url.pathname).toBe('https://www.dropbox.com/oauth2/authorize');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      client_id: 'key',
      response_type: 'code',
      redirect_uri: REDIRECT,
      code_challenge: 'ch',
      code_challenge_method: 'S256',
      token_access_type: 'offline',
      state: 'st',
    });
  });
});

describe('CloudSaves sign-in', () => {
  it('starts off, signs in through the popup and keeps the tokens', async () => {
    const s = await connected();
    expect(s.cloud.status).toBe('on');
    expect(s.dropbox.lastTokenForm?.get('code_verifier')).toMatch(/^[\w-]{43}$/);
    expect(s.dropbox.lastTokenForm?.get('client_secret')).toBeNull();
    expect(JSON.parse(s.storage.getItem(CLOUD_KEY) ?? '{}')).toMatchObject({
      provider: 'dropbox',
      tokens: { access: 'a1', refresh: 'r1' },
    });
    expect(s.storage.getItem(PENDING_KEY)).toBeNull();
    expect(new CloudSaves(s.deps).status).toBe('on');
  });

  it('reports a refusal and a cancelled wait', async () => {
    const s = await setup();
    const denied = s.cloud.connect('dropbox');
    await vi.waitFor(() => {
      expect(s.popup.location.href).not.toBe('');
    });
    landCallback(s.storage, { error: 'access_denied' });
    s.runTimers();
    expect(await denied).toBe('denied');
    s.popup.location.href = '';
    const cancelled = s.cloud.connect('dropbox');
    await vi.waitFor(() => {
      expect(s.popup.location.href).not.toBe('');
    });
    s.cloud.cancel();
    expect(await cancelled).toBe('cancelled');
    expect(s.popup.close).toHaveBeenCalled();
    expect(s.cloud.status).toBe('off');
  });

  it('ignores a callback whose state does not match', async () => {
    const s = await setup();
    const result = s.cloud.connect('dropbox');
    await vi.waitFor(() => {
      expect(s.popup.location.href).not.toBe('');
    });
    s.storage.setItem(RESULT_KEY, JSON.stringify({ query: '?state=forged&code=evil' }));
    s.runTimers();
    s.cloud.cancel();
    expect(await result).toBe('cancelled');
    expect(s.dropbox.calls).toEqual([]);
  });

  it('falls back to a full-tab redirect when popups are blocked, and finishes on the next start', async () => {
    const s = await setup({ popup: false });
    expect(await s.cloud.connect('dropbox')).toBe('redirected');
    expect(s.navigate.mock.calls[0]?.[0]).toMatch(/^https:\/\/www\.dropbox\.com\/oauth2\/authorize\?/);
    landCallback(s.storage, { code: 'c1' });
    const next = new CloudSaves(s.deps);
    expect(await next.resume()).toBe('connected');
    expect(next.status).toBe('on');
    expect(await next.resume()).toBeNull();
  });
});

describe('CloudSaves sync', () => {
  it('sends local saves the cloud lacks and fetches newer cloud saves', async () => {
    const s = await connected();
    await s.store.writeSlot('s1', save(8, '2026-10-25T10:00:00.000Z'));
    await s.store.writeAuto(save(4, '2026-10-25T09:00:00.000Z'));
    s.dropbox.files.set('/auto.json', JSON.stringify(save(12, '2026-10-25T11:00:00.000Z')));
    expect(await s.cloud.sync()).toEqual({ pulled: 1, pushed: 1 });
    expect(JSON.parse(s.dropbox.files.get('/s1.json') ?? '{}')).toMatchObject({ state: { hero: { hp: 8 } } });
    expect((await s.saves.loadAuto())?.hero.hp).toBe(12);
    // The autosave it replaced is kept as the backup.
    expect((await s.saves.loadSlot('auto_prev'))?.hero.hp).toBe(4);
    expect(await s.cloud.sync()).toEqual({ pulled: 0, pushed: 0 });
  });

  it('never fetches a cloud file that is not a usable save', async () => {
    const s = await connected();
    s.dropbox.files.set(
      '/s2.json',
      '{"format":"fimbulvetr","v":1,"savedAt":"2030-01-01T00:00:00Z","state":{}}',
    );
    s.dropbox.files.set('/s3.json', 'not json');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(await s.cloud.sync()).toEqual({ pulled: 0, pushed: 0 });
    warn.mockRestore();
    expect(await s.saves.loadSlot('s2')).toBeNull();
  });

  it('refreshes an expired access token and stores the new one', async () => {
    const s = await connected();
    s.advance(5 * 3600_000);
    await s.cloud.sync();
    expect(s.dropbox.refreshes).toBe(1);
    expect(JSON.parse(s.storage.getItem(CLOUD_KEY) ?? '{}')).toMatchObject({ tokens: { access: 'a2' } });
  });

  it('asks to reconnect when Dropbox rejects the refresh token', async () => {
    const s = await connected();
    s.dropbox.rejectRefresh = true;
    s.advance(5 * 3600_000);
    await expect(s.cloud.sync()).rejects.toBeInstanceOf(CloudAuthError);
    expect(s.cloud.status).toBe('reconnect');
    expect(new CloudSaves(s.deps).status).toBe('reconnect');
  });
});

describe('CloudSaves pushes', () => {
  it('sends a manual save at once and the autosave after a minute', async () => {
    const s = await connected();
    s.saves.onWrite = (slot, data) => {
      s.cloud.noteWrite(slot, data);
    };
    await s.saves.writeSlot('s3', newGame(1, NEW_GAME));
    await vi.waitFor(() => {
      expect(s.dropbox.files.has('/s3.json')).toBe(true);
    });
    await s.saves.autosaver.flush();
    s.saves.autosaver.request(newGame(2, NEW_GAME));
    await s.saves.autosaver.flush();
    expect(s.dropbox.files.has('/auto.json')).toBe(false);
    expect(PUSH_DELAY_MS).toBe(60_000);
    s.runTimers();
    await vi.waitFor(() => {
      expect(s.dropbox.files.has('/auto.json')).toBe(true);
    });
  });

  it('keeps a save queued when sending fails and sends it on the next flush', async () => {
    const s = await connected();
    const realFetch = s.dropbox.fetch;
    s.deps.http.fetch = () => Promise.reject(new TypeError('offline'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    s.cloud.noteWrite('s1', save(8, '2026-10-25T10:00:00.000Z'));
    await s.cloud.flush();
    warn.mockRestore();
    s.deps.http.fetch = realFetch;
    await s.cloud.flush();
    expect(s.dropbox.files.has('/s1.json')).toBe(true);
  });

  it('forgets the sign-in on disconnect and revokes the token', async () => {
    const s = await connected();
    await s.cloud.disconnect();
    expect(s.cloud.status).toBe('off');
    expect(s.storage.getItem(CLOUD_KEY)).toBeNull();
    expect(s.dropbox.calls).toContain('/2/auth/token/revoke');
    s.cloud.noteWrite('s1', save(8, '2026-10-25T10:00:00.000Z'));
    await s.cloud.flush();
    expect(s.dropbox.files.size).toBe(0);
  });
});

/** Just enough of Drive's appDataFolder: list, download, create and update. */
class FakeDrive {
  files = new Map<string, { name: string; text: string }>();
  revoked = false;
  next = 1;

  fetch = (url: string, init: RequestInit): Promise<Response> => Promise.resolve(this.answer(url, init));

  private answer(url: string, init: RequestInit): Response {
    const u = new URL(url);
    if (u.host === 'oauth2.googleapis.com') {
      this.revoked = true;
      return new Response('');
    }
    const auth = (init.headers as Record<string, string>)['Authorization'];
    if (auth !== 'Bearer g1') return new Response('', { status: 401 });
    const id = u.pathname.split('/').at(-1);
    if (u.pathname === '/drive/v3/files') {
      expect(u.searchParams.get('spaces')).toBe('appDataFolder');
      return Response.json({ files: [...this.files].map(([i, f]) => ({ id: i, name: f.name })) });
    }
    if (u.pathname.startsWith('/drive/v3/files/') && id !== undefined) {
      const f = this.files.get(id);
      return f === undefined ? new Response('', { status: 404 }) : new Response(f.text);
    }
    if (u.pathname === '/upload/drive/v3/files' && init.method === 'POST') {
      const body = init.body as string;
      const parts = body.split('\r\n');
      const meta = JSON.parse(parts[3] ?? '{}') as { name: string; parents: string[] };
      expect(meta.parents).toEqual(['appDataFolder']);
      const newId = `f${this.next++}`;
      this.files.set(newId, { name: meta.name, text: parts[7] ?? '' });
      return Response.json({ id: newId });
    }
    if (u.pathname.startsWith('/upload/drive/v3/files/') && id !== undefined && init.method === 'PATCH') {
      const f = this.files.get(id);
      if (f === undefined) return new Response('', { status: 404 });
      f.text = init.body as string;
      return Response.json({ id });
    }
    return new Response('', { status: 400 });
  }

  textOf(name: string): string | undefined {
    return [...this.files.values()].find((f) => f.name === name)?.text;
  }
}

describe('Google Drive', () => {
  it('asks for the token flow with only the hidden app-data scope', () => {
    const url = new URL(googleAuthorizeUrl('gid', REDIRECT, 'st'));
    expect(url.origin + url.pathname).toBe('https://accounts.google.com/o/oauth2/v2/auth');
    expect(url.searchParams.get('response_type')).toBe('token');
    expect(url.searchParams.get('scope')).toBe('https://www.googleapis.com/auth/drive.appdata');
    expect(url.searchParams.get('redirect_uri')).toBe(REDIRECT);
  });

  it('signs in from the fragment, creates and then updates files, and asks again after the hour', async () => {
    const s = await setup();
    const drive = new FakeDrive();
    s.deps.http.fetch = drive.fetch;
    const result = s.cloud.connect('google');
    await vi.waitFor(() => {
      expect(s.popup.location.href).toMatch(/^https:\/\/accounts\.google\.com\//);
    });
    landCallback(s.storage, { access_token: 'g1', expires_in: '3599', token_type: 'Bearer' });
    s.runTimers();
    expect(await result).toBe('connected');
    expect(s.cloud.provider).toBe('google');
    await s.store.writeSlot('s1', save(8, '2026-10-25T10:00:00.000Z'));
    expect(await s.cloud.sync()).toEqual({ pulled: 0, pushed: 1 });
    await s.store.writeSlot('s1', save(9, '2026-10-25T11:00:00.000Z'));
    expect(await s.cloud.sync()).toEqual({ pulled: 0, pushed: 1 });
    expect(drive.files.size).toBe(1);
    expect(JSON.parse(drive.textOf('s1.json') ?? '{}')).toMatchObject({ state: { hero: { hp: 9 } } });
    s.advance(3600_000);
    await expect(s.cloud.sync()).rejects.toBeInstanceOf(CloudAuthError);
    expect(s.cloud.status).toBe('reconnect');
    expect(s.cloud.provider).toBe('google');
  });

  it('reads a cloud save back by name', async () => {
    const drive = new FakeDrive();
    drive.files.set('x', { name: 'auto.json', text: '{"a":1}' });
    const client = new GoogleDriveClient(
      { fetch: drive.fetch, now: () => 0 },
      {
        access: 'g1',
        refresh: '',
        expiresAt: 10 ** 12,
      },
    );
    expect(await client.list()).toEqual(['auto.json']);
    expect(await client.read('auto.json')).toBe('{"a":1}');
    expect(await client.read('s1.json')).toBeNull();
    await client.revoke();
    expect(drive.revoked).toBe(true);
  });
});

describe('DropboxClient', () => {
  it('reads a missing file as null', async () => {
    const dropbox = new FakeDropbox();
    const client = new DropboxClient(
      { fetch: dropbox.fetch, now: () => 0 },
      'key',
      {
        access: 'a1',
        refresh: 'r1',
        expiresAt: 10 ** 12,
      },
      () => undefined,
    );
    expect(await client.read('nope.json')).toBeNull();
  });
});
