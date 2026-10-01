import { dirFromVec } from '../../math/dir';
import { scale } from '../../math/vec';
import { mem, setAnim, type Entity } from '../entity';
import type { Machine } from '../fsm';
import { distToHero, faceHero, still, steerTo, toHero, wallAhead } from './common';
import type { ActorCtx } from './defs';

export type KingState =
  | 'throne'
  | 'roar'
  | 'stalk'
  | 'tell'
  | 'sweep'
  | 'lower'
  | 'charge'
  | 'dazed'
  | 'fallen'
  | 'rise'
  | 'aim'
  | 'hurl';

/** The Haugbúi King's numbers: px, px per tick and ticks. */
export const KING = {
  /** Health at or below which each later phase begins (24 → phase 1 at 16, phase 2 at 8). */
  phaseAt: [16, 8],
  wake: 128,
  speed: 0.5,
  reach: 30,
  sweepTell: 24,
  sweepTicks: 10,
  /** Between charges. */
  chargeEvery: 150,
  /** Head lowered, crown ablaze (500 ms; 367 ms in the last phase; the second charge of a pair, 333 ms). */
  lowerTicks: 30,
  lowerLast: 22,
  lowerSecond: 20,
  chargeSpeed: 3,
  chargeTicks: 150,
  /** A charge into a wall only dazes it, guard still up. */
  dazedTicks: 40,
  /** An arrow in the crown fells it, open to the blade. */
  fallenTicks: 150,
  riseTicks: 40,
  roarTicks: 50,
  /** The last phase: between charges it hurls its spectral axe (400 ms wind-up). */
  hurlEvery: 110,
  aimTicks: 24,
  hurlTicks: 12,
} as const;

const phaseOf = (hp: number): number => KING.phaseAt.filter((at) => hp <= at).length;

/** Guarded: blows clink off its mail, and its crown can be struck only while `exposed`. */
function guarded(e: Entity, exposed: boolean): void {
  e.mem['guard'] = 1;
  e.mem['exposed'] = exposed ? 1 : 0;
}

/** An arrow found the crown (`EnemyDef.struckBy`): it falls. */
function struck(e: Entity): boolean {
  if (mem(e, 'struck') !== 1) return false;
  e.mem['struck'] = 0;
  return true;
}

function countdowns(e: Entity): void {
  e.mem['chargeCd'] = Math.max(0, mem(e, 'chargeCd') - 1);
  e.mem['hurlCd'] = Math.max(0, mem(e, 'hurlCd') - 1);
}

/**
 * The Haugbúi King, lord of Konungshaugr. His mail turns every blow. He stalks Ask and sweeps his sword
 * when close (400 ms tell); every few seconds he lowers his head, the gems of his crown blaze (the tell)
 * and he charges in a line. An arrow in the crown while it blazes (the tell or the charge) fells him,
 * open to the blade for 2.5 s; a charge into a wall only dazes him. At two thirds of his health two
 * draugr archers climb out of the floor each time he rises, and he charges twice; at the last third he
 * hurls his spectral axe between charges, and lowers his head faster.
 */
