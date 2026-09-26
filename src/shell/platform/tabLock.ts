export interface LockManagerLike {
  request(
    name: string,
    options: { ifAvailable: boolean },
    callback: (lock: unknown) => Promise<void> | undefined,
  ): Promise<unknown>;
}

/** Holds a Web Lock for the page's lifetime so two tabs never race each other's autosaves. */
export function acquireTabLock(
  locks: LockManagerLike | undefined,
  name = 'fimbulvetr-game',
): Promise<boolean> {
  if (locks === undefined) return Promise.resolve(true);
  return new Promise((resolve) => {
    void locks.request(name, { ifAvailable: true }, (lock) => {
      if (lock === null) {
        resolve(false);
        return undefined;
      }
      resolve(true);
      return new Promise<void>(() => {
        // Never resolves: the lock is released when the tab closes.
      });
    });
  });
}
