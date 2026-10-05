import { length, sub } from '../../math/vec';
import { mem, setAnim, type Entity } from '../entity';
import type { Machine } from '../fsm';
import { distToHero, faceHero, still, steerTo } from './common';
import type { ActorCtx } from './defs';

export type IvaldiState =
  | 'throne'
  | 'roar'
  | 'stalk'
  | 'raise'
  | 'slam'
  | 'stuck'
  | 'open'
  | 'climb'
  | 'anvil'
  | 'lift'
  | 'quake'
  | 'thrown'
  | 'glow'
  | 'cooled';

/** Ívaldi's numbers: px, px per tick and ticks. */
export const IVALDI = {
  /** Health at or below which each later phase begins (24 → the anvil at 16, white-hot at 8). */
  phaseAt: [16, 8],
  wake: 140,
  speed: 0.55,
  hotSpeed: 0.75,
  /** He brings the hammer down when Ask is this near. */
  reach: 44,
  raiseTicks: 36,
  raiseHot: 26,
  slamTicks: 14,
  /** The hammer stuck in the floor after a slam: his plates are open to the dwarf hammer. */
  stuckTicks: 70,
  /** A plate broken (or his fall from the anvil): the blade and hammer bite. */
  openTicks: 70,
  climbSpeed: 1,
  /** On the anvil: a ring of shockwave every so often, after a lift (the tell). */
  anvilEvery: 90,
  liftTicks: 30,
  quakeTicks: 10,
  /** Shaken off the anvil by Skjálfti: he lies open. */
  thrownTicks: 150,
  glowTicks: 50,
  /** Cooled by Ís: dull iron for 3 s, his plates open to the hammer. */
  cooledTicks: 180,
} as const;

const phaseOf = (hp: number): number => IVALDI.phaseAt.filter((at) => hp <= at).length;

function guarded(e: Entity, exposed: boolean): void {
  e.mem['guard'] = 1;
  e.mem['exposed'] = exposed ? 1 : 0;
}

/** A hammer blow found a plate (`EnemyDef.struckBy`). */
function struck(e: Entity): boolean {
  if (mem(e, 'struck') !== 1) return false;
  e.mem['struck'] = 0;
  return true;
}

/** Where his anvil stands: where he was set down. */
function anvilAt(e: Entity): { x: number; y: number } {
  if (mem(e, 'homeSet') !== 1) {
    e.mem['homeSet'] = 1;
    e.mem['hx'] = e.pos.x;
    e.mem['hy'] = e.pos.y;
  }
  return { x: mem(e, 'hx'), y: mem(e, 'hy') };
}

/** After an opening: on to the next phase if his health has crossed into it. */
function after(e: Entity): IvaldiState {
  const p = phaseOf(e.hp);
  if (p > mem(e, 'phase')) {
    e.mem['phase'] = p;
    return p === 1 ? 'climb' : 'glow';
  }
  return mem(e, 'phase') === 1 ? 'climb' : 'stalk';
}

/** White-hot (the last phase) until Ís cools him. */
function iced(e: Entity): boolean {
  if (mem(e, 'iced') !== 1) return false;
  e.mem['iced'] = 0;
  return mem(e, 'hot') === 1;
}

/**
 * Thane Ívaldi, the Anvil: a dwarf king in plated armour that turns every blow.
 *
 * 1. He walks the floor and brings his hammer down in a shockwave line (tell: the hammer raised). After a
 *    missed blow his hammer sticks in the floor: a blow of the dwarf hammer then breaks a plate and he
 *    stands open to the blade.
 * 2. At two thirds of his health he climbs his anvil in the middle of the hall and beats rings of
 *    shockwave out of it. Skjálfti shakes him off, and he lies open.
 * 3. At the last third he glows white-hot and walks faster. Ís cools him for 3 s, and only then does the
 *    dwarf hammer break his plates.
 */
