import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { NEW_GAME } from '@content/start';
import { solve } from '@core/progress/solver';
import type { ContentDb } from '@core/sim/db';
import { newGame, type GameState } from '@core/state/gameState';
import { TILE } from '@core/world/dims';
import type { Thing } from '@core/world/screen';

/**
 * test_a split by a wall at column 30 with a gate at (30,10) that stays shut until the eye's flag is set; a
 * piece lies past it. The eye stands in a niche of clear ice at the top (no straight line from the floor
 * reaches it), so only light does.
 */
function tower(things: Thing[]): ContentDb {
  const map = Array.from({ length: 22 }, (_, y) => {
    if (y === 0 || y === 21) return '▪'.repeat(40);
    const row = ['▪', ...Array.from({ length: 38 }, () => '▫'), '▪'];
    if (y !== 10) row[30] = '▪';
    if (y <= 2) for (let x = 1; x < 30; x++) row[x] = '▪';
    if (y === 2) for (let x = 12; x <= 16; x++) row[x] = '▧';
    return row.join('');
  });
  const gate: Thing = {
    k: 'gate',
    at: { x: 30, y: 10 },
    w: 1,
    h: 1,
    art: 'bars',
    closed: { k: 'not', c: { k: 'flag', id: 'st_utgard_open' } },
  };
  const piece: Thing = { k: 'piece', id: 'hp_test_past', at: { x: 35, y: 10 } };
  const screen = { ...DB.screens.test_a, map, things: [gate, piece, ...things] };
  return { ...DB, screens: { ...DB.screens, test_a: screen } };
}

function start(over: (s: GameState) => void = () => undefined): GameState {
  const s = newGame(1, NEW_GAME);
  s.hero.screen = 'test_a';
  s.hero.x = 4 * TILE + 8;
  s.hero.y = 10 * TILE + 14;
  over(s);
  return s;
}

const none = (): boolean => false;
const within = { within: ['test_a' as const] };
const EYE: Thing = { k: 'eye', at: { x: 14, y: 1 }, flag: 'st_utgard_open' };

describe('the solver and the light (M9b)', () => {
  it('lights an eye that a window shines on through clear ice', () => {
    const r = solve(tower([EYE, { k: 'beam', at: { x: 14, y: 20 }, dir: 'n' }]), start(), none, within);
    expect(r.pieces).toContain('hp_test_past');
  });

  it('turns a prism Ask can reach either way, but not one out of reach', () => {
    const beam: Thing = { k: 'beam', at: { x: 1, y: 15 }, dir: 'e' };
    const near = solve(
      tower([EYE, beam, { k: 'prism', at: { x: 14, y: 15 }, turn: '\\', turns: true }]),
      start(),
      none,
      within,
    );
    expect(near.pieces).toContain('hp_test_past');
    const fixed = solve(
      tower([EYE, beam, { k: 'prism', at: { x: 14, y: 15 }, turn: '\\' }]),
      start(),
      none,
      within,
    );
    expect(fixed.pieces).not.toContain('hp_test_past');
  });

  it('carries a beam onto the eye with the mirror, once Ask holds it', () => {
    const beam: Thing = { k: 'beam', at: { x: 1, y: 15 }, dir: 'e' };
    const bare = solve(tower([EYE, beam]), start(), none, within);
    expect(bare.pieces).not.toContain('hp_test_past');
    const held = solve(
      tower([EYE, beam]),
      start((s) => {
        s.inv.items.mirror = 1;
      }),
      none,
      within,
    );
    expect(held.pieces).toContain('hp_test_past');
  });

  it('lights an eye in plain sight with Bragð, but not one behind clear ice', () => {
    const open: Thing = { k: 'eye', at: { x: 20, y: 3 }, flag: 'st_utgard_open' };
    const bragd = (s: GameState): void => {
      s.inv.galdr = ['bragd'];
    };
    expect(solve(tower([open]), start(bragd), none, within).pieces).toContain('hp_test_past');
    expect(solve(tower([EYE]), start(bragd), none, within).pieces).not.toContain('hp_test_past');
  });
});
