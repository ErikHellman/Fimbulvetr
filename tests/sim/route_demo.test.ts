import { describe, expect, it } from 'vitest';
import { DEV_PRESETS } from '@content/dev/presets';
import type { DevPreset } from '@core/dev/query';
import type { GameState } from '@core/state/gameState';
import type { Harness } from './harness';
import { playPrologue } from './routes/m1a';
import { playRaidToRoots } from './routes/m1b';
import { playD1 } from './routes/m1c';
import { playM2b } from './routes/m2b';
import { playM2c } from './routes/m2c';
import { playM3a } from './routes/m3a';
import { playM3b } from './routes/m3b';
import { playM4a } from './routes/m4a';
import { playM4b } from './routes/m4b';
import { playM5a } from './routes/m5a';
import { seam } from './routes/seam';

/** The milestone routes in story order, each with the preset it starts from. */
const LEGS: readonly [string, DevPreset, (seed: number, from: GameState) => Harness][] = [
  ['m1b', DEV_PRESETS.night3, playRaidToRoots],
  ['m1c', DEV_PRESETS.d1, playD1],
  ['m2b', DEV_PRESETS.north, playM2b],
  ['m2c', DEV_PRESETS.hunt, playM2c],
  ['m3a', DEV_PRESETS.myl, playM3a],
  ['m3b', DEV_PRESETS.d2, playM3b],
  ['m4a', DEV_PRESETS.hau, playM4a],
  ['m4b', DEV_PRESETS.d3, playM4b],
  ['m5a', DEV_PRESETS.haubow, playM5a],
];

/** New Game to the credits: the prologue, then every milestone route carried on from the last. */
function playDemo(seed: number): { h: Harness; gaps: Record<string, string[]> } {
  let h = playPrologue(seed);
  const gaps: Record<string, string[]> = {};
  for (const [leg, preset, play] of LEGS) {
    const joined = seam(h.sim.snapshot(), preset);
    gaps[leg] = joined.gaps;
    h = play(seed, joined.state);
  }
  return { h, gaps };
}

/**
 * What the presets hold that the routes never play for: walking into a dungeon, meeting someone on the
 * way, and the optional pieces of heart, mead, bombs and silver gathered between milestones.
 */
const GAPS: Readonly<Record<string, readonly string[]>> = {
  m1b: ['weapon handaxe', 'silver'],
  m1c: ['flag st_d1_entered'],
  m2b: ['flag n_onundr_met', 'piece hp_d1_r09'],
  m2c: ['flag n_dagny_met'],
  m3a: [],
  m3b: [
    'flag st_d2_entered',
    'item horn',
    'item mead_red',
    'maxHp 20',
    'piece hp_ask_ridge',
    'piece hp_myr_pines',
    'piece hp_myr_brook',
  ],
  m4a: ['item mead_red', 'item bombs', 'silver'],
  m4b: [
    'item bombs',
    'piece hp_myl_peat',
    'piece hp_hau_barrows',
    'piece hp_hau_tarn',
    'opened hau_k_barrows',
    'silver',
  ],
  m5a: ['item mead_red', 'silver'],
};

describe('the demo, New Game to the credits', () => {
  it('plays every milestone route on from the last, through the credits, granting only the known gaps', () => {
    const { h, gaps } = playDemo(1);
    expect(gaps).toEqual(GAPS);
    expect(h.sim.state.flags.st_pass_open).toBe(true);
    expect(h.sim.state.clock.season).toBe('winter');
    const c = h.sim.state.clock;
    console.log(
      `Demo route: ${String(h.sim.tick)} ticks of the last leg, day ${String(c.day)}, hp ${String(h.sim.hero.hp)}/${String(h.sim.hero.maxHp)}, silver ${String(h.sim.state.hero.silver)}`,
    );
  }, 240_000);

  it('replays identically', () => {
    expect(playDemo(1).h.sim.hash()).toBe(playDemo(1).h.sim.hash());
  }, 480_000);
});
