import type { FishId } from '@content/ids';
import type { Season } from '../clock/types';
import type { L10n } from '../i18n/t';
import { isHeld, wasPressed, type InputFrame } from '../input/actions';
import { nextInt, type RngState } from '../math/rng';
import type { TilePos } from '../world/screen';
import type { Phase } from './cond';
import type { Effect } from './effects';

/** A fish that can bite, when, what it pays, and how hard it fights. */
export interface FishDef {
  readonly id: FishId;
  readonly name: L10n;
  /** Silver Kári pays for it as it lands. */
  readonly silver: number;
  readonly seasons: readonly Season[];
  /** Parts of the day it bites in (any, if absent). */
  readonly phases?: readonly Phase[];
  /** Relative chance among the fish biting now. */
  readonly weight: number;
  /** How far out it is hooked (reeling takes `FISHING.reel` a tick off it). */
  readonly dist: number;
  /** Tension each tick the line is held tight. */
  readonly pull: number;
  /** Distance it takes back each tick the line is slack. */
  readonly run: number;
  /** Extra tension each tick the line is held while it surges (let it run, or the line goes). */
  readonly surge: number;
  /** Applied when it is landed (Gamli's flag). */
  readonly onLand?: readonly Effect[];
}

/** Fishing numbers: ticks, tension (0–1000) and distance. */
export const FISHING = {
  castTicks: 24,
  waitMin: 90,
  waitMax: 361,
  /** A nibble: the float twitches, and striking then spooks the fish. */
  nibbleTicks: 8,
  /** The float is under: strike now. */
  biteTicks: 20,
  tensionStart: 400,
  /** The line snaps here. */
  tensionMax: 1000,
  /** Where the tension is safe to hold (shown on the bar). */
  band: [150, 850] as const,
  /** Tension lost each tick the line is slack. */
  slack: 25,
  /** Slack this long and the fish is off the hook. */
  slackTicks: 45,
  /** Distance reeled in each tick the line is held. */
  reel: 12,
  /** How far past where it was hooked the fish may run before it is gone. */
  escape: 400,
  surgeMin: 40,
  surgeMax: 101,
  surgeTicks: 20,
  resultTicks: 60,
} as const;

export type FishPhase = 'idle' | 'cast' | 'wait' | 'bite' | 'reel' | 'result';
export type FishResult = 'spooked' | 'missed' | 'snapped' | 'slipped' | 'landed';

/** A fishing session at one spot. Plain JSON integers, so it hashes and replays exactly. */
export interface FishRun {
  phase: FishPhase;
  /** Ticks in the current phase. */
  t: number;
  /** Where the float lies. */
  readonly float: TilePos;
  /** When the real bite comes (wait ticks), and the fake nibbles before it. */
  biteAt: number;
  nibbles: number[];
  fish: FishId | null;
  tension: number;
  dist: number;
  maxDist: number;
  /** Ticks the line has lain slack at zero tension. */
  slack: number;
  surgeAt: number;
  surgeLeft: number;
  result: FishResult | null;
}

export function newFishRun(float: TilePos): FishRun {
  return {
    phase: 'idle',
    t: 0,
    float: { ...float },
    biteAt: 0,
    nibbles: [],
    fish: null,
    tension: 0,
    dist: 0,
    maxDist: 0,
    slack: 0,
    surgeAt: 0,
    surgeLeft: 0,
    result: null,
  };
}

/** What a fishing step needs from the world. */
export interface FishEnv {
  readonly rng: RngState;
  /** The fish that could bite here and now. */
  readonly biting: readonly FishDef[];
  /** Called once when a fish is landed. */
  land(fish: FishDef): void;
}

const STRIKE = ['confirm', 'interact', 'sword'] as const;
const struck = (f: InputFrame): boolean => STRIKE.some((a) => wasPressed(f, a));
const holding = (f: InputFrame): boolean => STRIKE.some((a) => isHeld(f, a));

