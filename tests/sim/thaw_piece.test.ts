import { describe, expect, it } from 'vitest';
import { DEV_PRESETS } from '@content/dev/presets';
import { tileFeet } from '@core/world/screen';
import { Harness, frameOf } from './harness';
import { walkTo } from './walk';

/** Ask in the saddle with the seal-skin, the King dead or not, in spring. */
function saddle(thawed: boolean): Harness {
  const h = new Harness({ preset: DEV_PRESETS.d8king });
  h.sim.state.inv.items.sealskin = 1;
  h.sim.state.clock.season = 'spring';
  if (thawed) h.sim.state.flags.st_hrimnir_dead = true;
  const p = tileFeet({ x: 15, y: 14 });
  h.sim.command({ t: 'warp', screen: 'hrf_saddle', x: p.x, y: p.y });
  return h.idle(2);
}

describe('the saddle’s tarn-eye (hp_hrf_thaw)', () => {
  it('thaws once Hrímnir is dead, and a diver takes the piece off its bottom', () => {
    const h = saddle(true);
    walkTo(h, 15, 15);
    h.until((s) => s.hero.fsm.s === 'swim', 60, frameOf(['down']));
    h.until((s) => s.hero.pos.y >= tileFeet({ x: 15, y: 17 }).y, 120, frameOf(['down']));
    h.step(frameOf([], ['roll']));
    expect(h.sim.hero.fsm.s).toBe('dive');
    h.idle(10);
    expect(h.sim.state.world.pieces).toContain('hp_hrf_thaw');
  });

  it('lies under ice while the King lives, whatever the season below', () => {
    const h = saddle(false);
    walkTo(h, 15, 17);
    h.step(frameOf([], ['roll']));
    h.idle(30);
    expect(h.sim.hero.fsm.s).not.toBe('dive');
    expect(h.sim.state.world.pieces).not.toContain('hp_hrf_thaw');
  });
});
