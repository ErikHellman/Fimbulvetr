import type { WeaponId } from '@content/ids';
import { isHeld, moveVector, wasPressed, type InputFrame } from '../input/actions';
import { at, type Box } from '../math/box';
import { DIR_VEC, dirFromVec, type Dir4 } from '../math/dir';
import { normalize, scale } from '../math/vec';
import type { SimEvent } from '../sim/events';
import type { HeroState } from '../state/gameState';
import { createEntity, mem, setAnim, type Entity } from './entity';
import type { Machine, StateDef } from './fsm';
import { swordOf, type Tuning } from './tuning';

export type HeroMode =
  | 'move'
  | 'attack'
  | 'charge'
  | 'spin'
  | 'roll'
  | 'shield'
  | 'hurt'
  | 'hop'
  | 'lift'
  | 'carry'
  | 'throw'
  | 'toss'
  | 'cast'
  | 'dying';

export interface HeroCtx {
  readonly input: InputFrame;
  readonly tuning: Tuning;
  readonly hasShield: boolean;
  /** Holding a weapon (not bare hands): the sword button swings. */
  readonly armed: boolean;
  /** The offset that hops the hero over a ledge in `dir`, or null when there is none to hop. */
  ledgeHop(dir: Dir4): { dx: number; dy: number } | null;
  emit(event: SimEvent): void;
}

type HeroDef = StateDef<HeroMode, HeroCtx>;

const still = (e: Entity): void => {
  e.vel = { x: 0, y: 0 };
};

const moving = (e: Entity): boolean => e.vel.x !== 0 || e.vel.y !== 0;

function steer(e: Entity, c: HeroCtx, speed: number, turn: boolean): void {
  const m = moveVector(c.input);
  e.vel = scale(m, speed);
  if (turn) e.facing = dirFromVec(m, e.facing);
}

function swing(e: Entity, c: HeroCtx, anim: string, sound: 'sfx_swing' | 'sfx_spin'): void {
  e.mem['swing'] = mem(e, 'swing') + 1;
  setAnim(e, anim);
  c.emit({ t: 'sfx', id: sound });
}

const move: HeroDef = {
  tick(e, c) {
    if (wasPressed(c.input, 'roll') && mem(e, 'rollCd') === 0) return 'roll';
    if (wasPressed(c.input, 'sword') && c.armed) return 'attack';
    if (isHeld(c.input, 'shield') && c.hasShield) return 'shield';
    steer(e, c, c.tuning.hero.walkSpeed, true);
    // `push` counts ticks of leaning on a block (the props system keeps it).
    setAnim(e, mem(e, 'push') > 0 ? 'push' : moving(e) ? 'walk' : 'idle');
    return pushingLedge(e, c) ? 'hop' : undefined;
  },
};

/** Counts ticks of walking straight into a hoppable ledge. */
function pushingLedge(e: Entity, c: HeroCtx): boolean {
  const m = moveVector(c.input);
  const straight = (m.x === 0) !== (m.y === 0);
  const ahead = straight && dirFromVec(m, e.facing) === e.facing ? c.ledgeHop(e.facing) : null;
  const pushed = ahead === null ? 0 : mem(e, 'ledgePush') + 1;
  if (pushed !== mem(e, 'ledgePush')) e.mem['ledgePush'] = pushed;
  return pushed >= c.tuning.hero.ledgePushTicks;
}

/** Hops a ledge along a fixed arc; collision is skipped because the landing was checked up front. */
const hop: HeroDef = {
  enter(e, c) {
    const off = c.ledgeHop(e.facing) ?? { dx: 0, dy: 0 };
    e.mem['ledgePush'] = 0;
    e.mem['hopX'] = e.pos.x;
    e.mem['hopY'] = e.pos.y;
    e.mem['hopDx'] = off.dx;
    e.mem['hopDy'] = off.dy;
    e.knock = { x: 0, y: 0 };
    still(e);
    setAnim(e, 'walk');
  },
  tick(e, c) {
    const h = c.tuning.hero;
    const p = Math.min(1, (e.fsm.t + 1) / h.hopTicks);
    still(e);
    e.pos = { x: mem(e, 'hopX') + mem(e, 'hopDx') * p, y: mem(e, 'hopY') + mem(e, 'hopDy') * p };
    e.mem['z'] = 4 * h.hopHeight * p * (1 - p);
    return p >= 1 ? 'move' : undefined;
  },
  exit(e) {
    e.mem['z'] = 0;
  },
};

