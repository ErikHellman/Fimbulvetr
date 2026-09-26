import { SEASONS } from '../clock/types';
import { DIRS } from '../math/dir';

type Check = (value: unknown, path: string, errors: string[]) => void;

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const int =
  (min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER): Check =>
  (v, p, e) => {
    if (typeof v !== 'number' || !Number.isInteger(v) || v < min || v > max) {
      e.push(`${p}: expected an integer in [${min}, ${max}]`);
    }
  };

const num =
  (min = -Number.MAX_VALUE, max = Number.MAX_VALUE): Check =>
  (v, p, e) => {
    if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max) {
      e.push(`${p}: expected a number in [${min}, ${max}]`);
    }
  };

const bool: Check = (v, p, e) => {
  if (typeof v !== 'boolean') e.push(`${p}: expected true or false`);
};

const str: Check = (v, p, e) => {
  if (typeof v !== 'string') e.push(`${p}: expected text`);
};

const oneOf =
  (values: readonly string[]): Check =>
  (v, p, e) => {
    if (typeof v !== 'string' || !values.includes(v)) e.push(`${p}: expected one of ${values.join(', ')}`);
  };

const nullable =
  (check: Check): Check =>
  (v, p, e) => {
    if (v !== null) check(v, p, e);
  };

const either =
  (a: Check, b: Check): Check =>
  (v, p, e) => {
    const first: string[] = [];
    a(v, p, first);
    if (first.length === 0) return;
    const second: string[] = [];
    b(v, p, second);
    if (second.length > 0) e.push(...first);
  };

const arrayOf =
  (item: Check): Check =>
  (v, p, e) => {
    if (!Array.isArray(v)) {
      e.push(`${p}: expected a list`);
      return;
    }
    v.forEach((x: unknown, i) => {
      item(x, `${p}[${i}]`, e);
    });
  };

const pair =
  (a: Check, b: Check): Check =>
  (v, p, e) => {
    if (!Array.isArray(v) || v.length !== 2) {
      e.push(`${p}: expected two entries`);
      return;
    }
    a(v[0], `${p}[0]`, e);
    b(v[1], `${p}[1]`, e);
  };

const recordOf =
  (item: Check): Check =>
  (v, p, e) => {
    if (!isRecord(v)) {
      e.push(`${p}: expected an object`);
      return;
    }
    for (const [k, x] of Object.entries(v)) item(x, `${p}.${k}`, e);
  };

const shape =
  (fields: Readonly<Record<string, Check>>): Check =>
  (v, p, e) => {
    if (!isRecord(v)) {
      e.push(`${p}: expected an object`);
      return;
    }
    for (const [k, check] of Object.entries(fields)) check(v[k], `${p}.${k}`, e);
  };

const dungeon = shape({
  keys: int(0, 99),
  bigKey: bool,
  map: bool,
  compass: bool,
  bossDead: bool,
  doors: arrayOf(str),
});

const gameState = shape({
  seed: int(0, 0xffffffff),
  rng: shape({ s: int(0, 0xffffffff) }),
  flags: recordOf(either(bool, int())),
  hero: shape({
    screen: str,
    x: num(0, 640),
    y: num(0, 352),
    facing: oneOf(DIRS),
    hp: int(0, 80),
    maxHp: int(4, 80),
    seidr: int(0, 30),
    maxSeidr: int(0, 30),
    silver: int(0, 999),
    purse: int(0, 2),
  }),
  inv: shape({
    items: recordOf(int(0, 999)),
    slots: pair(nullable(str), nullable(str)),
    galdr: arrayOf(str),
    weapon: str,
    armor: str,
    ring: nullable(str),
    shield: bool,
  }),
  clock: shape({
    minute: int(0, 1439),
    sub: int(0, 1000),
    day: int(1),
    season: oneOf(SEASONS),
    seasonDay: int(0),
    epoch: int(0),
    policy: oneOf(['held', 'cycling']),
  }),
  world: shape({
    opened: arrayOf(str),
    pieces: arrayOf(str),
    warps: arrayOf(str),
    visited: arrayOf(str),
    cover: recordOf(shape({ epoch: int(0), cleared: str })),
    vars: recordOf(num()),
  }),
  dungeons: recordOf(dungeon),
  playTicks: int(0),
});

/** Structural validation of an (already migrated) state. Unknown item and flag ids are tolerated. */
export function validateGameState(value: unknown, knownScreens: ReadonlySet<string>): string[] {
  const errors: string[] = [];
  gameState(value, 'state', errors);
  if (errors.length > 0 || !isRecord(value)) return errors;
  const hero = value['hero'];
  if (isRecord(hero)) {
    const screen = hero['screen'];
    if (typeof screen === 'string' && !knownScreens.has(screen)) {
      errors.push(`state.hero.screen: unknown screen '${screen}'`);
    }
    const hp = hero['hp'];
    const maxHp = hero['maxHp'];
    if (typeof hp === 'number' && typeof maxHp === 'number' && hp > maxHp) {
      errors.push('state.hero.hp: more than maxHp');
    }
  }
  return errors;
}
