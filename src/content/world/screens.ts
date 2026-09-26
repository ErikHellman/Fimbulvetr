/** Every screen id. Add the id here, the ScreenDef in its region folder, and the entry in registry.ts. */
export const SCREEN_IDS = [
  'test_a',
  'test_b',
  'test_c',
  'test_int',
  'ask_farmyard',
  'ask_pasture',
  'ask_field',
  'ask_brook',
  'ask_village',
  'ask_hof',
  'ask_gate',
  'ask_ridge',
  'ask_int_longhouse',
  'ask_int_trader',
  'ask_int_hof',
] as const;
export type ScreenId = (typeof SCREEN_IDS)[number];

export const isScreenId = (s: string): s is ScreenId => (SCREEN_IDS as readonly string[]).includes(s);
