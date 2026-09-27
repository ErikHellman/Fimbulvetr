import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { actorCtx } from '@core/sim/systems/enemies';
import type { ContentDb } from '@core/sim/db';
import { SOLID } from '@core/world/collision';
import type { Thing } from '@core/world/screen';
import { Harness } from './harness';
import { face, walkTo } from './walk';

/** An open room of d1 with `things`. */
function room(things: Thing[]): ContentDb {
  const map = Array.from({ length: 22 }, (_, y) =>
    y === 0 || y === 21 ? '#'.repeat(40) : '#' + '.'.repeat(38) + '#',
  );
  const screen = { ...DB.screens.test_a, map, things, dungeon: 'd1' as const };
  return { ...DB, screens: { ...DB.screens, test_a: screen } };
}

const solid = (h: Harness, x: number, y: number): boolean =>
  ((h.sim.screen.collision.flags[y * 40 + x] ?? 0) & SOLID) !== 0;
const tileOf = (h: Harness, def: string): [number, number][] =>
  h.sim.actors
    .filter((a) => a.def === def)
    .map((a) => [Math.floor(a.pos.x / 16), Math.floor((a.pos.y - 1) / 16)]);
const ROOT: Thing = { k: 'prop', id: 'root_block', at: { x: 20, y: 10 } };

describe('root blocks', () => {
  it('slide one tile after a steady push, and block the way like walls', () => {
    const h = new Harness({ db: room([ROOT]), tile: [18, 10], facing: 'e' });
    expect(solid(h, 20, 10)).toBe(true);
    expect(actorCtx(h.sim).solidAt(20, 10)).toBe(true);
    h.hold(['right'], 12);
    expect(tileOf(h, 'root_block')).toEqual([[20, 10]]);
    h.hold(['right'], 20);
    expect(h.sim.hero.anim).toBe('push');
    h.idle(20);
    expect(tileOf(h, 'root_block')).toEqual([[21, 10]]);
    expect(h.sim.actors.find((a) => a.def === 'root_block')?.pos).toEqual({
      x: 21 * 16 + 8,
      y: 10 * 16 + 14,
    });
    expect(solid(h, 20, 10)).toBe(false);
    expect(solid(h, 21, 10)).toBe(true);
    expect(h.events).toContainEqual({ t: 'sfx', id: 'sfx_push' });
  });

  it('need a steady push: a nudge does nothing', () => {
    const h = new Harness({ db: room([ROOT]), tile: [18, 10], facing: 'e' });
    for (let i = 0; i < 6; i++) h.hold(['right'], 8).idle(4);
    expect(tileOf(h, 'root_block')).toEqual([[20, 10]]);
  });

  it('do not move into walls or other blocks', () => {
    const things: Thing[] = [ROOT, { ...ROOT, at: { x: 21, y: 10 } }, { ...ROOT, at: { x: 38, y: 5 } }];
    const h = new Harness({ db: room(things), tile: [18, 10], facing: 'e' });
    h.hold(['right'], 60).idle(20);
    expect(tileOf(h, 'root_block')).toEqual([
      [20, 10],
      [21, 10],
      [38, 5],
    ]);
    walkTo(h, 37, 5);
    face(h, 'e');
    h.hold(['right'], 60).idle(20);
    expect(tileOf(h, 'root_block')[2]).toEqual([38, 5]);
  });

  it('go back where they were when the room is entered again', () => {
    const h = new Harness({ db: room([ROOT]), tile: [18, 10], facing: 'e' });
    h.hold(['right'], 40).idle(20);
    expect(tileOf(h, 'root_block')).toEqual([[21, 10]]);
    h.sim.command({ t: 'warp', screen: 'test_a', x: 10 * 16 + 8, y: 10 * 16 + 14 });
    h.idle(1);
    expect(tileOf(h, 'root_block')).toEqual([[20, 10]]);
  });

  it('open a `blocks` shutter once every block has been moved', () => {
    const things: Thing[] = [
      ROOT,
      { ...ROOT, at: { x: 20, y: 14 } },
      { k: 'shutter', at: { x: 5, y: 1 }, w: 2, h: 1, opens: 'blocks' },
    ];
    const h = new Harness({ db: room(things), tile: [18, 10], facing: 'e' });
    h.idle(2);
    expect(solid(h, 5, 1)).toBe(true);
    h.hold(['right'], 40).idle(20);
    expect(solid(h, 5, 1)).toBe(true);
    walkTo(h, 18, 14);
    face(h, 'e');
    h.hold(['right'], 40).idle(20);
    expect(solid(h, 5, 1)).toBe(false);
  });
});

describe('vines', () => {
  it('bar the way until the sword cuts them', () => {
    const vines: Thing = { k: 'prop', id: 'vines', at: { x: 20, y: 10 } };
    const h = new Harness({ db: room([vines]), tile: [18, 10], facing: 'e' });
    expect(solid(h, 20, 10)).toBe(true);
    h.hold(['right'], 40).idle(10);
    expect(tileOf(h, 'vines')).toEqual([[20, 10]]);
    face(h, 'e');
    h.press(['sword']).idle(20);
    expect(tileOf(h, 'vines')).toEqual([]);
    expect(solid(h, 20, 10)).toBe(false);
    walkTo(h, 22, 10);
  });
});
