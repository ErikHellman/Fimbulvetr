export type Migration = (state: unknown) => unknown;

/**
 * MIGRATIONS[n] upgrades a version-n state to version n+1. Whenever SAVE_VERSION is bumped: add the
 * migration here and commit tests/fixtures/saves/v<new>.json. Old fixtures are never deleted.
 */
export const MIGRATIONS: Readonly<Record<number, Migration>> = {};

export function migrate(
  state: unknown,
  from: number,
  to: number,
  migrations: Readonly<Record<number, Migration>> = MIGRATIONS,
): unknown {
  let current = state;
  for (let v = from; v < to; v++) {
    const step = migrations[v];
    if (step === undefined) throw new Error(`no migration from v${v}`);
    current = step(current);
  }
  return current;
}
