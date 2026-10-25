import type { SaveService } from '../saveService';
import { CloudSaves } from './cloudSaves';

/**
 * The public OAuth client ids (there is no secret): the Dropbox app's key (App folder access) and the Google
 * Cloud project's web client. Both list the redirect URI below for the live site and `pnpm dev`.
 */
export const CLIENT_IDS = {
  dropbox: 's84l93p6okxe99x',
  google: '905225811260-p3iogr7qscov38l8fabuv5p5sv85om7o.apps.googleusercontent.com',
} as const;

/** Where the service sends the player back to. */
export function redirectUri(): string {
  return new URL(`${import.meta.env.BASE_URL}oauth-callback.html`, window.location.origin).href;
}

/** Cloud saves wired to the browser, or null where localStorage is unavailable. */
export function browserCloudSaves(saves: SaveService): CloudSaves | null {
  let storage: Storage;
  try {
    storage = window.localStorage;
  } catch {
    return null;
  }
  return new CloudSaves({
    storage,
    http: { fetch: (url, init) => fetch(url, init), now: () => Date.now() },
    saves,
    clientIds: CLIENT_IDS,
    redirectUri: redirectUri(),
    openPopup: () => window.open('', 'fimbulvetr-signin', 'popup,width=520,height=720'),
    navigate: (url) => {
      window.location.assign(url);
    },
    setTimer: (fn, ms) => window.setTimeout(fn, ms),
    clearTimer: (handle) => {
      window.clearTimeout(handle as number);
    },
  });
}
