import { describe, expect, it } from 'vitest';
import { DEFAULT_BINDINGS } from '@content/bindings';
import { REMAPPABLE, bindingsOf, keyLabel, rebind } from '@shell/input/remap';

describe('key remapping', () => {
  it('lays the overrides over the default bindings', () => {
    const b = bindingsOf({ sword: ['KeyU'] });
    expect(b.kb.sword).toEqual(['KeyU']);
    expect(b.kb.roll).toEqual(DEFAULT_BINDINGS.kb.roll);
    expect(b.pad).toBe(DEFAULT_BINDINGS.pad);
  });

  it('puts the new key first and keeps the action’s other keys', () => {
    const keys = rebind({}, 'up', 'KeyI');
    expect(bindingsOf(keys).kb.up).toEqual(['KeyI', 'ArrowUp']);
  });

  it('takes a key away from the action that had it, and swaps when that leaves it with none', () => {
    const keys = rebind({}, 'sword', 'KeyK');
    const b = bindingsOf(keys);
    expect(b.kb.sword).toEqual(['KeyK']);
    expect(b.kb.item1).toEqual(['KeyJ']);
    // Menu keys never lose their fixed keys.
    const e = bindingsOf(rebind({}, 'sword', 'KeyE'));
    expect(e.kb.sword).toEqual(['KeyE']);
    expect(e.kb.interact).toEqual(['KeyJ']);
    expect(e.kb.confirm).toEqual(DEFAULT_BINDINGS.kb.confirm);
  });

  it('never remaps the menu keys, so the player cannot lock themselves out', () => {
    expect(REMAPPABLE).not.toContain('confirm');
    expect(REMAPPABLE).not.toContain('cancel');
    expect(rebind({}, 'confirm', 'KeyQ')).toEqual({});
  });

  it('names keys for the menu', () => {
    expect(keyLabel('KeyJ')).toBe('J');
    expect(keyLabel('ArrowUp')).toBe('↑');
    expect(keyLabel('Space')).toBe('Space');
    expect(keyLabel('ShiftLeft')).toBe('Shift');
    expect(keyLabel('Digit3')).toBe('3');
  });
});
