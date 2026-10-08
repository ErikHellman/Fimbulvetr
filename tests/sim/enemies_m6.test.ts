import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import type { EnemyId } from '@content/ids';
import type { ContentDb } from '@core/sim/db';
import type { Thing } from '@core/world/screen';
import { MARA } from '@core/actors/enemies/mara';
import { Harness, frameOf } from './harness';

/** Opens test_a and puts `id` at (`x`, 10). */
function arena(id: EnemyId, x = 16): ContentDb {
  const open = Array.from({ length: 22 }, (_, y) =>
    y === 0 || y === 21 ? '#'.repeat(40) : '#' + '.'.repeat(38) + '#',
  );
  const things: Thing[] = [{ k: 'enemy', id, at: { x, y: 10 } }];
  return { ...DB, screens: { ...DB.screens, test_a: { ...DB.screens.test_a, map: open, things } } };
}

const foe = (h: Harness) => {
  const e = h.sim.enemies[0];
  if (e === undefined) throw new Error('no foe');
  return e;
};

describe('mara', () => {
  it('drifts unseen and untouchable until three tiles off, then shows itself and leaps', () => {
    const h = new Harness({ db: arena('mara', 20), tile: [10, 10], facing: 'e' });
    h.idle(20);
    expect(foe(h).anim).toBe('hide');
    expect(foe(h).iframes).toBeGreaterThan(0);
    h.until((s) => s.enemies[0]?.fsm.s === 'show', 900);
    expect(foe(h).anim).toBe('tell');
    h.until((s) => s.enemies[0]?.fsm.s === 'leap', MARA.showTicks + 2);
  });

  it('rides Ask and drains seiðr until a roll throws it off, and then lies open to the blade', () => {
    const h = new Harness({ db: arena('mara', 13), tile: [10, 10], facing: 'e' });
    h.sim.state.hero.seidr = 10;
    h.until((s) => s.enemies[0]?.fsm.s === 'ride', 300);
    h.idle(MARA.drainEvery * 3 + 2);
    expect(h.sim.state.hero.seidr).toBe(7);
    expect(foe(h).fsm.s).toBe('ride');
    h.press(['roll']);
    h.idle(2);
    expect(foe(h).fsm.s).toBe('thrown');
    const hp = foe(h).hp;
    // Walk back to it where it lies, and strike.
    for (let i = 0; i < 60; i++) {
      const dx = foe(h).pos.x - h.sim.hero.pos.x;
      const dy = foe(h).pos.y - h.sim.hero.pos.y;
      if (Math.abs(dx) < 18 && Math.abs(dy) < 4) break;
      h.step(frameOf(Math.abs(dy) >= 4 ? [dy < 0 ? 'up' : 'down'] : [dx < 0 ? 'left' : 'right']));
    }
    h.press([foe(h).pos.x < h.sim.hero.pos.x ? 'left' : 'right']);
    h.step(frameOf(['sword'], ['sword'])).idle(12);
    expect(foe(h).hp).toBeLessThan(hp);
  });

  it('takes hearts once the seiðr is gone', () => {
    const h = new Harness({ db: arena('mara', 13), tile: [10, 10], facing: 'e' });
    h.sim.state.hero.seidr = 0;
    const hp = h.sim.hero.hp;
    h.until((s) => s.enemies[0]?.fsm.s === 'ride', 300);
    h.idle(MARA.drainEvery * 2 + 2);
    expect(h.sim.hero.hp).toBeLessThan(hp);
  });
});

describe('fog-draugr', () => {
  it('lies hidden while Ask walks up facing it, and rises only when they are on top of it', () => {
    const h = new Harness({ db: arena('fog_draugr', 20), tile: [12, 10], facing: 'e' });
    h.idle(10);
    expect(foe(h).fsm.s).toBe('hidden');
    h.until((s) => s.hero.pos.x > 18 * 16 - 4, 400, frameOf(['right']));
    expect(foe(h).fsm.s).toBe('hidden');
    h.until((s) => s.enemies[0]?.fsm.s === 'rise', 200, frameOf(['right']));
  });

  it('rises behind Ask once they pass it with their back turned', () => {
    const h = new Harness({ db: arena('fog_draugr', 16), tile: [20, 10], facing: 'e' });
    h.idle(4);
    expect(foe(h).fsm.s).toBe('rise');
    expect(foe(h).iframes).toBeGreaterThan(0);
    h.until((s) => s.enemies[0]?.fsm.s === 'stalk', 60);
  });

  it('sinks back into the fog when Ask gets away', () => {
    const h = new Harness({ db: arena('fog_draugr', 6), tile: [9, 10], facing: 'e' });
    h.until((s) => s.enemies[0]?.fsm.s === 'stalk', 100);
    h.until((s) => s.enemies[0]?.fsm.s === 'sink', 900, frameOf(['right']));
    h.idle(40);
    expect(foe(h).fsm.s).toBe('hidden');
    h.expectAnims();
  });
});
