import { describe, expect, it, vi } from 'vitest';
import { acquireTabLock, type LockManagerLike } from '@shell/platform/tabLock';

function fakeLocks(): LockManagerLike {
  const held = new Set<string>();
  return {
    request: (name, _options, callback) => {
      const lock = held.has(name) ? null : { name };
      if (lock !== null) held.add(name);
      return Promise.resolve(callback(lock));
    },
  };
}

describe('acquireTabLock', () => {
  it('lets exactly one tab hold the game', async () => {
    const locks = fakeLocks();
    expect(await acquireTabLock(locks)).toBe(true);
    expect(await acquireTabLock(locks)).toBe(false);
  });

  it('allows play where the Web Locks API is missing', async () => {
    expect(await acquireTabLock(undefined)).toBe(true);
  });

  it('allows play instead of hanging forever when the request rejects', async () => {
    const locks: LockManagerLike = {
      request: () => Promise.reject(new Error('SecurityError: storage is blocked for this origin')),
    };
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(await acquireTabLock(locks)).toBe(true);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
