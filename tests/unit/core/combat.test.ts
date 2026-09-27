import { describe, expect, it } from 'vitest';
import { ENEMY_DEFS } from '@content/enemies';
import { runFsm } from '@core/actors/fsm';
import { BEHAVIOURS, createEnemy } from '@core/actors/enemies';
import { HEAVY, PIERCE_SHIELD, resolveHit, type HitData } from '@core/combat/hit';
import { testCtx } from './actorCtx';

const dummy = () => createEnemy(1, ENEMY_DEFS.dummy, { x: 100, y: 100 });
const opts = { shielding: false, iframes: 6, knockResist: 0 };
const hit = (over: Partial<HitData> = {}): HitData => ({
  amount: 2,
  element: 'none',
  knock: 4,
  dir: { x: 1, y: 0 },
  faction: 'hero',
  tags: 0,
  ...over,
});

describe('resolveHit', () => {
  it('damages, flashes, knocks back and grants i-frames', () => {
    const e = dummy();
    const r = resolveHit(e, hit(), opts);
    expect(r).toEqual({ outcome: 'damaged', dealt: 2 });
    expect(e.hp).toBe(ENEMY_DEFS.dummy.hp - 2);
    expect(e.iframes).toBe(6);
    expect(e.flash).toBeGreaterThan(0);
    expect(e.knock).toEqual({ x: 4, y: 0 });
  });

  it('ignores friendly fire and targets with i-frames', () => {
    const e = dummy();
    expect(resolveHit(e, hit({ faction: 'enemy' }), opts).outcome).toBe('ignored');
    e.iframes = 3;
    expect(resolveHit(e, hit(), opts).outcome).toBe('ignored');
  });

  it('blocks frontal hits on a raised shield, but not hits from behind or heavy hits', () => {
    const e = dummy();
    e.facing = 'w';
    const shielded = { ...opts, shielding: true };
    expect(resolveHit(e, hit({ dir: { x: 1, y: 0 } }), shielded).outcome).toBe('blocked');
    expect(e.hp).toBe(ENEMY_DEFS.dummy.hp);
    expect(resolveHit(e, hit({ dir: { x: -1, y: 0 } }), shielded).outcome).toBe('damaged');
    e.iframes = 0;
    expect(resolveHit(e, hit({ dir: { x: 1, y: 0 }, tags: HEAVY }), shielded).outcome).toBe('damaged');
  });

  it('reports a kill and never takes hp below zero', () => {
    const e = dummy();
    const r = resolveHit(e, hit({ amount: 999 }), opts);
    expect(r.outcome).toBe('killed');
    expect(r.dealt).toBe(ENEMY_DEFS.dummy.hp);
    expect(e.hp).toBe(0);
  });

  it('scales knockback by resistance', () => {
    const e = dummy();
    resolveHit(e, hit(), { ...opts, knockResist: 1 });
    expect(e.knock).toEqual({ x: 0, y: 0 });
  });
});

describe('PIERCE_SHIELD', () => {
  it('goes through a frontal shield', () => {
    const e = dummy();
    e.facing = 'w';
    const r = resolveHit(e, hit({ tags: PIERCE_SHIELD }), { ...opts, shielding: true });
    expect(r.outcome).toBe('damaged');
  });
});

describe('training dummy', () => {
  it('wobbles after a hit, then settles', () => {
    const e = dummy();
    const ctx = testCtx();
    resolveHit(e, hit(), opts);
    runFsm(BEHAVIOURS.dummy, e, ctx);
    expect(e.fsm.s).toBe('hurt');
    expect(e.anim).toBe('hurt');
    for (let i = 0; i < 12; i++) runFsm(BEHAVIOURS.dummy, e, ctx);
    expect(e.fsm.s).toBe('idle');
  });
});
