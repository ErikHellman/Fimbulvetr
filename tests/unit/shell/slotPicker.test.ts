import { describe, expect, it } from 'vitest';
import type { Action } from '@core/input/actions';
import { ARM_FRAMES, DONE_FRAMES, openPicker as fresh, pickerDone, stepPicker } from '@shell/ui/slotPicker';
import { frameOf } from '../../sim/harness';

const press = (...a: Action[]) => frameOf([], a);
/** A picker that has been open long enough to take input. */
const openPicker = () => ({ ...fresh(), t: ARM_FRAMES });

describe('slot picker', () => {
  it('ignores the key that closed the text before it', () => {
    let s = fresh();
    for (let i = 0; i < ARM_FRAMES; i++) {
      const r = stepPicker(s, press('confirm'));
      expect(r.action).toBeNull();
      s = r.state;
    }
    expect(stepPicker(s, press('confirm')).action).toEqual({ k: 'write', slot: 's1' });
  });

  it('moves over the three slots and "leave", wrapping', () => {
    const up = stepPicker(openPicker(), press('up'));
    expect(up.state.cursor).toBe(3);
    expect(up.moved).toBe(true);
  });

  it('writes the chosen slot and waits for storage', () => {
    const down = stepPicker(openPicker(), press('down')).state;
    const r = stepPicker(down, press('confirm'));
    expect(r.action).toEqual({ k: 'write', slot: 's2' });
    expect(r.state.phase).toBe('writing');
    expect(stepPicker(r.state, press('confirm')).action).toBeNull();
  });

  it('leaves without saving on cancel or the last row', () => {
    expect(stepPicker(openPicker(), press('cancel')).action).toEqual({ k: 'close' });
    const last = stepPicker(openPicker(), press('up')).state;
    expect(stepPicker(last, press('confirm')).action).toEqual({ k: 'close' });
  });

  it('shows the result until a key, or closes by itself', () => {
    let s = pickerDone(stepPicker(openPicker(), press('confirm')).state);
    expect(stepPicker(s, press('confirm')).action).toEqual({ k: 'close' });
    let closed = false;
    for (let i = 0; i < DONE_FRAMES && !closed; i++) {
      const r = stepPicker(s, frameOf([]));
      s = r.state;
      closed = r.action !== null;
    }
    expect(closed).toBe(true);
  });
});
