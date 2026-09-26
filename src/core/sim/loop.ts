/** The simulation always steps at exactly 60 Hz; rendering interpolates with `alpha`. */
export const STEP_MS = 1000 / 60;
/** At most this many steps per rendered frame; the rest of a long hitch is dropped, never fast-forwarded. */
export const MAX_STEPS = 4;
const MAX_DELTA_MS = 250;

export interface Accumulator {
  acc: number;
}

export function advance(
  a: Accumulator,
  deltaMs: number,
  maxSteps: number = MAX_STEPS,
): { steps: number; alpha: number } {
  const delta = Number.isFinite(deltaMs) ? Math.min(Math.max(deltaMs, 0), MAX_DELTA_MS) : 0;
  a.acc += delta;
  let steps = Math.floor(a.acc / STEP_MS);
  if (steps > maxSteps) {
    steps = maxSteps;
    a.acc = 0;
  } else {
    a.acc -= steps * STEP_MS;
  }
  return { steps, alpha: a.acc / STEP_MS };
}
