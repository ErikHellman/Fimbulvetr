import { IDBFactory as FakeIDBFactory } from 'fake-indexeddb';
import { describe, expect, it, vi } from 'vitest';
import { NEW_GAME } from '@content/start';
import { SCREEN_IDS, type ScreenId } from '@content/world/screens';
import { newGame } from '@core/state/gameState';
import { makeSave, type LoadResult } from '@core/state/save';
import { importMessageKey, saveFileName } from '@shell/platform/exportImport';
import { SaveService } from '@shell/platform/saveService';
import { SaveStore } from '@shell/platform/saveStore';

const known = new Set<string>(SCREEN_IDS);
const factory = (): IDBFactory => new FakeIDBFactory();

describe('SaveService', () => {
  it('falls back to the previous autosave when the latest one is unusable', async () => {
    const store = await SaveStore.open(factory());
    const service = new SaveService(store, 'test', known);
    const good = newGame(1, NEW_GAME);
    good.hero.hp = 9;
    await store.writeAuto(makeSave(good, 'test', 'x'));
    const bad = newGame(1, NEW_GAME);
    bad.hero.screen = 'nowhere' as ScreenId;
    await store.writeAuto(makeSave(bad, 'test', 'x'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect((await service.loadAuto())?.hero.hp).toBe(9);
    warn.mockRestore();
  });

  it('works without storage', async () => {
    const service = new SaveService(null, 'test', known);
    expect(service.available).toBe(false);
    expect(await service.loadAuto()).toBeNull();
  });

  it('exports JSON that imports again', () => {
    const service = new SaveService(null, 'test', known);
    const result = service.importText(service.exportJson(newGame(3, NEW_GAME)));
    expect(result.ok && result.checksumOk).toBe(true);
  });
});

describe('export/import helpers', () => {
  it('names files by slot and date', () => {
    expect(saveFileName(makeSave(newGame(1, NEW_GAME), 'b', '2026-09-26T10:00:00.000Z'), 'auto')).toBe(
      'fimbulvetr-auto-2026-09-26.json',
    );
  });

  it('maps load results to messages', () => {
    const ok: LoadResult = { ok: true, state: newGame(1, NEW_GAME), checksumOk: true, fromVersion: 1 };
    expect(importMessageKey(ok)).toBe('import_ok');
    expect(importMessageKey({ ...ok, checksumOk: false })).toBe('import_checksum');
    expect(importMessageKey({ ok: false, error: { code: 'not-a-save', detail: '' } })).toBe(
      'import_bad_file',
    );
    expect(importMessageKey({ ok: false, error: { code: 'too-new', detail: '' } })).toBe('import_too_new');
    expect(importMessageKey({ ok: false, error: { code: 'invalid', detail: '' } })).toBe('import_invalid');
  });
});
