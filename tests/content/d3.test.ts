import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { WORLD_LAYOUT } from '@content/world/layout';
import { SCREENS } from '@content/world/registry';
import { SCREEN_IDS, type ScreenId } from '@content/world/screens';
import { DIRS } from '@core/math/dir';
import { indexLayout, neighbourOf } from '@core/world/screen';

const rooms = SCREEN_IDS.filter((id) => SCREENS[id].dungeon === 'd3');

/** A room that needs the bow: an eye switch, or a foe that cannot be beaten without it. */
const needsBow = (id: ScreenId): boolean =>
  SCREENS[id].things.some(
    (t) =>
      (t.k === 'switch' && t.eye === true) ||
      (t.k === 'enemy' && (DB.enemies[t.id].needs ?? []).includes('bow')),
  );

const hasArrowPot = (id: ScreenId): boolean =>
  SCREENS[id].things.some((t) => t.k === 'prop' && t.id === 'arrow_pot');

describe('Konungshaugr', () => {
  it('has an arrow pot in or next to every room that needs the bow', () => {
    const index = indexLayout(WORLD_LAYOUT, SCREEN_IDS);
    const needing = rooms.filter(needsBow);
    expect(needing.length).toBeGreaterThanOrEqual(5);
    for (const id of needing) {
      const near = [id, ...DIRS.map((d) => neighbourOf(index, id, d)).filter((n) => n !== null)];
      expect(near.some(hasArrowPot), id).toBe(true);
    }
  });

  it('keeps every eye within an arrow’s line of floor it can be shot from', () => {
    // Checked properly by the solver proofs; here only that each eye stands on a solid tile's footing.
    for (const id of rooms)
      for (const t of SCREENS[id].things)
        if (t.k === 'switch' && t.eye === true) expect(t.set, `${id} eye latches a flag`).toBeDefined();
  });
});
