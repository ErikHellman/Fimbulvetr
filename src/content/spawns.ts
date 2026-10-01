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
};
