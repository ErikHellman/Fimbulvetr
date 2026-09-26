import { describe, expect, it } from 'vitest';
import { DUNGEONS } from '@content/ids';
import { NEW_GAME, TEST_START } from '@content/start';
import { newGame } from '@core/state/gameState';

describe('newGame', () => {
  it('is plain JSON', () => {
    const s = newGame(7, NEW_GAME);
    expect(JSON.parse(JSON.stringify(s))).toEqual(s);
  });

  it('starts at the configured place with three hearts (quarter-heart units)', () => {
    const s = newGame(7, NEW_GAME);
    expect(s.hero).toMatchObject({
      screen: NEW_GAME.screen,
      x: NEW_GAME.x,
      y: NEW_GAME.y,
      hp: 12,
      maxHp: 12,
    });
  });

  it('has a record for every dungeon', () => {
    expect(Object.keys(newGame(7, NEW_GAME).dungeons).sort()).toEqual([...DUNGEONS].sort());
  });

  it('starts the prologue at dawn on day 1, the clock held in summer', () => {
    const s = newGame(7, NEW_GAME);
    expect(s.clock).toMatchObject({ season: 'summer', policy: 'held', day: 1, minute: 360 });
    expect(s.flags).toEqual({ st_farm_day: 1 });
    expect(s.inv).toMatchObject({ weapon: 'handaxe', shield: false });
  });

  it('starts at 08:00 with no flags when the kit does not say otherwise', () => {
    const s = newGame(7, TEST_START);
    expect(s.clock.minute).toBe(480);
    expect(s.flags).toEqual({});
  });

  it('seeds the rng from the seed', () => {
    expect(newGame(7, NEW_GAME).rng).toEqual({ s: 7 });
  });
});
