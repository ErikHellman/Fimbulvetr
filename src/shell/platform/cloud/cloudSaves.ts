import { isSavedAt, planSync } from '@core/state/cloudSync';
import { SAVE_FORMAT, type SaveData } from '@core/state/save';
import { CLOUD_SLOTS, type CloudSlot, type SaveService } from '../saveService';
import type { StorageLike } from '../settings';
import { DropboxClient, authorizeUrl, exchangeCode } from './dropbox';
import { GoogleDriveClient, googleAuthorizeUrl, googleTokens } from './google';
import { challengeOf, randomToken } from './pkce';
import { CloudAuthError, type CloudFiles, type CloudTokens, type HttpDeps } from './types';

/**
 * Cloud saves: a copy of the autosave and the three manual slots in the player's own Dropbox or Google Drive,
 * whichever the player connected (one at a time). IndexedDB stays
 * the source of truth and the game never waits on the network. The title screen syncs (newest `savedAt`
 * wins per slot), manual saves are sent at once, the autosave at most once a minute and when the tab hides.
 *
 * Sign-in runs in a popup that lands on `oauth-callback.html`, which hands the result back through
 * localStorage. Where popups are blocked the whole tab goes to the service and back instead, and `resume()`
 * finishes the sign-in on the next start. Dropbox signs in once (a refresh token); Google gives a browser an
 * hour, after which the status turns to `reconnect`.
 */

export const CLOUD_KEY = 'fimbulvetr.cloud.v1';
/** The sign-in in progress: its service, `state` and PKCE verifier. */
export const PENDING_KEY = 'fimbulvetr.cloud.pending';
/** Written by `oauth-callback.html`: the query and fragment the service redirected back with, as one query. */
export const RESULT_KEY = 'fimbulvetr.cloud.result';

export const PUSH_DELAY_MS = 60_000;
const POLL_MS = 400;
const SIGN_IN_TIMEOUT_MS = 5 * 60_000;

export const PROVIDERS = ['dropbox', 'google'] as const;
export type CloudProvider = (typeof PROVIDERS)[number];
/** `off`: never connected or disconnected; `on`: connected; `reconnect`: the service asks to sign in again. */
export type CloudStatus = 'off' | 'on' | 'reconnect';
export type ConnectResult = 'connected' | 'cancelled' | 'denied' | 'failed' | 'redirected';

interface Stored {
  readonly provider: CloudProvider;
  readonly tokens: CloudTokens | null;
}

interface Pending {
  readonly provider: CloudProvider;
  readonly state: string;
  readonly verifier: string;
}

export interface CloudDeps {
  readonly storage: StorageLike & Pick<Storage, 'removeItem'>;
  readonly http: HttpDeps;
  readonly saves: SaveService;
  /** Each service's public OAuth client id (Dropbox calls it the app key). */
  readonly clientIds: Readonly<Record<CloudProvider, string>>;
  readonly redirectUri: string;
  /** `window.open` for the sign-in popup; null when the browser blocks it. */
  openPopup(): { location: { href: string }; close(): void } | null;
  /** Sends this tab to `url` (the fallback when popups are blocked). */
  navigate(url: string): void;
  setTimer(fn: () => void, ms: number): unknown;
  clearTimer(handle: unknown): void;
}

export interface SyncResult {
  readonly pulled: number;
  readonly pushed: number;
}

function parseJson(text: string | null): unknown {
  if (text === null) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function isTokens(v: unknown): v is CloudTokens {
  if (typeof v !== 'object' || v === null) return false;
  const t = v as Record<string, unknown>;
  return (
    typeof t['access'] === 'string' && typeof t['refresh'] === 'string' && typeof t['expiresAt'] === 'number'
  );
}

function savedAtOf(raw: unknown): string | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined;
  const r = raw as Record<string, unknown>;
  return r['format'] === SAVE_FORMAT && isSavedAt(r['savedAt']) ? r['savedAt'] : undefined;
}

const isProvider = (v: unknown): v is CloudProvider => PROVIDERS.some((p) => p === v);

export const fileOf = (slot: CloudSlot): string => `${slot}.json`;

export class CloudSaves {
  private stored: Stored | null;
  private client: CloudFiles | null = null;
  private readonly queued = new Map<CloudSlot, SaveData>();
  private timer: unknown = null;
  /** Network work runs one job at a time, so a sync and a push never race on the same file. */
  private chain: Promise<unknown> = Promise.resolve();
  /** Flushes run one after another, so a flush waits for the sends already under way. */
  private flushing: Promise<void> = Promise.resolve();
  private cancelSignIn: (() => void) | null = null;

