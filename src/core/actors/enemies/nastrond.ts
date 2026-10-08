import { length, normalize, sub, type Vec } from '../../math/vec';
import { mem, setAnim, type Entity } from '../entity';
import type { Machine } from '../fsm';
import { distToHero, faceHero, still, steerTo } from './common';
import type { ActorCtx } from './defs';

export type NastrondState =
  'throne' | 'roar' | 'stalk' | 'tell' | 'cut' | 'torn' | 'fetch' | 'arm' | 'raise' | 'wind' | 'flail';

/** Thane Náströnd's numbers: px, px per tick and ticks. */
export const NASTROND = {
  /** Health at or below which each later phase begins (30 → phase 1 at 20, phase 2 at 10). */
  phaseAt: [20, 10],
  wake: 128,
  speed: 0.45,
  reach: 34,
  cutTell: 24,
  cutTicks: 10,
  /** How far towards Ask the torn shield lands. */
  throwTo: 56,
  /** Staggered as the shield is torn from his arm. */
  tornTicks: 24,
  /** Walking back for it, open to the blade; quicker once the dead are raised. */
  fetchSpeed: 0.5,
  fetchSpeedLater: 0.9,
  armTicks: 20,
  raiseTicks: 60,
  roarTicks: 50,
  /** The last phase: the chain-flail, swung round him every so often (500 ms wind-up). */
  flailEvery: 140,
  windTicks: 30,
  flailTicks: 24,
} as const;

/** Where a torn shield lands: up to `throwTo` px along the line towards Ask, never closer than 20 px to Ask. */
export function shieldLanding(from: Vec, to: Vec): Vec {
  const gap = length(sub(to, from));
  if (gap === 0) return { ...from };
  const d = normalize(sub(to, from));
  const far = Math.min(NASTROND.throwTo, Math.max(0, gap - 20));
  return { x: from.x + d.x * far, y: from.y + d.y * far };
}

const phaseOf = (hp: number): number => NASTROND.phaseAt.filter((at) => hp <= at).length;

/** With his tower shield, every blow clinks off; without it he is open. */
function guarded(e: Entity): void {
  e.mem['guard'] = mem(e, 'bare') === 1 ? 0 : 1;
}

/** The grapple caught the shield's rim (`mem.hooked`): torn away, when he still bears it. */
function torn(e: Entity): boolean {
  if (mem(e, 'hooked') !== 1) return false;
  e.mem['hooked'] = 0;
  return mem(e, 'bare') !== 1;
}

/** A phase change is waiting: he raises the dead (and, the last time, the fog). */
const raising = (e: Entity): boolean => phaseOf(e.hp) > mem(e, 'phase');

function countdown(e: Entity): void {
  e.mem['flailCd'] = Math.max(0, mem(e, 'flailCd') - 1);
}

/**
 * Thane Náströnd, the Hollow, first of the Rime King's four. His tower shield turns every blow; he stalks
 * and cuts (400 ms tell). The grapple chain tears the shield from his arm: it lands near Ask, and he walks
 * back to fetch it, open to the blade, then takes it up again. At two thirds of his health he raises two
 * fog-draugr and fetches his shield quicker; at the last third he fills the hall with fog (`mem.fog`) and
 * swings a chain-flail round himself between cuts, which Ask's shield can stop.
 */
