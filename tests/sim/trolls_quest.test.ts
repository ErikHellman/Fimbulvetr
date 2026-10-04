import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { DEV_PRESETS } from '@content/dev/presets';
import type { ScreenId } from '@content/world/screens';
import { questLog } from '@core/story/quests';
import { tileFeet } from '@core/world/screen';
import { Harness } from './harness';
import { talkTo } from './walk';

function warp(h: Harness, screen: ScreenId, x: number, y: number): Harness {
  const p = tileFeet({ x, y });
  h.sim.command({ t: 'warp', screen, x: p.x, y: p.y });
  return h.idle(2);
}

const trolls = (h: Harness) =>
  questLog(DB.quests, { state: h.sim.state, quests: DB.quests }).find((q) => q.id === 'q_trolls');

/** After the pass, Önundr met; the clock at `minute` in winter (sunrise 7:00). */
function at(minute: number): Harness {
  const h = new Harness({ preset: DEV_PRESETS.fimbul, minute });
  Object.assign(h.sim.state.flags, { st_home_winter: true, n_onundr_met: true });
  return h;
}

describe('Önundr’s troll hunt (q_trolls)', () => {
  it('asks Ask to catch five trolls by sunrise in the troll wood', () => {
    const h = at(10 * 60);
    warp(h, 'myr_clearing', 23, 14);
    talkTo(h, 'onundr');
    expect(h.sim.state.flags.q_trolls_asked).toBe(true);
    expect(trolls(h)?.done).toBe(false);
  });

  it('counts each troll the sunrise turns to stone in the troll wood', () => {
    const h = at(4 * 60 + 55);
    h.sim.state.flags.q_trolls_asked = true;
    warp(h, 'myr_trollskog', 36, 18);
    expect(h.sim.actors.filter((a) => a.def === 'forest_troll')).toHaveLength(2);
    // Two hours to the winter sunrise (7:00); the test keeps Ask standing meanwhile.
    for (let i = 0; i < 76; i++) {
      h.idle(100);
      h.sim.hero.hp = h.sim.hero.maxHp;
    }
    expect(h.sim.actors.filter((a) => a.def === 'forest_troll')).toHaveLength(0);
    expect(h.sim.state.flags.q_trolls_stoned).toBe(2);
  });

  it('gives the arm-ring of stamina for five', () => {
    const h = at(10 * 60);
    Object.assign(h.sim.state.flags, { q_trolls_asked: true, q_trolls_stoned: 5 });
    warp(h, 'myr_clearing', 23, 14);
    talkTo(h, 'onundr');
    expect(h.sim.state.flags.w_ring_stamina).toBe(true);
    expect(trolls(h)?.done).toBe(true);
  });
});
