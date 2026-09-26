import { describe, expect, it, vi } from 'vitest';
import { FrameIndex } from '@shell/gfx/frameIndex';

describe('FrameIndex', () => {
  it('returns registered frames', () => {
    const index = new FrameIndex();
    index.set('hero_idle_s_0', { key: 'sprites_0', frame: 'hero_idle_s_0', ox: 0.5, oy: 0.9 });
    expect(index.get('hero_idle_s_0').key).toBe('sprites_0');
  });

  it('falls back to the missing frame and reports each name once', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const index = new FrameIndex();
    index.set('missing', { key: 'sprites_0', frame: 'missing', ox: 0.5, oy: 1 });
    expect(index.get('nope').frame).toBe('missing');
    index.get('nope');
    expect(error).toHaveBeenCalledTimes(1);
    expect(index.missingNames()).toEqual(['nope']);
    error.mockRestore();
  });
});
