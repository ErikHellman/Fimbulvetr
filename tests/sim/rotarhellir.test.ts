import { describe, expect, it } from 'vitest';
import { DEV_PRESETS } from '@content/dev/presets';
import { condCtx } from '@core/sim/systems/story';
import { dungeonOf } from '@core/state/dungeons';
import { questLog } from '@core/story/quests';
import { Harness } from './harness';
import { crossTo, finishStory, interactNorth, walkTo } from './walk';

describe('Rótarhellir', () => {
  it('opens under the roots: through the cave mouth, a first word, and the way back out', () => {
    const h = new Harness({ preset: DEV_PRESETS.myr });
    h.sim.command({ t: 'warp', screen: 'myr_roots', x: 19 * 16 + 8, y: 5 * 16 + 14 });
    h.idle(1);
    walkTo(h, 19, 3);
    crossTo(h, 'n', 'd1_r01');
    h.until((s) => s.mode === 'story', 60);
    finishStory(h);
    expect(h.sim.state.flags.st_d1_entered).toBe(true);
    expect(h.sim.weather()).toBe('clear');
    const minute = h.sim.state.clock.minute;
    h.idle(600);
    expect(h.sim.state.clock.minute).toBe(minute);
    crossTo(h, 's', 'myr_roots');
    expect(h.sim.hero.facing).toBe('s');
    h.expectAnims();
  });

  it('slides from room to room on its own grid', () => {
    const h = new Harness({ preset: DEV_PRESETS.d1 });
    h.sim.command({ t: 'god', on: true });
    walkTo(h, 19, 2);
    crossTo(h, 'n', 'd1_r04');
    walkTo(h, 37, 10);
    crossTo(h, 'e', 'd1_r06');
    expect(h.sim.screen.neighbours).toMatchObject({ s: 'd1_r03', w: 'd1_r04', n: 'd1_r08' });
    h.expectAnims();
  });

  it('bars the lair with lock A until a key is spent, then it stands open from both sides', () => {
    const h = new Harness({ preset: DEV_PRESETS.d1 });
    walkTo(h, 19, 2);
    crossTo(h, 'n', 'd1_r04');
    walkTo(h, 19, 1);
    h.hold(['up'], 30);
    expect(h.sim.screen.id).toBe('d1_r04');
    dungeonOf(h.sim.state, 'd1').keys = 1;
    h.hold(['up'], 5);
    crossTo(h, 'n', 'd1_r11');
    expect(dungeonOf(h.sim.state, 'd1')).toMatchObject({ keys: 0, doors: ['d1_lock_a'] });
    expect(h.sim.actors.filter((a) => a.def === 'lock').every((a) => a.anim === 'open')).toBe(true);
    // The far side of the boomerang shutter stays shut from here.
    expect(
      h.sim.actors.filter((a) => a.def === 'shutter' && a.mem['tx'] === 0).every((a) => a.anim === 'closed'),
    ).toBe(true);
    h.expectAnims();
  });

  it('ends at the runestone once Rótvættr is dead: it burns, Kolbeinn feels it, and Ask walks out', () => {
    const h = new Harness({ preset: DEV_PRESETS.d1boss });
    h.sim.state.flags.st_d1_boss_dead = true;
    dungeonOf(h.sim.state, 'd1').bossDead = true;
    h.sim.command({ t: 'warp', screen: 'd1_r12', x: 20 * 16 + 8, y: 12 * 16 + 14 });
    h.idle(1);
    expect(h.sim.enemies).toHaveLength(0);
    const heart = h.sim.actors.find((a) => a.def === 'heart_container');
    expect(heart && (heart.mem['hidden'] ?? 0)).toBe(0);
    const max = h.sim.hero.maxHp;
    h.until((s) => s.mode === 'story', 200, h.frame(['up']));
    finishStory(h);
    expect(h.sim.hero.maxHp).toBe(max + 4);
    interactNorth(h, 20, 2);
    expect(h.sim.mode).toBe('story');
    const cards: string[] = [];
    for (let i = 0; i < 2000 && h.sim.mode !== 'play'; i++) {
      const ui = h.sim.storyUi();
      if (ui?.k === 'card' && !cards.includes(ui.text.en)) cards.push(ui.text.en);
      h.step(h.frame([])).step(h.frame([]));
      if (ui !== null && (ui.k === 'text' || ui.k === 'card') && ui.shown >= 1) h.press(['confirm']);
    }
    expect(h.sim.mode).toBe('play');
    expect(h.sim.state.flags.st_stone1_lit).toBe(true);
    expect(h.sim.screen.id).toBe('myr_roots');
    expect(cards.at(-1)).toBe('To be continued.');
    const q = questLog(h.sim.db.quests, condCtx(h.sim)).find((e) => e.id === 'q_runestone_1');
    expect(q).toMatchObject({
      done: true,
      text: { en: 'The first runestone burns again. Two remain dark.' },
    });
    h.expectAnims();
  });
});
