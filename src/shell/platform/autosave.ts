import type { GameState } from '@core/state/gameState';

export interface AutosaveDeps {
  write(state: GameState): Promise<void>;
  now(): number;
  setTimer(fn: () => void, ms: number): unknown;
  clearTimer(handle: unknown): void;
  readonly minIntervalMs: number;
  onError(error: unknown): void;
}

/** At most one write per interval; later requests collapse into one trailing write of the newest state. */
export class Autosaver {
  private pending: GameState | null = null;
  private lastWrite = Number.NEGATIVE_INFINITY;
  private timer: unknown = null;
  private writing: Promise<void> | null = null;

  constructor(private readonly deps: AutosaveDeps) {}

  request(state: GameState): void {
    this.pending = state;
    const wait = this.lastWrite + this.deps.minIntervalMs - this.deps.now();
    if (wait <= 0) {
      void this.flush();
    } else if (this.timer === null) {
      this.timer = this.deps.setTimer(() => {
        this.timer = null;
        void this.flush();
      }, wait);
    }
  }

  async flush(): Promise<void> {
    if (this.writing !== null) await this.writing;
    const state = this.pending;
    if (state === null) return;
    this.pending = null;
    this.lastWrite = this.deps.now();
    if (this.timer !== null) {
      this.deps.clearTimer(this.timer);
      this.timer = null;
    }
    this.writing = this.deps
      .write(state)
      .catch((e: unknown) => {
        this.deps.onError(e);
      })
      .finally(() => {
        this.writing = null;
      });
    await this.writing;
  }
}
