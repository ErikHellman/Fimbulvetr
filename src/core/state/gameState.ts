import type { ArmorId, DungeonId, GaldrId, ItemId, RegionId, RingId, WeaponId } from '@content/ids';
import type { ScreenId } from '@content/world/screens';
import { newClock, type ClockState } from '../clock/types';
import type { Dir4 } from '../math/dir';
import { createRng, type RngState } from '../math/rng';
import type { Flags } from './flags';

export interface HeroState {
  screen: ScreenId;
  x: number;
  y: number;
  facing: Dir4;
  /** Health in quarter hearts. */
  hp: number;
  maxHp: number;
  seidr: number;
  maxSeidr: number;
  silver: number;
  purse: 0 | 1 | 2;
}

export interface InventoryState {
  items: Partial<Record<ItemId, number>>;
  slots: [ItemId | null, ItemId | null];
  galdr: GaldrId[];
  weapon: WeaponId;
  armor: ArmorId;
  ring: RingId | null;
  shield: boolean;
}

export interface DungeonState {
  keys: number;
  bigKey: boolean;
  map: boolean;
  compass: boolean;
  bossDead: boolean;
  doors: string[];
}

export interface CoverSave {
  epoch: number;
  cleared: string;
}

export interface WorldState {
  opened: string[];
  pieces: string[];
  warps: RegionId[];
  visited: ScreenId[];
  cover: Partial<Record<ScreenId, CoverSave>>;
  vars: Record<string, number>;
}

/** Everything that persists. Plain JSON. */
export interface GameState {
  seed: number;
  rng: RngState;
  flags: Flags;
  hero: HeroState;
  inv: InventoryState;
  clock: ClockState;
  world: WorldState;
  dungeons: Record<DungeonId, DungeonState>;
  playTicks: number;
}

export interface NewGameInit {
  readonly screen: ScreenId;
  readonly x: number;
  readonly y: number;
  readonly facing: Dir4;
  readonly weapon: WeaponId;
  readonly shield: boolean;
  readonly dungeons: readonly DungeonId[];
  /** Story flags set from the start. */
  readonly flags?: Flags;
  /** Clock minute to start at (the default is 08:00). */
  readonly minute?: number;
}

export function newGame(seed: number, init: NewGameInit): GameState {
  const dungeons = Object.fromEntries(
    init.dungeons.map((id) => [
      id,
      { keys: 0, bigKey: false, map: false, compass: false, bossDead: false, doors: [] },
    ]),
  ) as unknown as Record<DungeonId, DungeonState>;
  return {
    seed: seed >>> 0,
    rng: createRng(seed),
    flags: { ...init.flags },
    hero: {
      screen: init.screen,
      x: init.x,
      y: init.y,
      facing: init.facing,
      hp: 12,
      maxHp: 12,
      seidr: 10,
      maxSeidr: 10,
      silver: 0,
      purse: 0,
    },
    inv: {
      items: {},
      slots: [null, null],
      galdr: [],
      weapon: init.weapon,
      armor: 'wool_tunic',
      ring: null,
      shield: init.shield,
    },
    clock: { ...newClock(), ...(init.minute === undefined ? {} : { minute: init.minute }) },
    world: { opened: [], pieces: [], warps: [], visited: [init.screen], cover: {}, vars: {} },
    dungeons,
    playTicks: 0,
  };
}
