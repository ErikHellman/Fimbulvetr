/** Where a named frame lives: texture key, frame name and normalised origin (feet point). */
export interface FrameRef {
  readonly key: string;
  readonly frame: string;
  readonly ox: number;
  readonly oy: number;
}

export class FrameIndex {
  private readonly refs = new Map<string, FrameRef>();
  private readonly missing = new Set<string>();

  set(name: string, ref: FrameRef): void {
    this.refs.set(name, ref);
  }

  /** Unknown names fall back to the magenta `missing` frame and are reported once (tests fail on it). */
  get(name: string): FrameRef {
    const ref = this.refs.get(name);
    if (ref !== undefined) return ref;
    if (!this.missing.has(name)) {
      this.missing.add(name);
      console.error(`[art] missing frame '${name}'`);
    }
    const fallback = this.refs.get('missing');
    if (fallback === undefined) throw new Error('the missing-art frame is not registered');
    return fallback;
  }

  missingNames(): string[] {
    return [...this.missing];
  }
}
