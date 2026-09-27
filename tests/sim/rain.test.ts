import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import type { ContentDb } from '@core/sim/db';
import type { Thing } from '@core/world/screen';
import { FOG_RADIUS, LANTERN_FOG_RADIUS } from '@core/world/light';
import { Harness } from './harness';

/** An open field (test_a) with the given things, outdoors. */
function field(things: Thing[], opts: { indoor?: boolean } = {}): ContentDb {
  const map = Array.from({ length: 22 }, (_, y) =>
    y === 0 || y === 21 ? '#'.repeat(40) : '#' + '.'.repeat(38) + '#',
  );
  return { ...DB, screens: { ...DB.screens, test_a: { ...DB.screens.test_a, map, things, ...opts } } };
}

const braziers = (h: Harness) => h.sim.actors.filter((a) => a.kind === 'fixture' && a.def === 'brazier');
const LIT: Thing = { k: 'brazier', at: { x: 22, y: 10 }, lit: true };

describe('rain', () => {
  it('puts out a burning brazier outdoors', () => {
    const h = new Harness({ db: field([LIT]), tile: [18, 10] });
    h.idle(2);
    expect(braziers(h).map((b) => b.anim)).toEqual(['burn']);
    h.sim.command({ t: 'weather', kind: 'rain' });
    h.idle(2);
    expect(braziers(h).map((b) => b.anim)).toEqual(['out']);
    // It stays out when the rain stops.
    h.sim.command({ t: 'weather', kind: null });
    h.idle(2);
    expect(braziers(h).map((b) => b.anim)).toEqual(['out']);
  });

  it('leaves a brazier under a roof alone', () => {
    const h = new Harness({ db: field([LIT], { indoor: true }), tile: [18, 10] });
    h.sim.command({ t: 'weather', kind: 'storm' });
    h.idle(2);
    expect(braziers(h).map((b) => b.anim)).toEqual(['burn']);
  });
});

describe('fog', () => {
  it('closes in around Ask, and the lantern pushes it back', () => {
    const h = new Harness({ db: field([]), tile: [18, 10], minute: 12 * 60 });
    expect(h.sim.fog()).toEqual({ amount: 0, r: 0 });
    h.sim.command({ t: 'weather', kind: 'fog' });
    h.idle(1);
    expect(h.sim.fog().amount).toBeGreaterThan(0);
    expect(h.sim.fog().r).toBe(FOG_RADIUS);
    h.sim.state.inv.items.lantern = 1;
    expect(h.sim.fog().r).toBe(LANTERN_FOG_RADIUS);
    expect(h.sim.darkness()).toBe(0);
  });
});
