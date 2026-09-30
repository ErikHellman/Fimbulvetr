import { describe, expect, it } from 'vitest';
import { DEV_PRESETS } from '@content/dev/presets';
import type { ScreenId } from '@content/world/screens';
import { tileFeet } from '@core/world/screen';
import { Harness } from './harness';
import { crossTo, face, finishStory, walkTo } from './walk';

function archer(screen: ScreenId, x: number, y: number): Harness {
  const h = new Harness({ preset: DEV_PRESETS.haubow });
  const p = tileFeet({ x, y });
  h.sim.command({ t: 'warp', screen, x: p.x, y: p.y });
  return h.idle(2);
}

describe('Haugar’s bow secrets', () => {
  it('an arrow in the great cairn’s eye opens its door, and a larger quiver lies inside', () => {
    const h = archer('hau_cairns', 8, 13);
    face(h, 'n');
    h.press(['item1']);
    h.until((s) => s.state.flags.w_hau_cairn === true, 60);
    h.idle(4);
    walkTo(h, 10, 11);
    crossTo(h, 'n', 'hau_int_cairn');
    walkTo(h, 19, 9);
    face(h, 'n');
    h.press(['interact']);
    finishStory(h);
    expect(h.sim.state.inv.items.quiver).toBe(1);
    h.expectAnims();
  });

  it('an arrow in the far bank’s eye lowers the old bridge to the watchtower’s piece', () => {
    const h = archer('hau_watch', 20, 8);
    face(h, 'e');
    h.press(['item1']);
    h.until((s) => s.state.flags.w_hau_watch === true, 60);
    h.idle(4);
    walkTo(h, 31, 6);
    expect(h.sim.state.world.pieces).toContain('hp_hau_watch');
  });

  it('Geirmundr sells arrows once Ask carries a bow', () => {
    const h = archer('hau_barrows', 12, 18);
    h.sim.state.inv.items.arrows = 5;
    face(h, 'n');
    h.press(['interact']);
    for (let i = 0; i < 400 && h.sim.storyUi()?.k !== 'shop'; i += 4) h.press(['confirm']).idle(3);
    const ui = h.sim.storyUi();
    expect(ui?.k === 'shop' && ui.rows.some((r) => r.item === 'arrows')).toBe(true);
    h.press(['down']);
    h.press(['confirm']);
    finishStory(h);
    expect(h.sim.state.inv.items.arrows).toBe(15);
  });
});