function pick(rng: RngState, fish: readonly FishDef[]): FishDef | null {
  const total = fish.reduce((n, f) => n + f.weight, 0);
  if (total <= 0) return null;
  let roll = nextInt(rng, 0, total);
  for (const f of fish) {
    roll -= f.weight;
    if (roll < 0) return f;
  }
  return null;
}

function to(run: FishRun, phase: FishPhase): void {
  run.phase = phase;
  run.t = 0;
}

function end(run: FishRun, result: FishResult): void {
  run.result = result;
  to(run, 'result');
}

/** Whether the float twitches with a nibble at this tick of the wait. */
export const nibbling = (run: FishRun): boolean =>
  run.phase === 'wait' && run.nibbles.some((n) => run.t >= n && run.t < n + FISHING.nibbleTicks);

/**
 * One tick of fishing. Confirm casts; the wait brings nibbles (a strike then spooks the fish) and then the
 * bite, which must be struck within its window; reeling holds the line tight (tension rises, the fish comes
 * in) or lets it slack (tension falls, the fish runs), and while it surges a held line strains harder (the
 * float jerks: let it run). A fish can be landed while `run × pull < reel × slack`. Returns false when
 * Ask puts the rod down (cancel while idle or showing a result).
 */
export function stepFishing(run: FishRun, input: InputFrame, env: FishEnv): boolean {
  run.t += 1;
  switch (run.phase) {
    case 'idle':
      if (wasPressed(input, 'cancel')) return false;
      if (struck(input)) {
        run.result = null;
        run.fish = null;
        to(run, 'cast');
      }
      return true;
    case 'cast':
      if (run.t >= FISHING.castTicks) {
        run.biteAt = nextInt(env.rng, FISHING.waitMin, FISHING.waitMax);
        const n = nextInt(env.rng, 0, 3);
        run.nibbles = [];
        for (let i = 0; i < n; i++) run.nibbles.push(nextInt(env.rng, 20, Math.max(21, run.biteAt - 30)));
        to(run, 'wait');
      }
      return true;
    case 'wait':
      if (struck(input)) end(run, 'spooked');
      else if (run.t >= run.biteAt) to(run, 'bite');
      return true;
    case 'bite': {
      if (run.t > FISHING.biteTicks) {
        end(run, 'missed');
        return true;
      }
      if (!struck(input)) return true;
      const fish = pick(env.rng, env.biting);
      if (fish === null) {
        end(run, 'missed');
        return true;
      }
      run.fish = fish.id;
      run.tension = FISHING.tensionStart;
      run.dist = fish.dist;
      run.maxDist = fish.dist + FISHING.escape;
      run.slack = 0;
      run.surgeLeft = 0;
      run.surgeAt = nextInt(env.rng, FISHING.surgeMin, FISHING.surgeMax);
      to(run, 'reel');
      return true;
    }
    case 'reel': {
      const fish = env.biting.find((f) => f.id === run.fish);
      if (fish === undefined) {
        end(run, 'slipped');
        return true;
      }
      if (run.surgeLeft > 0) run.surgeLeft -= 1;
      else if (run.t >= run.surgeAt) {
        run.surgeLeft = FISHING.surgeTicks;
        run.surgeAt = run.t + FISHING.surgeTicks + nextInt(env.rng, FISHING.surgeMin, FISHING.surgeMax);
      }
      const surging = run.surgeLeft > 0;
      if (holding(input)) {
        run.tension += fish.pull + (surging ? fish.surge : 0);
        run.dist -= FISHING.reel;
      } else {
        run.tension = Math.max(0, run.tension - FISHING.slack);
        run.dist += fish.run;
      }
      run.slack = run.tension === 0 ? run.slack + 1 : 0;
      if (run.tension >= FISHING.tensionMax) end(run, 'snapped');
      else if (run.dist <= 0) {
        env.land(fish);
        end(run, 'landed');
      } else if (run.slack >= FISHING.slackTicks || run.dist >= run.maxDist) end(run, 'slipped');
      return true;
    }
    case 'result':
      if (wasPressed(input, 'cancel')) return false;
      if (run.t >= FISHING.resultTicks || struck(input)) to(run, 'idle');
      return true;
  }
}