export const IVALDI_MACHINE: Machine<IvaldiState, ActorCtx> = {
  throne: {
    tick(e, c) {
      anvilAt(e);
      guarded(e, false);
      still(e);
      setAnim(e, 'idle');
      return distToHero(e, c) < IVALDI.wake ? 'roar' : undefined;
    },
  },
  roar: {
    enter(e, c) {
      still(e);
      setAnim(e, 'roar');
      c.emit({ t: 'sfx', id: 'sfx_boss_roar' });
      c.emit({ t: 'shake', amount: 4 });
    },
    tick(e) {
      guarded(e, false);
      still(e);
      return e.fsm.t >= 49 ? 'stalk' : undefined;
    },
  },
  stalk: {
    enter(e) {
      setAnim(e, mem(e, 'hot') === 1 ? 'hotwalk' : 'walk');
    },
    tick(e, c) {
      guarded(e, false);
      if (iced(e)) return 'cooled';
      if (distToHero(e, c) < IVALDI.reach) return 'raise';
      steerTo(e, c, c.hero, mem(e, 'hot') === 1 ? IVALDI.hotSpeed : IVALDI.speed);
      faceHero(e, c);
      return undefined;
    },
  },
  raise: {
    enter(e, c) {
      still(e);
      faceHero(e, c);
      setAnim(e, 'raise');
    },
    tick(e) {
      guarded(e, false);
      still(e);
      if (iced(e)) return 'cooled';
      const tell = mem(e, 'hot') === 1 ? IVALDI.raiseHot : IVALDI.raiseTicks;
      return e.fsm.t >= tell - 1 ? 'slam' : undefined;
    },
  },
  slam: {
    enter(e, c) {
      setAnim(e, 'slam');
      c.emit({ t: 'sfx', id: 'sfx_hammer' });
      c.emit({ t: 'shake', amount: 3 });
    },
    tick(e) {
      guarded(e, false);
      still(e);
      return e.fsm.t >= IVALDI.slamTicks - 1 ? 'stuck' : undefined;
    },
  },
  stuck: {
    enter(e) {
      still(e);
      e.mem['struck'] = 0;
      guarded(e, mem(e, 'phase') === 0);
      setAnim(e, 'stuck');
    },
    tick(e) {
      // Only in the first phase are his plates open while the hammer is stuck.
      guarded(e, mem(e, 'phase') === 0);
      still(e);
      if (iced(e)) return 'cooled';
      if (struck(e)) return 'open';
      return e.fsm.t >= IVALDI.stuckTicks - 1 ? 'stalk' : undefined;
    },
  },
  open: {
    enter(e, c) {
      still(e);
      e.mem['guard'] = 0;
      e.mem['exposed'] = 0;
      e.mem['plates'] = mem(e, 'plates') + 1;
      e.iframes = 0;
      setAnim(e, 'open');
      c.emit({ t: 'sfx', id: 'sfx_break' });
      c.emit({ t: 'shake', amount: 3 });
    },
    tick(e) {
      still(e);
      e.mem['guard'] = 0;
      if (phaseOf(e.hp) > mem(e, 'phase')) return after(e);
      return e.fsm.t >= IVALDI.openTicks - 1 ? after(e) : undefined;
    },
  },
  climb: {
    enter(e) {
      setAnim(e, 'walk');
    },
    tick(e, c) {
      guarded(e, false);
      const home = anvilAt(e);
      const d = sub(home, e.pos);
      if (length(d) < 2) {
        e.pos = { ...home };
        still(e);
        return 'anvil';
      }
      steerTo(e, c, home, IVALDI.climbSpeed);
      return undefined;
    },
  },
  anvil: {
    enter(e) {
      still(e);
      e.mem['quake'] = 0;
      setAnim(e, 'anvil');
    },
    tick(e, c) {
      guarded(e, false);
      still(e);
      faceHero(e, c);
      if (mem(e, 'quake') === 1) return 'thrown';
      return e.fsm.t >= IVALDI.anvilEvery - 1 ? 'lift' : undefined;
    },
  },
  lift: {
    enter(e) {
      still(e);
      setAnim(e, 'raise');
    },
    tick(e) {
      guarded(e, false);
      still(e);
      if (mem(e, 'quake') === 1) return 'thrown';
      return e.fsm.t >= IVALDI.liftTicks - 1 ? 'quake' : undefined;
    },
  },
  quake: {
    enter(e, c) {
      setAnim(e, 'slam');
      c.emit({ t: 'sfx', id: 'sfx_quake' });
      c.emit({ t: 'shake', amount: 4 });
    },
    tick(e) {
      guarded(e, false);
      still(e);
      if (mem(e, 'quake') === 1) return 'thrown';
      return e.fsm.t >= IVALDI.quakeTicks - 1 ? 'anvil' : undefined;
    },
  },
  thrown: {
    enter(e, c) {
      still(e);
      e.mem['quake'] = 0;
      e.mem['guard'] = 0;
      e.mem['exposed'] = 0;
      e.iframes = 0;
      setAnim(e, 'fallen');
      c.emit({ t: 'shake', amount: 6 });
      c.emit({ t: 'sfx', id: 'sfx_stone' });
    },
    tick(e) {
      still(e);
      e.mem['guard'] = 0;
      if (phaseOf(e.hp) > mem(e, 'phase')) return after(e);
      return e.fsm.t >= IVALDI.thrownTicks - 1 ? 'climb' : undefined;
    },
  },
  glow: {
    enter(e, c) {
      still(e);
      e.mem['hot'] = 1;
      setAnim(e, 'roar');
      c.emit({ t: 'sfx', id: 'sfx_boss_roar' });
      c.emit({ t: 'shake', amount: 4 });
    },
    tick(e) {
      guarded(e, false);
      still(e);
      return e.fsm.t >= IVALDI.glowTicks - 1 ? 'stalk' : undefined;
    },
  },
  cooled: {
    enter(e, c) {
      still(e);
      e.mem['hot'] = 0;
      e.mem['struck'] = 0;
      guarded(e, true);
      setAnim(e, 'stuck');
      c.emit({ t: 'sfx', id: 'sfx_sizzle' });
    },
    tick(e) {
      guarded(e, true);
      still(e);
      if (struck(e)) return 'open';
      if (e.fsm.t < IVALDI.cooledTicks - 1) return undefined;
      e.mem['hot'] = 1;
      return 'stalk';
    },
  },
};
