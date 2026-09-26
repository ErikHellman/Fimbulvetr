import type { CritterId } from '@content/ids';
import { nextInt } from '../math/rng';
import type { Box } from '../math/box';
import { dirFromVec } from '../math/dir';
import { length, normalize, scale, sub, type Vec } from '../math/vec';
import type { ActorCtx } from './enemies/defs';
import { createEntity, mem, setAnim, type Entity } from './entity';
import type { Machine } from './fsm';

export interface CritterDef {
  readonly id: CritterId;
  readonly art: string;
  readonly body: Box;
  readonly hurt: Box;
  readonly behaviour: 'sheep' | 'raven';
  /** Blocks the hero like a wall (sheep can be pushed around by walking at them). */
  readonly solid: boolean;
  /** Thrown objects scare it off (ravens). Others ignore throws. */
  readonly scaredByThrow: boolean;
}

export const SHEEP_FLEE_RADIUS = 40;
export const SHEEP_CALM_RADIUS = 56;
export const SHEEP_WANDER = 0.3;
export const SHEEP_FLEE = 1.6;
/** How far (px) a grazing sheep strays from where it started before it ambles back. */
export const SHEEP_RANGE = 48;
export const RAVEN_WARY_RADIUS = 28;
export const RAVEN_HOP = 1.6;
export const RAVEN_FLY_TICKS = 40;

const dist = (e: Entity, c: ActorCtx): number => length(sub(e.pos, c.hero));
const away = (e: Entity, c: ActorCtx): Vec => {
  const d = sub(e.pos, c.hero);
  return length(d) === 0 ? { x: 0, y: -1 } : normalize(d);
};

const WANDER_DIRS: readonly Vec[] = [
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

const blockedAhead = (e: Entity, c: ActorCtx, d: Vec): boolean =>
  c.solidAt(Math.floor((e.pos.x + d.x * 12) / 16), Math.floor((e.pos.y - 4 + d.y * 12) / 16));

/** A fleeing animal that runs into a wall turns along it, away from the hero, instead of pressing into it. */
function slide(e: Entity, c: ActorCtx, d: Vec): Vec {
  if (!blockedAhead(e, c, d)) return d;
  const a = away(e, c);
  const options: Vec[] = [
    { x: d.x, y: 0 },
    { x: 0, y: d.y },
    { x: -d.y, y: d.x },
    { x: d.y, y: -d.x },
  ].filter((v) => length(v) > 0.2);
  options.sort((p, q) => q.x * a.x + q.y * a.y - (p.x * a.x + p.y * a.y));
  const free = options.find((v) => !blockedAhead(e, c, normalize(v)));
  return free === undefined ? { x: 0, y: 0 } : normalize(free);
}

type SheepState = 'graze' | 'flee';

/** Sheep amble about and shy away from the hero, which is how they are herded. */
export const SHEEP_MACHINE: Machine<SheepState, ActorCtx> = {
  graze: {
    tick(e, c) {
      if (dist(e, c) < SHEEP_FLEE_RADIUS) return 'flee';
      const left = mem(e, 'timer');
      if (left <= 0) {
        const home = sub({ x: mem(e, 'homeX'), y: mem(e, 'homeY') }, e.pos);
        const roll = WANDER_DIRS[nextInt(c.rng, 0, WANDER_DIRS.length)] ?? { x: 0, y: 0 };
        const back =
          Math.abs(home.x) > Math.abs(home.y)
            ? { x: Math.sign(home.x), y: 0 }
            : { x: 0, y: Math.sign(home.y) };
        const d = length(home) > SHEEP_RANGE ? back : roll;
        e.vel = scale(d, SHEEP_WANDER);
        e.facing = dirFromVec(d, e.facing);
        e.mem['timer'] = nextInt(c.rng, 60, 150);
      } else e.mem['timer'] = left - 1;
      setAnim(e, e.vel.x !== 0 || e.vel.y !== 0 ? 'walk' : 'idle');
      return undefined;
    },
  },
  flee: {
    enter(e, c) {
      if (nextInt(c.rng, 0, 3) === 0) c.emit({ t: 'sfx', id: 'sfx_bleat' });
    },
    tick(e, c) {
      if (dist(e, c) > SHEEP_CALM_RADIUS) {
        e.vel = { x: 0, y: 0 };
        e.mem['timer'] = 0;
        e.mem['homeX'] = e.pos.x;
        e.mem['homeY'] = e.pos.y;
        return 'graze';
      }
      // Pushed ahead of a walking hero, mostly along the way he walks: that is what makes herding work.
      const push = length(c.heroVel) > 0 ? normalize(c.heroVel) : { x: 0, y: 0 };
      const d = normalize({ x: away(e, c).x + push.x * 2, y: away(e, c).y + push.y * 2 });
      e.vel = scale(slide(e, c, length(d) > 0 ? d : away(e, c)), SHEEP_FLEE);
      e.facing = dirFromVec(d, e.facing);
      setAnim(e, 'walk');
      return undefined;
    },
  },
};

type RavenState = 'peck' | 'hop' | 'fly';

/** Ravens peck at the barley, hop off when the hero comes close, and fly away for good when hit. */
export const RAVEN_MACHINE: Machine<RavenState, ActorCtx> = {
  peck: {
    enter(e) {
      e.vel = { x: 0, y: 0 };
      setAnim(e, 'peck');
    },
    tick(e, c) {
      if (e.flash > 0) return 'fly';
      return dist(e, c) < RAVEN_WARY_RADIUS ? 'hop' : undefined;
    },
  },
  hop: {
    enter(e, c) {
      const d = away(e, c);
      e.vel = scale(d, RAVEN_HOP);
      e.facing = dirFromVec(d, e.facing);
      setAnim(e, 'hop');
      c.emit({ t: 'sfx', id: 'sfx_caw' });
    },
    tick(e) {
      if (e.flash > 0) return 'fly';
      return e.fsm.t >= 15 ? 'peck' : undefined;
    },
  },
  fly: {
    enter(e, c) {
      const d = away(e, c);
      e.vel = { x: d.x * 1.5, y: -1.5 };
      setAnim(e, 'fly');
      c.emit({ t: 'sfx', id: 'sfx_caw' });
    },
    tick(e) {
      e.mem['z'] = mem(e, 'z') + 1;
      if (e.fsm.t >= RAVEN_FLY_TICKS) e.mem['gone'] = 1;
      return undefined;
    },
  },
};

export const CRITTER_MACHINES: Readonly<Record<CritterDef['behaviour'], Machine<string, ActorCtx>>> = {
  sheep: SHEEP_MACHINE,
  raven: RAVEN_MACHINE,
};

export function createCritter(id: number, def: CritterDef, pos: Vec, thingIndex: number): Entity {
  const e = createEntity({
    id,
    kind: 'critter',
    def: def.id,
    art: def.art,
    pos,
    facing: 's',
    body: def.body,
    hurt: def.hurt,
    faction: 'neutral',
    hp: 99,
    maxHp: 99,
    state: def.behaviour === 'sheep' ? 'graze' : 'peck',
  });
  e.mem['thing'] = thingIndex;
  e.mem['homeX'] = pos.x;
  e.mem['homeY'] = pos.y;
  return e;
}
