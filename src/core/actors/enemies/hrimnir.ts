import { mem, setAnim, type Entity } from '../entity';
import type { Machine } from '../fsm';
import { TILE } from '../../world/dims';
import { distToHero, justHit, still } from './common';
import type { ActorCtx } from './defs';

export type HrimnirState = 'idle' | 'rise' | 'sweep' | 'inhale' | 'breathe' | 'rest' | 'open' | 'rage';
export type HandState = 'shadow' | 'sweep' | 'struck';
export type PillarState = 'shadow' | 'fall' | 'fallen';

/** Hrímnir's numbers: px, px per tick and ticks. */
export const HRIMNIR = {
  /** Health at or below which each later phase begins (24 → the breath at 16, the pillars at 8). */
  phaseAt: [16, 8],
  wake: 220,
  riseTicks: 80,
  /**
   * The binding Embla holds open (`systems/binding.ts`): a ring centred `below` px south of him that shrinks
   * from `rMax` to `rMin`; then his breath fills the hall and the ring opens wide again.
   */
  ring: { below: 6 * TILE, rMax: 160, rMin: 44, shrink: 0.12, breath: 8 },
  /** His hand's shadow sweeps across Ask's row (the tell), then the hand. */
  shadowTicks: 40,
  handSpeed: 3,
  /** A struck hand stuns him: his heart-rune is bared this long. */
  openTicks: 150,
  inhaleTicks: 40,
  breatheTicks: 24,
  restTicks: 60,
  rageTicks: 60,
  /** A pillar's shadow (the tell), its fall, and how long its wreck lies as glaze. */
  pillarShadow: 50,
  pillarFall: 10,
  pillarLies: 600,
} as const;

const phaseOf = (hp: number): number => HRIMNIR.phaseAt.filter((at) => hp <= at).length;

function warded(e: Entity): void {
  e.mem['guard'] = 1;
  // His own breath sent back by the ice mirror reaches his heart (`EnemyDef.struckBy`).
  e.mem['exposed'] = 1;
}

function struck(e: Entity): boolean {
  if (mem(e, 'struck') !== 1) return false;
  e.mem['struck'] = 0;
  return true;
}

const handStruck = (c: ActorCtx): boolean =>
  c.others.some((o) => o.def === 'hrimnir_hand' && o.fsm.s === 'struck');
const handOut = (c: ActorCtx): boolean => c.others.some((o) => o.def === 'hrimnir_hand');

/** After a stun or a breath: a new phase is roared in; otherwise the next attack. */
function next(e: Entity): HrimnirState {
  if (phaseOf(e.hp) > mem(e, 'phase')) return 'rage';
  return mem(e, 'phase') >= 1 && mem(e, 'alt') === 1 ? 'inhale' : 'sweep';
}

/**
 * Hrímnir the Rime King, waking in the binding hall (D8's boss, M10b). He never leaves the north end of
 * the hall; Embla holds the binding open, a ring on the floor that shrinks (the fight's clock).
 *
 * 1. His hand sweeps across Ask's row (tell: its shadow). Struck, it stuns him, his heart-rune bared to the
 *    sword, arrows and Bragð. Every other blow turns.
 * 2. From two thirds he also breathes rime down the hall (tell: the breath drawn in); the ice mirror sends the
 *    middle blast back into his heart.
 * 3. From one third he pulls the hall's pillars down on Ask (tell: their shadows); their wreck is glaze.
 */
