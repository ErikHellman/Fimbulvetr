import { UI } from '@content/i18n/ui';
import { t, type Lang } from '@core/i18n/t';
import { showMessage } from '@shell/boot/message';

/**
 * Full screen through the Fullscreen API, with the `webkit` prefix Safari still needs on iPad and older
 * macOS. iPhone Safari has no element fullscreen at all; there the game says how to add it to the Home
 * Screen, where it runs standalone (the PWA manifest asks for `display: standalone`).
 */

type Request = () => Promise<void> | void;

export interface FullscreenDoc {
  readonly documentElement: { requestFullscreen?: Request; webkitRequestFullscreen?: Request };
  readonly fullscreenEnabled?: boolean;
  readonly webkitFullscreenEnabled?: boolean;
  readonly fullscreenElement?: unknown;
  readonly webkitFullscreenElement?: unknown;
  exitFullscreen?: Request;
  webkitExitFullscreen?: Request;
}

export type FullscreenState = 'on' | 'off' | 'unsupported';

function supported(doc: FullscreenDoc): boolean {
  const root = doc.documentElement;
  return (
    (doc.fullscreenEnabled === true && typeof root.requestFullscreen === 'function') ||
    (doc.webkitFullscreenEnabled === true && typeof root.webkitRequestFullscreen === 'function')
  );
}

function active(doc: FullscreenDoc): boolean {
  return (doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null) !== null;
}

/** `standalone`: running as an installed app, which fills the screen even without the API. */
export function fullscreenState(doc: FullscreenDoc, standalone: boolean): FullscreenState {
  if (supported(doc)) return active(doc) ? 'on' : 'off';
  return standalone ? 'on' : 'unsupported';
}

/**
 * Enters or leaves full screen. False when the browser has no API or refused, which it does unless a
 * key press, click or tap started the request: gamepad buttons do not count as a user gesture.
 */
export async function toggleFullscreen(doc: FullscreenDoc): Promise<boolean> {
  if (!supported(doc)) return false;
  const root = doc.documentElement;
  try {
    if (active(doc)) await (doc.exitFullscreen ?? doc.webkitExitFullscreen)?.call(doc);
    else await (root.requestFullscreen ?? root.webkitRequestFullscreen)?.call(root);
    return true;
  } catch {
    return false;
  }
}

/** F11 (the browser's own key, taken over so Esc and the menu agree) and Alt+Enter. */
export function isFullscreenHotkey(e: { readonly code: string; readonly altKey: boolean }): boolean {
  return e.code === 'F11' || (e.code === 'Enter' && e.altKey);
}

export function isStandalone(win: Window): boolean {
  const nav = win.navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true || win.matchMedia('(display-mode: standalone)').matches;
}

export function currentFullscreen(): FullscreenState {
  return fullscreenState(document, isStandalone(window));
}

/**
 * Toggles full screen for the settings row or the hotkey. A refused request (a gamepad press) offers a
 * button, whose click is a gesture the browser accepts; without the API it explains the Home Screen.
 */
export function requestFullscreenToggle(lang: Lang): void {
  const doc = document as FullscreenDoc;
  const state = fullscreenState(doc, isStandalone(window));
  if (state === 'unsupported') {
    showMessage(t(UI.fullscreen_home_screen, lang), [{ label: t(UI.ok, lang), run: () => undefined }]);
    return;
  }
  void toggleFullscreen(doc).then((ok) => {
    if (ok) return;
    showMessage(t(UI.fullscreen_confirm, lang), [
      { label: t(UI.fullscreen_enter, lang), run: () => void toggleFullscreen(doc) },
      { label: t(UI.update_later, lang), run: () => undefined },
    ]);
  });
}

export function attachFullscreenHotkey(win: Window, lang: () => Lang): () => void {
  const onDown = (e: KeyboardEvent): void => {
    if (e.repeat || !isFullscreenHotkey(e)) return;
    // Captured first so Alt+Enter never reaches the game as a confirm press.
    e.preventDefault();
    e.stopPropagation();
    requestFullscreenToggle(lang());
  };
  win.addEventListener('keydown', onDown, { capture: true });
  return () => {
    win.removeEventListener('keydown', onDown, { capture: true });
  };
}