const attack: HeroDef = {
  enter(e, c) {
    e.mem['combo'] = 1;
    still(e);
    swing(e, c, 'attack1', 'sfx_swing');
  },
  tick(e, c) {
    const h = c.tuning.hero;
    const combo = mem(e, 'combo');
    const t = e.fsm.t;
    const duration = combo === 3 ? h.finisherTicks : h.attackTicks;
    still(e);
    e.mem['swordOn'] = t >= h.swordActiveFrom && t <= h.swordActiveTo ? 1 : 0;
    if (combo < 3 && t >= duration - h.comboWindow && wasPressed(c.input, 'sword')) {
      e.mem['combo'] = combo + 1;
      e.mem['swordOn'] = 0;
      e.fsm.t = -1;
      swing(e, c, `attack${combo + 1}`, 'sfx_swing');
      return undefined;
    }
    if (t >= duration - 1) return isHeld(c.input, 'sword') ? 'charge' : 'move';
    return undefined;
  },
  exit(e) {
    e.mem['swordOn'] = 0;
    e.mem['combo'] = 0;
  },
};

const charge: HeroDef = {
  enter(e) {
    e.mem['charged'] = 0;
    setAnim(e, 'charge');
  },
  tick(e, c) {
    steer(e, c, c.tuning.hero.chargeSpeed, false);
    if (e.fsm.t + 1 >= c.tuning.hero.chargeTicks && mem(e, 'charged') === 0) {
      e.mem['charged'] = 1;
      c.emit({ t: 'sfx', id: 'sfx_charge' });
    }
    if (!isHeld(c.input, 'sword')) return mem(e, 'charged') === 1 ? 'spin' : 'move';
    return undefined;
  },
  exit(e) {
    e.mem['charged'] = 0;
  },
};

const spin: HeroDef = {
  enter(e, c) {
    still(e);
    swing(e, c, 'spin', 'sfx_spin');
    e.mem['spinOn'] = 1;
  },
  tick(e, c) {
    still(e);
    return e.fsm.t >= c.tuning.hero.spinTicks - 1 ? 'move' : undefined;
  },
  exit(e) {
    e.mem['spinOn'] = 0;
  },
};

const roll: HeroDef = {
  enter(e, c) {
    const m = moveVector(c.input);
    const d = m.x === 0 && m.y === 0 ? DIR_VEC[e.facing] : normalize(m);
    e.mem['rollDx'] = d.x;
    e.mem['rollDy'] = d.y;
    e.facing = dirFromVec(d, e.facing);
    e.iframes = Math.max(e.iframes, c.tuning.hero.rollIframes);
    setAnim(e, 'roll');
    c.emit({ t: 'sfx', id: 'sfx_roll' });
  },
  tick(e, c) {
    const h = c.tuning.hero;
    e.vel = scale({ x: mem(e, 'rollDx'), y: mem(e, 'rollDy') }, h.rollSpeed);
    return e.fsm.t >= h.rollTicks - 1 ? 'move' : undefined;
  },
  exit(e, c) {
    e.mem['rollCd'] = c.tuning.hero.rollCooldown;
    still(e);
  },
};

const shield: HeroDef = {
  enter(e) {
    e.mem['shielding'] = 1;
    setAnim(e, 'shield');
  },
  tick(e, c) {
    if (!isHeld(c.input, 'shield')) return 'move';
    if (wasPressed(c.input, 'sword')) return 'attack';
    if (wasPressed(c.input, 'roll') && mem(e, 'rollCd') === 0) return 'roll';
    steer(e, c, c.tuning.hero.shieldSpeed, false);
    setAnim(e, moving(e) ? 'shieldwalk' : 'shield');
    return undefined;
  },
  exit(e) {
    e.mem['shielding'] = 0;
  },
};

