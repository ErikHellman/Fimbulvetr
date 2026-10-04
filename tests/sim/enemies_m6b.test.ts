import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import type { EnemyId } from '@content/ids';
import type { ContentDb } from '@core/sim/db';
import type { Thing } from '@core/world/screen';
import { mem } from '@core/actors/entity';
import { GARMR } from '@core/actors/enemies/garmr';
import { HELHOUND } from '@core/actors/enemies/helhound';
import { NASTROND } from '@core/actors/enemies/nastrond';
import { Harness, frameOf } from './harness';

/** Opens test_a and puts each foe at (x, y). */
function arena(foes: readonly (readonly [EnemyId, number, number])[]): ContentDb {
  const open = Array.from({ length: 22 }, (_, y) =>
    y === 0 || y === 21 ? '#'.repeat(40) : '#' + '.'.repeat(38) + '#',
  );
  const things: Thing[] = foes.map(([id, x, y]) => ({ k: 'enemy', id, at: { x, y } }));
  return { ...DB, screens: { ...DB.screens, test_a: { ...DB.screens.test_a, map: open, things } } };
}

const byDef = (h: Harness, def: EnemyId) => {
  const e = h.sim.enemies.find((a) => a.def === def);
  if (e === undefined) throw new Error(`no ${def}`);
  return e;
};

function withGrapple(h: Harness): Harness {
  h.sim.state.inv.items.grapple = 1;
  h.sim.state.inv.slots = ['grapple', null];
  return h;
}

/** Strikes until `foe` loses health or `budget` swings are spent; returns the health lost. */
function strike(h: Harness, def: EnemyId, budget = 6): number {
  const hp = byDef(h, def).hp;
  for (let i = 0; i < budget && byDef(h, def).hp === hp; i++) h.step(frameOf(['sword'], ['sword'])).idle(14);
  return hp - byDef(h, def).hp;
}

describe('hel-hounds', () => {
  it('crouch together: the second lunges a beat after the first', () => {
    const h = new Harness({
      db: arena([
        ['helhound', 14, 9],
        ['helhound', 14, 12],
      ]),
      tile: [10, 10],
      facing: 'e',
    });
    h.until((s) => s.enemies.some((e) => e.fsm.s === 'lunge'), 300);
    const [a, b] = h.sim.enemies;
    const first = a?.fsm.s === 'lunge' ? a : b;
    const second = first === a ? b : a;
    expect(second?.fsm.s).toBe('tell');
    expect(mem(second ?? first ?? h.sim.hero, 'pair')).toBe(1);
    h.until(() => second?.fsm.s === 'lunge', HELHOUND.pairLag + 4);
  });

  it('are light: the grapple drags one in', () => {
    const h = withGrapple(new Harness({ db: arena([['helhound', 16, 10]]), tile: [10, 10], facing: 'e' }));
    h.press(['item1']);
    h.until((s) => !s.actors.some((a) => a.def === 'grapple'), 120);
    expect(byDef(h, 'helhound').pos.x).toBeLessThan(13 * 16);
    expect(mem(byDef(h, 'helhound'), 'stun')).toBeGreaterThan(0);
  });
});

describe('Garmr', () => {
  it('sleeps until Ask comes near, roars, and shrugs off every blow', () => {
    const h = new Harness({ db: arena([['garmr', 20, 10]]), tile: [6, 10], facing: 'e' });
    h.idle(30);
    expect(byDef(h, 'garmr').fsm.s).toBe('sleep');
    h.until((s) => s.enemies[0]?.fsm.s === 'roar', 400, frameOf(['right']));
    expect(h.sim.boss()?.name.en).toBe('Garmr');
    h.until((s) => s.enemies[0]?.fsm.s === 'stalk', GARMR.roarTicks + 2);
    expect(mem(byDef(h, 'garmr'), 'guard')).toBe(1);
  });

  it('breathes frost close in, and lunges from further off', () => {
    const h = new Harness({ db: arena([['garmr', 13, 10]]), tile: [10, 10], facing: 'e' });
    h.until((s) => s.enemies[0]?.fsm.s === 'breath', 200);
    const far = new Harness({ db: arena([['garmr', 18, 10]]), tile: [10, 10], facing: 'e' });
    far.until((s) => s.enemies[0]?.fsm.s === 'lunge', 400);
  });

  it('hooked by its collar ring, it reels open to the blade', () => {
    const h = withGrapple(new Harness({ db: arena([['garmr', 16, 10]]), tile: [10, 10], facing: 'e' }));
    h.until((s) => s.enemies[0]?.fsm.s === 'stalk', 200);
    h.press(['item1']);
    h.until((s) => s.enemies[0]?.fsm.s === 'reel', 60);
    expect(mem(byDef(h, 'garmr'), 'guard')).toBe(0);
    // Walk up and strike.
    h.until((s) => (s.enemies[0]?.pos.x ?? 0) - s.hero.pos.x < 30, 120, frameOf(['right']));
    expect(strike(h, 'garmr')).toBeGreaterThan(0);
    h.until((s) => s.enemies[0]?.fsm.s === 'rise', GARMR.reelTicks + 2);
  });
});

describe('Náströnd', () => {
  it('turns every blow with his tower shield until the grapple tears it away; then he fetches it', () => {
    const h = withGrapple(new Harness({ db: arena([['nastrond', 17, 10]]), tile: [10, 10], facing: 'e' }));
    h.until((s) => s.enemies[0]?.fsm.s === 'stalk', 200);
    expect(mem(byDef(h, 'nastrond'), 'guard')).toBe(1);
    expect(h.sim.boss()?.name.en).toBe('Náströnd');
    h.press(['item1']);
    h.until((s) => s.enemies.some((e) => e.def === 'tower_shield'), 60);
    expect(mem(byDef(h, 'nastrond'), 'guard')).toBe(0);
    h.until((s) => s.enemies.find((e) => e.def === 'nastrond')?.fsm.s === 'fetch', NASTROND.tornTicks + 2);
    h.until((s) => !s.enemies.some((e) => e.def === 'tower_shield'), 600);
    h.until((s) => s.enemies.find((e) => e.def === 'nastrond')?.fsm.s !== 'arm', NASTROND.armTicks + 2);
    expect(mem(byDef(h, 'nastrond'), 'guard')).toBe(1);
  });

  it('raises two fog-draugr at two thirds, and fills the hall with fog at the last third', () => {
    const h = new Harness({ db: arena([['nastrond', 17, 10]]), tile: [10, 10], facing: 'e' });
    h.until((s) => s.enemies[0]?.fsm.s === 'stalk', 200);
    byDef(h, 'nastrond').hp = NASTROND.phaseAt[0];
    h.until((s) => s.enemies.find((e) => e.def === 'nastrond')?.fsm.s === 'raise', 4);
    expect(h.sim.enemies.filter((e) => e.def === 'fog_draugr')).toHaveLength(2);
    h.idle(NASTROND.raiseTicks + 2);
    byDef(h, 'nastrond').hp = NASTROND.phaseAt[1];
    h.until((s) => s.enemies.find((e) => e.def === 'nastrond')?.fsm.s === 'raise', 4);
    expect(h.sim.fog().amount).toBeGreaterThan(0);
    h.idle(NASTROND.raiseTicks + 2);
    h.until((s) => s.enemies.find((e) => e.def === 'nastrond')?.fsm.s === 'flail', NASTROND.flailEvery + 40);
  });
});
