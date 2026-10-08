import { describe, expect, it } from 'vitest';
import { unknownChars } from '@art/font';
import { DB } from '@content/index';
import { NEW_GAME } from '@content/start';
import { newGame } from '@core/state/gameState';
import { makeSave } from '@core/state/save';
import { summarize } from '@shell/platform/saveStore';
import { summaryLine } from '@shell/ui/slotText';

describe('slot summary line', () => {
  const fresh = summarize(makeSave(newGame(1, NEW_GAME), 'test', 'x'));

  it('says nothing of the ending for a game in progress, or a summary stored before M11b', () => {
    expect(fresh.done).toBe(false);
    expect(summaryLine(fresh, DB, 'en')).not.toContain('ᛟ');
    const { done: _, ...old } = fresh;
    expect(summaryLine(old, DB, 'en')).toMatch(/^Day 1/);
  });

  it('puts the othala rune before a finished game', () => {
    const state = newGame(1, NEW_GAME);
    const done = summarize(
      makeSave({ ...state, flags: { ...state.flags, st_game_done: true } }, 'test', 'x'),
    );
    expect(done.done).toBe(true);
    expect(summaryLine(done, DB, 'en')).toMatch(/^ᛟ Day 1/);
    expect(unknownChars('ᛟ')).toEqual([]);
  });
});
