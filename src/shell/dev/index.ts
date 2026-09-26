import type { DevBridge, DevTools } from './bridge';
import { createConsole } from './console';
import { installHook } from './hook';
import { createOverlay } from './overlay';

/** Loaded with a dynamic import only when DEV_TOOLS is true, so production bundles never contain it. */
export function createDevTools(): DevTools {
  let current: DevBridge | null = null;
  const counts: Record<string, number> = {};
  installHook(() => current, counts);
  createOverlay(() => current);
  createConsole(() => current);
  return {
    attach(bridge) {
      current = bridge;
    },
    onEvents(events) {
      for (const ev of events) {
        const key = ev.t === 'sfx' ? ev.id : ev.t;
        counts[key] = (counts[key] ?? 0) + 1;
      }
    },
  };
}
