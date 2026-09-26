import type { DevPreset } from '@core/dev/query';

/** Dev starting points for `?preset=`. Content milestones add story presets (day2, night3, …). */
export const DEV_PRESETS = {
  /** The M0 test kit: seax and shield in the test lands. */
  m0: { screen: 'test_a', tile: [10, 11], weapon: 'seax', shield: true },
} as const satisfies Record<string, DevPreset>;

export type DevPresetId = keyof typeof DEV_PRESETS;

export const isDevPresetId = (s: string): s is DevPresetId => Object.hasOwn(DEV_PRESETS, s);
