/** One copy to make between this browser and the player's cloud storage. */
export interface SyncStep {
  readonly slot: string;
  /** `push`: send the local save to the cloud; `pull`: fetch the cloud save into this browser. */
  readonly dir: 'push' | 'pull';
}

const SAVED_AT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;

/** A `savedAt` as `makeSave` writes it (UTC ISO 8601). In that form, string order is time order. */
export function isSavedAt(value: unknown): value is string {
  return typeof value === 'string' && SAVED_AT.test(value);
}

/**
 * Compares each slot's `savedAt` here and in the cloud: the newer copy wins, a missing copy is filled in, and
 * a cloud copy with an unreadable timestamp is overwritten (never fetched). Equal stamps need nothing.
 */
export function planSync(
  slots: readonly string[],
  local: Readonly<Record<string, string | undefined>>,
  remote: Readonly<Record<string, string | undefined>>,
): SyncStep[] {
  const steps: SyncStep[] = [];
  for (const slot of slots) {
    const here = isSavedAt(local[slot]) ? local[slot] : undefined;
    const there = isSavedAt(remote[slot]) ? remote[slot] : undefined;
    if (here !== undefined && (there === undefined || here > there)) steps.push({ slot, dir: 'push' });
    else if (there !== undefined && (here === undefined || there > here)) steps.push({ slot, dir: 'pull' });
  }
  return steps;
}
