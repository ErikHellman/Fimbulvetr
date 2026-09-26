import { describe, expect, it } from 'vitest';
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
});
