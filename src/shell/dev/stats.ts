export interface FrameSummary {
  readonly fps: number;
  readonly p95: number;
  readonly simMs: number;
}

/** Rolling frame-time statistics for the overlay and the performance tests. */
export class FrameStats {
  private readonly frames: number[] = [];
  private simMs = 0;

  record(frameMs: number, simMs: number): void {
    this.frames.push(frameMs);
    if (this.frames.length > 120) this.frames.shift();
    this.simMs = simMs;
  }

  summary(): FrameSummary {
    if (this.frames.length === 0) return { fps: 0, p95: 0, simMs: this.simMs };
    const sorted = [...this.frames].sort((a, b) => a - b);
    const mean = sorted.reduce((sum, v) => sum + v, 0) / sorted.length;
    const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))] ?? 0;
    return { fps: mean > 0 ? 1000 / mean : 0, p95, simMs: this.simMs };
  }
}
