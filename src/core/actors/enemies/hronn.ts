import { nextInt } from '../../math/rng';
import { length, sub, type Vec } from '../../math/vec';
import { mem, setAnim, type Entity } from '../entity';
import type { Machine } from '../fsm';
import { faceHero, still } from './common';
import type { ActorCtx } from './defs';

export type HronnState = 'wake' | 'under' | 'surface' | 'sink' | 'stunned';
export type GrateState = 'grate';

/** Hrönn's numbers: px and ticks. */
export const HRONN = {
  /** Its four grates round the hall's pool, from where it waits (north, east, south, west). */
  grates: [
    { x: 0, y: -80 },
    { x: 112, y: 0 },
    { x: 0, y: 80 },
    { x: -112, y: 0 },
  ],
  /** Health at or below which it waits under a shorter while, with a second grate bubbling as a decoy. */
  phaseAt: 8,
  /** Under a grate before it surfaces: longer than a bomb's fuse (96), so one set at the bubbling grate is in time. */
  underTicks: 150,
  underTicksLast: 110,
  /** Up out of the grate: the tell (400 ms), then the bite. */
  surfaceTell: 24,
  surfaceTicks: 56,
  /** Swimming under the floor to the next grate. */
  sinkTicks: 40,
  /** Blown out of its grate: stunned, open to the blade (2.5 s). */
  stunTicks: 150,
  /** A broken grate is mended this long after, once Ask is this far (px) from it. */
  regrowTicks: 240,
  regrowClear: 28,
} as const;

const GRATE_IDS = ['m0', 'm1', 'm2', 'm3'] as const;
const GROW_IDS = ['g0', 'g1', 'g2', 'g3'] as const;
const N = HRONN.grates.length;

function grateAt(e: Entity, c: ActorCtx, i: number): Readonly<Entity> | undefined {
  const id = mem(e, GRATE_IDS[i] ?? 'm0');
  return id === 0 ? undefined : c.others.find((a) => a.id === id);
}

function spotPos(e: Entity, i: number): Vec {
  const s = HRONN.grates[i] ?? { x: 0, y: 0 };
  return { x: mem(e, 'homeX') + s.x, y: mem(e, 'homeY') + s.y };
}

function raise(e: Entity, c: ActorCtx, i: number): void {
  const g = c.spawn('hronn_grate', spotPos(e, i), 's');
  g.mem['spot'] = i;
  e.mem[GRATE_IDS[i] ?? 'm0'] = g.id;
  e.mem[GROW_IDS[i] ?? 'g0'] = 0;
}

/** Broken grates are mended after a while, but never up under Ask's feet. */
function regrow(e: Entity, c: ActorCtx): void {
  for (let i = 0; i < N; i++) {
    if (grateAt(e, c, i) !== undefined) continue;
    const key = GROW_IDS[i] ?? 'g0';
    const t = Math.min(HRONN.regrowTicks, mem(e, key) + 1);
    e.mem[key] = t;
    if (t >= HRONN.regrowTicks && length(sub(spotPos(e, i), c.hero)) > HRONN.regrowClear) raise(e, c, i);
  }
}

/** Out of reach under the floor: no blow or blast touches it. */
function submerged(e: Entity): void {
  still(e);
  e.iframes = Math.max(e.iframes, 2);
  e.mem['guard'] = 1;
}

const last = (e: Entity): boolean => e.hp <= HRONN.phaseAt;

/**
 * Hrönn, the great eel of Sökkva Hof's round hall. It lies under one of four grates round the pool, which
 * bubbles, then rears up out of it (400 ms) and bites, and sinks on to the next grate in turn, round the
 * hall. Blade and blast turn off it; but a bomb that blows apart the grate it lies under stuns it there
 * (2.5 s), open to the sword. Broken grates are mended. At a third of its health it waits less, and a
 * second grate bubbles to fool Ask. A mini-boss: Vindr's stave lies behind it.
 */