  constructor(private readonly deps: CloudDeps) {
    const raw = parseJson(deps.storage.getItem(CLOUD_KEY)) as Record<string, unknown> | null;
    const provider = raw?.['provider'];
    this.stored = isProvider(provider)
      ? { provider, tokens: isTokens(raw?.['tokens']) ? raw['tokens'] : null }
      : null;
  }

  /** The service connected (or asking to be connected again); null when off. */
  get provider(): CloudProvider | null {
    return this.stored?.provider ?? null;
  }

  get status(): CloudStatus {
    if (this.stored === null) return 'off';
    return this.stored.tokens === null ? 'reconnect' : 'on';
  }

  /** Signs in to a service in a popup (or, where popups are blocked, by sending this tab there). */
  async connect(provider: CloudProvider): Promise<ConnectResult> {
    const popup = this.deps.openPopup();
    // The suffix tells `oauth-callback.html` whether to close (popup) or go back to the game (same tab).
    const pending: Pending = {
      provider,
      state: `${randomToken()}${popup === null ? '.r' : '.p'}`,
      verifier: randomToken(),
    };
    this.deps.storage.removeItem(RESULT_KEY);
    this.deps.storage.setItem(PENDING_KEY, JSON.stringify(pending));
    const id = this.deps.clientIds[provider];
    const url =
      provider === 'dropbox'
        ? authorizeUrl(id, this.deps.redirectUri, await challengeOf(pending.verifier), pending.state)
        : googleAuthorizeUrl(id, this.deps.redirectUri, pending.state);
    if (popup === null) {
      this.deps.navigate(url);
      return 'redirected';
    }
    popup.location.href = url;
    const query = await this.waitForResult(pending.state);
    if (query === null) {
      popup.close();
      this.deps.storage.removeItem(PENDING_KEY);
      return 'cancelled';
    }
    return this.finish(query, pending);
  }

  /** Stops waiting for the popup (the player pressed Esc). */
  cancel(): void {
    this.cancelSignIn?.();
  }

  /** Finishes a sign-in that went through a full-tab redirect; null when there was none. */
  async resume(): Promise<ConnectResult | null> {
    const pending = parseJson(this.deps.storage.getItem(PENDING_KEY)) as Pending | null;
    const result = parseJson(this.deps.storage.getItem(RESULT_KEY)) as { query?: unknown } | null;
    if (pending === null || result === null || typeof result.query !== 'string') return null;
    if (!isProvider(pending.provider)) return null;
    if (new URLSearchParams(result.query).get('state') !== pending.state) return null;
    return this.finish(result.query, pending);
  }

  /** Signs this browser out (the saves stay in the cloud and here). */
  async disconnect(): Promise<void> {
    this.clearQueue();
    const client = this.ensureClient();
    this.stored = null;
    this.client = null;
    this.deps.storage.removeItem(CLOUD_KEY);
    try {
      await client?.revoke();
    } catch (e) {
      console.warn('[cloud] revoking the token failed:', e);
    }
  }

  /** Copies each slot whichever way is newer. Throws CloudAuthError when the service wants a new sign-in. */
  sync(): Promise<SyncResult> {
    return this.run(async (client) => {
      const local = await this.deps.saves.stored();
      const remote: Partial<Record<CloudSlot, unknown>> = {};
      const names = new Set(await client.list());
      for (const slot of CLOUD_SLOTS) {
        if (names.has(fileOf(slot))) remote[slot] = parseJson(await client.read(fileOf(slot)));
      }
      const stamp = (from: Partial<Record<CloudSlot, unknown>>): Record<string, string | undefined> =>
        Object.fromEntries(CLOUD_SLOTS.map((s) => [s, savedAtOf(from[s])]));
      let pulled = 0;
      let pushed = 0;
      for (const step of planSync(CLOUD_SLOTS, stamp(local), stamp(remote))) {
        const slot = step.slot as CloudSlot;
        if (step.dir === 'pull') {
          if (await this.deps.saves.adopt(slot, remote[slot])) pulled++;
        } else {
          const save = local[slot];
          if (save === undefined) continue;
          await client.write(fileOf(slot), JSON.stringify(save));
          pushed++;
        }
      }
      return { pulled, pushed };
    });
  }

  /** A save the game just wrote: manual slots go now, the autosave within a minute. */
  noteWrite(slot: CloudSlot, save: SaveData): void {
    if (this.status !== 'on') return;
    this.queued.set(slot, save);
    if (slot !== 'auto') void this.flush();
    else if (this.timer === null) {
      this.timer = this.deps.setTimer(() => {
        this.timer = null;
        void this.flush();
      }, PUSH_DELAY_MS);
    }
  }