export const NASTROND_MACHINE: Machine<NastrondState, ActorCtx> = {
  throne: {
    tick(e, c) {
      guarded(e);
      still(e);
      setAnim(e, 'idle');
      e.mem['hooked'] = 0;
      return distToHero(e, c) < NASTROND.wake ? 'roar' : undefined;
    },
  },
  roar: {
    enter(e, c) {
      still(e);
      faceHero(e, c);
      setAnim(e, 'roar');
      c.emit({ t: 'sfx', id: 'sfx_boss_roar' });
      c.emit({ t: 'shake', amount: 4 });
    },
    tick(e) {
      guarded(e);
      still(e);
      e.mem['hooked'] = 0;
      if (e.fsm.t < NASTROND.roarTicks - 1) return undefined;
      e.mem['flailCd'] = NASTROND.flailEvery;
      return 'stalk';
    },
  },
  stalk: {
    enter(e) {
      setAnim(e, mem(e, 'bare') === 1 ? 'bare_walk' : 'walk');
    },
    tick(e, c) {
      guarded(e);
      if (raising(e)) return 'raise';
      if (torn(e)) return 'torn';
      countdown(e);
      if (mem(e, 'bare') === 1) return 'fetch';
      if (mem(e, 'phase') >= 2 && mem(e, 'flailCd') === 0) return 'wind';
      if (distToHero(e, c) < NASTROND.reach) return 'tell';
      steerTo(e, c, c.hero, NASTROND.speed);
      faceHero(e, c);
      return undefined;
    },
  },
  tell: {
    enter(e, c) {
      still(e);
      faceHero(e, c);
      setAnim(e, 'tell');
    },
    tick(e) {
      guarded(e);
      still(e);
      if (torn(e)) return 'torn';
      return e.fsm.t >= NASTROND.cutTell - 1 ? 'cut' : undefined;
    },
  },
  cut: {
    enter(e, c) {
      setAnim(e, 'cut');
      c.emit({ t: 'sfx', id: 'sfx_swing' });
    },
    tick(e) {
      guarded(e);
      still(e);
      if (torn(e)) return 'torn';
      return e.fsm.t >= NASTROND.cutTicks - 1 ? 'stalk' : undefined;
    },
  },
  torn: {
    enter(e, c) {
      still(e);
      e.mem['bare'] = 1;
      e.mem['guard'] = 0;
      e.iframes = 0;
      setAnim(e, 'bare_idle');
      // The shield flies off along the chain and lands between him and Ask.
      const at = shieldLanding(e.pos, c.hero);
      const shield = c.spawn('tower_shield', at, 's');
      e.mem['shield'] = shield.id;
      e.mem['sx'] = at.x;
      e.mem['sy'] = at.y;
      c.emit({ t: 'sfx', id: 'sfx_break' });
      c.emit({ t: 'shake', amount: 3 });
    },
    tick(e) {
      still(e);
      guarded(e);
      e.mem['hooked'] = 0;
      if (raising(e)) return 'raise';
      return e.fsm.t >= NASTROND.tornTicks - 1 ? 'fetch' : undefined;
    },
  },
  fetch: {
    enter(e) {
      setAnim(e, 'bare_walk');
    },
    tick(e, c) {
      guarded(e);
      e.mem['hooked'] = 0;
      if (raising(e)) return 'raise';
      countdown(e);
      if (mem(e, 'phase') >= 2 && mem(e, 'flailCd') === 0) return 'wind';
      const to = { x: mem(e, 'sx'), y: mem(e, 'sy') };
      if (length(sub(to, e.pos)) < 10) return 'arm';
      const speed = mem(e, 'phase') >= 1 ? NASTROND.fetchSpeedLater : NASTROND.fetchSpeed;
      steerTo(e, c, to, speed);
      return undefined;
    },
  },
  arm: {
    enter(e) {
      still(e);
      setAnim(e, 'bare_idle');
    },
    tick(e) {
      still(e);
      guarded(e);
      if (raising(e)) return 'raise';
      if (e.fsm.t < NASTROND.armTicks - 1) return undefined;
      // The shield is up again (its own behaviour sees him take it and goes).
      e.mem['bare'] = 0;
      e.mem['shield'] = 0;
      guarded(e);
      return 'stalk';
    },
  },
  raise: {
    enter(e, c) {
      still(e);
      e.mem['phase'] = phaseOf(e.hp);
      setAnim(e, mem(e, 'bare') === 1 ? 'bare_idle' : 'roar');
      c.emit({ t: 'sfx', id: 'sfx_boss_roar' });
      c.emit({ t: 'shake', amount: 5 });
      if (mem(e, 'phase') === 1)
        for (const dx of [-64, 64]) c.spawn('fog_draugr', { x: e.pos.x + dx, y: e.pos.y + 32 }, 's');
      if (mem(e, 'phase') >= 2) e.mem['fog'] = 1;
    },
    tick(e) {
      still(e);
      guarded(e);
      e.mem['hooked'] = 0;
      if (e.fsm.t < NASTROND.raiseTicks - 1) return undefined;
      e.mem['flailCd'] = NASTROND.flailEvery;
      return mem(e, 'bare') === 1 ? 'fetch' : 'stalk';
    },
  },
  wind: {
    enter(e, c) {
      still(e);
      faceHero(e, c);
      setAnim(e, mem(e, 'bare') === 1 ? 'bare_idle' : 'tell');
      c.emit({ t: 'sfx', id: 'sfx_chain' });
    },
    tick(e) {
      still(e);
      guarded(e);
      if (torn(e)) return 'torn';
      return e.fsm.t >= NASTROND.windTicks - 1 ? 'flail' : undefined;
    },
  },
  flail: {
    enter(e, c) {
      setAnim(e, 'flail');
      c.emit({ t: 'sfx', id: 'sfx_swing' });
    },
    tick(e) {
      still(e);
      guarded(e);
      if (torn(e)) return 'torn';
      if (e.fsm.t < NASTROND.flailTicks - 1) return undefined;
      e.mem['flailCd'] = NASTROND.flailEvery;
      return mem(e, 'bare') === 1 ? 'fetch' : 'stalk';
    },
  },
};

export type TowerShieldState = 'lie';

/**
 * Náströnd's tower shield where the grapple flung it: it lies until he stands over it in his `arm` pose,
 * then it is his again and goes. It is gone with him, too.
 */
export const TOWER_SHIELD_MACHINE: Machine<TowerShieldState, ActorCtx> = {
  lie: {
    tick(e, c) {
      still(e);
      setAnim(e, 'idle');
      const owner = c.others.find((o) => o.def === 'nastrond' && mem(o, 'shield') === e.id);
      if (owner === undefined) {
        e.mem['gone'] = 1;
        return undefined;
      }
      const near = length(sub(owner.pos, e.pos)) < 16;
      if (near && owner.fsm.s === 'arm') e.mem['gone'] = 1;
      return undefined;
    },
  },
};
