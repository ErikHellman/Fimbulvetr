import { describe, expect, it } from 'vitest';
import { DEV_PRESETS } from '@content/dev/presets';
import { questLog } from '@core/story/quests';
import { DB } from '@content/index';
import { Harness, frameOf } from './harness';
import { crossTo, finishStory, walkTo } from './walk';

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
