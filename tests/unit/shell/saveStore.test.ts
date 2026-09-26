import { IDBFactory as FakeIDBFactory } from 'fake-indexeddb';
import { describe, expect, it, vi } from 'vitest';
import { NEW_GAME } from '@content/start';
import { newGame } from '@core/state/gameState';
import { makeSave } from '@core/state/save';
import { SaveStore, openSaveStoreSafely } from '@shell/platform/saveStore';

const factory = (): IDBFactory => new FakeIDBFactory();

const save = (hp: number) => {
  const s = newGame(1, NEW_GAME);
  s.hero.hp = hp;
  return makeSave(s, 'test', '2026-09-26T00:00:00.000Z');
};

describe('SaveStore', () => {
  it('keeps the previous autosave as auto_prev', async () => {
    const store = await SaveStore.open(factory());
    await store.writeAuto(save(12));
    await store.writeAuto(save(8));
    expect((await store.get('auto'))?.save.state.hero.hp).toBe(8);
    expect((await store.get('auto_prev'))?.save.state.hero.hp).toBe(12);
    expect((await store.get('auto'))?.summary).toMatchObject({
      screen: 'test_a',
      hearts: 2,
      day: 1,
      season: 'summer',
    });
    store.close();
  });

  it('writes manual slots and meta values', async () => {
    const store = await SaveStore.open(factory());
    await store.writeSlot('s2', save(10));
    await store.setMeta('persistAsked', true);
    expect((await store.get('s2'))?.save.state.hero.hp).toBe(10);
    expect(await store.getMeta('persistAsked')).toBe(true);
    expect(await store.get('s1')).toBeUndefined();
    store.close();
  });

  it('returns null instead of throwing when IndexedDB is missing or broken', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(await openSaveStoreSafely(undefined)).toBeNull();
    const broken = {
      open: () => {
        throw new Error('blocked');
      },
    } as unknown as IDBFactory;
    expect(await openSaveStoreSafely(broken)).toBeNull();
    warn.mockRestore();
  });
});
