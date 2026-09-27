import { nextInt } from '../../math/rng';
import { TILE } from '../../world/dims';
import { mem, setAnim, type Entity } from '../entity';
import type { Machine } from '../fsm';
import { still } from './common';
import type { ActorCtx } from './defs';

export type RotvaettrState = 'wake' | 'guard' | 'open' | 'roar';
export type BulbState = 'glow';
export type SpikeState = 'tell' | 'erupt' | 'sink';

export const ROTVAETTR = {
  /** Where its three bulbs grow, from its feet (the room puts them across sap). */
  bulbs: [
    { x: -112, y: 40 },
    { x: 112, y: 40 },
    { x: 0, y: 120 },
  ],
  /** Health at or below which each later phase begins (24 → phase 1 at 16, phase 2 at 8). */
  phaseAt: [16, 8],
  /** How long a stunned bulb stays shut, by phase: they recover faster as the fight goes on. */
  bulbStun: [400, 300, 240],
  /** The core stays open this long once every bulb is shut. */
  openTicks: 150,
  roarTicks: 50,
  /** Phase 1 on: a root-biter every so often, never more than `maxBiters` at once. */
  summonTicks: 240,
  maxBiters: 2,
  biterSpots: [
    { x: -64, y: 72 },
    { x: 64, y: 72 },
    { x: -40, y: 152 },
    { x: 40, y: 152 },
  ],
  /** Phase 2: a root spike under Ask this often. */
  spikeTicks: 100,
  /** A spike's warning (400 ms), then it erupts and sinks. */
  spikeTell: 24,
  spikeErupt: 14,
  spikeSink: 10,
} as const;

const phaseOf = (hp: number): number => ROTVAETTR.phaseAt.filter((at) => hp <= at).length;
const isBulb = (e: Readonly<Entity>): boolean => e.def === 'rot_bulb';
const stunned = (e: Readonly<Entity>): boolean => mem(e, 'stun') > 0;

/** A later phase begins when the health falls past its mark: the core shuts and roars. */
function phaseChanged(e: Entity): boolean {
  const p = phaseOf(e.hp);
  if (p <= mem(e, 'phase')) return false;
  e.mem['phase'] = p;
  return true;
}

/** Root-biters (phase 1 on) and root spikes under Ask (phase 2) while the core is shut. */
function attack(e: Entity, c: ActorCtx): void {
  const phase = mem(e, 'phase');
  if (phase >= 1) {
    const t = mem(e, 'summonT') + 1;
    e.mem['summonT'] = t % ROTVAETTR.summonTicks;
    const biters = c.others.filter((a) => a.def === 'root_biter').length;
    if (t >= ROTVAETTR.summonTicks && biters < ROTVAETTR.maxBiters) {
      const spot = ROTVAETTR.biterSpots[nextInt(c.rng, 0, ROTVAETTR.biterSpots.length)] ?? { x: 0, y: 0 };
      c.spawn('root_biter', { x: e.pos.x + spot.x, y: e.pos.y + spot.y }, 's');
    }
  }
  if (phase >= 2) {
    const t = mem(e, 'spikeT') + 1;
    e.mem['spikeT'] = t % ROTVAETTR.spikeTicks;
    if (t >= ROTVAETTR.spikeTicks) {
      const at = {
        x: Math.floor(c.hero.x / TILE) * TILE + TILE / 2,
        y: Math.floor((c.hero.y - 1) / TILE) * TILE + TILE - 2,
      };
      c.spawn('root_spike', at, 's');
    }
  }
}

/**
 * Rótvættr, the root-wight of the first stone: an armoured heart in the roots. Its three bulbs keep it
 * shut; only when all three are stunned at once (the boomerang) does the core open to the blade. Each
 * third of its health lost it roars and fights harder: bulbs wake sooner, root-biters come, and at the
 * last root spikes burst up under Ask.
 */
export const ROTVAETTR_MACHINE: Machine<RotvaettrState, ActorCtx> = {
  wake: {
    tick(e, c) {
      still(e);
      for (const b of ROTVAETTR.bulbs) c.spawn('rot_bulb', { x: e.pos.x + b.x, y: e.pos.y + b.y }, 's');
      e.mem['guard'] = 1;
      return 'guard';
    },
  },
  guard: {
    enter(e) {
      e.mem['guard'] = 1;
      setAnim(e, 'idle');
    },
    tick(e, c) {
      still(e);
      if (phaseChanged(e)) return 'roar';
      const bulbs = c.others.filter(isBulb);
      // Once open, the core waits for a bulb to wake before it can be opened again.
      if (bulbs.some((b) => !stunned(b))) e.mem['armed'] = 1;
      if (mem(e, 'armed') === 1 && bulbs.length > 0 && bulbs.every(stunned)) return 'open';
      attack(e, c);
      return undefined;
    },
  },
  open: {
    enter(e, c) {
      e.mem['guard'] = 0;
      e.mem['armed'] = 0;
      setAnim(e, 'open');
      c.emit({ t: 'sfx', id: 'sfx_gate' });
    },
    tick(e) {
      still(e);
      if (phaseChanged(e)) return 'roar';
      return e.fsm.t >= ROTVAETTR.openTicks - 1 ? 'guard' : undefined;
    },
  },
  roar: {
    enter(e, c) {
      e.mem['guard'] = 1;
      e.mem['armed'] = 0;
      setAnim(e, 'roar');
      c.emit({ t: 'sfx', id: 'sfx_boss_roar' });
      c.emit({ t: 'shake', amount: 4 });
    },
    tick(e) {
      still(e);
      return e.fsm.t >= ROTVAETTR.roarTicks - 1 ? 'guard' : undefined;
    },
  },
};

/** A bulb glows; how long a stun keeps it shut follows Rótvættr's phase. */
export const BULB_MACHINE: Machine<BulbState, ActorCtx> = {
  glow: {
    tick(e, c) {
      still(e);
      setAnim(e, 'idle');
      const heart = c.others.find((a) => a.def === 'rotvaettr');
      const phase = heart === undefined ? 0 : mem(heart, 'phase');
      const stunFor = ROTVAETTR.bulbStun[phase] ?? ROTVAETTR.bulbStun[0];
      if (mem(e, 'stunFor') !== stunFor) e.mem['stunFor'] = stunFor;
      return undefined;
    },
  },
};

/** A root spike: the ground cracks (the tell), a spike bursts up, then sinks and is gone. */
export const SPIKE_MACHINE: Machine<SpikeState, ActorCtx> = {
  tell: {
    tick(e) {
      setAnim(e, 'tell');
      still(e);
      e.iframes = Math.max(e.iframes, 2);
      return e.fsm.t >= ROTVAETTR.spikeTell - 1 ? 'erupt' : undefined;
    },
  },
  erupt: {
    enter(e, c) {
      setAnim(e, 'erupt');
      c.emit({ t: 'sfx', id: 'sfx_break' });
    },
    tick(e) {
      still(e);
      e.iframes = Math.max(e.iframes, 2);
      return e.fsm.t >= ROTVAETTR.spikeErupt - 1 ? 'sink' : undefined;
    },
  },
  sink: {
    enter(e) {
      setAnim(e, 'sink');
    },
    tick(e) {
      still(e);
      e.iframes = Math.max(e.iframes, 2);
      if (e.fsm.t >= ROTVAETTR.spikeSink - 1) e.mem['gone'] = 1;
      return undefined;
    },
  },
};
