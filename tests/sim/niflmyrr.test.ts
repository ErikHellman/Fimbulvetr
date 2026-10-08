import { describe, expect, it } from 'vitest';
import { DEV_PRESETS } from '@content/dev/presets';
import { questLog } from '@core/story/quests';
import { DB } from '@content/index';
import { blast } from '@core/sim/systems/bombs';
import { tileFeet } from '@core/world/screen';
import { Harness, frameOf } from './harness';
import { crossTo, finishStory, talkTo, walkTo } from './walk';

/** Through the melted rime, at the gorge's mouth in Niflmýrr (no rolled foes, so the walk is the test). */
function inTheGorge(): Harness {
  const h = new Harness({ preset: DEV_PRESETS.fimbul, screen: 'nif_gorge', tile: [20, 18] });
  h.sim.state.flags.st_rime_open = true;
  return h;
}

describe('Niflmýrr’s south row', () => {
  it('greets Ask once out of the gorge, and the road north moves on', () => {
    const h = inTheGorge();
    h.until((s) => s.mode === 'story', 300, frameOf(['up']));
    finishStory(h);
    expect(h.sim.state.flags.st_niflmyrr_reached).toBe(true);
    const log = questLog(DB.quests, { state: h.sim.state, quests: DB.quests }).find((q) => q.id === 'q_act2');
    expect(log?.text.en).toMatch(/^Niflmýrr/);
    walkTo(h, 20, 16);
    walkTo(h, 20, 12);
    expect(h.sim.mode).toBe('play');
  });

  it('walks west from the gorge over the causeway, through the dead wood and the camp to the shore and the hut', () => {
    const h = inTheGorge();
    h.sim.state.flags.st_niflmyrr_reached = true;
    walkTo(h, 1, 10);
    crossTo(h, 'w', 'nif_causeway');
    walkTo(h, 1, 6);
    crossTo(h, 'w', 'nif_deadwood');
    walkTo(h, 1, 13);
    crossTo(h, 'w', 'nif_camp');
    walkTo(h, 1, 10);
    crossTo(h, 'w', 'nif_shore');
    walkTo(h, 19, 10);
    h.hold(['up'], 60).idle(40);
    expect(h.sim.screen.id).toBe('nif_int_hut');
    h.expectAnims();
  });
});

describe('Niflmýrr’s north row', () => {
  it('goes north from the gorge to Helgrind’s gate, west along the Gjöll past the jars to the cairns and the strand', () => {
    const h = inTheGorge();
    h.sim.state.flags.st_niflmyrr_reached = true;
    walkTo(h, 20, 1);
    crossTo(h, 'n', 'nif_gate');
    walkTo(h, 1, 15);
    crossTo(h, 'w', 'nif_gjoll');
    walkTo(h, 1, 15);
    crossTo(h, 'w', 'nif_jars');
    walkTo(h, 1, 13);
    crossTo(h, 'w', 'nif_cairns');
    walkTo(h, 1, 11);
    crossTo(h, 'w', 'nif_strand');
    expect(h.sim.screen.id).toBe('nif_strand');
  });

  it('comes down from the jars into the dead wood', () => {
    const h = new Harness({ preset: DEV_PRESETS.fimbul, screen: 'nif_jars', tile: [20, 15] });
    walkTo(h, 31, 20);
    crossTo(h, 's', 'nif_deadwood');
    expect(h.sim.screen.id).toBe('nif_deadwood');
  });

  it('opens the cave behind the rockfall at the jars with a bomb', () => {
    const h = new Harness({ preset: DEV_PRESETS.fimbul, screen: 'nif_jars', tile: [23, 14], facing: 'n' });
    h.idle(1);
    h.hold(['up'], 30);
    expect(h.sim.screen.id).toBe('nif_jars');
    blast(h.sim, tileFeet({ x: 23, y: 13 }));
    h.idle(1);
    expect(h.sim.state.world.opened).toContain('nif_k_jars');
    h.hold(['up'], 60).idle(40);
    expect(h.sim.screen.id).toBe('nif_int_cave');
  });
});

describe('the drained camp', () => {
  it('a bled thrall tells why the captives were taken, and that Embla got away; then he is gone', () => {
    const h = new Harness({ preset: DEV_PRESETS.fimbul, screen: 'nif_camp', tile: [16, 12] });
    h.sim.state.flags.st_niflmyrr_reached = true;
    talkTo(h, 'thrall');
    finishStory(h);
    expect(h.sim.state.flags.st_twist_heard).toBe(true);
    expect(h.sim.actors.some((a) => a.def === 'thrall')).toBe(false);
    const log = questLog(DB.quests, { state: h.sim.state, quests: DB.quests }).find((q) => q.id === 'q_act2');
    expect(log?.text.en).toMatch(/captives are being bled/);
  });
});