  /** Sends every queued save now. Failures are logged and the save stays queued for the next try. */
  flush(): Promise<void> {
    this.flushing = this.flushing.then(() => this.send());
    return this.flushing;
  }

  private async send(): Promise<void> {
    if (this.queued.size === 0 || this.status !== 'on') return;
    if (this.timer !== null) {
      this.deps.clearTimer(this.timer);
      this.timer = null;
    }
    const batch = [...this.queued];
    this.queued.clear();
    try {
      await this.run(async (client) => {
        for (const [slot, save] of batch) await client.write(fileOf(slot), JSON.stringify(save));
      });
    } catch (e) {
      console.warn('[cloud] sending saves failed:', e);
      for (const [slot, save] of batch) if (!this.queued.has(slot)) this.queued.set(slot, save);
    }
  }

  private async finish(query: string, pending: Pending): Promise<ConnectResult> {
    this.deps.storage.removeItem(PENDING_KEY);
    this.deps.storage.removeItem(RESULT_KEY);
    const params = new URLSearchParams(query);
    const code = params.get('code');
    if (params.get('state') !== pending.state) return 'failed';
    if (pending.provider === 'google') {
      const tokens = googleTokens(params, this.deps.http.now());
      if (tokens === null) return params.get('error') === 'access_denied' ? 'denied' : 'failed';
      this.client = null;
      this.store({ provider: 'google', tokens });
      return 'connected';
    }
    if (code === null) return params.get('error') === 'access_denied' ? 'denied' : 'failed';
    try {
      const tokens = await exchangeCode(
        this.deps.http,
        this.deps.clientIds.dropbox,
        this.deps.redirectUri,
        code,
        pending.verifier,
      );
      this.client = null;
      this.store({ provider: 'dropbox', tokens });
      return 'connected';
    } catch (e) {
      console.warn('[cloud] finishing the sign-in failed:', e);
      return 'failed';
    }
  }

  private waitForResult(state: string): Promise<string | null> {
    return new Promise((resolve) => {
      let waited = 0;
      let handle: unknown = null;
      const done = (query: string | null): void => {
        this.cancelSignIn = null;
        if (handle !== null) this.deps.clearTimer(handle);
        resolve(query);
      };
      this.cancelSignIn = () => {
        done(null);
      };
      const poll = (): void => {
        handle = null;
        const result = parseJson(this.deps.storage.getItem(RESULT_KEY)) as { query?: unknown } | null;
        const query = typeof result?.query === 'string' ? result.query : null;
        if (query !== null && new URLSearchParams(query).get('state') === state) {
          done(query);
          return;
        }
        waited += POLL_MS;
        if (waited >= SIGN_IN_TIMEOUT_MS) done(null);
        else handle = this.deps.setTimer(poll, POLL_MS);
      };
      handle = this.deps.setTimer(poll, POLL_MS);
    });
  }

  private run<T>(job: (client: CloudFiles) => Promise<T>): Promise<T> {
    const next = this.chain.then(async () => {
      const client = this.ensureClient();
      if (client === null) throw new CloudAuthError('not connected');
      try {
        return await job(client);
      } catch (e) {
        if (e instanceof CloudAuthError && this.stored !== null) {
          this.client = null;
          this.clearQueue();
          this.store({ provider: this.stored.provider, tokens: null });
        }
        throw e;
      }
    });
    this.chain = next.catch(() => undefined);
    return next;
  }

  private ensureClient(): CloudFiles | null {
    const tokens = this.stored?.tokens ?? null;
    if (this.stored === null || tokens === null) return null;
    this.client ??=
      this.stored.provider === 'dropbox'
        ? new DropboxClient(this.deps.http, this.deps.clientIds.dropbox, tokens, (fresh) => {
            this.store({ provider: 'dropbox', tokens: fresh });
          })
        : new GoogleDriveClient(this.deps.http, tokens);
    return this.client;
  }

  private store(stored: Stored): void {
    this.stored = stored;
    try {
      this.deps.storage.setItem(CLOUD_KEY, JSON.stringify(stored));
    } catch (e) {
      console.warn('[cloud] storing the sign-in failed:', e);
    }
  }

  private clearQueue(): void {
    this.queued.clear();
    if (this.timer !== null) {
      this.deps.clearTimer(this.timer);
      this.timer = null;
    }
  }
}
