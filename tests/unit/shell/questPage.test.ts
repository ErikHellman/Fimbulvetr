import { describe, expect, it } from 'vitest';
import type { QuestLine } from '@core/story/quests';
import { openMenu, stepMenu, type MenuState } from '@shell/ui/pauseMenu';
import { questCounts, questPage, scrollTop } from '@shell/ui/questPage';
import { frameOf } from '../../sim/harness';
import type { Action } from '@core/input/actions';

const line = (id: QuestLine['id'], done: boolean): QuestLine => ({
  id,
  name: { en: id, sv: id },
  text: { en: '', sv: '' },
  done,
});

const LOG = [
  line('q_chores', true),
  line('q_volva', false),
  line('q_fisher', true),
  line('q_runestone_1', false),
];

describe('the quest page', () => {
  it('shows active or done quests, story chapters before side quests', () => {
    expect(questPage(LOG, 'active').map((q) => q.id)).toEqual(['q_runestone_1', 'q_volva']);
    expect(questPage(LOG, 'done').map((q) => q.id)).toEqual(['q_chores', 'q_fisher']);
    expect(questCounts(LOG)).toEqual({ active: 2, done: 2 });
  });

  it('scrolls to keep the cursor in view', () => {
    expect(scrollTop(0, 30, 10)).toBe(0);
    expect(scrollTop(12, 30, 10)).toBe(7);
    expect(scrollTop(29, 30, 10)).toBe(20);
    expect(scrollTop(3, 4, 10)).toBe(0);
  });

  it('moves through the quests with up and down, and E switches active and done', () => {
    const step = (st: MenuState, a: Action, n = 3) => stepMenu(st, frameOf([], [a]), [], n).state;
    const open = openMenu('quests');
    expect(open.filter).toBe('active');
    expect(step(open, 'down')?.cursor).toBe(1);
    expect(step(open, 'up')?.cursor).toBe(2);
    const done = step({ ...open, cursor: 2 }, 'interact');
    expect(done).toMatchObject({ tab: 'quests', filter: 'done', cursor: 0 });
    if (done === null) throw new Error('the menu closed');
    expect(step(done, 'confirm')?.filter).toBe('active');
    expect(step(open, 'right')?.tab).toBe('system');
  });
});