const hurt: HeroDef = {
  enter(e) {
    still(e);
    setAnim(e, 'hurt');
  },
  tick(e, c) {
    still(e);
    return e.fsm.t >= c.tuning.hero.hurtTicks - 1 ? 'move' : undefined;
  },
};

/** Raising a prop overhead; the props system moves the prop, the hero just stands still. */
const lift: HeroDef = {
  enter(e) {
    still(e);
    setAnim(e, 'lift');
  },
  tick(e, c) {
    still(e);
    return e.fsm.t >= c.tuning.hero.liftTicks - 1 ? 'carry' : undefined;
  },
};

/** Walking with a prop overhead: no sword, roll or shield. The props system throws or sets it down. */
const carry: HeroDef = {
  tick(e, c) {
    steer(e, c, c.tuning.hero.carrySpeed, true);
    setAnim(e, moving(e) ? 'carrywalk' : 'carry');
    return undefined;
  },
};

const throwing: HeroDef = {
  enter(e) {
    still(e);
    setAnim(e, 'throw');
  },
  tick(e, c) {
    still(e);
    return e.fsm.t >= c.tuning.hero.throwTicks - 1 ? 'move' : undefined;
  },
};

/** Throwing a sub-item (the boomerang flies on its own). */
const toss: HeroDef = {
  enter(e) {
    still(e);
    setAnim(e, 'toss');
  },
  tick(e, c) {
    still(e);
    return e.fsm.t >= c.tuning.hero.tossTicks - 1 ? 'move' : undefined;
  },
};

/** Singing a galdr (the bolt flies on its own). */
const cast: HeroDef = {
  enter(e) {
    still(e);
    setAnim(e, 'cast');
  },
  tick(e, c) {
    still(e);
    return e.fsm.t >= c.tuning.hero.castTicks - 1 ? 'move' : undefined;
  },
};

/** Fallen at 0 hp. The sim is in `over` mode, which advances the clock of this state by hand. */
const dying: HeroDef = {
  enter(e) {
    still(e);
    e.knock = { x: 0, y: 0 };
    e.facing = 's';
    setAnim(e, 'dying');
  },
  tick(e) {
    still(e);
    return undefined;
  },
};

export const HERO_MACHINE: Machine<HeroMode, HeroCtx> = {
  move,
  attack,
  charge,
  spin,
  roll,
  shield,
  hurt,
  hop,
  lift,
  carry,
  throw: throwing,
  toss,
  cast,
  dying,
};

/** Per-tick bookkeeping that is independent of the current state. */
export function heroPreTick(e: Entity): void {
  const cd = mem(e, 'rollCd');
  if (cd > 0) e.mem['rollCd'] = cd - 1;
}

export function createHero(
  id: number,
  hero: Pick<HeroState, 'x' | 'y' | 'facing' | 'hp' | 'maxHp'>,
  t: Tuning,
): Entity {
  return createEntity({
    id,
    kind: 'hero',
    def: 'hero',
    art: 'hero',
    pos: { x: hero.x, y: hero.y },
    facing: hero.facing,
    body: t.hero.body,
    hurt: t.hero.hurt,
    faction: 'hero',
    hp: hero.hp,
    maxHp: hero.maxHp,
    state: 'move',
  });
}

/** The hero's live weapon hitbox in screen pixels, or null when it cannot hit. */
export function heroSwordBox(e: Entity, t: Tuning, weapon?: WeaponId): Box | null {
  const sw = swordOf(t, weapon);
  if (mem(e, 'spinOn') === 1) return at(sw.spinBox, e.pos);
  if (mem(e, 'swordOn') === 1) return at(sw.boxes[e.facing], e.pos);
  return null;
}

export function heroSwordDamage(e: Entity, t: Tuning, weapon?: WeaponId): number {
  const sw = swordOf(t, weapon);
  if (mem(e, 'spinOn') === 1) return sw.spinDamage;
  const combo = Math.min(3, Math.max(1, mem(e, 'combo')));
  return sw.comboDamage[combo - 1] ?? sw.comboDamage[0];
}
