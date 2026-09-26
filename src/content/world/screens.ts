/** Every screen id. Add the id here, the ScreenDef in its region folder, and the entry in registry.ts. */
export const SCREEN_IDS = ['test_a', 'test_b', 'test_c'] as const;
export type ScreenId = (typeof SCREEN_IDS)[number];

export const isScreenId = (s: string): s is ScreenId => (SCREEN_IDS as readonly string[]).includes(s);
