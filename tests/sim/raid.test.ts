import { describe, expect, it } from 'vitest';
import { DEV_PRESETS } from '@content/dev/presets';
import { NPCS } from '@content/ids';
import { SOLID } from '@core/world/collision';
import { placeOf } from '@core/sim/systems/npcs';
import { Harness, frameOf } from './harness';
import { crossTo, finishStory, talkTo, walkTo } from './walk';
import { condCtx } from '@core/sim/systems/story';
import { questLog } from '@core/story/quests';

const solid = (h: Harness, x: number, y: number): boolean =>
  ((h.sim.screen.collision.flags[y * 40 + x] ?? 0) & SOLID) !== 0;

function toFarmyard(h: Harness): Harness {
  h.sim.command({ t: 'god', on: true });
  walkTo(h, 19, 19);
  crossTo(h, 's', 'ask_farmyard');
  return h;
}

describe('the raid night', () => {
  it('sleeping on the third night wakes Ask to fire, pitchfork in hand, in the first autumn storm', () => {
    const h = new Harness({ preset: DEV_PRESETS.night3 });
    h.hold(['up'], 2).press(['interact']);
    finishStory(h);
    expect(h.sim.state.flags.st_raid_begun).toBe(true);
    expect(h.sim.state.clock).toMatchObject({ season: 'autumn', minute: 120 });
    expect(h.sim.state.inv.weapon).toBe('pitchfork');
    expect(h.sim.screen.id).toBe('ask_int_longhouse');
    expect(
      h.sim.actors.filter((a) => a.kind === 'fixture' && a.def === 'fire' && a.anim === 'burn').length,
    ).toBe(22);
    expect(h.sim.enemies.map((e) => e.def)).toEqual(['draugr']);
    h.expectAnims();
  });

  it('stands still in time while it lasts', () => {
    const h = new Harness({ preset: DEV_PRESETS.raid });
    h.idle(3000);
    expect(h.sim.state.clock.minute).toBe(120);
  });

  it('closes the farmyard with fire except the road north, under the storm', () => {
    const h = toFarmyard(new Harness({ preset: DEV_PRESETS.raid }));
    expect(h.sim.weather()).toBe('storm');
    expect(h.sim.darkness()).toBeGreaterThan(0.5);
    for (const [x, y] of [
      [0, 10],
      [39, 11],
      [19, 21],
    ] as const)
      expect(solid(h, x, y), `${x},${y}`).toBe(true);
    expect(solid(h, 19, 0)).toBe(false);
    expect(h.sim.enemies.map((e) => e.def).sort()).toEqual(['draugr', 'draugr', 'troll']);
    expect(h.sim.lights().length).toBe(1 + 11 + 12);
    h.expectAnims();
  });

  it('ends at the gate: Kolbeinn takes Embla, and morning comes in the longhouse', () => {
    const h = toFarmyard(new Harness({ preset: DEV_PRESETS.raid }));
    walkTo(h, 19, 1);
    crossTo(h, 'n', 'ask_gate');
    expect(
      h.sim.actors
        .filter((a) => a.kind === 'npc')
        .map((a) => a.def)
        .sort(),
    ).toEqual(['embla', 'grimr', 'halvar', 'kolbeinn']);
    h.until((s) => s.mode === 'story', 400, frameOf(['up']));
    finishStory(h);
    const s = h.sim.state;
    expect(s.flags.st_raid_done).toBe(true);
    expect(s.clock.minute).toBe(7 * 60);
    expect(s.clock.day).toBe(2);
    expect(h.sim.screen.id).toBe('ask_int_longhouse');
    expect(h.sim.enemies).toHaveLength(0);
    expect(h.sim.actors.filter((a) => a.kind === 'npc').map((a) => a.def)).toEqual(['halvar']);
    h.idle(600);
    expect(s.clock.minute).toBeGreaterThan(7 * 60);
    const taken = NPCS.filter(
      (id) => id !== 'kolbeinn' && !['halvar', 'gyda', 'sigrun', 'grimr'].includes(id),
    );
    for (const id of taken) {
      s.clock.minute = 12 * 60;
      const def = h.sim.db.npcs[id];
      expect(def && placeOf(h.sim, def), id).toBeNull();
    }
  });

  it('continues at the longhouse door when Ask falls in the yard', () => {
    const h = toFarmyard(new Harness({ preset: DEV_PRESETS.raid }));
    h.sim.command({ t: 'god', on: false });
    h.sim.command({ t: 'setHp', hp: 0 });
    h.until((s) => s.mode === 'over', 10);
    h.idle(100).press(['confirm']);
    expect(h.sim.mode).toBe('play');
    expect(h.sim.screen.id).toBe('ask_farmyard');
    expect(h.sim.hero.pos).toEqual({ x: 9 * 16 + 8, y: 8 * 16 + 14 });
    expect(h.sim.state.flags.st_raid_done).toBeUndefined();
  });
});

describe('the morning after', () => {
  it('Halvar gives the seax and shield, Gyða tells the legend, and the gate north opens', () => {
    const h = new Harness({ preset: DEV_PRESETS.morning });
    talkTo(h, 'halvar');
    expect(h.sim.state.inv).toMatchObject({ weapon: 'seax', shield: true });
    expect(h.sim.state.flags.st_seax_given).toBe(true);
    const log = () => questLog(h.sim.db.quests, condCtx(h.sim)).map((q) => [q.id, q.text.en]);
    expect(log()).toContainEqual(['q_legend', 'Go to the hof and hear what Gyða knows.']);

    h.sim.command({ t: 'warp', screen: 'ask_int_hof', x: 20 * 16 + 8, y: 14 * 16 + 14 });
    h.idle(1);
    talkTo(h, 'gyda');
    expect(h.sim.state.flags.st_legend_told).toBe(true);
    expect(h.sim.state.clock.policy).toBe('cycling');
    expect(log().map(([id]) => id)).toContain('q_runestone_1');

    h.sim.command({ t: 'warp', screen: 'ask_gate', x: 20 * 16 + 8, y: 8 * 16 + 14 });
    h.idle(1);
    expect(solid(h, 19, 3)).toBe(false);
    expect(
      h.sim.actors.filter((a) => a.kind === 'fixture' && a.def === 'gate').every((g) => g.anim === 'open'),
    ).toBe(true);
  });

  it('keeps the gate barred before the legend', () => {
    const h = new Harness({ preset: DEV_PRESETS.morning });
    h.sim.command({ t: 'warp', screen: 'ask_gate', x: 20 * 16 + 8, y: 8 * 16 + 14 });
    h.idle(1);
    expect(solid(h, 19, 3)).toBe(true);
  });
});
