import { describe, expect, it } from 'vitest';
import { bit } from '@core/input/actions';
import { TapTargets, tapScript } from '@shell/input/tapTargets';

describe('tap targets', () => {
  it('moves the cursor to a tapped line first, then takes it', () => {
    const t = new TapTargets();
    t.rows(100, 50, 200, 12, 4, 1);
    const third = t.hit(150, 50 + 2 * 12 + 3);
    expect(third).not.toBeNull();
    if (third === null) return;
    expect(tapScript(third, 150)).toEqual([bit('down'), 0]);
    const second = t.hit(150, 50 + 12);
    if (second === null) throw new Error('no hit');
    expect(tapScript(second, 150)).toEqual([bit('confirm'), 0]);
  });

  it('steps up several lines, and tabs sideways without taking them', () => {
    expect(tapScript({ k: 'row', x: 0, y: 0, w: 1, h: 1, row: 0, cursor: 2 }, 0)).toEqual([
      bit('up'),
      0,
      bit('up'),
      0,
    ]);
    const tab = { k: 'row', x: 0, y: 0, w: 1, h: 1, row: 3, cursor: 1, axis: 'h', take: false } as const;
    expect(tapScript(tab, 0)).toEqual([bit('right'), 0, bit('right'), 0]);
    expect(tapScript({ ...tab, row: 1 }, 0)).toEqual([]);
  });

  it('goes the short way round a list that wraps', () => {
    const t = new TapTargets();
    t.rows(0, 0, 100, 10, 15, 0);
    const last = t.hit(5, 145);
    if (last === null) throw new Error('no hit');
    expect(tapScript(last, 5)).toEqual([bit('up'), 0]);
  });

  it('turns a value left or right by which half of it is tapped', () => {
    const row = { k: 'row', x: 0, y: 0, w: 300, h: 12, row: 1, cursor: 1, value: { x: 200, w: 60 } } as const;
    expect(tapScript(row, 210)).toEqual([bit('left'), 0]);
    expect(tapScript(row, 250)).toEqual([bit('right'), 0]);
    expect(tapScript(row, 50)).toEqual([bit('confirm'), 0]);
  });

  it('presses a plain button, and the topmost target wins', () => {
    const t = new TapTargets();
    t.add({ k: 'press', x: 0, y: 0, w: 640, h: 360, action: 'confirm' });
    t.add({ k: 'press', x: 10, y: 10, w: 20, h: 20, action: 'cancel' });
    expect(t.hit(15, 15)).toMatchObject({ action: 'cancel' });
    expect(t.hit(300, 300)).toMatchObject({ action: 'confirm' });
    expect(t.hit(700, 10)).toBeNull();
    t.clear();
    expect(t.size).toBe(0);
  });
});
