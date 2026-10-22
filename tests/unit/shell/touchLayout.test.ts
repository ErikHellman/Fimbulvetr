import { describe, expect, it } from 'vitest';
import type { Action } from '@core/input/actions';
import { buttonAt, buttonSize, layout, type LayoutInput } from '@shell/input/touchLayout';

const PHONE: LayoutInput = {
  w: 844,
  h: 390,
  insets: { top: 0, right: 0, bottom: 21, left: 47 },
  size: 'normal',
  leftHanded: false,
  offsets: {},
  context: 'play',
  hidden: new Set(),
};

const find = (l: ReturnType<typeof layout>, a: Action) => l.buttons.find((b) => b.action === a);

describe('touch layout', () => {
  it('sizes buttons for thumbs: never under 48 px, capped on tablets, scaled by the setting', () => {
    expect(buttonSize(844, 390, 'normal')).toBe(59);
    expect(buttonSize(320, 240, 'normal')).toBe(48);
    expect(buttonSize(1366, 1024, 'normal')).toBe(84);
    expect(buttonSize(844, 390, 'large')).toBeGreaterThan(buttonSize(844, 390, 'normal'));
  });

  it('puts the sword bottom right, the stick bottom left, and every button on screen', () => {
    const l = layout(PHONE);
    const sword = find(l, 'sword');
    expect(sword?.x).toBeGreaterThan(PHONE.w * 0.8);
    expect(sword?.y).toBeGreaterThan(PHONE.h * 0.7);
    expect(l.stick?.x).toBeLessThan(PHONE.w * 0.3);
    expect(l.stick?.zone.x).toBe(0);
    for (const b of l.buttons) {
      expect(b.x - b.r).toBeGreaterThanOrEqual(PHONE.insets.left);
      expect(b.x + b.r).toBeLessThanOrEqual(PHONE.w - PHONE.insets.right);
      expect(b.y - b.r).toBeGreaterThanOrEqual(0);
      expect(b.y + b.r).toBeLessThanOrEqual(PHONE.h - PHONE.insets.bottom);
    }
  });

  it('keeps the play buttons from overlapping each other', () => {
    const l = layout(PHONE);
    for (const a of l.buttons)
      for (const b of l.buttons) {
        if (a === b) continue;
        expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(a.r + b.r - 1);
      }
  });

  it('mirrors for the left hand', () => {
    const l = layout({ ...PHONE, leftHanded: true });
    expect(find(l, 'sword')?.x).toBeLessThan(PHONE.w * 0.2);
    expect(l.stick?.zone.x).toBeGreaterThan(PHONE.w / 2);
  });

  it('leaves out hidden buttons, and shows a d-pad with OK and Back in menus', () => {
    expect(find(layout({ ...PHONE, hidden: new Set(['galdr']) }), 'galdr')).toBeUndefined();
    const menu = layout({ ...PHONE, context: 'menu' });
    expect(menu.stick).toBeNull();
    expect(menu.buttons.map((b) => b.action).sort()).toEqual(
      ['cancel', 'confirm', 'down', 'left', 'right', 'up'].sort(),
    );
  });

  it('adds the item buttons to a menu that asks for them', () => {
    const menu = layout({ ...PHONE, context: 'menu', extras: ['item1', 'item2'] });
    expect(find(menu, 'item1')).toBeDefined();
    expect(find(menu, 'item2')).toBeDefined();
  });

  it('moves a button by its offset in diameters, but never off screen', () => {
    const home = find(layout(PHONE), 'roll');
    const moved = find(layout({ ...PHONE, offsets: { roll: { dx: -1, dy: 0 } } }), 'roll');
    expect((home?.x ?? 0) - (moved?.x ?? 0)).toBe(59);
    const far = find(layout({ ...PHONE, offsets: { roll: { dx: 50, dy: 50 } } }), 'roll');
    expect((far?.x ?? 0) + (far?.r ?? 0)).toBeLessThanOrEqual(PHONE.w);
  });

  it('finds the button under a thumb, with a little slop', () => {
    const l = layout(PHONE);
    const sword = find(l, 'sword');
    if (sword === undefined) throw new Error('no sword');
    expect(buttonAt(l, sword.x + sword.r, sword.y)?.action).toBe('sword');
    expect(buttonAt(l, 400, 50)).toBeNull();
  });
});
