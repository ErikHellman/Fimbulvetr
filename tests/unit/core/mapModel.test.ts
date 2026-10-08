import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { NEW_GAME } from '@content/start';
import { newGame } from '@core/state/gameState';
import { beaconMarks, gridScreenOf, overworldMap } from '@core/world/mapModel';

describe('overworld map', () => {
  it('lists every grid screen once, in reading order, with its region', () => {
    const m = overworldMap(DB.layout, DB.screens, [], 'ask_farmyard');
    const ids = m.cells.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain('ask_farmyard');
    expect(ids).not.toContain('ask_int_longhouse');
    expect(m.cells.find((c) => c.id === 'ask_village')?.region).toBe('askdalr');
    const order = m.cells.map((c) => c.gy * 100 + c.gx);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it('marks visited screens and the one the hero is on, and frames them', () => {
    const m = overworldMap(DB.layout, DB.screens, ['ask_farmyard', 'ask_village', 'ask_gate'], 'ask_village');
    expect(m.cells.filter((c) => c.visited).map((c) => c.id)).toEqual([
      'ask_gate',
      'ask_farmyard',
      'ask_village',
    ]);
    expect(m.cells.filter((c) => c.here).map((c) => c.id)).toEqual(['ask_village']);
    expect(m).toMatchObject({ x0: 4, y0: 9, x1: 5, y1: 10 });
  });

  it('places the hero inside a house on the screen its door opens from', () => {
    expect(gridScreenOf(DB.layout, DB.screens, 'ask_int_longhouse')).toBe('ask_farmyard');
    expect(gridScreenOf(DB.layout, DB.screens, 'ask_int_trader')).toBe('ask_village');
    const m = overworldMap(DB.layout, DB.screens, ['ask_farmyard'], 'ask_int_longhouse');
    expect(m.cells.find((c) => c.here)?.id).toBe('ask_farmyard');
  });
});

describe('verse markers', () => {
  it('marks a screen on the map, unvisited or not, and frames it', () => {
    const m = overworldMap(DB.layout, DB.screens, ['ask_farmyard'], 'ask_farmyard', ['ask_village']);
    expect(m.cells.filter((c) => c.marked).map((c) => c.id)).toEqual(['ask_village']);
    expect(m).toMatchObject({ x0: 4, y0: 10, x1: 5, y1: 10 });
    const none = overworldMap(DB.layout, DB.screens, ['ask_farmyard'], 'ask_farmyard');
    expect(none.cells.some((c) => c.marked)).toBe(false);
  });
});

describe('the beacon arm-ring', () => {
  it('marks every overworld screen with a heart piece still lying out, and none once taken', () => {
    const s = newGame(1, NEW_GAME);
    const marks = beaconMarks(DB.layout, DB.screens, s);
    expect(marks).toContain('hrf_glacier');
    expect(marks.every((id) => DB.layout.at[id] !== undefined)).toBe(true);
    expect(new Set(marks).size).toBe(marks.length);
    s.world.pieces.push('hp_hrf_glacier');
    expect(beaconMarks(DB.layout, DB.screens, s)).not.toContain('hrf_glacier');
  });

  it('leaves dungeon rooms to the compass', () => {
    const marks = beaconMarks(DB.layout, DB.screens, newGame(1, NEW_GAME));
    expect(marks.some((id) => DB.screens[id].dungeon !== undefined)).toBe(false);
  });
});
