import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import type { ContentDb } from '@core/sim/db';
import { BOMB, blast } from '@core/sim/systems/bombs';
import type { Thing } from '@core/world/screen';
import { Harness } from './harness';

/** An open yard on test_a with the given things. */
function yard(things: Thing[]): ContentDb {
  const map = Array.from({ length: 22 }, (_, y) =>
    y === 0 || y === 21 ? '#'.repeat(40) : '#' + '·'.repeat(38) + '#',
  );
  return { ...DB, screens: { ...DB.screens, test_a: { ...DB.screens.test_a, map, things } } };
}

describe('the iron warden (jarnvordr)', () => {
  it('turns the sword until a blast cracks its plates; then the blade bites', () => {
    const h = new Harness({
      db: yard([{ k: 'enemy', id: 'jarnvordr', at: { x: 30, y: 10 } }]),
      tile: [10, 10],
    });
    h.idle(1);
    const foe = h.sim.enemies[0];
    if (foe === undefined) throw new Error('no warden');
    const hp = foe.hp;
    const swing = (): void => {
      foe.pos = { x: h.sim.hero.pos.x + 22, y: h.sim.hero.pos.y };
      foe.iframes = 0;
      h.sim.hero.facing = 'e';
      h.press(['sword']).idle(8);
    };
    h.idle(60);
    swing();
    expect(foe.hp).toBe(hp);
    blast(h.sim, { ...foe.pos });
    expect(foe.mem['cracked']).toBe(1);
    expect(foe.hp).toBe(hp - BOMB.toFoes);
    h.idle(40);
    swing();
    expect(foe.hp).toBeLessThan(hp - BOMB.toFoes);
  });

  it('needs bombs (the hammer comes later)', () => {
    expect(DB.enemies.jarnvordr.needs).toEqual(['bombs']);
  });
});

describe('the ember sprite (glóð)', () => {
  it('flies, glows, and is put out at once by Ís', () => {
    expect(DB.enemies.glod.flies).toBe(true);
    expect(DB.enemies.glod.glow).toBeGreaterThan(0);
    const h = new Harness({ db: yard([{ k: 'enemy', id: 'glod', at: { x: 20, y: 10 } }]), tile: [10, 10] });
    h.sim.state.inv.galdr = ['is'];
    h.sim.state.hero.seidr = 10;
    h.idle(1);
    const foe = h.sim.enemies[0];
    if (foe === undefined) throw new Error('no ember');
    foe.pos = { x: h.sim.hero.pos.x + 40, y: h.sim.hero.pos.y };
    h.sim.hero.facing = 'e';
    h.press(['galdr']);
    h.until((s) => s.enemies.length === 0, 40);
    expect(h.sim.enemies).toHaveLength(0);
  });
});
