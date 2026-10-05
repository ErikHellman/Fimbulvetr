import type { SpawnTable } from '@core/world/spawns';
import type { RegionId } from './ids';

/**
 * Rolled enemies by region and season, on screens that list spawn points. Night doubles the count; the
 * forest trolls come out only at night, and the sunrise turns them to stone. The Rime King's ravens fly
 * only at night, more of them in winter.
 */
export const SPAWN_TABLES: Readonly<Partial<Record<RegionId, SpawnTable>>> = {
  myrkvidr: {
    count: { summer: 2, autumn: 2, winter: 2, spring: 2 },
    entries: {
      summer: [
        { id: 'vargr', weight: 3 },
        { id: 'draugr', weight: 2, time: 'night' },
        { id: 'forest_troll', weight: 1, time: 'night' },
        { id: 'rime_raven', weight: 1, time: 'night' },
      ],
      autumn: [
        { id: 'vargr', weight: 3 },
        { id: 'draugr', weight: 2, time: 'night' },
        { id: 'forest_troll', weight: 1, time: 'night' },
        { id: 'rime_raven', weight: 1, time: 'night' },
      ],
      winter: [
        { id: 'vargr', weight: 4 },
        { id: 'draugr', weight: 1, time: 'night' },
        { id: 'forest_troll', weight: 2, time: 'night' },
        { id: 'rime_raven', weight: 2, time: 'night' },
      ],
      spring: [
        { id: 'vargr', weight: 2 },
        { id: 'draugr', weight: 2, time: 'night' },
        { id: 'forest_troll', weight: 1, time: 'night' },
        { id: 'rime_raven', weight: 1, time: 'night' },
      ],
    },
  },
  /**
   * Mýrland: wolves on the banks by day, the drowned dead and bog-lights by night. Spring days are quiet
   * (the floods keep the wolves up in the wood). Mud-crabs crawl out in summer and autumn, once Ask carries
   * bombs (a foe that `needs` what Ask lacks is left out of the draw).
   */
  myrland: {
    count: { summer: 2, autumn: 2, winter: 2, spring: 2 },
    entries: {
      summer: [
        { id: 'vargr', weight: 2 },
        { id: 'leirkrabbi', weight: 1, time: 'day' },
        { id: 'draugr', weight: 2, time: 'night' },
        { id: 'myrljos', weight: 3, time: 'night' },
      ],
      autumn: [
        { id: 'vargr', weight: 2 },
        { id: 'leirkrabbi', weight: 1, time: 'day' },
        { id: 'draugr', weight: 2, time: 'night' },
        { id: 'myrljos', weight: 3, time: 'night' },
      ],
      winter: [
        { id: 'vargr', weight: 3 },
        { id: 'myrljos', weight: 1, time: 'night' },
        { id: 'draugr', weight: 1, time: 'night' },
        { id: 'rime_raven', weight: 1, time: 'night' },
      ],
      spring: [
        { id: 'myrljos', weight: 2, time: 'night' },
        { id: 'draugr', weight: 1, time: 'night' },
      ],
    },
  },
  /**
   * Haugar: wolves on the heather by day; by night the barrow-wights and the draugr climb out of their
   * mounds, and in winter the Rime King's ravens fly over the barrows.
   */
  haugar: {
    count: { summer: 2, autumn: 2, winter: 2, spring: 2 },
    entries: {
      summer: [
        { id: 'vargr', weight: 2, time: 'day' },
        { id: 'haugbui', weight: 3, time: 'night' },
        { id: 'draugr', weight: 2, time: 'night' },
        { id: 'bogdraugr', weight: 1, time: 'night' },
      ],
      autumn: [
        { id: 'vargr', weight: 2, time: 'day' },
        { id: 'haugbui', weight: 3, time: 'night' },
        { id: 'draugr', weight: 2, time: 'night' },
        { id: 'bogdraugr', weight: 1, time: 'night' },
      ],
      winter: [
        { id: 'vargr', weight: 3, time: 'day' },
        { id: 'haugbui', weight: 3, time: 'night' },
        { id: 'draugr', weight: 1, time: 'night' },
        { id: 'rime_raven', weight: 2, time: 'night' },
      ],
      spring: [
        { id: 'vargr', weight: 2, time: 'day' },
        { id: 'haugbui', weight: 3, time: 'night' },
        { id: 'draugr', weight: 2, time: 'night' },
      ],
    },
  },
  /**
   * Niflmýrr: fog-draugr wait in the mist by day and night; by night the mara ride and the drowned dead
   * walk, and bog-lights drift over the pools (ravens instead in winter).
   */
  niflmyrr: {
    count: { summer: 2, autumn: 2, winter: 2, spring: 2 },
    entries: {
      summer: [
        { id: 'fog_draugr', weight: 3 },
        { id: 'mara', weight: 2, time: 'night' },
        { id: 'draugr', weight: 1, time: 'night' },
        { id: 'myrljos', weight: 1, time: 'night' },
      ],
      autumn: [
        { id: 'fog_draugr', weight: 3 },
        { id: 'mara', weight: 2, time: 'night' },
        { id: 'draugr', weight: 1, time: 'night' },
        { id: 'myrljos', weight: 1, time: 'night' },
      ],
      winter: [
        { id: 'fog_draugr', weight: 3 },
        { id: 'mara', weight: 2, time: 'night' },
        { id: 'draugr', weight: 1, time: 'night' },
        { id: 'rime_raven', weight: 1, time: 'night' },
      ],
      spring: [
        { id: 'fog_draugr', weight: 3 },
        { id: 'mara', weight: 2, time: 'night' },
        { id: 'draugr', weight: 1, time: 'night' },
        { id: 'myrljos', weight: 1, time: 'night' },
      ],
    },
  } /** Sævatn: the marbendill climb out onto its banks at night; in winter ravens cross the ice instead. */,
  saevatn: {
    count: { summer: 1, autumn: 1, winter: 1, spring: 1 },
    entries: {
      summer: [{ id: 'marbendill', weight: 1, time: 'night' }],
      autumn: [{ id: 'marbendill', weight: 1, time: 'night' }],
      winter: [{ id: 'rime_raven', weight: 1, time: 'night' }],
      spring: [{ id: 'marbendill', weight: 1, time: 'night' }],
    },
  },
  /** Dvergagröf: iron wardens walk their old beats by day and night; ember sprites drift out after dark. */
  dvergagrof: {
    count: { summer: 2, autumn: 2, winter: 2, spring: 2 },
    entries: {
      summer: [
        { id: 'jarnvordr', weight: 2 },
        { id: 'glod', weight: 2, time: 'night' },
      ],
      autumn: [
        { id: 'jarnvordr', weight: 2 },
        { id: 'glod', weight: 2, time: 'night' },
      ],
      winter: [
        { id: 'jarnvordr', weight: 2 },
        { id: 'rime_raven', weight: 1, time: 'night' },
      ],
      spring: [
        { id: 'jarnvordr', weight: 2 },
        { id: 'glod', weight: 2, time: 'night' },
      ],
    },
  },
  /** Hrímfjöll (M9a): ice wolves by day and night, frost wisps after dark; always winter up here. */
  hrimfjoll: {
    count: { summer: 2, autumn: 2, winter: 2, spring: 2 },
    entries: {
      summer: [
        { id: 'isvargr', weight: 2 },
        { id: 'frostvaettr', weight: 2, time: 'night' },
      ],
      autumn: [
        { id: 'isvargr', weight: 2 },
        { id: 'frostvaettr', weight: 2, time: 'night' },
      ],
      winter: [
        { id: 'isvargr', weight: 2 },
        { id: 'frostvaettr', weight: 2, time: 'night' },
      ],
      spring: [
        { id: 'isvargr', weight: 2 },
        { id: 'frostvaettr', weight: 2, time: 'night' },
      ],
    },
  },
};
