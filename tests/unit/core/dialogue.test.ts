import { describe, expect, it } from 'vitest';
import { TEST_START } from '@content/start';
import { newGame } from '@core/state/gameState';
import type { Effect } from '@core/story/effects';
import {
  openDialogue,
  revealTicks,
  stepDialogue,
  visibleChoices,
  nodeOf,
  type DialogueDef,
  type DialogueEnv,
} from '@core/story/dialogue';
import { frameOf } from '../../sim/harness';

const DEF: DialogueDef = {
  entry: [{ when: { k: 'flag', id: 'q_sheep_d1' }, node: 'thanks' }, { node: 'hello' }],
  nodes: {
    hello: {
      text: { en: 'Morning, lad.', sv: 'God morgon, pojk.' },
      next: 'ask',
      do: [{ k: 'set', flag: 'st_intro_seen', value: true }],
    },
    ask: {
      text: { en: 'Will you pen the sheep?', sv: 'Fållar du fåren?' },
      choices: [
        { text: { en: 'Yes', sv: 'Ja' }, do: [{ k: 'add', flag: 'st_farm_day', n: 1 }] },
        { text: { en: 'Secret', sv: 'Hemlis' }, when: { k: 'item', id: 'lantern' }, next: 'hello' },
        { text: { en: 'Later', sv: 'Sen' }, next: 'hello' },
      ],
    },
    thanks: { text: { en: 'Thanks!', sv: 'Tack!' } },
  },
};

function env(): DialogueEnv & { applied: Effect[] } {
  const applied: Effect[] = [];
  return {
    def: DEF,
    ctx: { state: newGame(1, TEST_START), quests: {} },
    cps: 60,
    applied,
    apply: (effects) => applied.push(...effects),
  };
}

const confirm = frameOf([], ['confirm']);
const down = frameOf([], ['down']);
const none = frameOf([]);

describe('dialogue', () => {
  it('opens at the first entry whose condition holds and applies the node effects', () => {
    const e = env();
    expect(openDialogue('dev_chat', e)?.node).toBe('hello');
    expect(e.applied).toEqual([{ k: 'set', flag: 'st_intro_seen', value: true }]);
    e.ctx.state.flags.q_sheep_d1 = true;
    expect(openDialogue('dev_chat', e)?.node).toBe('thanks');
  });

  it('reveals the text over time; a press first shows all, the next moves on', () => {
    const e = env();
    const run = openDialogue('dev_chat', e);
    if (run === null) throw new Error('no run');
    const full = revealTicks(nodeOf(run, DEF).text, e.cps);
    expect(full).toBe('God morgon, pojk.'.length);
    stepDialogue(run, none, e);
    expect(run.t).toBe(1);
    stepDialogue(run, confirm, e);
    expect(run.t).toBe(full);
    stepDialogue(run, confirm, e);
    expect(run.node).toBe('ask');
    expect(run.t).toBe(0);
  });

  it('filters choices by condition, moves the cursor and applies the chosen effects', () => {
    const e = env();
    const run = openDialogue('dev_chat', e);
    if (run === null) throw new Error('no run');
    run.node = 'ask';
    run.t = 999;
    expect(visibleChoices(nodeOf(run, DEF), e.ctx)).toHaveLength(2);
    stepDialogue(run, down, e);
    expect(run.cursor).toBe(1);
    stepDialogue(run, down, e);
    expect(run.cursor).toBe(0);
    e.applied.length = 0;
    expect(stepDialogue(run, confirm, e)).toBe(false);
    expect(e.applied).toEqual([{ k: 'add', flag: 'st_farm_day', n: 1 }]);
  });

  it('follows a choice to its next node', () => {
    const e = env();
    const run = openDialogue('dev_chat', e);
    if (run === null) throw new Error('no run');
    run.node = 'ask';
    run.t = 999;
    stepDialogue(run, down, e);
    expect(stepDialogue(run, confirm, e)).toBe(true);
    expect(run.node).toBe('hello');
  });

  it('returns null when no entry applies', () => {
    const e = env();
    expect(openDialogue('dev_chat', { ...e, def: { entry: [], nodes: {} } })).toBeNull();
  });
});