export const HRIMNIR_MACHINE: Machine<HrimnirState, ActorCtx> = {
  idle: {
    tick(e, c) {
      warded(e);
      still(e);
      setAnim(e, 'idle');
      return distToHero(e, c) < HRIMNIR.wake ? 'rise' : undefined;
    },
  },
  rise: {
    enter(e, c) {
      still(e);
      setAnim(e, 'roar');
      c.emit({ t: 'sfx', id: 'sfx_boss_roar' });
      c.emit({ t: 'shake', amount: 6 });
    },
    tick(e) {
      warded(e);
      still(e);
      if (e.fsm.t < HRIMNIR.riseTicks - 1) return undefined;
      // The binding wakes with him.
      e.mem['ringX'] = e.pos.x;
      e.mem['ringY'] = e.pos.y + HRIMNIR.ring.below;
      e.mem['ringR'] = HRIMNIR.ring.rMax;
      return 'sweep';
    },
  },
  sweep: {
    enter(e, c) {
      still(e);
      setAnim(e, 'reach');
      // The hand comes in from the side of the hall farther from Ask.
      const fromWest = c.hero.x > e.pos.x;
      const hand = c.spawn(
        'hrimnir_hand',
        { x: fromWest ? 3 * TILE : 37 * TILE, y: c.hero.y },
        fromWest ? 'e' : 'w',
      );
      hand.mem['dx'] = fromWest ? 1 : -1;
    },
    tick(e, c) {
      warded(e);
      still(e);
      if (handStruck(c)) return 'open';
      if (struck(e)) return 'open';
      if (e.fsm.t > 4 && !handOut(c)) {
        e.mem['alt'] = mem(e, 'alt') === 1 ? 0 : 1;
        return mem(e, 'phase') >= 2 ? 'rest' : next(e);
      }
      return undefined;
    },
  },
  inhale: {
    enter(e) {
      still(e);
      e.facing = 's';
      setAnim(e, 'inhale');
    },
    tick(e) {
      warded(e);
      still(e);
      if (struck(e)) return 'open';
      return e.fsm.t >= HRIMNIR.inhaleTicks - 1 ? 'breathe' : undefined;
    },
  },
  breathe: {
    enter(e, c) {
      setAnim(e, 'breathe');
      c.emit({ t: 'sfx', id: 'sfx_frost' });
      const at = { x: e.pos.x, y: e.pos.y - 4 };
      c.shoot('bolt', at, { x: 0, y: 1 });
      c.shoot('bolt', at, { x: -0.45, y: 0.89 });
      c.shoot('bolt', at, { x: 0.45, y: 0.89 });
    },
    tick(e) {
      warded(e);
      still(e);
      if (struck(e)) return 'open';
      if (e.fsm.t < HRIMNIR.breatheTicks - 1) return undefined;
      e.mem['alt'] = 0;
      return mem(e, 'phase') >= 2 ? 'rest' : next(e);
    },
  },
  rest: {
    enter(e, c) {
      setAnim(e, 'idle');
      if (mem(e, 'phase') >= 2) c.spawn('rime_pillar', { ...c.hero }, 's');
    },
    tick(e) {
      warded(e);
      still(e);
      if (struck(e)) return 'open';
      return e.fsm.t >= HRIMNIR.restTicks - 1 ? next(e) : undefined;
    },
  },
  open: {
    enter(e, c) {
      still(e);
      e.mem['guard'] = 0;
      e.iframes = 0;
      setAnim(e, 'open');
      c.emit({ t: 'shake', amount: 4 });
      c.emit({ t: 'sfx', id: 'sfx_gem' });
    },
    tick(e) {
      e.mem['guard'] = 0;
      e.mem['exposed'] = 0;
      still(e);
      return e.fsm.t >= HRIMNIR.openTicks - 1 ? next(e) : undefined;
    },
  },
  rage: {
    enter(e, c) {
      still(e);
      e.mem['phase'] = phaseOf(e.hp);
      e.mem['alt'] = 1;
      setAnim(e, 'roar');
      c.emit({ t: 'sfx', id: 'sfx_boss_roar' });
      c.emit({ t: 'shake', amount: 6 });
    },
    tick(e) {
      warded(e);
      still(e);
      return e.fsm.t >= HRIMNIR.rageTicks - 1 ? next(e) : undefined;
    },
  },
};

/** Hrímnir's hand: its shadow crosses Ask's row (the tell), then it sweeps across; a blow stuns him. */
export const HAND_MACHINE: Machine<HandState, ActorCtx> = {
  shadow: {
    tick(e) {
      setAnim(e, 'shadow');
      still(e);
      if (justHit(e)) return 'struck';
      return e.fsm.t >= HRIMNIR.shadowTicks - 1 ? 'sweep' : undefined;
    },
  },
  sweep: {
    enter(e) {
      setAnim(e, 'sweep');
    },
    tick(e) {
      if (justHit(e)) return 'struck';
      const dx = mem(e, 'dx');
      e.vel = { x: dx * HRIMNIR.handSpeed, y: 0 };
      if ((dx > 0 && e.pos.x > 37 * TILE) || (dx < 0 && e.pos.x < 3 * TILE)) e.mem['gone'] = 1;
      return undefined;
    },
  },
  struck: {
    enter(e, c) {
      still(e);
      setAnim(e, 'struck');
      c.emit({ t: 'sfx', id: 'sfx_break' });
    },
    tick(e) {
      still(e);
      e.iframes = Math.max(e.iframes, 2);
      if (e.fsm.t >= 20) e.mem['gone'] = 1;
      return undefined;
    },
  },
};

/** A rime pillar pulled down: its shadow where Ask stood (the tell), the fall, and its wreck lying as glaze. */
export const PILLAR_MACHINE: Machine<PillarState, ActorCtx> = {
  shadow: {
    tick(e) {
      setAnim(e, 'shadow');
      still(e);
      e.iframes = Math.max(e.iframes, 2);
      return e.fsm.t >= HRIMNIR.pillarShadow - 1 ? 'fall' : undefined;
    },
  },
  fall: {
    enter(e, c) {
      setAnim(e, 'fall');
      c.emit({ t: 'shake', amount: 3 });
      c.emit({ t: 'sfx', id: 'sfx_glass' });
    },
    tick(e) {
      still(e);
      e.iframes = Math.max(e.iframes, 2);
      return e.fsm.t >= HRIMNIR.pillarFall - 1 ? 'fallen' : undefined;
    },
  },
  fallen: {
    enter(e) {
      setAnim(e, 'fallen');
      // Its wreck: the 3×3 tiles round where it fell are glaze (see `systems/glaze.ts`).
      e.mem['glaze'] = 1;
    },
    tick(e) {
      still(e);
      e.iframes = Math.max(e.iframes, 2);
      if (e.fsm.t >= HRIMNIR.pillarLies - 1) e.mem['gone'] = 1;
      return undefined;
    },
  },
};
