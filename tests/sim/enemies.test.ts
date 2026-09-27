import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import type { AttackWindow, EnemyDef } from '@core/actors/enemies/defs';
import { HEAVY, STUN } from '@core/combat/hit';
import type { ContentDb } from '@core/sim/db';
import { actorCtx } from '@core/sim/systems/enemies';
import { damageActor } from '@core/sim/systems/combat';
import type { Thing } from '@core/world/screen';
import { Harness } from './harness';

const AROUND = { x: -24, y: -24, w: 48, h: 32 };
const window = (from: number, to: number, tags = 0): AttackWindow => ({
  from,
  to,
  boxes: { n: AROUND, s: AROUND, e: AROUND, w: AROUND },
  amount: 2,
  knock: 3,
  tags,
});

/** test_a opened up, with a (patched) dummy at (16,10) described by `things`. */
function arena(patch: Partial<EnemyDef>, things?: Thing[]): ContentDb {
  const open = Array.from({ length: 22 }, (_, y) =>
    y === 0 || y === 21 ? '#'.repeat(40) : '#' + '.'.repeat(38) + '#',
  );
  return {
    ...DB,
    enemies: { ...DB.enemies, dummy: { ...DB.enemies.dummy, ...patch } },
    screens: {
      ...DB.screens,
      test_a: {
        ...DB.screens.test_a,
        map: open,
        things: things ?? [{ k: 'enemy', id: 'dummy', at: { x: 16, y: 10 } }],
      },
    },
  };
}

describe('attack windows', () => {
  it('land only while the state clock is inside the window', () => {
    const h = new Harness({ db: arena({ attacks: { idle: window(30, 32) } }), tile: [16, 11], facing: 'n' });
    const hp = h.sim.hero.hp;
    h.idle(28);
    expect(h.sim.hero.hp).toBe(hp);
    h.idle(6);
    expect(h.sim.hero.hp).toBe(hp - 2);
    expect(h.sim.hero.fsm.s).toBe('hurt');
  });

  it('are blocked by the shield unless the blow is heavy', () => {
    const light = new Harness({
      db: arena({ attacks: { idle: window(0, 999) } }),
      tile: [16, 11],
      facing: 'n',
    });
    const hp = light.sim.hero.hp;
    light.hold(['shield'], 40);
    expect(light.sim.hero.hp).toBe(hp);
    expect(light.events.some((e) => e.t === 'hit' && e.blocked)).toBe(true);

    const heavy = new Harness({
      db: arena({ attacks: { idle: window(0, 999, HEAVY) } }),
      tile: [16, 11],
      facing: 'n',
    });
    heavy.hold(['shield'], 40);
    expect(heavy.sim.hero.hp).toBe(hp - 2);
  });
});

describe('stun and guard', () => {
  it('a stunned enemy stands frozen and does not strike', () => {
    const h = new Harness({ db: arena({ attacks: { idle: window(0, 999) } }), tile: [10, 10] });
    const dummy = h.sim.enemies[0];
    if (dummy === undefined) throw new Error('no dummy');
    dummy.mem['stun'] = 20;
    const t = dummy.fsm.t;
    h.idle(10);
    expect(dummy.fsm.t).toBe(t);
    h.idle(15);
    expect(dummy.fsm.t).toBeGreaterThan(t);
  });

  it('a stunning hit freezes an enemy that can be stunned, and only that', () => {
    const h = new Harness({ db: arena({ stunnable: 90, immortal: true }), tile: [10, 10] });
    const dummy = h.sim.enemies[0];
    if (dummy === undefined) throw new Error('no dummy');
    const hit = {
      amount: 0,
      element: 'none',
      knock: 0,
      dir: { x: 1, y: 0 },
      faction: 'hero',
      tags: STUN,
    } as const;
    damageActor(h.sim, dummy, hit);
    expect(dummy.mem['stun']).toBe(90);

    const g = new Harness({ db: arena({}), tile: [10, 10] });
    const plain = g.sim.enemies[0];
    if (plain === undefined) throw new Error('no dummy');
    damageActor(g.sim, plain, hit);
    expect(plain.mem['stun']).toBeUndefined();
  });

  it('a guarded enemy clinks and takes no damage', () => {
    const h = new Harness({ db: arena({ immortal: false }), tile: [15, 10], facing: 'e' });
    const dummy = h.sim.enemies[0];
    if (dummy === undefined) throw new Error('no dummy');
    dummy.mem['guard'] = 1;
    h.press(['sword']).idle(20);
    expect(dummy.hp).toBe(dummy.maxHp);
    expect(h.events.some((e) => e.t === 'hit' && e.blocked)).toBe(true);
  });
});

describe('enemy things', () => {
  it('spawn only while their condition holds', () => {
    const things: Thing[] = [
      { k: 'enemy', id: 'dummy', at: { x: 16, y: 10 }, when: { k: 'flag', id: 'st_raid_begun' } },
    ];
    expect(new Harness({ db: arena({}, things) }).sim.enemies).toHaveLength(0);
    const h = new Harness({ db: arena({}, things) });
    h.sim.state.flags.st_raid_begun = true;
    h.sim.command({ t: 'warp', screen: 'test_a', x: 100, y: 100 });
    h.idle(1);
    expect(h.sim.enemies).toHaveLength(1);
  });

  it('apply their onDeath effects when killed', () => {
    const things: Thing[] = [
      {
        k: 'enemy',
        id: 'dummy',
        at: { x: 16, y: 10 },
        onDeath: [{ k: 'set', flag: 'st_raid_begun', value: true }],
      },
    ];
    const h = new Harness({ db: arena({ immortal: false, hp: 1 }, things), tile: [15, 10], facing: 'e' });
    h.press(['sword']).idle(10);
    expect(h.sim.enemies).toHaveLength(0);
    expect(h.sim.state.flags.st_raid_begun).toBe(true);
  });
});

describe('summons', () => {
  it('act from the next tick and never run a screen thing on death', () => {
    const things: Thing[] = [
      {
        k: 'enemy',
        id: 'dummy',
        at: { x: 30, y: 10 },
        onDeath: [{ k: 'set', flag: 'st_raid_begun', value: true }],
      },
    ];
    const h = new Harness({ db: arena({ immortal: false, hp: 1 }, things), tile: [15, 10], facing: 'e' });
    const e = actorCtx(h.sim).spawn('dummy', { x: 16 * 16 + 8, y: 10 * 16 + 14 }, 'w');
    expect(e.mem['summoned']).toBe(1);
    expect(e.facing).toBe('w');
    h.press(['sword']).idle(10);
    expect(h.sim.enemies).toHaveLength(1);
    expect(h.sim.state.flags.st_raid_begun).toBeUndefined();
  });

  it('are swept away once they mark themselves gone', () => {
    const h = new Harness({ db: arena({}), tile: [10, 10] });
    const dummy = h.sim.enemies[0];
    if (dummy === undefined) throw new Error('no dummy');
    dummy.mem['gone'] = 1;
    h.idle(1);
    expect(h.sim.enemies).toHaveLength(0);
  });
});
