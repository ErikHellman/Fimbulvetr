import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import type { ContentDb } from '@core/sim/db';
import type { Thing } from '@core/world/screen';
import { TILE } from '@core/world/dims';
import { Harness } from './harness';

/**
 * A crypt room on test_a: floor (`7`) walled round (`8`), a band of pits (`0`) across cols 14–21 with a
 * ghost floor (`9`) through it on row 10.
 */
function crypt(things: Thing[] = []): ContentDb {
  const map = Array.from({ length: 22 }, (_, y) => {
    if (y === 0 || y === 21) return '8'.repeat(40);
    const band = y === 10 ? '9'.repeat(8) : '0'.repeat(8);
    return '8' + '7'.repeat(13) + band + '7'.repeat(17) + '8';
  });
  return {
    ...DB,
    screens: { ...DB.screens, test_a: { ...DB.screens.test_a, map, things, dungeon: 'd3' } },
  };
}

const col = (h: Harness): number => Math.floor(h.sim.hero.pos.x / TILE);

describe('pits and ghost floors', () => {
  it('stop Ask at a pit’s edge, but the hidden floor carries them across', () => {
    const pit = new Harness({ db: crypt(), tile: [10, 8], facing: 'e' });
    pit.hold(['right'], 120);
    expect(col(pit)).toBe(13);
    const ghost = new Harness({ db: crypt(), tile: [10, 10], facing: 'e' });
    ghost.hold(['right'], 220);
    expect(col(ghost)).toBeGreaterThan(21);
  });

  it('show their hidden floor only in the lantern’s light or a burning brazier’s', () => {
    const dark = new Harness({ db: crypt(), tile: [13, 10], facing: 'e' });
    dark.idle(1);
    expect(dark.sim.ghosts()).toEqual([]);
    const lamp = new Harness({ db: crypt(), tile: [13, 10], facing: 'e' });
    lamp.sim.state.inv.items.lantern = 1;
    lamp.idle(1);
    const shown = lamp.sim.ghosts();
    expect(shown).toContainEqual({ x: 14, y: 10 });
    expect(shown).not.toContainEqual({ x: 21, y: 10 });
    const fire = new Harness({
      db: crypt([{ k: 'brazier', at: { x: 21, y: 9 }, lit: true }]),
      tile: [4, 4],
    });
    fire.idle(1);
    expect(fire.sim.ghosts()).toContainEqual({ x: 20, y: 10 });
    expect(fire.sim.ghosts()).not.toContainEqual({ x: 14, y: 10 });
  });

  it('let arrows fly over pits', () => {
    const h = new Harness({ db: crypt(), tile: [12, 8], facing: 'e' });
    h.sim.command({ t: 'give', item: 'bow', n: 1 });
    h.idle(1);
    h.sim.state.inv.slots = ['bow', null];
    h.press(['item1']);
    let far = 0;
    for (let i = 0; i < 40; i++) {
      const a = h.sim.actors.find((x) => x.def === 'arrow');
      if (a !== undefined) far = Math.max(far, a.pos.x);
      h.idle(1);
    }
    expect(far).toBeGreaterThan(22 * TILE);
  });
});

describe('grave-gold and the sleeping dead', () => {
  const tomb = (): ContentDb =>
    crypt([
      { k: 'enemy', id: 'draugr', at: { x: 6, y: 5 }, asleep: true },
      { k: 'enemy', id: 'draugr', at: { x: 8, y: 5 }, asleep: true },
      { k: 'prop', id: 'grave_gold', at: { x: 7, y: 8 } },
      {
        k: 'chest',
        id: 'c_tomb',
        at: { x: 30, y: 4 },
        gives: { silver: 5, text: { en: 'x', sv: 'x' } },
        appear: 'clear',
      },
    ]);
  const sleepers = (h: Harness) => h.sim.enemies.filter((e) => e.mem['asleep'] === 1);

  it('lie still and harmless, cannot be struck, and keep the room from being clear', () => {
    const h = new Harness({ db: tomb(), tile: [7, 6], facing: 'n' });
    h.idle(120);
    expect(sleepers(h)).toHaveLength(2);
    const hp = h.sim.hero.hp;
    const foe = h.sim.enemies[0];
    h.sim.hero.pos = { x: foe?.pos.x ?? 0, y: (foe?.pos.y ?? 0) + 14 };
    h.press(['sword']).idle(30);
    expect(h.sim.enemies.every((e) => e.hp === e.maxHp)).toBe(true);
    expect(h.sim.hero.hp).toBe(hp);
    expect(h.sim.actors.find((a) => a.def === 'chest')?.mem['wait']).toBe(1);
    h.expectAnims();
  });

  it('wake when the gold is lifted, and once beaten the room gives up its chest', () => {
    const h = new Harness({ db: tomb(), tile: [7, 9], facing: 'n' });
    h.idle(2);
    h.press(['interact']);
    expect(h.sim.hero.fsm.s).toBe('lift');
    expect(sleepers(h)).toHaveLength(0);
    expect(h.events.some((e) => e.t === 'sfx' && e.id === 'sfx_wake')).toBe(true);
    h.idle(60);
    expect(h.sim.enemies.every((e) => e.fsm.s !== 'rise')).toBe(true);
    h.sim.command({ t: 'killAll' });
    h.idle(4);
    expect(h.sim.actors.find((a) => a.def === 'chest')?.mem['wait']).toBe(0);
    h.expectAnims();
  });
});
