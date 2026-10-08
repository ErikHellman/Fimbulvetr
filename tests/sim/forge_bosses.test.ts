import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { BELGR } from '@core/actors/enemies/belgr';
import { IVALDI } from '@core/actors/enemies/ivaldi';
import type { Entity } from '@core/actors/entity';
import type { ContentDb } from '@core/sim/db';
import { blast } from '@core/sim/systems/bombs';
import type { Thing } from '@core/world/screen';
import { Harness } from './harness';

function hall(things: Thing[]): ContentDb {
  const map = Array.from({ length: 22 }, (_, y) =>
    y === 0 || y === 21 ? '#'.repeat(40) : '#' + '░'.repeat(38) + '#',
  );
  return { ...DB, screens: { ...DB.screens, test_a: { ...DB.screens.test_a, map, things } } };
}

function boss(h: Harness, id: string): Entity {
  const e = h.sim.enemies.find((a) => a.def === id);
  if (e === undefined) throw new Error(`no ${id}`);
  return e;
}

/** Waits until the foe is in `state` (the hero standing still, god-moded so nothing ends the test). */
function until(h: Harness, e: Entity, state: string, max = 1200): void {
  h.until(() => e.fsm.s === state, max);
}

describe('Belgr, the bellows construct', () => {
  it('turns the sword, breathes fire, and staggers when a blast meets its open intake', () => {
    const h = new Harness({ db: hall([{ k: 'enemy', id: 'belgr', at: { x: 20, y: 8 } }]), tile: [20, 14] });
    h.sim.god = true;
    const b = boss(h, 'belgr');
    until(h, b, 'swell');
    until(h, b, 'breathe');
    until(h, b, 'draw');
    expect(b.mem['exposed']).toBe(1);
    blast(h.sim, { x: b.pos.x, y: b.pos.y + 4 });
    h.idle(2);
    expect(b.fsm.s).toBe('reel');
    expect(b.mem['guard']).toBe(0);
    h.idle(BELGR.reelTicks);
    expect(['stalk', 'swell']).toContain(b.fsm.s);
  });
});

describe('Ívaldi, the Anvil', () => {
  function fight(): { h: Harness; iv: Entity } {
    const h = new Harness({ db: hall([{ k: 'enemy', id: 'ivaldi', at: { x: 20, y: 10 } }]), tile: [20, 13] });
    h.sim.god = true;
    h.sim.state.inv.items.hammer = 1;
    h.sim.state.inv.slots = ['hammer', null];
    h.sim.state.inv.galdr = ['skjalfti', 'is'];
    h.sim.state.hero.seidr = 20;
    return { h, iv: boss(h, 'ivaldi') };
  }

  /** Brings the hammer down on him from where Ask stands, facing him. */
  function hammer(h: Harness, iv: Entity): void {
    h.until((s) => s.hero.fsm.s === 'move', 120);
    h.sim.hero.pos = { x: iv.pos.x, y: iv.pos.y + 16 };
    h.sim.hero.facing = 'n';
    h.press(['item1']).idle(DB.tuning.hero.hammerTicks);
  }

  it('phase 1: his hammer sticks after a slam, and the dwarf hammer breaks a plate', () => {
    const { h, iv } = fight();
    until(h, iv, 'stuck');
    expect(iv.mem['exposed']).toBe(1);
    hammer(h, iv);
    expect(['open', 'climb', 'stalk']).toContain(iv.fsm.s);
    expect(iv.mem['plates']).toBe(1);
  });

  it('phase 2: on his anvil until Skjálfti throws him off', () => {
    const { h, iv } = fight();
    iv.hp = 16;
    until(h, iv, 'stuck');
    hammer(h, iv);
    until(h, iv, 'anvil');
    h.sim.state.inv.galdr = ['skjalfti', 'is'];
    h.press(['galdr']).idle(2);
    expect(iv.fsm.s).toBe('thrown');
    expect(iv.mem['guard']).toBe(0);
  });

  it('phase 3: white-hot until Ís cools him; then the hammer bites', () => {
    const { h, iv } = fight();
    iv.hp = 8;
    iv.mem['phase'] = 1;
    iv.fsm = { s: 'open', t: IVALDI.openTicks - 2 };
    h.idle(4);
    until(h, iv, 'stalk');
    expect(iv.mem['hot']).toBe(1);
    h.sim.state.inv.galdr = ['is'];
    h.sim.hero.pos = { x: iv.pos.x, y: iv.pos.y + 40 };
    h.sim.hero.facing = 'n';
    h.press(['galdr']);
    until(h, iv, 'cooled', 60);
    hammer(h, iv);
    expect(iv.fsm.s).toBe('open');
    // The opening over, he glows white-hot again.
    iv.hp = 8;
    until(h, iv, 'glow', IVALDI.openTicks + 2);
    until(h, iv, 'stalk', IVALDI.glowTicks + 2);
    expect(iv.mem['hot']).toBe(1);
  });
});
