import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { ENEMIES, type EnemyId } from '@content/ids';
import { BEHAVIOURS, createEnemy } from '@core/actors/enemies';
import { runFsm } from '@core/actors/fsm';
import type { Action } from '@core/input/actions';
import type { ContentDb } from '@core/sim/db';
import type { Thing } from '@core/world/screen';
import { testCtx } from '../unit/core/actorCtx';
import { Harness } from './harness';

/** Runs an enemy's behaviour next to a still hero; returns ticks from the start of its tell to the blow. */
function tellToBlow(id: EnemyId): number | null {
  const def = DB.enemies[id];
  const e = createEnemy(1, def, { x: 100, y: 100 });
  const ctx = testCtx({ hero: { x: 100, y: 120 } });
  let tellAt: number | null = null;
  for (let tick = 0; tick < 1200; tick++) {
    runFsm(BEHAVIOURS[def.behaviour], e, ctx);
    if (e.anim === 'tell' && tellAt === null) tellAt = tick;
    const w = def.attacks?.[e.fsm.s];
    if (w !== undefined && e.fsm.t >= w.from && e.fsm.t <= w.to) return tellAt === null ? 0 : tick - tellAt;
  }
  return null;
}

describe('telegraphs', () => {
  it('every attack is preceded by a 300–500 ms tell', () => {
    const attackers = ENEMIES.filter((id) => DB.enemies[id].attacks !== undefined);
    expect(attackers).toEqual(expect.arrayContaining(['vargr', 'draugr', 'troll']));
    for (const id of attackers) {
      const ticks = tellToBlow(id);
      expect(ticks, id).not.toBeNull();
      expect(ticks, id).toBeGreaterThanOrEqual(18);
      expect(ticks, id).toBeLessThanOrEqual(30);
    }
  });
});

/** Opens test_a and puts `id` at (16,10). */
function arena(id: EnemyId, extra: Partial<Thing> = {}): ContentDb {
  const open = Array.from({ length: 22 }, (_, y) =>
    y === 0 || y === 21 ? '#'.repeat(40) : '#' + '.'.repeat(38) + '#',
  );
  const things = [{ k: 'enemy', id, at: { x: 16, y: 10 }, ...extra } as Thing];
  return { ...DB, screens: { ...DB.screens, test_a: { ...DB.screens.test_a, map: open, things } } };
}

describe('draugr', () => {
  it('rises untouchable, then its blow staggers through a raised shield', () => {
    const h = new Harness({ db: arena('draugr'), tile: [16, 12], facing: 'n' });
    const hp = h.sim.hero.hp;
    expect(h.sim.enemies[0]?.fsm.s).toBe('rise');
    h.hold(['shield'], 200);
    expect(h.sim.hero.hp).toBe(hp - 4);
  });
});

describe('troll', () => {
  it('cannot be hurt: every blow clinks off', () => {
    const h = new Harness({ db: arena('troll'), tile: [16, 12], facing: 'n' });
    h.sim.hero.hp = 999;
    h.sim.hero.maxHp = 999;
    for (let i = 0; i < 10; i++) h.press(['sword']).idle(12);
    expect(h.sim.enemies).toHaveLength(1);
    expect(h.sim.enemies[0]?.hp).toBe(99);
    expect(h.count('killed')).toBe(0);
  });
});

describe('vargr', () => {
  it('stalks in, crouches, and a hit during the crouch stops the lunge', () => {
    const h = new Harness({ db: arena('vargr'), tile: [16, 14], facing: 'n' });
    h.until((s) => s.enemies[0]?.fsm.s === 'tell', 400);
    const wolf = h.sim.enemies[0];
    if (wolf === undefined) throw new Error('no wolf');
    const toward = (): Action[] => {
      const dx = wolf.pos.x - h.sim.hero.pos.x;
      const dy = wolf.pos.y - h.sim.hero.pos.y;
      const out: Action[] = [];
      if (Math.abs(dx) > 2) out.push(dx > 0 ? 'right' : 'left');
      if (Math.abs(dy) > 2) out.push(dy > 0 ? 'down' : 'up');
      return out;
    };
    for (
      let i = 0;
      i < 20 && Math.hypot(wolf.pos.x - h.sim.hero.pos.x, wolf.pos.y - h.sim.hero.pos.y) > 28;
      i++
    )
      h.step(h.frame(toward()));
    expect(wolf.fsm.s).toBe('tell');
    h.press(['sword']).idle(3);
    expect(['hurt', 'stalk']).toContain(h.sim.enemies[0]?.fsm.s ?? 'dead');
    expect(h.sim.enemies[0]?.hp ?? 0).toBeLessThan(6);
  });

  it('dies to the seax and may drop something', () => {
    const h = new Harness({ db: arena('vargr'), tile: [16, 14], facing: 'n', seed: 3 });
    h.sim.hero.hp = 999;
    h.sim.hero.maxHp = 999;
    for (let i = 0; i < 60 && h.sim.enemies.length > 0; i++) {
      const w = h.sim.enemies[0];
      if (w === undefined) break;
      const dx = w.pos.x - h.sim.hero.pos.x;
      const dy = w.pos.y - h.sim.hero.pos.y;
      h.press([Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up']);
      h.press(['sword']).idle(8);
    }
    expect(h.sim.enemies).toHaveLength(0);
    expect(h.count('killed')).toBe(1);
  });
});
