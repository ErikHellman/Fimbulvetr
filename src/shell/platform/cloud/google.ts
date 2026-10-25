import { CloudAuthError, type CloudFiles, type CloudTokens, type HttpDeps } from './types';

/**
 * Google Drive over plain fetch. A browser-only client gets no refresh token from Google (its token endpoint
 * wants the client secret even with PKCE), so sign-in is the OAuth token flow in a popup: an access token
 * for an hour, after which the player connects again. The `drive.appdata` scope is a hidden folder only this
 * game can see; it is a non-sensitive scope, so Google asks for no security review.
 */

export const GOOGLE_AUTHORIZE = 'https://accounts.google.com/o/oauth2/v2/auth';
export const GOOGLE_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
const FILES = 'https://www.googleapis.com/drive/v3/files';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files';
const REVOKE = 'https://oauth2.googleapis.com/revoke';

/** Stop a little early so a slow request does not run past the expiry. */
const EARLY_MS = 60_000;

export function googleAuthorizeUrl(clientId: string, redirectUri: string, state: string): string {
  const q = new URLSearchParams({
    client_id: clientId,
    response_type: 'token',
    redirect_uri: redirectUri,
    scope: GOOGLE_SCOPE,
    include_granted_scopes: 'true',
    state,
  });
  return `${GOOGLE_AUTHORIZE}?${q.toString()}`;
}

/** The tokens from the redirect's fragment, or null when it carries none. */
export function googleTokens(params: URLSearchParams, now: number): CloudTokens | null {
  const access = params.get('access_token');
  const expiresIn = Number(params.get('expires_in'));
  if (access === null || !Number.isFinite(expiresIn) || expiresIn <= 0) return null;
  return { access, expiresAt: now + expiresIn * 1000, refresh: '' };
}

export class GoogleDriveClient implements CloudFiles {
  /** File ids by name, from the last listing. */
  private ids: Map<string, string> | null = null;

  constructor(
    private readonly deps: HttpDeps,
    private readonly tokens: CloudTokens,
  ) {}

  async list(): Promise<string[]> {
    const q = new URLSearchParams({ spaces: 'appDataFolder', fields: 'files(id,name)', pageSize: '100' });
    const res = await this.call(`${FILES}?${q.toString()}`, { method: 'GET' });
    if (!res.ok) throw new Error(`list: HTTP ${res.status}`);
    const r = (await res.json()) as { files?: { id?: unknown; name?: unknown }[] };
    this.ids = new Map();
    for (const f of r.files ?? []) {
      if (typeof f.id === 'string' && typeof f.name === 'string' && !this.ids.has(f.name)) {
        this.ids.set(f.name, f.id);
      }
    }
    return [...this.ids.keys()];
  }

  async read(name: string): Promise<string | null> {
    const id = (await this.idsNow()).get(name);
    if (id === undefined) return null;
    const res = await this.call(`${FILES}/${encodeURIComponent(id)}?alt=media`, { method: 'GET' });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`download ${name}: HTTP ${res.status}`);
    return res.text();
  }

  async write(name: string, text: string): Promise<void> {
    const ids = await this.idsNow();
    const id = ids.get(name);
    if (id !== undefined) {
      const res = await this.call(`${UPLOAD}/${encodeURIComponent(id)}?uploadType=media`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: text,
      });
      if (res.ok) return;
      if (res.status !== 404) throw new Error(`upload ${name}: HTTP ${res.status}`);
      ids.delete(name);
    }
    const boundary = 'fimbulvetr-save';
    const body = [
      `--${boundary}`,
      'Content-Type: application/json; charset=UTF-8',
      '',
      JSON.stringify({ name, parents: ['appDataFolder'] }),
      `--${boundary}`,
      'Content-Type: application/json',
      '',
      text,
      `--${boundary}--`,
      '',
    ].join('\r\n');
    const res = await this.call(`${UPLOAD}?uploadType=multipart&fields=id`, {
      method: 'POST',
      headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
      body,
    });
    if (!res.ok) throw new Error(`upload ${name}: HTTP ${res.status}`);
    const r = (await res.json()) as { id?: unknown };
    if (typeof r.id === 'string') ids.set(name, r.id);
  }

  /** Withdraws the game's access. The files stay in the hidden app folder. */
  async revoke(): Promise<void> {
    await this.deps.fetch(REVOKE, {
      method: 'POST',
      body: new URLSearchParams({ token: this.tokens.access }),
    });
  }

  private async idsNow(): Promise<Map<string, string>> {
    if (this.ids === null) await this.list();
    return this.ids ?? new Map<string, string>();
  }

  private async call(
    url: string,
    init: { method: string; headers?: Record<string, string>; body?: string },
  ): Promise<Response> {
    if (this.deps.now() > this.tokens.expiresAt - EARLY_MS) throw new CloudAuthError('the hour is up');
    const res = await this.deps.fetch(url, {
      method: init.method,
      headers: { ...init.headers, Authorization: `Bearer ${this.tokens.access}` },
      ...(init.body === undefined ? {} : { body: init.body }),
    });
    if (res.status === 401) throw new CloudAuthError('Google refused the token');
    return res;
  }
}