export const KING_MACHINE: Machine<KingState, ActorCtx> = {
  throne: {
    tick(e, c) {
      guarded(e, false);
      still(e);
      setAnim(e, 'idle');
      if (distToHero(e, c) < KING.wake) return 'roar';
      return undefined;
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
      if (e.fsm.t < KING.roarTicks - 1) return undefined;
      e.mem['chargeCd'] = KING.chargeEvery;
      e.mem['hurlCd'] = KING.hurlEvery;
      return 'stalk';
    },
  },
  stalk: {
    enter(e) {
      setAnim(e, 'walk');
    },
    tick(e, c) {
      guarded(e, false);
      countdowns(e);
      const d = distToHero(e, c);
      if (d < KING.reach) return 'tell';
      if (mem(e, 'chargeCd') === 0 && d > 48) {
        e.mem['second'] = 0;
        return 'lower';
      }
      if (mem(e, 'phase') >= 2 && mem(e, 'hurlCd') === 0 && d > 40) return 'aim';
      steerTo(e, c, c.hero, KING.speed);
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
      guarded(e, false);
      still(e);
      return e.fsm.t >= KING.sweepTell - 1 ? 'sweep' : undefined;
    },
  },
  sweep: {
    enter(e, c) {
      setAnim(e, 'sweep');
      c.emit({ t: 'sfx', id: 'sfx_swing' });
    },
    tick(e) {
      guarded(e, false);
      still(e);
      return e.fsm.t >= KING.sweepTicks - 1 ? 'stalk' : undefined;
    },
  },
  lower: {
    enter(e, c) {
      still(e);
      faceHero(e, c);
      const d = toHero(e, c);
      e.mem['cdx'] = d.x;
      e.mem['cdy'] = d.y;
      setAnim(e, 'lower');
      c.emit({ t: 'sfx', id: 'sfx_growl' });
    },
    tick(e) {
      guarded(e, true);
      still(e);
      if (struck(e)) return 'fallen';
      const tell =
        mem(e, 'second') === 1 ? KING.lowerSecond : mem(e, 'phase') >= 2 ? KING.lowerLast : KING.lowerTicks;
      return e.fsm.t >= tell - 1 ? 'charge' : undefined;
    },
  },
  charge: {
    enter(e) {
      setAnim(e, 'charge');
    },
    tick(e, c) {
      guarded(e, true);
      if (struck(e)) return 'fallen';
      const d = { x: mem(e, 'cdx'), y: mem(e, 'cdy') };
      e.facing = dirFromVec(d, e.facing);
      if (wallAhead(e, c, d, 14) || e.fsm.t >= KING.chargeTicks - 1) {
        still(e);
        c.emit({ t: 'shake', amount: 3 });
        c.emit({ t: 'sfx', id: 'sfx_stone' });
        return 'dazed';
      }
      e.vel = scale(d, KING.chargeSpeed);
      return undefined;
    },
  },
  dazed: {
    enter(e) {
      still(e);
      setAnim(e, 'dazed');
    },
    tick(e) {
      guarded(e, false);
      still(e);
      if (e.fsm.t < KING.dazedTicks - 1) return undefined;
      // From two thirds of his health on, a second charge follows the first.
      if (mem(e, 'phase') >= 1 && mem(e, 'second') === 0) {
        e.mem['second'] = 1;
        return 'lower';
      }
      e.mem['chargeCd'] = KING.chargeEvery;
      return 'stalk';
    },
  },
  fallen: {
    enter(e, c) {
      still(e);
      e.mem['guard'] = 0;
      e.mem['exposed'] = 0;
      e.iframes = 0;
      setAnim(e, 'fallen');
      c.emit({ t: 'shake', amount: 5 });
    },
    tick(e) {
      still(e);
      e.mem['guard'] = 0;
      // A phase change: he gets up at once, roaring.
      if (phaseOf(e.hp) > mem(e, 'phase')) return 'rise';
      return e.fsm.t >= KING.fallenTicks - 1 ? 'rise' : undefined;
    },
  },
  rise: {
    enter(e, c) {
      still(e);
      setAnim(e, 'roar');
      const p = phaseOf(e.hp);
      if (p > mem(e, 'phase')) {
        e.mem['phase'] = p;
        c.emit({ t: 'sfx', id: 'sfx_boss_roar' });
      }
      // From two thirds on, two draugr archers climb out of the floor each time he rises.
      if (mem(e, 'phase') >= 1)
        for (const dx of [-72, 72]) c.spawn('bogdraugr', { x: e.pos.x + dx, y: e.pos.y + 24 }, 's');
    },
    tick(e) {
      guarded(e, false);
      still(e);
      if (e.fsm.t < KING.riseTicks - 1) return undefined;
      e.mem['chargeCd'] = KING.chargeEvery;
      e.mem['second'] = 0;
      return 'stalk';
    },
  },
  aim: {
    enter(e, c) {
      still(e);
      faceHero(e, c);
      setAnim(e, 'tell');
    },
    tick(e) {
      guarded(e, false);
      still(e);
      return e.fsm.t >= KING.aimTicks - 1 ? 'hurl' : undefined;
    },
  },
  hurl: {
    enter(e, c) {
      setAnim(e, 'sweep');
      c.shoot('axe', { x: e.pos.x, y: e.pos.y - 18 }, toHero(e, c), e.id);
      e.mem['hurlCd'] = KING.hurlEvery;
    },
    tick(e) {
      guarded(e, false);
      still(e);
      return e.fsm.t >= KING.hurlTicks - 1 ? 'stalk' : undefined;
    },
  },
};
