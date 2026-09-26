import { describe, expect, it } from 'vitest';
import { DEFAULT_BINDINGS } from '@content/bindings';
import { InputLatch, isHeld, wasPressed, wasReleased } from '@core/input/actions';
import { deadzone, readPad, type GamepadLike } from '@shell/input/gamepad';
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
});
