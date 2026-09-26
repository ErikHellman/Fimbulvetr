import { describe, expect, it } from 'vitest';
import { DEFAULT_BINDINGS } from '@content/bindings';
import { InputLatch, isHeld, wasPressed, wasReleased } from '@core/input/actions';
import { connectedPads, deadzone, readPad, type GamepadLike } from '@shell/input/gamepad';
import { KeyboardState, isTextInput } from '@shell/input/keyboard';
import { InputMapper } from '@shell/input/mapper';

function key(
  code: string,
  target: unknown = null,
): { code: string; target: EventTarget | null; preventDefault(): void; prevented: boolean } {
  const e = {
    code,
    target: target as EventTarget | null,
    prevented: false,
    preventDefault() {
      e.prevented = true;
    },
  };
  return e;
}

function setup(holdToggleShield = false): { keys: KeyboardState; latch: InputLatch; mapper: InputMapper } {
  const keys = new KeyboardState();
  const latch = new InputLatch();
  return { keys, latch, mapper: new InputMapper(DEFAULT_BINDINGS, latch, { holdToggleShield }) };
}

function pad(buttons: number[], axes: [number, number] = [0, 0]): GamepadLike {
  return {
    connected: true,
    mapping: 'standard',
    axes,
    buttons: Array.from({ length: 17 }, (_, i) => ({
      pressed: buttons.includes(i),
      value: buttons.includes(i) ? 1 : 0,
    })),
  };
}

describe('KeyboardState', () => {
  it('tracks physical keys and captures browser-scrolling keys', () => {
    const keys = new KeyboardState();
    const space = key('Space');
    keys.down(space);
    keys.down(key('KeyW'));
    expect([...keys.codes()].sort()).toEqual(['KeyW', 'Space']);
    expect(space.prevented).toBe(true);
    keys.up({ code: 'KeyW' });
    expect([...keys.codes()]).toEqual(['Space']);
  });

  it('ignores keys typed into text fields', () => {
    const keys = new KeyboardState();
    keys.down(key('KeyD', { tagName: 'INPUT' }));
    expect(keys.codes().size).toBe(0);
    expect(isTextInput({ tagName: 'TEXTAREA' })).toBe(true);
    expect(isTextInput({ tagName: 'CANVAS' })).toBe(false);
  });

  it('keeps a tap that starts and ends between two takeCodes() samples', () => {
    const keys = new KeyboardState();
    keys.down(key('KeyJ'));
    keys.up({ code: 'KeyJ' });
    expect([...keys.takeCodes()]).toEqual(['KeyJ']);
    expect([...keys.takeCodes()]).toEqual([]);
  });

  it('drops pending taps on clear() (blur)', () => {
    const keys = new KeyboardState();
    keys.down(key('KeyJ'));
    keys.up({ code: 'KeyJ' });
    keys.clear();
    expect([...keys.takeCodes()]).toEqual([]);
  });
});

describe('InputMapper', () => {
  it('maps WASD to actions and a digital move vector', () => {
    const { keys, latch, mapper } = setup();
    keys.down(key('KeyW'));
    keys.down(key('KeyD'));
    mapper.sample(keys.codes(), null);
    const f = latch.consume();
    expect(isHeld(f, 'up') && isHeld(f, 'right')).toBe(true);
    expect([f.mx, f.my]).toEqual([1, -1]);
  });

  it('releases everything when the window loses focus', () => {
    const { keys, latch, mapper } = setup();
    keys.down(key('KeyD'));
    mapper.sample(keys.codes(), null);
    latch.consume();
    keys.clear();
    mapper.sample(keys.codes(), null);
    const f = latch.consume();
    expect(wasReleased(f, 'right')).toBe(true);
    expect(f.held).toBe(0);
    expect(f.mx).toBe(0);
  });

  it('uses the standard gamepad layout and prefers the analog stick', () => {
    const { latch, mapper } = setup();
    mapper.sample(new Set(), readPad([pad([2, 5], [0.9, 0])]));
    const f = latch.consume();
    expect(wasPressed(f, 'sword')).toBe(true);
    expect(wasPressed(f, 'roll')).toBe(true);
    expect(f.mx).toBeGreaterThan(0.8);
  });

  it('turns shield into a toggle when hold-to-toggle is on', () => {
    const { keys, latch, mapper } = setup(true);
    keys.down(key('ShiftLeft'));
    mapper.sample(keys.codes(), null);
    keys.up({ code: 'ShiftLeft' });
    mapper.sample(keys.codes(), null);
    expect(isHeld(latch.consume(), 'shield')).toBe(true);
    keys.down(key('ShiftLeft'));
    mapper.sample(keys.codes(), null);
    keys.up({ code: 'ShiftLeft' });
    mapper.sample(keys.codes(), null);
    latch.consume();
    expect(isHeld(latch.consume(), 'shield')).toBe(false);
  });

  it('never loses a key tap that falls entirely between two once-per-frame samples', () => {
    const { keys, latch, mapper } = setup();
    // The keydown and keyup both arrive before the next rendered frame samples the keyboard.
    keys.down(key('KeyJ'));
    keys.up({ code: 'KeyJ' });
    mapper.sample(keys.takeCodes(), null);
    const first = latch.consume();
    expect(wasPressed(first, 'sword')).toBe(true);

    mapper.sample(keys.takeCodes(), null);
    const second = latch.consume();
    expect(wasReleased(second, 'sword')).toBe(true);
    expect(second.held).toBe(0);
  });

  it('toggles hold-to-toggle shield from a tap shorter than a frame', () => {
    const { keys, latch, mapper } = setup(true);
    // Both the keydown and keyup arrive before the frame samples the keyboard.
    keys.down(key('ShiftLeft'));
    keys.up({ code: 'ShiftLeft' });
    mapper.sample(keys.takeCodes(), null);
    expect(isHeld(latch.consume(), 'shield')).toBe(true);
  });
});

describe('gamepad', () => {
  it('ignores a disconnected or absent pad', () => {
    expect(readPad([])).toBeNull();
    expect(readPad([null, { ...pad([0]), connected: false }])).toBeNull();
  });

  it('applies a radial dead zone and rescales outside it', () => {
    expect(deadzone(0.1, 0.1)).toEqual([0, 0]);
    const [x, y] = deadzone(1, 0);
    expect(x).toBeCloseTo(1);
    expect(y).toBe(0);
  });

  it('treats a non-finite axis as zero instead of freezing the tab', () => {
    expect(deadzone(NaN, 0)).toEqual([0, 0]);
    expect(deadzone(0, NaN)).toEqual([0, 0]);
    expect(deadzone(Infinity, 0)).toEqual([0, 0]);
  });
});

describe('connectedPads', () => {
  it('returns an empty list when getGamepads is missing', () => {
    expect(connectedPads({})).toEqual([]);
  });

  it('returns an empty list instead of throwing when getGamepads throws', () => {
    const nav = {
      getGamepads(): never {
        throw new Error('insecure origin');
      },
    };
    expect(connectedPads(nav)).toEqual([]);
  });

  it('passes through the pads when getGamepads succeeds', () => {
    const pads = [pad([0])];
    expect(connectedPads({ getGamepads: () => pads })).toBe(pads);
  });
});
