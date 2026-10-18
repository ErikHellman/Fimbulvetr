import { describe, expect, it } from 'vitest';
import { hostPad, nativeHost, withHostPad } from '@shell/platform/host';

const host = (pad: string) => ({ platform: () => 'androidtv', pad: () => pad, exit: () => undefined });

describe('native host', () => {
  it('is found only when the app injected a well-formed host', () => {
    expect(nativeHost({})).toBeNull();
    expect(nativeHost({ FimbulvetrHost: { platform: 'x' } })).toBeNull();
    expect(nativeHost({ FimbulvetrHost: host('0,0,0') })?.platform).toBe('androidtv');
  });

  it('reads the pad as a standard-layout gamepad: button mask and left stick', () => {
    const pad = hostPad(host(`${(1 << 0) | (1 << 9) | (1 << 15)},0.5,-1`));
    expect(pad.connected).toBe(true);
    expect(pad.mapping).toBe('standard');
    const held = pad.buttons.flatMap((b, i) => (b.pressed ? [i] : []));
    expect(held).toEqual([0, 9, 15]);
    expect(pad.axes).toEqual([0.5, -1]);
  });

  it('treats a garbled pad string as nothing held', () => {
    const pad = hostPad(host('nonsense'));
    expect(pad.buttons.some((b) => b.pressed)).toBe(false);
    expect(pad.axes).toEqual([0, 0]);
  });

  it('puts the host pad ahead of browser pads, and adds nothing without a host', () => {
    const browserPad = { connected: true, mapping: 'standard', buttons: [], axes: [] };
    expect(withHostPad(null, [browserPad])).toEqual([browserPad]);
    const pads = withHostPad(nativeHost({ FimbulvetrHost: host('2,0,0') }), [browserPad]);
    expect(pads).toHaveLength(2);
    expect(pads[0]?.buttons[1]?.pressed).toBe(true);
  });
});
