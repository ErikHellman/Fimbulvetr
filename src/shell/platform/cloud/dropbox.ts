/**
 * Dropbox over plain fetch: OAuth 2 code flow with PKCE (no client secret, so it runs in the browser) and the
 * three file calls cloud saves need. The app has "App folder" access, so paths are relative to
 * `Apps/<app name>/` in the player's Dropbox and it can see nothing else.
 */

import { CloudAuthError, type CloudFiles, type CloudTokens, type HttpDeps } from './types';

export const DROPBOX_AUTHORIZE = 'https://www.dropbox.com/oauth2/authorize';
const TOKEN = 'https://api.dropboxapi.com/oauth2/token';
const API = 'https://api.dropboxapi.com/2';
const CONTENT = 'https://content.dropboxapi.com/2';

/** Refresh a little early so a slow request does not run past the expiry. */
const EARLY_MS = 60_000;

export function authorizeUrl(appKey: string, redirectUri: string, challenge: string, state: string): string {
  const q = new URLSearchParams({
    client_id: appKey,
    response_type: 'code',
    redirect_uri: redirectUri,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    token_access_type: 'offline',
    state,
  });
  return `${DROPBOX_AUTHORIZE}?${q.toString()}`;
}

interface TokenReply {
  readonly access_token?: unknown;
  readonly expires_in?: unknown;
  readonly refresh_token?: unknown;
}

async function tokenCall(
  deps: HttpDeps,
  form: Record<string, string>,
  refresh?: string,
): Promise<CloudTokens> {
  const res = await deps.fetch(TOKEN, { method: 'POST', body: new URLSearchParams(form) });
  if (res.status === 400 || res.status === 401) throw new CloudAuthError(`token: ${await res.text()}`);
  if (!res.ok) throw new Error(`token: HTTP ${res.status}`);
  const r = (await res.json()) as TokenReply;
  const newRefresh = typeof r.refresh_token === 'string' ? r.refresh_token : refresh;
  if (typeof r.access_token !== 'string' || typeof r.expires_in !== 'number' || newRefresh === undefined) {
    throw new Error('token: unexpected reply');
  }
  return { access: r.access_token, expiresAt: deps.now() + r.expires_in * 1000, refresh: newRefresh };
}

/** Trades the code from the redirect for tokens. */
export function exchangeCode(
  deps: HttpDeps,
  appKey: string,
  redirectUri: string,
  code: string,
  verifier: string,
): Promise<CloudTokens> {
  return tokenCall(deps, {
    grant_type: 'authorization_code',
    code,
    client_id: appKey,
    redirect_uri: redirectUri,
    code_verifier: verifier,
  });
}

export class DropboxClient implements CloudFiles {
  constructor(
    private readonly deps: HttpDeps,
    private readonly appKey: string,
    private tokens: CloudTokens,
    /** Called with every refreshed token so the caller can store it. */
    private readonly onTokens: (tokens: CloudTokens) => void,
  ) {}

  /** The names of the files in the app folder (a save is never more than a handful). */
  async list(): Promise<string[]> {
    const res = await this.call(`${API}/files/list_folder`, {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: '' }),
    });
    if (!res.ok) throw new Error(`list: HTTP ${res.status}`);
    const r = (await res.json()) as { entries?: { name?: unknown; '.tag'?: unknown }[] };
    return (r.entries ?? []).flatMap((e) =>
      e['.tag'] === 'file' && typeof e.name === 'string' ? [e.name] : [],
    );
  }

  /** A file's text, or null when it does not exist. */
  async read(name: string): Promise<string | null> {
    const res = await this.call(`${CONTENT}/files/download`, {
      headers: { 'Dropbox-API-Arg': JSON.stringify({ path: `/${name}` }) },
    });
    if (res.status === 409) {
      const body = await res.text();
      if (body.includes('not_found')) return null;
      throw new Error(`download ${name}: ${body}`);
    }
    if (!res.ok) throw new Error(`download ${name}: HTTP ${res.status}`);
    return res.text();
  }

  async write(name: string, text: string): Promise<void> {
    const res = await this.call(`${CONTENT}/files/upload`, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Dropbox-API-Arg': JSON.stringify({ path: `/${name}`, mode: 'overwrite', mute: true }),
      },
      body: text,
    });
    if (!res.ok) throw new Error(`upload ${name}: HTTP ${res.status}`);
  }

  /** Signs this browser out of Dropbox. The files stay. */
  async revoke(): Promise<void> {
    await this.call(`${API}/auth/token/revoke`, {});
  }

  private async call(
    url: string,
    init: { headers?: Record<string, string>; body?: string },
  ): Promise<Response> {
    if (this.deps.now() > this.tokens.expiresAt - EARLY_MS) await this.refresh();
    const send = (): Promise<Response> =>
      this.deps.fetch(url, {
        method: 'POST',
        headers: { ...init.headers, Authorization: `Bearer ${this.tokens.access}` },
        ...(init.body === undefined ? {} : { body: init.body }),
      });
    let res = await send();
    if (res.status === 401) {
      await this.refresh();
      res = await send();
      if (res.status === 401) throw new CloudAuthError('still unauthorised after a refresh');
    }
    return res;
  }

  private async refresh(): Promise<void> {
    this.tokens = await tokenCall(
      this.deps,
      { grant_type: 'refresh_token', refresh_token: this.tokens.refresh, client_id: this.appKey },
      this.tokens.refresh,
    );
    this.onTokens(this.tokens);
  }
}
