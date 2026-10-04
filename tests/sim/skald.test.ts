import { describe, expect, it } from 'vitest';
import { DEV_PRESETS } from '@content/dev/presets';
import { VERSES } from '@content/verses';
import { verseMarks } from '@core/world/mapModel';
import { Harness } from './harness';
import { talkTo } from './walk';

/** At the drained camp with the twist heard, at `minute`, with `silver` in the purse. */
function atTheCamp(minute: number, silver: number): Harness {
  const h = new Harness({ preset: DEV_PRESETS.fimbul, screen: 'nif_camp', tile: [33, 16], minute });
  h.sim.state.flags.st_niflmyrr_reached = true;
  h.sim.state.flags.st_twist_heard = true;
  h.sim.state.hero.silver = silver;
  return h;
}

const bragi = (h: Harness) => h.sim.actors.some((a) => a.kind === 'npc' && a.def === 'bragi');

describe('Bragi the skald', () => {
  it('keeps his fire at the drained camp by night, and is gone by day', () => {
    expect(bragi(atTheCamp(23 * 60, 0))).toBe(true);
    expect(bragi(atTheCamp(19 * 60, 0))).toBe(true);
    expect(bragi(atTheCamp(12 * 60, 0))).toBe(false);
  });

  it('sells his verses for 30 silver each, and each one marks a secret on the map', () => {
    const h = atTheCamp(23 * 60, 100);
    expect(verseMarks(VERSES, h.sim.state)).toEqual([]);
    talkTo(h, 'bragi');
    expect(h.sim.state.flags.n_bragi_met).toBe(true);
    expect(h.sim.state.hero.silver).toBe(70);
    const held = VERSES.filter((v) => h.sim.state.flags[v.flag] === true);
    expect(held).toHaveLength(1);
    expect(verseMarks(VERSES, h.sim.state)).toEqual([held[0]?.screen]);
    talkTo(h, 'bragi');
    talkTo(h, 'bragi');
    expect(h.sim.state.hero.silver).toBe(10);
    expect(VERSES.every((v) => h.sim.state.flags[v.flag] === true)).toBe(true);
    talkTo(h, 'bragi');
    expect(h.sim.state.hero.silver).toBe(10);
  });

  it('sings nothing for an empty purse', () => {
    const h = atTheCamp(23 * 60, 20);
    talkTo(h, 'bragi');
    expect(h.sim.state.hero.silver).toBe(20);
    expect(VERSES.some((v) => h.sim.state.flags[v.flag] === true)).toBe(false);
  });

  it('a marker goes once its secret is found', () => {
    const h = atTheCamp(23 * 60, 0);
    const v = VERSES[0];
    if (v === undefined) throw new Error('no verses');
    h.sim.state.flags[v.flag] = true;
    expect(verseMarks(VERSES, h.sim.state)).toEqual([v.screen]);
    h.sim.state.world.pieces.push(v.piece);
    expect(verseMarks(VERSES, h.sim.state)).toEqual([]);
  });
});
