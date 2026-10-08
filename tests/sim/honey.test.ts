import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { DEV_PRESETS } from '@content/dev/presets';
import type { Season } from '@core/clock/types';
import type { ScreenId } from '@content/world/screens';
import { questLog } from '@core/story/quests';
import { tileFeet } from '@core/world/screen';
import { Harness } from './harness';
import { finishStory, interactNorth, talkTo } from './walk';

function warp(h: Harness, screen: ScreenId, x: number, y: number): Harness {
  const p = tileFeet({ x, y });
  h.sim.command({ t: 'warp', screen, x: p.x, y: p.y });
  return h.idle(2);
}

const quest = (h: Harness) =>
  questLog(DB.quests, { state: h.sim.state, quests: DB.quests }).find((q) => q.id === 'q_honey');

/** After the pass in `season`, Þórdís met; the hive in the pines robbed with or without the lantern. */
function atHive(season: Season, lantern: boolean): Harness {
  const h = new Harness({ preset: DEV_PRESETS.fimbul, season });
  Object.assign(h.sim.state.flags, { st_home_winter: true, q_honey_asked: true });
  if (!lantern) delete h.sim.state.inv.items.lantern;
  warp(h, 'myr_pines', 30, 8);
  interactNorth(h, 30, 5);
  finishStory(h);
  return h;
}

describe('Þórdís’s wild honey (q_honey)', () => {
  it('is asked for in the mead hall once the pass is open', () => {
    const h = new Harness({ preset: DEV_PRESETS.fimbul });
    warp(h, 'upp_int_meadhall', 19, 16);
    talkTo(h, 'thordis');
    expect(h.sim.state.flags.q_honey_asked).toBe(true);
    expect(quest(h)?.done).toBe(false);
  });

  it('can be taken only in summer or autumn, with the lantern’s smoke', () => {
    expect(atHive('winter', true).sim.state.inv.items.honey ?? 0).toBe(0);
    expect(atHive('spring', true).sim.state.inv.items.honey ?? 0).toBe(0);
    expect(atHive('summer', false).sim.state.inv.items.honey ?? 0).toBe(0);
    expect(atHive('summer', true).sim.state.inv.items.honey).toBe(1);
    expect(atHive('autumn', true).sim.state.inv.items.honey).toBe(1);
  });

  it('earns a mead horn', () => {
    const h = atHive('autumn', true);
    const horns = h.sim.state.inv.items.horn ?? 0;
    warp(h, 'upp_int_meadhall', 19, 16);
    talkTo(h, 'thordis');
    expect(h.sim.state.inv.items.horn).toBe(horns + 1);
    expect(h.sim.state.inv.items.honey ?? 0).toBe(0);
    expect(quest(h)?.done).toBe(true);
  });
});
