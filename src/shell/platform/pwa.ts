import { registerSW } from 'virtual:pwa-register';
import { UI } from '@content/i18n/ui';
import { t, type Lang } from '@core/i18n/t';
import { showMessage } from '@shell/boot/message';

/** Registers the offline service worker. New versions are offered, never swapped in mid-session. */
export function registerServiceWorker(lang: Lang): void {
  if (!('serviceWorker' in navigator)) return;
  const update = registerSW({
    immediate: true,
    onNeedRefresh() {
      showMessage(t(UI.update_ready, lang), [
        {
          label: t(UI.update_reload, lang),
          run: () => {
            void update(true);
          },
        },
        { label: t(UI.update_later, lang), run: () => undefined },
      ]);
    },
  });
}
