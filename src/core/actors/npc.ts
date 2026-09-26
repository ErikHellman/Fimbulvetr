import type { DialogueId, NpcId } from '@content/ids';
import type { ScreenId } from '@content/world/screens';
import type { L10n } from '../i18n/t';
import type { Box } from '../math/box';
import type { Dir4 } from '../math/dir';
import type { Cond } from '../story/cond';
import type { TilePos } from '../world/screen';
import { tileFeet } from '../world/screen';
import { createEntity, type Entity } from './entity';

/** Where an NPC is while `when` holds. The first matching place wins; none means not around. */
export interface NpcPlace {
  readonly when?: Cond;
  readonly screen: ScreenId;
  readonly at: TilePos;
  readonly facing: Dir4;
  /** Tiles walked in a loop (the first is usually `at`), pausing at each. */
  readonly patrol?: readonly TilePos[];
}

export interface NpcDef {
  readonly id: NpcId;
  readonly name: L10n;
  readonly art: string;
  /** The conversation interact opens; defaults to the NPC's own id. */
  readonly talk?: DialogueId;
  readonly places: readonly NpcPlace[];
}

export const NPC_BODY: Box = { x: -6, y: -8, w: 12, h: 8 };
export const NPC_HURT: Box = { x: -7, y: -26, w: 14, h: 26 };
export const NPC_SPEED = 0.6;
/** Ticks an NPC waits at each patrol point. */
export const NPC_PAUSE = 90;

export function createNpc(id: number, def: NpcDef, place: NpcPlace, placeIndex: number): Entity {
  const e = createEntity({
    id,
    kind: 'npc',
    def: def.id,
    art: def.art,
    pos: tileFeet(place.at),
    facing: place.facing,
    body: NPC_BODY,
    hurt: NPC_HURT,
    faction: 'neutral',
    hp: 1,
    maxHp: 1,
    state: 'idle',
  });
  e.mem['place'] = placeIndex;
  return e;
}