export const HRONN_MACHINE: Machine<HronnState, ActorCtx> = {
  wake: {
    tick(e, c) {
      e.mem['homeX'] = e.pos.x;
      e.mem['homeY'] = e.pos.y;
      e.mem['in'] = 0;
      e.mem['decoy'] = -1;
      for (let i = 0; i < N; i++) raise(e, c, i);
      submerged(e);
      return 'under';
    },
  },
  under: {
    enter(e, c) {
      e.pos = spotPos(e, mem(e, 'in'));
      setAnim(e, 'under');
      if (!last(e)) return;
      const others = [0, 1, 2, 3].filter((i) => i !== mem(e, 'in') && grateAt(e, c, i) !== undefined);
      e.mem['decoy'] = others.length === 0 ? -1 : (others[nextInt(c.rng, 0, others.length)] ?? -1);
    },
    tick(e, c) {
      submerged(e);
      regrow(e, c);
      if (grateAt(e, c, mem(e, 'in')) === undefined) return 'stunned';
      const wait = last(e) ? HRONN.underTicksLast : HRONN.underTicks;
      return e.fsm.t >= wait - 1 ? 'surface' : undefined;
    },
  },
  surface: {
    enter(e, c) {
      e.mem['decoy'] = -1;
      faceHero(e, c);
      setAnim(e, 'tell');
      c.emit({ t: 'sfx', id: 'sfx_splash' });
    },
    tick(e, c) {
      still(e);
      e.mem['guard'] = 1;
      regrow(e, c);
      if (grateAt(e, c, mem(e, 'in')) === undefined) return 'stunned';
      faceHero(e, c);
      if (e.fsm.t === HRONN.surfaceTell - 1) {
        setAnim(e, 'bite');
        c.emit({ t: 'sfx', id: 'sfx_growl' });
      }
      return e.fsm.t >= HRONN.surfaceTicks - 1 ? 'sink' : undefined;
    },
  },
  sink: {
    enter(e) {
      e.mem['from'] = mem(e, 'in');
      e.mem['in'] = (mem(e, 'in') + 1) % N;
      setAnim(e, 'sink');
    },
    tick(e, c) {
      submerged(e);
      regrow(e, c);
      const a = spotPos(e, mem(e, 'from'));
      const b = spotPos(e, mem(e, 'in'));
      const k = Math.min(1, (e.fsm.t + 1) / HRONN.sinkTicks);
      e.pos = { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
      if (e.fsm.t < HRONN.sinkTicks - 1) return undefined;
      // Past a broken grate to the next whole one; with none whole it waits for one to be mended.
      for (let n = 0; n < N; n++) {
        const i = (mem(e, 'in') + n) % N;
        if (grateAt(e, c, i) === undefined) continue;
        e.mem['in'] = i;
        return 'under';
      }
      return undefined;
    },
  },
  stunned: {
    enter(e, c) {
      still(e);
      e.iframes = 0;
      e.mem['guard'] = 0;
      e.mem['decoy'] = -1;
      setAnim(e, 'stunned');
      c.emit({ t: 'sfx', id: 'sfx_stun' });
      c.emit({ t: 'shake', amount: 3 });
    },
    tick(e, c) {
      still(e);
      regrow(e, c);
      return e.fsm.t >= HRONN.stunTicks - 1 ? 'sink' : undefined;
    },
  },
};

/** An iron grate in the floor: it bubbles while Hrönn lies under it (or, later, to fool Ask). */
export const GRATE_MACHINE: Machine<GrateState, ActorCtx> = {
  grate: {
    tick(e, c) {
      still(e);
      const eel = c.others.find((a) => a.def === 'hronn');
      const spot = mem(e, 'spot');
      const bubbling =
        eel !== undefined && eel.fsm.s === 'under' && (mem(eel, 'in') === spot || mem(eel, 'decoy') === spot);
      setAnim(e, bubbling ? 'bubble' : 'idle');
      return undefined;
    },
  },
};
