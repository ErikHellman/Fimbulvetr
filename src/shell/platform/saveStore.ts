import type { Season } from '@core/clock/types';
import type { SaveData } from '@core/state/save';
import { openDatabase, request, transactionDone } from './idb';

export const DB_NAME = 'fimbulvetr';
const DB_VERSION = 1;
const SAVES = 'saves';
const META = 'meta';

export type SlotId = 'auto' | 'auto_prev' | 's1' | 's2' | 's3';

/** Shown on the load screen without parsing the whole save. */
export interface SaveSummary {
  readonly screen: string;
  readonly hearts: number;
  readonly playTicks: number;
  readonly day: number;
  readonly season: Season;
}

export interface SaveRecord {
  readonly slot: SlotId;
  readonly summary: SaveSummary;
  readonly save: SaveData;
}

export function summarize(save: SaveData): SaveSummary {
  const s = save.state;
  return {
    screen: s.hero.screen,
    hearts: s.hero.hp / 4,
    playTicks: s.playTicks,
    day: s.clock.day,
    season: s.clock.season,
  };
}

export class SaveStore {
  private constructor(private readonly db: IDBDatabase) {}

  static async open(factory: IDBFactory, name: string = DB_NAME): Promise<SaveStore> {
    const db = await openDatabase(factory, name, DB_VERSION, (d) => {
      if (!d.objectStoreNames.contains(SAVES)) d.createObjectStore(SAVES, { keyPath: 'slot' });
      if (!d.objectStoreNames.contains(META)) d.createObjectStore(META);
    });
    return new SaveStore(db);
  }

  async get(slot: SlotId): Promise<SaveRecord | undefined> {
    const tx = this.db.transaction(SAVES, 'readonly');
    return (await request(tx.objectStore(SAVES).get(slot))) as SaveRecord | undefined;
  }

  /** Writes the autosave and keeps the one before it as `auto_prev`, in a single transaction. */
  async writeAuto(save: SaveData): Promise<void> {
    const tx = this.db.transaction(SAVES, 'readwrite');
    const store = tx.objectStore(SAVES);
    const current = store.get('auto');
    current.onsuccess = () => {
      const previous = current.result as SaveRecord | undefined;
      if (previous !== undefined) store.put({ ...previous, slot: 'auto_prev' } satisfies SaveRecord);
      store.put({ slot: 'auto', summary: summarize(save), save } satisfies SaveRecord);
    };
    await transactionDone(tx);
  }

  /** Manual slots (mead halls, hofs) ask for strict durability. */
  async writeSlot(slot: 's1' | 's2' | 's3', save: SaveData): Promise<void> {
    const tx = this.db.transaction(SAVES, 'readwrite', { durability: 'strict' });
    tx.objectStore(SAVES).put({ slot, summary: summarize(save), save } satisfies SaveRecord);
    await transactionDone(tx);
  }

  async getMeta(key: string): Promise<unknown> {
    const tx = this.db.transaction(META, 'readonly');
    return request(tx.objectStore(META).get(key));
  }

  async setMeta(key: string, value: unknown): Promise<void> {
    const tx = this.db.transaction(META, 'readwrite');
    tx.objectStore(META).put(value, key);
    await transactionDone(tx);
  }

  close(): void {
    this.db.close();
  }
}

/** The game must still start where IndexedDB is missing or refuses to open (private mode, blocked data). */
export async function openSaveStoreSafely(factory: IDBFactory | undefined): Promise<SaveStore | null> {
  if (factory === undefined) return null;
  try {
    return await SaveStore.open(factory);
  } catch (e) {
    console.warn('[save] IndexedDB unavailable:', e);
    return null;
  }
}
