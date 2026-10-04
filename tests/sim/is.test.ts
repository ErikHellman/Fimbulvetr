import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { DEV_PRESETS } from '@content/dev/presets';
import type { EnemyId } from '@content/ids';
import type { ContentDb } from '@core/sim/db';
import type { Thing } from '@core/world/screen';
import { coverAt } from '@core/world/cover';
import { Harness, frameOf } from './harness';
import { crossTo, talkTo, walkTo } from './walk';
import { tileFeet } from '@core/world/screen';

/** At the cairns pool's north shore in summer, an Ís stave readied in slot K (two carried). */
function byThePool(): Harness {
  const h = new Harness({
    preset: DEV_PRESETS.fimbul,
    screen: 'nif_cairns',
    tile: [17, 5],
    facing: 's',
    season: 'summer',
  });
  h.sim.state.inv.items = { ...h.sim.state.inv.items, stave_is: 2 };
  h.sim.state.inv.slots = ['stave_is', h.sim.state.inv.slots[1]];
  return h;
}

const iceAt = (h: Harness, x: number, y: number) =>
  coverAt(h.sim.screen.cover, DB.coverOrder, x, y) === 'is_ice';

describe('an Ís rune-stave', () => {
  it('sings Ís for no seiðr, spends one stave, and lays ice on the still water it reaches', () => {
    const h = byThePool();
    const seidr = h.sim.state.hero.seidr;
    h.press(['item1']).idle(30);
    expect(h.sim.state.inv.items.stave_is).toBe(1);
    expect(h.sim.state.hero.seidr).toBe(seidr);
    expect(h.events).toContainEqual({ t: 'sfx', id: 'sfx_is' });
    expect([iceAt(h, 16, 6), iceAt(h, 17, 7), iceAt(h, 18, 7)]).toEqual([true, true, true]);
    expect(iceAt(h, 17, 8)).toBe(false);
  });

  it('two casts make a road of ice out to the islet and its heart piece', () => {
    const h = byThePool();
    h.press(['item1']).idle(30);
    walkTo(h, 17, 7);
    h.press(['item1']).idle(30);
    expect(h.sim.state.inv.items.stave_is ?? 0).toBe(0);
    expect(h.sim.state.inv.slots[0]).toBeNull();
    walkTo(h, 17, 10);
    expect(h.sim.state.world.pieces).toContain('hp_nif_cairns');
  });

  it('thaws once Ask leaves the screen', () => {
    const h = byThePool();
    h.press(['item1']).idle(30);
    expect(iceAt(h, 17, 6)).toBe(true);
    walkTo(h, 38, 13);
    crossTo(h, 'e', 'nif_jars');
    h.idle(10);
    crossTo(h, 'w', 'nif_cairns');
    expect(iceAt(h, 17, 6)).toBe(false);
  });

  it('never freezes running or black water', () => {
    const h = byThePool();
    walkTo(h, 26, 9);
    h.press(['right']);
    h.press(['item1']).idle(30);
    expect(h.sim.screen.cover.kind.some((k) => DB.coverOrder[k - 1] === 'is_ice')).toBe(false);
  });
});

describe('Sölvi’s staves', () => {
  it('sells Ís staves for 40 silver once the rime is melted, three at most', () => {
    const h = new Harness({ preset: DEV_PRESETS.fimbul });
    Object.assign(h.sim.state.flags, { n_solvi_met: true, st_hlif_learned: true, st_rime_open: true });
    h.sim.state.hero.silver = 200;
    const p = tileFeet({ x: 19, y: 14 });
    h.sim.command({ t: 'warp', screen: 'upp_int_runehall', x: p.x, y: p.y });
    h.idle(2);
    talkTo(h, 'solvi');
    expect(h.sim.state.inv.items.stave_is).toBe(1);
    expect(h.sim.state.hero.silver).toBe(160);
    talkTo(h, 'solvi');
    talkTo(h, 'solvi');
    talkTo(h, 'solvi');
    expect(h.sim.state.inv.items.stave_is).toBe(3);
    expect(h.sim.state.hero.silver).toBe(80);
  });
});

/** Opens test_a and puts `id` at (`x`, 10), with health enough to measure a blow by. */
function arena(id: EnemyId, x: number): ContentDb {
  const open = Array.from({ length: 22 }, (_, y) =>
    y === 0 || y === 21 ? '#'.repeat(40) : '#' + '.'.repeat(38) + '#',
  );
  const things: Thing[] = [{ k: 'enemy', id, at: { x, y: 10 } }];
  return {
    ...DB,
    enemies: { ...DB.enemies, [id]: { ...DB.enemies[id], hp: 60 } },
    screens: { ...DB.screens, test_a: { ...DB.screens.test_a, map: open, things } },
  };
}

/** Walks up to the first foe and strikes it once; returns the damage dealt. */
function strike(h: Harness): number {
  const foe = () => {
    const e = h.sim.enemies[0];
    if (e === undefined) throw new Error('no foe');
    return e;
  };
  for (let i = 0; i < 90; i++) {
    const dx = foe().pos.x - h.sim.hero.pos.x;
    const dy = foe().pos.y - h.sim.hero.pos.y;
    if (Math.abs(dx) < 18 && Math.abs(dy) < 4) break;
    h.step(frameOf(Math.abs(dy) >= 4 ? [dy < 0 ? 'up' : 'down'] : [dx < 0 ? 'left' : 'right']));
  }
  h.press([foe().pos.x < h.sim.hero.pos.x ? 'left' : 'right']);
  const before = foe().hp;
  h.step(frameOf(['sword'], ['sword'])).idle(12);
  return before - foe().hp;
}

describe('Ís, the ice-song', () => {
  it('costs 3 seiðr from the galdr button and freezes a foe where it stands: no moves, no blows', () => {
    const h = new Harness({ db: arena('draugr', 16), tile: [10, 10], facing: 'e' });
    h.sim.state.inv.galdr = ['is'];
    h.sim.state.hero.seidr = 10;
    h.press(['galdr']).idle(20);
    expect(h.sim.state.hero.seidr).toBe(7);
    const foe = h.sim.enemies[0];
    expect(foe?.mem['frozen']).toBeGreaterThan(200);
    const at = { ...foe?.pos };
    const hp = h.sim.hero.hp;
    walkTo(h, 15, 10);
    h.idle(60);
    expect(h.sim.enemies[0]?.pos).toEqual(at);
    expect(h.sim.hero.hp).toBe(hp);
    h.idle(240);
    expect(h.sim.enemies[0]?.mem['frozen'] ?? 0).toBe(0);
  });

  it('a frozen foe shatters under a blow for double damage, and thaws', () => {
    const plain = new Harness({ db: arena('draugr', 16), tile: [10, 10], facing: 'e' });
    const base = strike(plain);
    expect(base).toBeGreaterThan(0);
    const h = new Harness({ db: arena('draugr', 16), tile: [10, 10], facing: 'e' });
    h.sim.state.inv.galdr = ['is'];
    h.sim.state.hero.seidr = 10;
    h.press(['galdr']).idle(20);
    expect(strike(h)).toBe(base * 2);
    expect(h.sim.enemies[0]?.mem['frozen'] ?? 0).toBe(0);
  });
});
