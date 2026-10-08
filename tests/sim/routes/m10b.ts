import type { Entity } from '@core/actors/entity';
import type { Action } from '@core/input/actions';
import type { Dir4 } from '@core/math/dir';
import type { GameState } from '@core/state/gameState';
import { TILE } from '@core/world/dims';
import { Harness, frameOf } from '../harness';
import { crossTo, finishStory, talkTo, walkTo } from '../walk';
import { alive } from './m7b';
import { stepToward, turn } from './m8b';

const KEY: Readonly<Record<Dir4, Action>> = { n: 'up', s: 'down', e: 'right', w: 'left' };

const foe = (h: Harness, id: string): Entity | undefined => h.sim.enemies.find((e) => e.def === id);
const px = (t: number): number => t * TILE + TILE / 2;
const feet = (t: number): number => t * TILE + TILE - 2;

/**
 * Hrímnir: Ask keeps to the middle of the binding, a little below him. His hand's sweep is met with the
 * sword as it comes; his breath is sent back off the mirror; a pillar's shadow is stepped out of; and while
 * his heart-rune is bared, the sword from just below him.
 */
function hrimnir(h: Harness): void {
  const log: string[] = [];
  const home = { x: px(20), y: feet(11) };
  let side = 0;
  for (let spent = 0; spent < 40000; spent++) {
    const k = foe(h, 'hrimnir');
    if (k === undefined) return;
    if (k.fsm.t === 0)
      log.push(
        `${String(h.sim.tick)} ${k.fsm.s} hp ${String(k.hp)} ask ${String(h.sim.hero.hp)} ring ${String(Math.round(h.sim.ring()?.r ?? 0))}`,
      );
    if (h.sim.mode === 'over') throw new Error(`Ask fell to Hrímnir\n${log.join('\n')}`);
    if (h.sim.mode !== 'play') {
      h.idle(1);
      continue;
    }
    const hs = h.sim.hero.fsm.s;
    const me = h.sim.hero.pos;
    const spot = { x: home.x + side, y: home.y };
    // A pillar's shadow under Ask: aside, the other way from the last time.
    const pillar = h.sim.enemies.find(
      (e) =>
        e.def === 'rime_pillar' &&
        e.fsm.s === 'shadow' &&
        Math.abs(e.pos.x - me.x) < 24 &&
        Math.abs(e.pos.y - me.y) < 24,
    );
    if (pillar !== undefined) {
      if (hs === 'mirror') {
        h.step(frameOf([]));
        continue;
      }
      side = side > 0 ? -40 : 40;
      stepToward(h, home.x + side, home.y, 2);
      continue;
    }
    if (k.fsm.s === 'open') {
      if (hs === 'mirror') {
        h.step(frameOf([]));
        continue;
      }
      if (hs !== 'move' && hs !== 'attack') {
        h.idle(1);
        continue;
      }
      if (!stepToward(h, k.pos.x, k.pos.y + 22, 2)) continue;
      turn(h, 'n');
      h.step(frameOf([], ['sword']));
      continue;
    }
    if (
      k.fsm.s === 'inhale' ||
      k.fsm.s === 'breathe' ||
      h.sim.actors.some((a) => a.kind === 'projectile' && a.def === 'bolt')
    ) {
      // In line under him, the mirror up.
      if (hs !== 'mirror' && !stepToward(h, k.pos.x, home.y, 2)) continue;
      h.step(frameOf(['item1', KEY.n], hs === 'mirror' ? [] : ['item1']));
      continue;
    }
    if (hs === 'mirror') {
      h.step(frameOf([]));
      continue;
    }
    if (hs !== 'move' && hs !== 'attack') {
      h.idle(1);
      continue;
    }
    const hand = foe(h, 'hrimnir_hand');
    if (hand !== undefined && hand.fsm.s !== 'struck') {
      // Hold the row it was sent along, face it, and swing as it arrives.
      const from: Dir4 = (hand.mem['dx'] ?? 1) > 0 ? 'w' : 'e';
      if (h.sim.hero.facing !== from) {
        h.step(frameOf([KEY[from]], [KEY[from]]));
        continue;
      }
      const gap = Math.abs(hand.pos.x - me.x);
      if (hand.fsm.s === 'sweep' && gap < 34) h.step(frameOf([], ['sword']));
      else h.idle(1);
      continue;
    }
    // Back to the middle of the binding.
    stepToward(h, spot.x, spot.y, 2);
  }
  throw new Error(`Hrímnir still stands\n${log.slice(-60).join('\n')}`);
}

/**
 * M10b: from Kolbeinn's hall (the M10a save) west into the binding hall: Embla takes the binding in hand;
 * Hrímnir, his hand, his breath and his pillars; the ending (the thaw, the valley, the farm, Kolbeinn's end,
 * and Embla on the shore: Ask stays); the final credits; and spring at the farm, with Embla there.
 */
export function playM10b(from: GameState): Harness {
  const h = new Harness({ state: from });
  h.idle(2);
  h.sim.command({ t: 'equip', slot: 0, item: 'mirror' });
  h.sim.command({ t: 'equip', slot: 1, item: 'bombs' });
  h.idle(1);

  // West through the open rime into the binding hall: Embla comes in behind.
  walkTo(h, 2, 10);
  crossTo(h, 'w', 'd8_r12', 300);
  h.until((s) => s.mode === 'story', 200, frameOf(['left']));
  finishStory(h);
  walkTo(h, 20, 11);
  hrimnir(h);
  // The ending runs at once: first choice at the shore (Ask stays).
  for (let i = 0; i < 600 && h.sim.mode !== 'story'; i++) h.idle(1);
  finishStory(h, 20000);
  talkTo(h, 'embla');
  alive(h);
  return h;
}
