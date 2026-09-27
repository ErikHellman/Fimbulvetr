import type { SpawnTable } from '@core/world/spawns';
import type { RegionId } from './ids';

/**
 * Rolled enemies by region and season, on screens that list spawn points. Night doubles the count; the
 * forest trolls come out only at night, and the sunrise turns them to stone.
 */
export const SPAWN_TABLES: Readonly<Partial<Record<RegionId, SpawnTable>>> = {
  myrkvidr: {
    count: { summer: 2, autumn: 2, winter: 2, spring: 2 },
    entries: {
      summer: [
        { id: 'vargr', weight: 3 },
        { id: 'draugr', weight: 2, time: 'night' },
        { id: 'forest_troll', weight: 1, time: 'night' },
      ],
      autumn: [
        { id: 'vargr', weight: 3 },
        { id: 'draugr', weight: 2, time: 'night' },
        { id: 'forest_troll', weight: 1, time: 'night' },
      ],
      winter: [
        { id: 'vargr', weight: 4 },
        { id: 'draugr', weight: 1, time: 'night' },
        { id: 'forest_troll', weight: 2, time: 'night' },
      ],
      spring: [
        { id: 'vargr', weight: 2 },
        { id: 'draugr', weight: 2, time: 'night' },
        { id: 'forest_troll', weight: 1, time: 'night' },
      ],
    },
  },
};
