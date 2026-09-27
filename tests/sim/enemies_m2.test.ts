import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import type { EnemyId } from '@content/ids';
import { BEHAVIOURS, createEnemy } from '@core/actors/enemies';
import { mem, type Entity } from '@core/actors/entity';
import { runFsm } from '@core/actors/fsm';
import { HEAVY } from '@core/combat/hit';
import type { ContentDb } from '@core/sim/db';
import type { Thing } from '@core/world/screen';
import { testCtx } from '../unit/core/actorCtx';
import { Harness } from './harness';

/** Runs `e` for `ticks` ticks in `ctx`, returning the states it passed through in order. */
function run(e: Entity, ctx: ReturnType<typeof testCtx>, ticks: number): string[] {
  const seen: string[] = [e.fsm.s];
  for (let i = 0; i < ticks; i++) {
    runFsm(BEHAVIOURS[DB.enemies[e.def as EnemyId].behaviour], e, ctx);
    if (seen[seen.length - 1] !== e.fsm.s) seen.push(e.fsm.s);
  }
  return seen;
}

const enemy = (id: EnemyId, x = 100, y = 100): Entity => createEnemy(1, DB.enemies[id], { x, y });

describe('the pack leader (vargr_alpha)', () => {
  it('howls on first sight, a 24-tick tell, and two vargr answer', () => {
    const e = enemy('vargr_alpha');
    const ctx = testCtx({ hero: { x: 100, y: 180 } });
    const states = run(e, ctx, 40);
    expect(states.slice(0, 3)).toEqual(['prowl', 'stalk', 'howl']);
    expect(ctx.events).toContainEqual({ t: 'sfx', id: 'sfx_howl' });
    expect(ctx.spawned.map((s) => s.def)).toEqual(['vargr', 'vargr']);
    expect(ctx.spawned.every((s) => mem(s, 'caller') === e.id)).toBe(true);
  });

  it('never has more than two of its own at once', () => {
    const e = enemy('vargr_alpha');
    const pack = [enemy('vargr', 80, 100), enemy('vargr', 120, 100)];
    for (const p of pack) p.mem['caller'] = e.id;
    const ctx = testCtx({ hero: { x: 100, y: 180 }, others: pack });
    run(e, ctx, 1200);
    expect(ctx.spawned).toHaveLength(0);
  });

  it('calls no one when struck mid-howl', () => {
    const e = enemy('vargr_alpha');
    const ctx = testCtx({ hero: { x: 100, y: 180 } });
    run(e, ctx, 10);
    expect(e.fsm.s).toBe('howl');
    e.flash = 8;
    e.iframes = 8;
    run(e, ctx, 30);
    expect(ctx.spawned).toHaveLength(0);
  });

  it('lunges hard: a heavy blow, and fourteen health', () => {
    const def = DB.enemies.vargr_alpha;
    expect(def.hp).toBe(14);
    expect(def.attacks?.['lunge']?.tags).toBe(HEAVY);
    expect(def.attacks?.['lunge']?.amount).toBeGreaterThan(DB.enemies.vargr.attacks?.['lunge']?.amount ?? 0);
  });
});

describe('the rime raven', () => {
  it('circles out of reach until it spots Ask, shrieks for 24 ticks, calls a vargr, then dives', () => {
    const e = enemy('rime_raven');
    const far = testCtx({ hero: { x: 400, y: 400 } });
    run(e, far, 120);
    expect(e.fsm.s).toBe('circle');
    expect(e.iframes).toBeGreaterThan(0);
    const ctx = testCtx({ hero: { x: 100, y: 160 } });
    const states = run(e, ctx, 60);
    expect(states.slice(0, 3)).toEqual(['circle', 'shriek', 'dive']);
    expect(ctx.events).toContainEqual({ t: 'sfx', id: 'sfx_shriek' });
    expect(ctx.spawned.map((s) => s.def)).toEqual(['vargr']);
  });

  it('calls again only once the vargr it called is gone', () => {
    const e = enemy('rime_raven');
    const called = enemy('vargr', 60, 100);
    called.mem['caller'] = e.id;
    const ctx = testCtx({ hero: { x: 100, y: 160 }, others: [called] });
    const states = run(e, ctx, 200);
    expect(states).toContain('dive');
    expect(ctx.spawned).toHaveLength(0);
  });

  it('flies over walls', () => {
    const open = Array.from({ length: 22 }, (_, y) =>
      y === 0 || y === 21 ? '#'.repeat(40) : '#' + '.'.repeat(18) + '#' + '.'.repeat(19) + '#',
    );
    const things: Thing[] = [{ k: 'enemy', id: 'rime_raven', at: { x: 17, y: 10 } }];
    const db: ContentDb = {
      ...DB,
      screens: { ...DB.screens, test_a: { ...DB.screens.test_a, map: open, things } },
    };
    // Ask stands beyond the wall, in sight: the dive crosses it.
    const h = new Harness({ db, tile: [22, 10], minute: 23 * 60 });
    let east = 0;
    for (let i = 0; i < 300; i++) {
      h.idle(1);
      for (const a of h.sim.enemies) if (a.def === 'rime_raven') east = Math.max(east, a.pos.x);
    }
    expect(east).toBeGreaterThan(20 * 16);
  });
});
