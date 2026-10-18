import type { MusicId } from '@content/music';
import type { Score } from './compose';

/**
 * The placeholder soundtrack: one score per track. The main theme (title) comes back in the last battle and
 * the credits; each region has a winter variant of its own tune, slower, on the bone flute.
 */

/** The main theme's seed: the title, the last battle and the credits all sing it. */
const MAIN = 1001;

const base = {
  beats: 4,
  bars: 16,
  bass: true,
  drone: true,
  accomp: 'harp',
  drums: 'none',
  busy: 0.5,
  reverb: 0.35,
} as const;

/** The same tune in winter: slower and sparer, on the flute over bowed chords, no drums. */
export function winter(s: Score): Score {
  return {
    ...s,
    bpm: Math.max(56, Math.round(s.bpm * 0.85)),
    lead: 'flute',
    accomp: 'pad',
    drums: 'none',
    reverb: Math.min(0.6, s.reverb + 0.2),
  };
}

const REGIONS = {
  /** Home: a lilting polska in G mixolydian. */
  music_askdalr: {
    ...base,
    theme: 11,
    root: 55,
    mode: 'mixolydian',
    bpm: 104,
    beats: 3,
    lead: 'fiddle',
    drums: 'pulse',
  },
  /** The dark wood: slow aeolian, low fiddle over bowed chords. */
  music_myrkvidr: { ...base, theme: 12, root: 57, mode: 'aeolian', bpm: 74, lead: 'fiddle', accomp: 'pad' },
  /** The bog: a lyre tune in E dorian, in three. */
  music_myrland: {
    ...base,
    theme: 13,
    root: 64,
    mode: 'dorian',
    bpm: 86,
    beats: 3,
    lead: 'harp',
    accomp: 'pad',
  },
  /** The barrow hills: phrygian, heavy and slow, a heartbeat drum. */
  music_haugar: {
    ...base,
    theme: 14,
    root: 62,
    mode: 'phrygian',
    bpm: 66,
    lead: 'fiddle',
    drums: 'pulse',
    busy: 0.35,
  },
  /** The mist marsh: the flute alone over a drone. */
  music_niflmyrr: {
    ...base,
    theme: 15,
    root: 59,
    mode: 'aeolian',
    bpm: 62,
    lead: 'flute',
    accomp: 'pad',
    bass: false,
    busy: 0.3,
    reverb: 0.5,
  },
  /** The lake: a bright lydian lyre in three, like water. */
  music_saevatn: {
    ...base,
    theme: 16,
    root: 65,
    mode: 'lydian',
    bpm: 92,
    beats: 3,
    lead: 'harp',
    accomp: 'both',
  },
  /** The dwarves' hollows: a march in E phrygian. */
  music_dvergagrof: {
    ...base,
    theme: 17,
    root: 64,
    mode: 'phrygian',
    bpm: 96,
    lead: 'fiddle',
    drums: 'march',
  },
  /** The frost fells: B dorian, wide and cold. */
  music_hrimfjoll: {
    ...base,
    theme: 18,
    root: 59,
    mode: 'dorian',
    bpm: 70,
    lead: 'fiddle',
    accomp: 'pad',
    reverb: 0.5,
  },
} as const satisfies Record<string, Score>;

const DUNGEONS = {
  /** Rótarhellir, the root cave. */
  music_d1: {
    ...base,
    theme: 21,
    root: 62,
    mode: 'dorian',
    bpm: 78,
    lead: 'harp',
    accomp: 'pad',
    drums: 'pulse',
    busy: 0.4,
  },
  /** Sökkva Kvern, the drowned mill. */
  music_d2: {
    ...base,
    theme: 22,
    root: 60,
    mode: 'aeolian',
    bpm: 84,
    beats: 3,
    lead: 'harp',
    accomp: 'pad',
    drums: 'pulse',
  },
  /** Konungshaugr, the king's barrow. */
  music_d3: {
    ...base,
    theme: 23,
    root: 57,
    mode: 'phrygian',
    bpm: 64,
    lead: 'fiddle',
    accomp: 'pad',
    busy: 0.3,
    reverb: 0.5,
  },
  /** Helgrind, Hel's gate. */
  music_d4: {
    ...base,
    theme: 24,
    root: 59,
    mode: 'phrygian',
    bpm: 70,
    lead: 'flute',
    accomp: 'pad',
    drums: 'pulse',
    reverb: 0.55,
  },
  /** Sökkva Hof, the sunken temple. */
  music_d5: {
    ...base,
    theme: 25,
    root: 62,
    mode: 'aeolian',
    bpm: 76,
    lead: 'harp',
    accomp: 'both',
    reverb: 0.5,
  },
  /** The forge of the dwarves. */
  music_d6: {
    ...base,
    theme: 26,
    root: 64,
    mode: 'phrygian',
    bpm: 100,
    lead: 'fiddle',
    accomp: 'pad',
    drums: 'march',
  },
  /** Hrímturn, the Rime Tower. */
  music_d7: {
    ...base,
    theme: 27,
    root: 59,
    mode: 'dorian',
    bpm: 72,
    lead: 'flute',
    accomp: 'pad',
    drums: 'pulse',
    reverb: 0.55,
  },
  /** Útgarðr. */
  music_d8: {
    ...base,
    theme: 28,
    root: 62,
    mode: 'phrygian',
    bpm: 88,
    lead: 'fiddle',
    accomp: 'both',
    drums: 'march',
  },
} as const satisfies Record<string, Score>;

export const MUSIC_SCORES: Readonly<Record<MusicId, Score>> = {
  /** The main theme, D dorian, unhurried. */
  music_title: { ...base, theme: MAIN, root: 62, mode: 'dorian', bpm: 76, lead: 'fiddle' },
  /** Uppvík and the village: a quick, bright polska. */
  music_town: {
    ...base,
    theme: 31,
    root: 55,
    mode: 'ionian',
    bpm: 116,
    beats: 3,
    lead: 'fiddle',
    accomp: 'both',
    drums: 'pulse',
    busy: 0.6,
  },
  music_boss: {
    ...base,
    theme: 41,
    root: 64,
    mode: 'phrygian',
    bpm: 132,
    bars: 8,
    lead: 'fiddle',
    accomp: 'pad',
    drums: 'war',
    busy: 0.7,
    reverb: 0.25,
  },
  /** The Rime King: the main theme, dark and driven. */
  music_final: {
    ...base,
    theme: MAIN,
    root: 62,
    mode: 'phrygian',
    bpm: 120,
    lead: 'fiddle',
    accomp: 'both',
    drums: 'war',
    reverb: 0.3,
  },
  /** The credits: the main theme turned to mixolydian, the spring after the winter. */
  music_credits: {
    ...base,
    theme: MAIN,
    root: 62,
    mode: 'mixolydian',
    bpm: 84,
    bars: 24,
    lead: 'fiddle',
    accomp: 'both',
    drums: 'pulse',
  },
  ...REGIONS,
  music_askdalr_winter: winter(REGIONS.music_askdalr),
  music_myrkvidr_winter: winter(REGIONS.music_myrkvidr),
  music_myrland_winter: winter(REGIONS.music_myrland),
  music_haugar_winter: winter(REGIONS.music_haugar),
  music_niflmyrr_winter: winter(REGIONS.music_niflmyrr),
  music_saevatn_winter: winter(REGIONS.music_saevatn),
  music_dvergagrof_winter: winter(REGIONS.music_dvergagrof),
  music_hrimfjoll_winter: winter(REGIONS.music_hrimfjoll),
  ...DUNGEONS,
};
