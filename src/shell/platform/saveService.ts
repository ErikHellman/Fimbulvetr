import type { GameState } from '@core/state/gameState';
import { loadSave, makeSave, parseSaveJson, type LoadResult, type SaveData } from '@core/state/save';
import { Autosaver } from './autosave';
import { downloadSave } from './exportImport';
import type { SaveStore } from './saveStore';

export const AUTOSAVE_INTERVAL_MS = 4000;

/** Everything the game does with saves. Works (as a no-op for storage) when IndexedDB is unavailable. */
export class SaveService {
  readonly autosaver: Autosaver;
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

  /** The newest usable autosave, falling back to the one before it. */
  async loadAuto(): Promise<GameState | null> {
    if (this.store === null) return null;
    for (const slot of ['auto', 'auto_prev'] as const) {
      const record = await this.store.get(slot);
      if (record === undefined) continue;
      const result = loadSave(record.save, this.knownScreens);
      if (result.ok) return result.state;
      console.warn(`[save] ${slot} is unusable: ${result.error.detail}`);
    }
    return null;
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
    await this.store.writeAuto(this.toSave(state));
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
