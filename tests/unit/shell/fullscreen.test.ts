import { describe, expect, it } from 'vitest';
import {
  fullscreenState,
  toggleFullscreen,
  isFullscreenHotkey,
  type FullscreenDoc,
} from '@shell/platform/fullscreen';

function fakeDoc(kind: 'standard' | 'webkit' | 'none', on = false) {
  const calls: string[] = [];
  const root: Record<string, unknown> = {};
  const doc: Record<string, unknown> = { documentElement: root };
  if (kind === 'standard') {
    doc['fullscreenEnabled'] = true;
    doc['fullscreenElement'] = on ? root : null;
    root['requestFullscreen'] = () => (calls.push('request'), Promise.resolve());
    doc['exitFullscreen'] = () => (calls.push('exit'), Promise.resolve());
  } else if (kind === 'webkit') {
    doc['webkitFullscreenEnabled'] = true;
    doc['webkitFullscreenElement'] = on ? root : null;
    root['webkitRequestFullscreen'] = () => {
      calls.push('webkit-request');
    };
    doc['webkitExitFullscreen'] = () => {
      calls.push('webkit-exit');
    };
  }
  return { doc: doc as unknown as FullscreenDoc, calls };
}

describe('fullscreen', () => {
  it('reads the state through the standard API or the webkit prefix', () => {
    expect(fullscreenState(fakeDoc('standard').doc, false)).toBe('off');
    expect(fullscreenState(fakeDoc('standard', true).doc, false)).toBe('on');
    expect(fullscreenState(fakeDoc('webkit', true).doc, false)).toBe('on');
    expect(fullscreenState(fakeDoc('none').doc, false)).toBe('unsupported');
    // An installed app on a phone without element fullscreen already fills the screen.
    expect(fullscreenState(fakeDoc('none').doc, true)).toBe('on');
  });

  it('enters and leaves with whichever API the browser has', async () => {
    const std = fakeDoc('standard');
    expect(await toggleFullscreen(std.doc)).toBe(true);
    const stdOn = fakeDoc('standard', true);
    expect(await toggleFullscreen(stdOn.doc)).toBe(true);
    const wk = fakeDoc('webkit');
    expect(await toggleFullscreen(wk.doc)).toBe(true);
    const wkOn = fakeDoc('webkit', true);
    expect(await toggleFullscreen(wkOn.doc)).toBe(true);
    expect([...std.calls, ...stdOn.calls, ...wk.calls, ...wkOn.calls]).toEqual([
      'request',
      'exit',
      'webkit-request',
      'webkit-exit',
    ]);
    expect(await toggleFullscreen(fakeDoc('none').doc)).toBe(false);
  });

  it('reports a refused request (no user gesture, as from a gamepad) as false', async () => {
    const { doc } = fakeDoc('standard');
    (doc.documentElement as unknown as Record<string, unknown>)['requestFullscreen'] = () =>
      Promise.reject(new TypeError('Permissions check failed'));
    expect(await toggleFullscreen(doc)).toBe(false);
  });

  it('takes F11 and Alt+Enter as the hotkey', () => {
    expect(isFullscreenHotkey({ code: 'F11', altKey: false })).toBe(true);
    expect(isFullscreenHotkey({ code: 'Enter', altKey: true })).toBe(true);
    expect(isFullscreenHotkey({ code: 'Enter', altKey: false })).toBe(false);
    expect(isFullscreenHotkey({ code: 'KeyF', altKey: false })).toBe(false);
  });
});
