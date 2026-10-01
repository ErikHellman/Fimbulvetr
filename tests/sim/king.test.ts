import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import type { ContentDb } from '@core/sim/db';
import type { Thing } from '@core/world/screen';
import { KING } from '@core/actors/enemies/king';
import { Harness, frameOf } from './harness';

/** The King's hall on test_a (part of d3): walled round, the King at (20, 8), the heart on `clear`. */
function hall(): ContentDb {
  const map = Array.from({ length: 22 }, (_, y) =>
    y === 0 || y === 21 ? '8'.repeat(40) : '8' + '7'.repeat(38) + '8',
  );
  const things: Thing[] = [
    { k: 'enemy', id: 'haugkonungr', at: { x: 20, y: 8 } },
    { k: 'heart', id: 'hc_test', at: { x: 20, y: 4 }, appear: 'clear' },
  ];
  return { ...DB, screens: { ...DB.screens, test_a: { ...DB.screens.test_a, map, things, dungeon: 'd3' } } };
}

const king = (h: Harness) => h.sim.enemies.find((e) => e.def === 'haugkonungr');

/** Ask with the bow, below the King, hardy enough to take what comes. */
function court(): Harness {
  const h = new Harness({ db: hall(), tile: [20, 15], facing: 'n' });
  h.sim.command({ t: 'give', item: 'bow', n: 1 });
  h.idle(1);
  h.sim.state.inv.slots = ['bow', null];
  h.sim.hero.hp = 999;
  h.sim.hero.maxHp = 999;
  return h;
}

/** Faces the King and looses an arrow at him. */
function shootAt(h: Harness): void {
  h.until((s) => s.hero.fsm.s === 'move', 60);
  const k = king(h);
  if (k === undefined) return;
  const dx = k.pos.x - h.sim.hero.pos.x;
  const dy = k.pos.y - h.sim.hero.pos.y;
  h.sim.hero.facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'e' : 'w') : dy > 0 ? 's' : 'n';
  h.press(['item1']);
}

describe('the Haugbúi King', () => {
  it('turns blade and arrow alike while his crown is dark', () => {
    const h = court();
    h.until(() => king(h)?.fsm.s === 'stalk', 200);
    const k = king(h);
    if (k === undefined) throw new Error('no king');
    expect(h.sim.boss()?.name.en).toBe('The Haugbúi King');
    shootAt(h);
    h.idle(30);
    expect(k.hp).toBe(24);
    expect(k.fsm.s).not.toBe('fallen');
  });

  it('lowers his head for 500 ms before he charges; an arrow in the blazing crown fells him for 2.5 s', () => {
    const h = court();
    h.until(() => king(h)?.fsm.s === 'lower', 600);
    const lowered = h.sim.tick;
    h.until(() => king(h)?.fsm.s === 'charge', 60);
    expect(h.sim.tick - lowered).toBe(KING.lowerTicks);
    // The next time: an arrow while the crown blazes.
    h.until(() => king(h)?.fsm.s === 'lower', 900, frameOf([]));
    shootAt(h);
    h.until(() => king(h)?.fsm.s === 'fallen', 60);
    const fell = h.sim.tick;
    const k = king(h);
    if (k === undefined) throw new Error('no king');
    // Open to the blade now.
    h.sim.hero.pos = { x: k.pos.x, y: k.pos.y + 20 };
    h.sim.hero.facing = 'n';
    h.idle(14).press(['sword']).idle(14);
    expect(k.hp).toBeLessThan(24);
    h.until(() => king(h)?.fsm.s !== 'fallen', 200);
    expect(h.sim.tick - fell).toBeGreaterThanOrEqual(KING.fallenTicks - 20);
    h.expectAnims();
  });

  it('calls two archers up at two thirds of his health, and hurls a returning axe at the last third', () => {
    const h = court();
    h.until(() => king(h)?.fsm.s === 'stalk', 200);
    const k = king(h);
    if (k === undefined) throw new Error('no king');
    k.hp = 16;
    k.fsm = { s: 'fallen', t: 0 };
    h.idle(2);
    expect(k.mem['phase']).toBe(1);
    expect(h.sim.enemies.filter((e) => e.def === 'bogdraugr')).toHaveLength(2);
    k.hp = 8;
    k.fsm = { s: 'fallen', t: 0 };
    h.idle(2);
    expect(h.sim.boss()?.phase).toBe(2);
    h.until(() => h.sim.actors.some((a) => a.def === 'axe'), 600);
    h.until(() => !h.sim.actors.some((a) => a.def === 'axe'), 300);
    h.expectAnims();
  });

  it('takes his archers with him, and the heart container appears', () => {
    const h = court();
    h.until(() => king(h)?.fsm.s === 'stalk', 200);
    const k = king(h);
    if (k === undefined) throw new Error('no king');
    k.hp = 16;
    k.fsm = { s: 'fallen', t: 0 };
    h.idle(2);
    h.sim.command({ t: 'killAll' });
    h.idle(4);
    expect(h.sim.enemies).toHaveLength(0);
    expect(h.sim.state.dungeons.d3.bossDead).toBe(true);
    expect(h.sim.actors.find((a) => a.kind === 'pickup' && a.def === 'heart_container')?.mem['wait']).toBe(0);
  });
});
