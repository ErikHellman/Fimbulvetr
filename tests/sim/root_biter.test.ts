import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import type { ContentDb } from '@core/sim/db';
import type { Thing } from '@core/world/screen';
import { Harness } from './harness';
import { face, walkTo } from './walk';

/** test_a opened up, a root-biter at (16,10). */
function den(): ContentDb {
  const map = Array.from({ length: 22 }, (_, y) =>
    y === 0 || y === 21 ? '#'.repeat(40) : '#' + '.'.repeat(38) + '#',
  );
  const things: Thing[] = [{ k: 'enemy', id: 'root_biter', at: { x: 16, y: 10 } }];
  return { ...DB, screens: { ...DB.screens, test_a: { ...DB.screens.test_a, map, things } } };
}

const biter = (h: Harness) => {
  const e = h.sim.enemies[0];
  if (e === undefined) throw new Error('no root-biter');
  return e;
};

describe('the root-biter', () => {
  it('lies buried and untouchable until Ask comes near', () => {
    const h = new Harness({ db: den(), tile: [16, 15], facing: 'n' });
    h.idle(120);
    expect(biter(h).fsm.s).toBe('buried');
    expect(biter(h).anim).toBe('buried');
    biter(h).iframes = 0;
    h.idle(1);
    expect(biter(h).iframes).toBeGreaterThan(0);
  });

  it('rears up with a tell and bites whoever stands close', () => {
    const h = new Harness({ db: den(), tile: [16, 15], facing: 'n' });
    const hp = h.sim.hero.hp;
    walkTo(h, 16, 12);
    h.until((s) => s.enemies[0]?.fsm.s === 'emerge', 60);
    expect(biter(h).anim).toBe('tell');
    h.until((s) => s.enemies[0]?.fsm.s === 'bite', 40);
    h.idle(8);
    expect(h.sim.hero.hp).toBeLessThan(hp);
  });

  it('falls to the sword once it is up', () => {
    const h = new Harness({ db: den(), tile: [16, 15], facing: 'n' });
    h.sim.command({ t: 'god', on: true });
    walkTo(h, 16, 12);
    for (let i = 0; i < 30 && h.sim.enemies.length > 0; i++) {
      h.until((s) => s.enemies.length === 0 || ['up', 'emerge'].includes(s.enemies[0]?.fsm.s ?? ''), 300);
      face(h, 'n');
      h.press(['sword']).idle(10);
    }
    expect(h.sim.enemies).toHaveLength(0);
    expect(h.count('killed')).toBe(1);
  });

  it('is held up by the boomerang, open to the blade', () => {
    const h = new Harness({ db: den(), tile: [16, 12], facing: 'n' });
    h.sim.command({ t: 'god', on: true });
    h.sim.state.inv.items.boomerang = 1;
    h.sim.state.inv.slots = ['boomerang', null];
    h.until((s) => s.enemies[0]?.fsm.s === 'up', 200);
    h.press(['item1']);
    h.until((s) => (s.enemies[0]?.mem['stun'] ?? 0) > 0, 30);
    h.idle(80);
    expect(biter(h).fsm.s).toBe('up');
    expect(biter(h).mem['stun']).toBeGreaterThan(0);
  });
});
