import type { MusicRules } from '@core/audio/music';

/**
 * Every music track, by the key it plays under. Placeholder tracks are composed in code (src/art/music);
 * a real recording loaded under the same key (and `<key>_combat`, `<key>_night` for its stems) replaces one.
 */
export const MUSIC = [
  'music_title',
  'music_town',
  'music_boss',
  'music_final',
  'music_credits',
  'music_askdalr',
  'music_myrkvidr',
  'music_myrland',
  'music_haugar',
  'music_niflmyrr',
  'music_saevatn',
  'music_dvergagrof',
  'music_hrimfjoll',
  'music_askdalr_winter',
  'music_myrkvidr_winter',
  'music_myrland_winter',
  'music_haugar_winter',
  'music_niflmyrr_winter',
  'music_saevatn_winter',
  'music_dvergagrof_winter',
  'music_hrimfjoll_winter',
  'music_d1',
  'music_d2',
  'music_d3',
  'music_d4',
  'music_d5',
  'music_d6',
  'music_d7',
  'music_d8',
] as const;
export type MusicId = (typeof MUSIC)[number];

/** Which screens play the town theme, which bosses the last battle, and how near a foe starts the drums. */
export const MUSIC_RULES: MusicRules = {
  towns: [
    'ask_village',
    'ask_int_trader',
    'upp_gate',
    'upp_hall',
    'upp_square',
    'upp_smiths',
    'upp_int_hof',
    'upp_int_meadhall',
    'upp_int_runehall',
    'upp_int_smithy',
    'upp_int_trader',
  ],
  finalBosses: ['hrimnir'],
  threatRadius: 112,
};
