import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { SCREENS } from '@content/world/registry';
import { SCREEN_IDS, type ScreenId } from '@content/world/screens';
import { parseTextMap } from '@core/world/textmap';

const rooms = SCREEN_IDS.filter((id) => SCREENS[id].dungeon === 'd7');

const grid = (id: ScreenId) => parseTextMap(SCREENS[id].map, DB.legend);

describe('Hrímturn', () => {
  it('has thirty-two rooms on Hrímfjöll, none of them cold', () => {
    expect(rooms).toHaveLength(32);
    for (const id of rooms) {
      expect(SCREENS[id].region, id).toBe('hrimfjoll');
      expect(SCREENS[id].cold, id).toBeUndefined();
    }
  });

  it('is entered from the tower’s foot, and left again the same way', () => {
    const into = SCREENS.hrf_towerfoot.things.filter((t) => t.k === 'door' && t.to === 'd7_r28');
    expect(into).toHaveLength(2);
    const out = SCREENS.d7_r28.things.filter((t) => t.k === 'door' && t.to === 'hrf_towerfoot');
    expect(out).toHaveLength(2);
  });

  it('never lets glaze touch a room’s edge', () => {
    for (const id of rooms) {
      const g = grid(id);
      for (let y = 0; y < g.rows; y++)
        for (let x = 0; x < g.cols; x++) {
          const edge = x < 2 || y < 2 || x >= g.cols - 2 || y >= g.rows - 2;
          if (edge) expect(g.cells[y * g.cols + x], `${id} ${String(x)},${String(y)}`).not.toBe('glaze');
        }
    }
  });

  it('keeps every crystal eye where only light reaches it: a niche behind clear ice', () => {
    const eyes = rooms.flatMap((id) => SCREENS[id].things.flatMap((t) => (t.k === 'eye' ? [{ id, t }] : [])));
    expect(eyes.length).toBe(6);
    for (const { id, t } of eyes) {
      const g = grid(id);
      const at = (x: number, y: number): string | undefined => g.cells[y * g.cols + x];
      const sides = [
        at(t.at.x + 1, t.at.y),
        at(t.at.x - 1, t.at.y),
        at(t.at.x, t.at.y + 1),
        at(t.at.x, t.at.y - 1),
      ];
      expect(
        sides.filter((c) => c === 'clear_ice'),
        id,
      ).toHaveLength(1);
      expect(
        sides.filter((c) => c === 'tower_wall'),
        id,
      ).toHaveLength(3);
    }
  });

  it('keeps Ása and Bjarni in its cells, behind bars, until Hrímgerðr falls', () => {
    const places = (id: 'asa' | 'bjarni') => DB.npcs[id]?.places ?? [];
    expect(places('asa').map((p) => p.screen)).toContain('d7_r19');
    expect(places('bjarni').map((p) => p.screen)).toContain('d7_r18');
  });

  it('keeps Svellr before the mirror, and Hrímgerðr behind the great lock', () => {
    const where = (enemy: string): ScreenId[] =>
      rooms.filter((id) => SCREENS[id].things.some((t) => t.k === 'enemy' && t.id === enemy));
    expect(where('svellr')).toEqual(['d7_r22']);
    expect(where('hrimgerdr')).toEqual(['d7_r04']);
    expect(SCREENS.d7_r04.things.some((t) => t.k === 'lock' && t.big === true)).toBe(true);
    const mirror = rooms.filter((id) =>
      SCREENS[id].things.some((t) => t.k === 'chest' && 'item' in t.gives && t.gives.item === 'mirror'),
    );
    expect(mirror).toEqual(['d7_r23']);
  });
});
