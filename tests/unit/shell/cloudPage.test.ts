import { describe, expect, it } from 'vitest';
import { cloudRows, openCloudPage, stepCloudPage } from '@shell/ui/cloudPage';
import { frameOf } from '../../sim/harness';

describe('cloud saves page', () => {
  it('offers both services until connected, then Sync and Disconnect, or Reconnect', () => {
    expect(cloudRows('off')).toEqual(['dropbox', 'google', 'back']);
    expect(cloudRows('on')).toEqual(['sync', 'disconnect', 'back']);
    expect(cloudRows('reconnect')).toEqual(['reconnect', 'disconnect', 'back']);
  });

  it('moves, wraps and takes the row under the cursor', () => {
    const s0 = openCloudPage();
    expect(stepCloudPage(s0, frameOf([], ['confirm']), 'off').action).toBe('dropbox');
    const up = stepCloudPage(s0, frameOf([], ['up']), 'on');
    expect(up.state.cursor).toBe(2);
    expect(stepCloudPage(up.state, frameOf([], ['confirm']), 'on').action).toBe('back');
    expect(stepCloudPage(s0, frameOf([], ['down']), 'on').state.cursor).toBe(1);
  });

  it('goes back on Esc and keeps the cursor in range when the rows shrink', () => {
    expect(stepCloudPage(openCloudPage(), frameOf([], ['cancel']), 'on').action).toBe('back');
    const r = stepCloudPage({ cursor: 5 }, frameOf([]), 'off');
    expect(r).toEqual({ state: { cursor: 2 }, action: null, moved: false });
  });
});
