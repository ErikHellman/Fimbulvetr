import { describe, expect, it } from 'vitest';
import { DEV_PRESETS } from '@content/dev/presets';
import type { ScreenId } from '@content/world/screens';
import { tileFeet } from '@core/world/screen';
import { Harness } from './harness';

/** Ask in Haugar's stone circle with Farvegr known, readied, and a full seiðr bar. */
function singer(screen: ScreenId = 'hau_circle', tile: readonly [number, number] = [10, 11]): Harness {
  const h = new Harness({ preset: DEV_PRESETS.hau });
  const s = h.sim.state;
  s.inv.galdr = ['eldr', 'farvegr'];
  s.world.warps = ['haugar', 'myrland'];
  s.hero.seidr = s.hero.maxSeidr;
  const p = tileFeet({ x: tile[0], y: tile[1] });
  h.sim.command({ t: 'warp', screen, x: p.x, y: p.y });
  h.idle(2);
  h.sim.command({ t: 'ready', galdr: 'farvegr' });
  h.idle(1);
  return h;
}

const picker = (h: Harness) => {
  const ui = h.sim.storyUi();
  return ui?.k === 'warps' ? ui : null;
};

describe('readying a galdr', () => {
  it('puts a known galdr first, for the galdr button; an unknown one is refused', () => {
    const h = singer();
    expect(h.sim.state.inv.galdr).toEqual(['farvegr', 'eldr']);
    h.sim.command({ t: 'ready', galdr: 'ljos' });
    h.idle(1);
    expect(h.sim.state.inv.galdr).toEqual(['farvegr', 'eldr']);
  });
});

describe('Farvegr', () => {
  it('opens a picker of the woken stones, and cancelling costs nothing', () => {
    const h = singer();
    const seidr = h.sim.state.hero.seidr;
    h.press(['galdr']);
    expect(picker(h)?.rows).toEqual(['haugar', 'myrland']);
    h.press(['cancel']);
    h.idle(2);
    expect(h.sim.mode).toBe('play');
    expect(h.sim.state.hero.seidr).toBe(seidr);
  });

  it('pays its seiðr and brings Ask to the stone they pick', () => {
    const h = singer();
    const seidr = h.sim.state.hero.seidr;
    h.press(['galdr']);
    h.press(['down']);
    h.press(['confirm']);
    h.until((s) => s.mode === 'play', 200);
    expect(h.sim.screen.id).toBe('myl_river');
    expect(h.sim.state.hero.seidr).toBe(seidr - h.sim.db.galdr.farvegr.cost);
    const at = tileFeet({ x: 10, y: 4 });
    expect(h.sim.hero.pos).toEqual(at);
    h.expectAnims();
  });

  it('fizzles for free underground and indoors', () => {
    for (const [screen, tile] of [
      ['hau_int_styrr', [19, 13]],
      ['d2_r01', [19, 18]],
    ] as const) {
      const h = singer(screen, tile);
      const seidr = h.sim.state.hero.seidr;
      h.press(['galdr']);
      expect(h.sim.mode).toBe('play');
      expect(h.events.some((e) => e.t === 'sfx' && e.id === 'sfx_fizzle')).toBe(true);
      expect(h.sim.state.hero.seidr).toBe(seidr);
    }
  });

  it('fizzles without the seiðr to pay for it', () => {
    const h = singer();
    h.sim.state.hero.seidr = 3;
    h.press(['galdr']);
    expect(h.sim.mode).toBe('play');
    expect(h.events.some((e) => e.t === 'sfx' && e.id === 'sfx_fizzle')).toBe(true);
  });
});
