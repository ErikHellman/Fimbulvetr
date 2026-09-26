import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import type { NpcDef } from '@core/actors/npc';
import { at, overlaps } from '@core/math/box';
import type { ContentDb } from '@core/sim/db';
import { Harness } from './harness';

const HALVAR: NpcDef = {
  id: 'halvar',
  name: { en: 'Halvar', sv: 'Halvar' },
  art: 'npc_halvar',
  places: [
    { when: { k: 'flag', id: 'st_farm_day', gte: 2 }, screen: 'test_b', at: { x: 5, y: 5 }, facing: 's' },
    { screen: 'test_a', at: { x: 12, y: 8 }, facing: 's' },
  ],
};

const EMBLA: NpcDef = {
  id: 'embla',
  name: { en: 'Embla', sv: 'Embla' },
  art: 'npc_embla',
  places: [
    {
      screen: 'test_a',
      at: { x: 6, y: 16 },
      facing: 'e',
      patrol: [
        { x: 6, y: 16 },
        { x: 10, y: 16 },
      ],
    },
  ],
};

function npcDb(): ContentDb {
  return {
    ...DB,
    screens: { ...DB.screens, test_a: { ...DB.screens.test_a, things: [] } },
    npcs: { halvar: HALVAR, embla: EMBLA },
    dialogue: {
      halvar: {
        entry: [{ node: 'a' }],
        nodes: {
          a: { text: { en: 'Up already?', sv: 'Redan vaken?' }, next: 'b' },
          b: {
            who: 'ask',
            text: { en: '…', sv: '…' },
            do: [{ k: 'set', flag: 'st_farm_day', value: 2 }],
          },
        },
      },
    },
  };
}

const npc = (h: Harness, id: string) => h.sim.actors.find((a) => a.kind === 'npc' && a.def === id);

describe('NPCs', () => {
  it('stand where their first matching place says', () => {
    const h = new Harness({ db: npcDb(), tile: [12, 11] });
    expect(npc(h, 'halvar')?.pos).toEqual({ x: 12 * 16 + 8, y: 8 * 16 + 14 });
    expect(npc(h, 'embla')).toBeDefined();
  });

  it('turn to the hero and talk; the conversation can send them elsewhere', () => {
    const h = new Harness({ db: npcDb(), tile: [12, 10], facing: 'n' });
    h.hold(['up'], 20);
    h.press(['interact']);
    expect(h.sim.mode).toBe('story');
    expect(npc(h, 'halvar')?.facing).toBe('s');
    h.idle(40);
    expect(h.sim.storyUi()).toMatchObject({ who: 'halvar', shown: 1 });
    h.press(['confirm']).idle(30);
    expect(h.sim.storyUi()).toMatchObject({ who: 'ask' });
    h.press(['confirm']);
    expect(h.sim.mode).toBe('play');
    expect(npc(h, 'halvar')).toBeUndefined();
  });

  it('block the hero', () => {
    const h = new Harness({ db: npcDb(), tile: [12, 11], facing: 'n' });
    h.hold(['up'], 90);
    const halvar = npc(h, 'halvar');
    if (halvar === undefined) throw new Error('no halvar');
    expect(overlaps(at(h.sim.hero.body, h.sim.hero.pos), at(halvar.body, halvar.pos))).toBe(false);
    expect(h.sim.hero.pos.y).toBeGreaterThan(halvar.pos.y);
  });

  it('walk their patrol, pausing at each point', () => {
    const h = new Harness({ db: npcDb(), tile: [20, 11] });
    const x0 = npc(h, 'embla')?.pos.x ?? 0;
    h.idle(30);
    expect(npc(h, 'embla')?.pos.x).toBe(x0);
    h.idle(100);
    expect(npc(h, 'embla')?.pos.x).toBeGreaterThan(x0);
    h.until((s) => s.actors.find((a) => a.def === 'embla')?.pos.x === 10 * 16 + 8, 200);
    h.idle(30);
    expect(npc(h, 'embla')?.pos.x).toBe(10 * 16 + 8);
    expect(npc(h, 'embla')?.anim).toBe('idle');
  });
});
