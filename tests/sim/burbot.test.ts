import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { DEV_PRESETS } from '@content/dev/presets';
import type { Season } from '@core/clock/types';
import type { StoryUi } from '@core/sim/systems/story';
import { questLog } from '@core/story/quests';
import { tileFeet } from '@core/world/screen';
import { Harness } from './harness';
import { finishStory, interactNorth, talkTo } from './walk';

const quest = (h: Harness) =>
  questLog(DB.quests, { state: h.sim.state, quests: DB.quests }).find((q) => q.id === 'q_burbot');

type Fishing = Extract<NonNullable<StoryUi>, { k: 'fish' }>;
const ui = (h: Harness): Fishing | null => {
  const u = h.sim.storyUi();
  return u?.k === 'fish' ? u : null;
};

function atJetty(h: Harness): Harness {
  const p = tileFeet({ x: 28, y: 11 });
  h.sim.command({ t: 'warp', screen: 'upp_smiths', x: p.x, y: p.y });
  return h.idle(2);
}

/** After the pass in `season` at `minute`, Eyvindr has asked (or not). */
function setUp(season: Season, minute: number, asked = true): Harness {
  const h = new Harness({ preset: DEV_PRESETS.fimbul, season, minute });
  Object.assign(h.sim.state.flags, { st_home_winter: true, n_eyvindr_met: true, q_burbot_asked: asked });
  return atJetty(h);
}

/** Fishes the ice hole off the jetty's end until a burbot is landed, or gives up; the rod is put down. */
function fishForBurbot(h: Harness): void {
  interactNorth(h, 30, 10);
  h.idle(1);
  for (let i = 0; i < 60_000 && h.sim.state.flags.q_burbot_caught !== true; i++) {
    const f = ui(h);
    if (f === null) break;
    if (f.phase === 'idle' || f.phase === 'bite' || (f.phase === 'result' && f.result !== null))
      h.press(['confirm']);
    else if (f.phase === 'reel' && f.tension < 700 && !f.surging) h.hold(['confirm'], 1);
    else h.idle(1);
  }
  while (h.sim.mode === 'story') {
    if (ui(h)?.phase === 'idle') h.press(['cancel']).idle(1);
    else if (ui(h) === null) finishStory(h);
    else h.idle(1);
  }
}

describe('Eyvindr’s burbot (q_burbot)', () => {
  it('is asked for on the jetty once the pass is open', () => {
    const h = setUp('winter', 12 * 60, false);
    talkTo(h, 'eyvindr');
    expect(h.sim.state.flags.q_burbot_asked).toBe(true);
    expect(quest(h)?.done).toBe(false);
  });

  it('lands a burbot through the ice on a winter night', () => {
    const h = setUp('winter', 22 * 60);
    fishForBurbot(h);
    expect(h.sim.state.flags.q_burbot_caught).toBe(true);
  });

  it('has no hole to fish but in winter', () => {
    const h = setUp('summer', 22 * 60);
    interactNorth(h, 30, 10).idle(1);
    expect(h.sim.mode).toBe('story');
    expect(ui(h)).toBeNull();
    finishStory(h);
  });

  it('earns a piece of heart', () => {
    const h = setUp('winter', 12 * 60);
    h.sim.state.flags.q_burbot_caught = true;
    talkTo(h, 'eyvindr');
    expect(h.sim.state.flags.q_burbot_done).toBe(true);
    expect(h.sim.state.world.pieces).toContain('hp_upp_bay');
    expect(quest(h)?.done).toBe(true);
  });
});
