import type { Box } from '../math/box';
import type { Dir4 } from '../math/dir';
import type { Vec } from '../math/vec';

export type Faction = 'hero' | 'enemy' | 'neutral' | 'env';
/** `fixture`: part of the room that changes with conditions (a gate, a fire, a chest, a shutter). */
export type EntityKind = 'hero' | 'enemy' | 'npc' | 'critter' | 'prop' | 'pickup' | 'fixture' | 'projectile';

export interface FsmState {
  s: string;
  t: number;
}

/**
 * A live actor. Plain data so it can be cloned, hashed and inspected; behaviour lives in state machines.
 * `pos` is the feet point; `body` (collision) and `hurt` (can be hit) are relative to it.
 */
export interface Entity {
  readonly id: number;
  readonly kind: EntityKind;
  readonly def: string;
  readonly art: string;
  pos: Vec;
  prev: Vec;
  vel: Vec;
  knock: Vec;
  facing: Dir4;
  readonly body: Box;
  readonly hurt: Box;
  readonly faction: Faction;
  hp: number;
  maxHp: number;
  iframes: number;
  flash: number;
  fsm: FsmState;
  anim: string;
  animT: number;
  mem: Record<string, number>;
}

export interface EntityInit {
  readonly id: number;
  readonly kind: EntityKind;
  readonly def: string;
  readonly art: string;
  readonly pos: Vec;
  readonly facing: Dir4;
  readonly body: Box;
  readonly hurt: Box;
  readonly faction: Faction;
  readonly hp: number;
  readonly maxHp: number;
  readonly state: string;
}

export function createEntity(i: EntityInit): Entity {
  return {
    id: i.id,
    kind: i.kind,
    def: i.def,
    art: i.art,
    pos: { ...i.pos },
    prev: { ...i.pos },
    vel: { x: 0, y: 0 },
    knock: { x: 0, y: 0 },
    facing: i.facing,
    body: i.body,
    hurt: i.hurt,
    faction: i.faction,
    hp: i.hp,
    maxHp: i.maxHp,
    iframes: 0,
    flash: 0,
    fsm: { s: i.state, t: 0 },
    anim: 'idle',
    animT: 0,
    mem: {},
  };
}

/** Switches animation, restarting its clock only when it actually changes. */
export function setAnim(e: Entity, anim: string): void {
  if (e.anim !== anim) {
    e.anim = anim;
    e.animT = 0;
  }
}

export const mem = (e: Entity, key: string): number => e.mem[key] ?? 0;
