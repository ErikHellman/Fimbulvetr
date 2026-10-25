import type { GameState } from '@core/state/gameState';
import { loadSave, makeSave, parseSaveJson, type LoadResult, type SaveData } from '@core/state/save';
import { Autosaver } from './autosave';
import { downloadSave } from './exportImport';
import type { SaveStore, SaveSummary, SlotId } from './saveStore';

export const SLOT_IDS = ['auto', 'auto_prev', 's1', 's2', 's3'] as const satisfies readonly SlotId[];
export type ManualSlot = 's1' | 's2' | 's3';
/** The slots cloud saves copy: `auto_prev` stays a backup in this browser only. */
export const CLOUD_SLOTS = ['auto', 's1', 's2', 's3'] as const satisfies readonly SlotId[];
export type CloudSlot = (typeof CLOUD_SLOTS)[number];

export const AUTOSAVE_INTERVAL_MS = 4000;

/** Everything the game does with saves. Works (as a no-op for storage) when IndexedDB is unavailable. */
export class SaveService {
  readonly autosaver: Autosaver;
  /** Told about every save the game writes (the autosave and manual slots), for cloud saves. */
  onWrite: ((slot: CloudSlot, save: SaveData) => void) | null = null;
  private persistAsked = false;

  constructor(
    private readonly store: SaveStore | null,
    private readonly build: string,
    private readonly knownScreens: ReadonlySet<string>,
  ) {
    this.autosaver = new Autosaver({
      write: (state) => this.writeAuto(state),
      now: () => performance.now(),
      setTimer: (fn, ms) => setTimeout(fn, ms),
      clearTimer: (handle) => {
        clearTimeout(handle as number);
      },
      minIntervalMs: AUTOSAVE_INTERVAL_MS,
      onError: (e) => {
        console.warn('[save] autosave failed:', e);
      },
    });
  }

  get available(): boolean {
    return this.store !== null;
  }

  /** Every slot's summary for the title and slot screens (null: empty or unreadable). */
  async slots(): Promise<Record<SlotId, SaveSummary | null>> {
    const out: Record<SlotId, SaveSummary | null> = {
      auto: null,
      auto_prev: null,
      s1: null,
      s2: null,
      s3: null,
    };
    if (this.store === null) return out;
    for (const slot of SLOT_IDS) {
      try {
        out[slot] = (await this.store.get(slot))?.summary ?? null;
      } catch (e) {
        console.warn(`[save] reading ${slot} failed:`, e);
      }
    }
    return out;
  }

  /** A slot's game, validated and migrated; null when empty or unusable. */
  async loadSlot(slot: SlotId): Promise<GameState | null> {
    if (this.store === null) return null;
    let record;
    try {
      record = await this.store.get(slot);
    } catch (e) {
      console.warn(`[save] reading ${slot} failed:`, e);
      return null;
    }
    if (record === undefined) return null;
    const result = loadSave(record.save, this.knownScreens);
    if (result.ok) return result.state;
    console.warn(`[save] ${slot} is unusable: ${result.error.detail}`);
    return null;
  }

  /** Writes a manual slot (at a mead hall or hof). Returns whether it was written. */
  async writeSlot(slot: ManualSlot, state: GameState): Promise<boolean> {
    if (this.store === null) return false;
    try {
      const save = this.toSave(state);
      await this.store.writeSlot(slot, save);
      this.onWrite?.(slot, save);
      return true;
    } catch (e) {
      console.warn(`[save] writing ${slot} failed:`, e);
      return false;
    }
  }

  /** The newest usable autosave, falling back to the one before it. */
  async loadAuto(): Promise<GameState | null> {
    if (this.store === null) return null;
    for (const slot of ['auto', 'auto_prev'] as const) {
      let record;
      try {
        record = await this.store.get(slot);
      } catch (e) {
        console.warn(`[save] reading ${slot} failed:`, e);
        continue;
      }
      if (record === undefined) continue;
      const result = loadSave(record.save, this.knownScreens);
      if (result.ok) return result.state;
      console.warn(`[save] ${slot} is unusable: ${result.error.detail}`);
    }
    return null;
  }

  /** The stored saves of the slots cloud saves copy, as written (missing or unreadable ones left out). */
  async stored(): Promise<Partial<Record<CloudSlot, SaveData>>> {
    const out: Partial<Record<CloudSlot, SaveData>> = {};
    if (this.store === null) return out;
    for (const slot of CLOUD_SLOTS) {
      try {
        const record = await this.store.get(slot);
        if (record !== undefined) out[slot] = record.save;
      } catch (e) {
        console.warn(`[save] reading ${slot} failed:`, e);
      }
    }
    return out;
  }

  /**
   * Stores a save that came from elsewhere (the cloud) in a slot, if it loads here. A fetched autosave moves
   * the current one to `auto_prev`, as any autosave does. Not reported to `onWrite`.
   */
  async adopt(slot: CloudSlot, raw: unknown): Promise<boolean> {
    if (this.store === null) return false;
    if (!loadSave(raw, this.knownScreens).ok) return false;
    const save = raw as SaveData;
    if (slot === 'auto') await this.store.writeAuto(save);
    else await this.store.writeSlot(slot, save);
    return true;
  }

  exportJson(state: GameState): string {
    return JSON.stringify(this.toSave(state), null, 2);
  }

  download(state: GameState): void {
    downloadSave(this.toSave(state), 'auto');
  }

  importText(text: string): LoadResult {
    return parseSaveJson(text, this.knownScreens);
  }

  private toSave(state: GameState): SaveData {
    return makeSave(state, this.build, new Date().toISOString());
  }

  private async writeAuto(state: GameState): Promise<void> {
    if (this.store === null) return;
    const save = this.toSave(state);
    await this.store.writeAuto(save);
    this.onWrite?.('auto', save);
    if (this.persistAsked) return;
    this.persistAsked = true;
    if ((await this.store.getMeta('persistAsked')) === true) return;
    await this.store.setMeta('persistAsked', true);
    try {
      // Safari evicts script storage after 7 days without a visit unless it is persistent (or installed).
      await navigator.storage.persist();
    } catch {
      // The Storage API is missing here; export/import remains the safety net.
    }
  }
}
