import { describe, expect, it } from 'vitest';
import { DEV_PRESETS } from '@content/dev/presets';
import type { ScreenId } from '@content/world/screens';
import { HUSCARL } from '@core/actors/enemies/huscarl';
import type { Action } from '@core/input/actions';
import type { Dir4 } from '@core/math/dir';
import { Harness, frameOf } from './harness';
import { crossFighting, crossTo, finishStory, talkTo, walkFighting, walkTo } from './walk';

const FACING: Readonly<Record<string, Dir4>> = { right: 'e', left: 'w', down: 's', up: 'n' };
const BACK: Readonly<Record<string, Action>> = { right: 'left', left: 'right', down: 'up', up: 'down' };

function alive(h: Harness): void {
  expect(h.sim.mode, `fell on ${h.sim.screen.id}`).not.toBe('over');
  h.expectAnims();
}

function leave(h: Harness, tx: number, ty: number, dir: Dir4, to: ScreenId): void {
  walkFighting(h, tx, ty);
  crossFighting(h, dir, to);
  if (h.sim.mode === 'story') finishStory(h);
  alive(h);
}

/**
 * Duels Styrr as he taught: keep off at a roll's length and drive the dash thrust through his shield
 * while he walks in; take his cut on the shield; meet the heavy overhead with a parry and strike him while
 * he stands stunned and open. Returns once he yields (or the duel ends otherwise).
 */
function styrrDuel(h: Harness, budget = 9000): void {
  for (let spent = 0; spent < budget; spent++) {
    const foe = h.sim.enemies.find((e) => e.def === 'styrr_duel');
    if (foe === undefined || h.sim.mode !== 'play') return;
    const dx = foe.pos.x - h.sim.hero.pos.x;
    const dy = foe.pos.y - h.sim.hero.pos.y;
    const horizontal = Math.abs(dx) > Math.abs(dy);
    const toward: Action = horizontal ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
    const side: Action = horizontal ? (dy > 0 ? 'down' : 'up') : dx > 0 ? 'right' : 'left';
    const along = Math.max(Math.abs(dx), Math.abs(dy));
    const across = Math.min(Math.abs(dx), Math.abs(dy));
    const s = h.sim.hero.fsm.s;
    const open = (foe.mem['stun'] ?? 0) > 0 && foe.mem['open'] === 1;
    if (foe.fsm.s === 'wind' && foe.fsm.t >= HUSCARL.windTicks - 4) {
      // The heavy blow is falling: a parry, the shield raised just as it lands.
      for (let i = 0; i < 12; i++) h.step(frameOf(['shield'], i === 0 ? ['shield'] : []));
      h.step(frameOf([], [], ['shield']));
      continue;
    }
    if (foe.fsm.s === 'tell' && foe.fsm.t >= HUSCARL.tellTicks - 6) {
      // His cut: on the shield, facing him.
      if (s === 'move' && h.sim.hero.facing !== FACING[toward]) h.step(frameOf([toward], [toward]));
      for (let i = 0; i < 16; i++) h.step(frameOf(['shield'], i === 0 ? ['shield'] : []));
      h.step(frameOf([], [], ['shield']));
      continue;
    }
    if (s !== 'move') {
      h.step(frameOf([]));
      continue;
    }
    if (open && along <= 24 && across <= 10) {
      if (h.sim.hero.facing !== FACING[toward]) h.step(frameOf([toward], [toward]));
      h.step(frameOf([], ['sword'])).idle(12);
      continue;
    }
    const walking = foe.fsm.s === 'stalk' || foe.fsm.s === 'recover';
    if (walking && across <= 5 && along >= 40 && along <= 54) {
      // The dash thrust: roll at him and strike while still low.
      h.step(frameOf([toward, 'roll'], ['roll']));
      for (let i = 1; i < 5; i++) h.step(frameOf([toward]));
      h.step(frameOf([toward, 'sword'], ['sword'])).idle(14);
      continue;
    }
    const held: Action[] = [];
    if (across > 5) held.push(side);
    if (along < 40) held.push(BACK[toward] ?? toward);
    else if (along > 54) held.push(toward);
    h.step(frameOf(held));
  }
  throw new Error('Styrr still stands');
}

/** From the King's Barrow after M4 to the end of Act I: Styrr's last duel, Bragð, the pass and the credits. */
export function playM5a(seed: number): Harness {
  const h = new Harness({ preset: DEV_PRESETS.haubow, seed });
  h.idle(2);

  // North to the stone circle and east to Styrr's cottage: the challenge, and the duel accepted.
  leave(h, 19, 0, 'n', 'hau_circle');
  leave(h, 39, 11, 'e', 'hau_huscarl');
  walkTo(h, 24, 8);
  crossTo(h, 'n', 'hau_int_styrr');
  talkTo(h, 'styrr');
  expect(h.sim.state.flags.q_duel_asked).toBe(true);
  expect(h.sim.state.flags.ev_duel_on).toBe(true);
  walkTo(h, 19, 14);
  crossTo(h, 's', 'hau_huscarl');

  // The duel in the yard, and the lesson after it.
  styrrDuel(h);
  expect(h.sim.state.flags.q_duel_won).toBe(true);
  h.until((sim) => sim.mode === 'story', 60);
  finishStory(h);
  expect(h.sim.state.inv.galdr).toContain('bragd');
  alive(h);

  // Back to the circle and north up to the pass: three stones lit, and the door opens.
  leave(h, 0, 11, 'w', 'hau_circle');
  leave(h, 19, 0, 'n', 'hau_pass');
  walkTo(h, 20, 8);
  h.until((sim) => sim.mode === 'story', 400, frameOf(['up']));
  let credits = false;
  for (let i = 0; i < 6000 && h.sim.mode !== 'play'; i += 4) {
    if (h.sim.storyUi()?.k === 'credits') credits = true;
    h.step(frameOf([], ['confirm'])).idle(3);
  }
  finishStory(h);
  expect(credits).toBe(true);
  expect(h.sim.state.flags.st_pass_open).toBe(true);
  expect(h.sim.state.clock.season).toBe('winter');
  alive(h);
  return h;
}

describe('M5a route', () => {
  it('wins Styrr’s last duel, learns Bragð, and opens the pass into the Fimbulvetr', () => {
    const h = playM5a(5);
    const c = h.sim.state.clock;
    console.log(
      `M5a route: ${String(h.sim.tick)} ticks (${(h.sim.tick / 3600).toFixed(1)} min of perfect play), day ${String(c.day)} ${String(Math.floor(c.minute / 60))}:${String(c.minute % 60).padStart(2, '0')}, hp ${String(h.sim.hero.hp)}/${String(h.sim.hero.maxHp)}`,
    );
  }, 120_000);

  it('replays identically', () => {
    expect(playM5a(9).sim.hash()).toBe(playM5a(9).sim.hash());
  }, 240_000);
});
