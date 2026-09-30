import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { NEW_GAME } from '@content/start';
import { solve } from '@core/progress/solver';
import type { ContentDb } from '@core/sim/db';
import { newGame } from '@core/state/gameState';
import { TILE } from '@core/world/dims';
import type { Thing } from '@core/world/screen';
import { Harness, frameOf } from './harness';

const READ = frameOf(['confirm'], ['confirm']);

/** test_a with a warp stone for Haugar at (20, 8), arriving at (20, 9). */
function stoneDb(extra: Thing[] = []): ContentDb {
  const things: Thing[] = [
    { k: 'warp', region: 'haugar', at: { x: 20, y: 8 }, arrive: { x: 20, y: 9 } },
    ...extra,
  ];
  return { ...DB, screens: { ...DB.screens, test_a: { ...DB.screens.test_a, things } } };
}

const stone = (h: Harness) => h.sim.actors.find((a) => a.kind === 'fixture' && a.def === 'warp');

describe('warp stones', () => {
  it('stand dormant and solid until Ask wakes one with interact, for good', () => {
    const h = new Harness({ db: stoneDb(), tile: [20, 10], facing: 'n' });
    h.idle(2);
    expect(stone(h)?.anim).toBe('dormant');
    // Solid: walking north stops below it.
    h.hold(['up'], 40);
    expect(Math.floor((h.sim.hero.pos.y - 1) / TILE)).toBe(9);
    h.press(['interact']);
    expect(h.sim.state.world.warps).toEqual(['haugar']);
    expect(h.events.some((e) => e.t === 'sfx' && e.id === 'sfx_warp')).toBe(true);
    expect(h.sim.mode).toBe('story');
    h.until((s) => s.mode === 'play', 600, READ);
    expect(stone(h)?.anim).toBe('awake');
    // A second touch only speaks; the region is kept once.
    h.idle(2).press(['interact']);
    h.until((s) => s.mode === 'play', 600, READ);
    expect(h.sim.state.world.warps).toEqual(['haugar']);
    h.expectAnims();
  });

  it('show awake when the region was woken before', () => {
    const h = new Harness({ db: stoneDb(), tile: [20, 12] });
    h.sim.state.world.warps.push('haugar');
    h.sim.command({ t: 'warp', screen: 'test_a', x: 20 * TILE + 8, y: 12 * TILE + 14 });
    h.idle(2);
    expect(stone(h)?.anim).toBe('awake');
  });

  it('block the solver like a stone', () => {
    const s = newGame(1, NEW_GAME);
    s.hero.screen = 'test_a';
    s.hero.x = 20 * TILE + 8;
    s.hero.y = 10 * TILE + 14;
    const db = stoneDb([{ k: 'piece', id: 'hp_test_stone', at: { x: 20, y: 8 } }]);
    expect(solve(db, s, () => false, { within: ['test_a'] }).pieces).not.toContain('hp_test_stone');
  });
});
