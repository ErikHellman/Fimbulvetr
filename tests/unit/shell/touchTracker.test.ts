import { describe, expect, it } from 'vitest';
import { bit } from '@core/input/actions';
import { layout, type LayoutInput } from '@shell/input/touchLayout';
import { TouchTracker } from '@shell/input/touchTracker';

const INPUT: LayoutInput = {
  w: 844,
  h: 390,
  insets: { top: 0, right: 0, bottom: 0, left: 0 },
  size: 'normal',
  leftHanded: false,
  offsets: {},
  context: 'play',
  hidden: new Set(),
};
const PLAY = layout(INPUT);
const at = (a: string): { x: number; y: number } => {
  const b = PLAY.buttons.find((x) => x.action === a);
  if (b === undefined) throw new Error(a);
  return b;
};

describe('touch tracker', () => {
  it('holds a button while the finger is on it', () => {
    const t = new TouchTracker(PLAY);
    t.down(1, at('sword').x, at('sword').y);
    expect(t.held()).toBe(bit('sword'));
    expect(t.up(1)).toBeNull();
    expect(t.held()).toBe(0);
  });

  it('keeps a tap quicker than a frame for the next read', () => {
    const t = new TouchTracker(PLAY);
    t.down(1, at('roll').x, at('roll').y);
    t.up(1);
    expect(t.held()).toBe(0);
    expect(t.take()).toBe(bit('roll'));
    expect(t.take()).toBe(0);
  });

  it('slides from one button onto another, and keeps the last one over a gap', () => {
    const t = new TouchTracker(PLAY);
    t.down(1, at('sword').x, at('sword').y);
    t.move(1, at('roll').x, at('roll').y);
    expect(t.held()).toBe(bit('roll'));
    t.move(1, 400, 30);
    expect(t.held()).toBe(bit('roll'));
  });

  it('drives the stick from where the thumb lands, with a second finger on a button', () => {
    const t = new TouchTracker(PLAY);
    t.down(1, 150, 300);
    t.move(1, 150 + (PLAY.stick?.r ?? 0), 300);
    t.down(2, at('shield').x, at('shield').y);
    expect(t.axes()).toEqual([1, 0]);
    expect(t.held()).toBe(bit('shield') | bit('right'));
    t.up(1);
    expect(t.axes()).toEqual([0, 0]);
  });

  it('reports a tap that did not move, and not a drag', () => {
    const t = new TouchTracker(PLAY);
    t.down(1, 600, 60);
    expect(t.up(1)).toEqual({ x: 600, y: 60 });
    t.down(2, 600, 60);
    t.move(2, 640, 60);
    expect(t.up(2)).toBeNull();
  });

  it('lets go of buttons a new layout no longer has', () => {
    const t = new TouchTracker(PLAY);
    t.down(1, at('sword').x, at('sword').y);
    t.down(2, 150, 300);
    t.setLayout(layout({ ...INPUT, context: 'menu' }));
    expect(t.held()).toBe(0);
    expect(t.stick()).toBeNull();
  });
});
