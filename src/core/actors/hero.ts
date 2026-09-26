import { isHeld, moveVector, wasPressed, type InputFrame } from '../input/actions';
import { at, type Box } from '../math/box';
import { DIR_VEC, dirFromVec } from '../math/dir';
import { normalize, scale } from '../math/vec';
import type { SimEvent } from '../sim/events';
import type { HeroState } from '../state/gameState';
import { createEntity, mem, setAnim, type Entity } from './entity';
import type { Machine, StateDef } from './fsm';
import type { Tuning } from './tuning';

export type HeroMode = 'move' | 'attack' | 'charge' | 'spin' | 'roll' | 'shield' | 'hurt';

export interface HeroCtx {
  readonly input: InputFrame;
  readonly tuning: Tuning;
  readonly hasShield: boolean;
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
    if (wasPressed(c.input, 'sword')) return 'attack';
    if (isHeld(c.input, 'shield') && c.hasShield) return 'shield';
    steer(e, c, c.tuning.hero.walkSpeed, true);
    setAnim(e, moving(e) ? 'walk' : 'idle');
    return undefined;
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

export const HERO_MACHINE: Machine<HeroMode, HeroCtx> = { move, attack, charge, spin, roll, shield, hurt };

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

/** The hero's live sword hitbox in screen pixels, or null when the sword cannot hit. */
export function heroSwordBox(e: Entity, t: Tuning): Box | null {
  if (mem(e, 'spinOn') === 1) return at(t.sword.spinBox, e.pos);
  if (mem(e, 'swordOn') === 1) return at(t.sword.boxes[e.facing], e.pos);
  return null;
}

export function heroSwordDamage(e: Entity, t: Tuning): number {
  if (mem(e, 'spinOn') === 1) return t.sword.spinDamage;
  const combo = Math.min(3, Math.max(1, mem(e, 'combo')));
  return t.sword.comboDamage[combo - 1] ?? t.sword.comboDamage[0];
}
