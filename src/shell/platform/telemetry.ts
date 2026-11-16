import * as Vaka from '@hellsoft/vaka-browser';
import { UI } from '@content/i18n/ui';
import { t, type Lang } from '@core/i18n/t';
import { IGNORE_KEYS_ATTR } from '@shell/input/keyboard';
import { scrubItem } from './telemetryScrub';

/**
 * Anonymous error reports, cookieless analytics and player feedback through Vaka
 * (https://vaka.hellsoft.se/). Nothing identifies the player: no user id, no cookies, no stored visitor
 * id (the SDK's visit id lives in sessionStorage and ends with the tab), and URLs lose their query
 * strings. The ingest key is public by design; it can only send.
 */

const VAKA_KEY = 'vk_32514b33c0b6d4efb4c77a9086b15d23';
const VAKA_ENDPOINT = 'https://vaka.fly.dev';

/** Starts reporting. Off in dev and `--mode test` builds, and from localhost. */
export function startTelemetry(enabled: boolean): void {
  if (!enabled) return;
  // Feedback carries the page address without passing `beforeSend`; a production build reads no query
  // string or fragment, so drop them from the address bar before anything is sent.
  if (location.search !== '' || location.hash !== '') history.replaceState(null, '', location.pathname);
  Vaka.init({
    key: VAKA_KEY,
    endpoint: VAKA_ENDPOINT,
    release: __RELEASE__,
    environment: import.meta.env.MODE,
    ignoreLocalhost: true,
    beforeSend: (item) => scrubItem(item),
  });
}

let installedLang: Lang | null = null;

/**
 * Opens the feedback form over the game, in the player's language. It asks for no email and takes no
 * screenshot, so a message is anonymous. Loaded on first use. Does nothing when reporting is off.
 */
export async function openFeedback(lang: Lang): Promise<void> {
  if (!Vaka.isActive()) return;
  const fb = await import('@hellsoft/vaka-browser/feedback');
  if (installedLang !== lang) {
    fb.installFeedback({
      button: false,
      crashPrompt: false,
      screenshot: false,
      askEmail: false,
      accent: '#7a5c9e',
      strings: {
        title: t(UI.fb_title, lang),
        placeholder: t(UI.fb_placeholder, lang),
        submit: t(UI.fb_submit, lang),
        cancel: t(UI.fb_cancel, lang),
        sending: t(UI.fb_sending, lang),
        thanks: t(UI.fb_thanks, lang),
        error: t(UI.fb_error, lang),
      },
    });
    // The form lives in a shadow root; keys typed into it must not drive the game behind it.
    document.querySelector('[data-vaka-feedback]')?.setAttribute(IGNORE_KEYS_ATTR, '');
    installedLang = lang;
  }
  await fb.showFeedback();
}
