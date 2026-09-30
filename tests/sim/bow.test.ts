import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { itemMax } from '@core/items/defs';
import type { ContentDb } from '@core/sim/db';
import type { Thing } from '@core/world/screen';
import { Harness, frameOf } from './harness';

/** An open field (test_a walled round) with `things`. */
function field(things: Thing[], map?: string[]): ContentDb {
  const open = Array.from({ length: 22 }, (_, y) =>
    y === 0 || y === 21 ? '#'.repeat(40) : '#' + '.'.repeat(38) + '#',
  );
  return { ...DB, screens: { ...DB.screens, test_a: { ...DB.screens.test_a, map: map ?? open, things } } };
}

function archer(db: ContentDb, arrows = 30): Harness {
  const h = new Harness({ db, tile: [10, 10], facing: 'e' });
  h.sim.command({ t: 'give', item: 'bow', n: 1 });
  h.idle(1);
  h.sim.state.inv.items.arrows = arrows;
  h.sim.state.inv.slots = ['bow', null];
  return h;
}

const arrowsOut = (h: Harness) => h.sim.actors.filter((a) => a.kind === 'projectile' && a.def === 'arrow');

describe('the bow', () => {
  it('comes with a full quiver of thirty, and each quiver holds twenty more', () => {
    const h = new Harness({ db: field([]) });
    h.sim.command({ t: 'give', item: 'bow', n: 1 });
    h.idle(1);
    expect(h.sim.state.inv.items.arrows).toBe(30);
    expect(h.sim.state.inv.slots).toContain('bow');
    expect(itemMax(DB.items, { quiver: 1 }, 'arrows')).toBe(50);
    expect(itemMax(DB.items, { quiver: 2 }, 'arrows')).toBe(70);
  });

  it('looses an arrow the way Ask faces, one from the quiver, and it strikes a foe', () => {
    const h = archer(field([{ k: 'enemy', id: 'dummy', at: { x: 20, y: 10 } }]));
    h.press(['item1']);
    expect(h.sim.hero.fsm.s).toBe('shoot');
    expect(h.sim.state.inv.items.arrows).toBe(29);
    expect(arrowsOut(h)).toHaveLength(1);
    h.until((s) => !s.actors.some((a) => a.def === 'arrow'), 90);
    const dummy = h.sim.enemies[0];
    expect(h.events.some((e) => e.t === 'hit' && e.target === dummy?.id && e.dealt > 0)).toBe(true);
    h.expectAnims();
  });

  it('clicks empty without arrows', () => {
    const h = archer(field([]), 0);
    h.press(['item1']);
    expect(arrowsOut(h)).toHaveLength(0);
    expect(h.events.some((e) => e.t === 'sfx' && e.id === 'sfx_fizzle')).toBe(true);
    expect(h.sim.state.inv.items.arrows).toBe(0);
  });

  it('flies over water and stops at a wall', () => {
    const map = Array.from({ length: 22 }, (_, y) =>
      y === 0 || y === 21
        ? '#'.repeat(40)
        : '#' + '.'.repeat(11) + '~~~~' + '.'.repeat(8) + '#' + '.'.repeat(14) + '#',
    );
    const h = archer(field([], map));
    h.press(['item1']);
    let far = 0;
    for (let i = 0; i < 80; i++) {
      const a = arrowsOut(h)[0];
      if (a !== undefined) far = Math.max(far, a.pos.x);
      h.step(frameOf([]));
    }
    // Over the pond (cols 12–15) to the wall at col 24, not beyond.
    expect(far).toBeGreaterThan(16 * 16);
    expect(far).toBeLessThan(25 * 16);
  });
});

describe('eye switches', () => {
  const eye: Thing = { k: 'switch', at: { x: 12, y: 10 }, eye: true };
  const lit = (h: Harness) => h.sim.actors.find((a) => a.def === 'switch')?.mem['lit'] === 1;

  it('open only to an arrow: a blade just clinks', () => {
    const h = archer(field([eye]));
    h.sim.hero.pos = { x: 11 * 16 + 8, y: h.sim.hero.pos.y };
    h.press(['sword']).idle(24);
    expect(lit(h)).toBe(false);
    expect(h.events.some((e) => e.t === 'sfx' && e.id === 'sfx_block')).toBe(true);
    h.sim.hero.pos = { x: 6 * 16 + 8, y: h.sim.hero.pos.y };
    h.press(['item1']);
    h.until(() => lit(h), 60);
    expect(lit(h)).toBe(true);
  });
});

describe('arrows to be found', () => {
  it('drop only once the bow is owned, and an arrow pot holds some', () => {
    const h = archer(field([{ k: 'prop', id: 'arrow_pot', at: { x: 11, y: 10 } }]), 10);
    h.sim.hero.pos = { x: 10 * 16 + 8, y: 10 * 16 + 14 };
    h.sim.hero.facing = 'e';
    h.press(['sword']).idle(20);
    expect(h.sim.actors.some((a) => a.def === 'arrow_pot')).toBe(false);
    h.hold(['right'], 20);
    expect(h.sim.state.inv.items.arrows).toBeGreaterThan(10);
  });
});
