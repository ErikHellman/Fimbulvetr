import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { NEW_GAME } from '@content/start';
import type { ScreenId } from '@content/world/screens';
import { solve } from '@core/progress/solver';
import { newGame, type GameState } from '@core/state/gameState';
import { TILE } from '@core/world/dims';

const nothing = (): boolean => false;

/** Ask on `screen` at a tile, with whatever `kit` adds. */
function on(
  screen: ScreenId,
  x: number,
  y: number,
  kit: (s: GameState) => void = () => undefined,
): GameState {
  const s = newGame(1, NEW_GAME);
  s.hero.screen = screen;
  s.hero.x = x * TILE + 8;
  s.hero.y = y * TILE + 14;
  kit(s);
  return s;
}

const pieces = (s: GameState, screen: ScreenId, season?: 'winter' | 'summer'): readonly string[] =>
  solve(DB, s, nothing, { within: [screen], ...(season === undefined ? {} : { season }) }).pieces;

/** M11a's four hidden pieces: each wants its own late tool, and never another way in. */
describe('the progression solver on the M11a pieces', () => {
  it('reaches the gully sinkhole only with the grapple, and back out again', () => {
    expect(pieces(on('hau_gully', 12, 12), 'hau_gully')).not.toContain('hp_hau_sinkhole');
    const s = on('hau_gully', 12, 12, (g) => (g.inv.items.grapple = 1));
    const r = solve(DB, s, nothing, { within: ['hau_gully'] });
    expect(r.pieces).toContain('hp_hau_sinkhole');
    expect(r.stranded).toEqual([]);
  });

  it('reaches the Gjöll’s islet (Bragi’s M6a verse) only with the grapple, and back out again', () => {
    expect(pieces(on('nif_gjoll', 20, 12), 'nif_gjoll')).not.toContain('hp_nif_gjoll');
    const s = on('nif_gjoll', 20, 12, (g) => (g.inv.items.grapple = 1));
    const r = solve(DB, s, nothing, { within: ['nif_gjoll'] });
    expect(r.pieces).toContain('hp_nif_gjoll');
    expect(r.stranded).toEqual([]);
  });

  it('reaches the miners’ store only with the hammer', () => {
    expect(
      pieces(
        on('dvg_ledges', 10, 6, (g) => (g.inv.items.bombs = 10)),
        'dvg_ledges',
      ),
    ).not.toContain('hp_dvg_store');
    expect(
      pieces(
        on('dvg_ledges', 10, 6, (g) => (g.inv.items.hammer = 1)),
        'dvg_ledges',
      ),
    ).toContain('hp_dvg_store');
  });

  it('reaches the slag pool’s eye only with Ís', () => {
    const skin = (g: GameState): void => {
      g.inv.items.sealskin = 1;
      g.inv.items.grapple = 1;
    };
    expect(pieces(on('dvg_slag', 20, 18, skin), 'dvg_slag')).not.toContain('hp_dvg_slag');
    expect(
      pieces(
        on('dvg_slag', 20, 18, (g) => g.inv.galdr.push('is')),
        'dvg_slag',
      ),
    ).toContain('hp_dvg_slag');
  });

  it('leaves the saddle’s tarn-eye under the ice while the winter holds the mountain', () => {
    const s = on('hrf_saddle', 20, 10, (g) => {
      g.inv.items.sealskin = 1;
      g.inv.armor = 'ember_byrnie';
    });
    // Hrímfjöll keeps its winter in the solver (the thaw is the ending's): even in summer the eye is iced.
    for (const season of ['winter', 'summer'] as const)
      expect(pieces(s, 'hrf_saddle', season)).not.toContain('hp_hrf_thaw');
  });
});
