import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { gridScreenOf, overworldMap } from '@core/world/mapModel';

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
