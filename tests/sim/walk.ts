import type { EnemyId, NpcId } from '@content/ids';
import type { ScreenId } from '@content/world/screens';
import type { Action } from '@core/input/actions';
import type { Dir4 } from '@core/math/dir';
import type { Sim } from '@core/sim/sim';
import { SCREEN_COLS, SCREEN_ROWS, TILE } from '@core/world/dims';
import { SOLID } from '@core/world/collision';
import { tileFeet } from '@core/world/screen';
import { Harness, frameOf } from './harness';

/** Headless "autopilot" helpers for route tests: walk by BFS over tiles, talk, use, lift and throw. */

const KEY: Readonly<Record<Dir4, Action>> = { n: 'up', s: 'down', e: 'right', w: 'left' };

export const heroTile = (sim: Sim): readonly [number, number] => [
  Math.floor(sim.hero.pos.x / TILE),
  Math.floor((sim.hero.pos.y - 1) / TILE),
];

/** Tiles that block walking: solid terrain, anything solid standing on the tile, and burning tiles. */
function blocked(sim: Sim): (tx: number, ty: number) => boolean {
  const g = sim.screen.collision;
  const occupied = new Set<string>();
  for (const a of sim.actors)
    if (a.kind === 'fixture' && a.def === 'fire' && a.mem['on'] === 1)
      occupied.add(`${String(a.mem['tx'])},${String(a.mem['ty'])}`);
  for (const a of sim.actors) {
    const solidActor =
      a.kind === 'npc' ||
      (a.kind === 'prop' && (a.mem['carried'] ?? 0) === 0) ||
      (a.kind === 'enemy' && sim.db.enemies[a.def as EnemyId].solid);
    if (solidActor)
      occupied.add(`${String(Math.floor(a.pos.x / TILE))},${String(Math.floor((a.pos.y - 1) / TILE))}`);
  }
  return (tx, ty) => {
    if (tx < 0 || ty < 0 || tx >= SCREEN_COLS || ty >= SCREEN_ROWS) return true;
    if (((g.flags[ty * g.cols + tx] ?? 0) & SOLID) !== 0) return true;
    return occupied.has(`${String(tx)},${String(ty)}`);
  };
}

function path(
  sim: Sim,
  from: readonly [number, number],
  to: readonly [number, number],
): [number, number][] | null {
  const isBlocked = blocked(sim);
  const key = (x: number, y: number): number => y * SCREEN_COLS + x;
  const prev = new Map<number, number>();
  const start = key(from[0], from[1]);
  const goal = key(to[0], to[1]);
  prev.set(start, -1);
  const queue = [start];
  while (queue.length > 0) {
    const cur = queue.shift() ?? 0;
    if (cur === goal) break;
    const cx = cur % SCREEN_COLS;
    const cy = Math.floor(cur / SCREEN_COLS);
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const nx = cx + dx;
      const ny = cy + dy;
      const k = key(nx, ny);
      if (prev.has(k)) continue;
      if (k !== goal && isBlocked(nx, ny)) continue;
      if (nx < 0 || ny < 0 || nx >= SCREEN_COLS || ny >= SCREEN_ROWS) continue;
      prev.set(k, cur);
      queue.push(k);
    }
  }
  if (!prev.has(goal)) return null;
  const out: [number, number][] = [];
  for (let k = goal; k !== start; k = prev.get(k) ?? start)
    out.unshift([k % SCREEN_COLS, Math.floor(k / SCREEN_COLS)]);
  return out;
}

/** Steers one tick toward a feet point; returns true once there (within a pixel on both axes). */
function steer(h: Harness, x: number, y: number, extra: readonly Action[] = []): boolean {
  const p = h.sim.hero.pos;
  const dx = x - p.x;
  const dy = y - p.y;
  if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) return true;
  const held: Action[] = [...extra];
  if (Math.abs(dx) > 1) held.push(dx > 0 ? 'right' : 'left');
  else held.push(dy > 0 ? 'down' : 'up');
  h.step(frameOf(held));
  return false;
}

/**
 * Walks to a tile on the current screen, re-planning as NPCs and sheep move. `extra` actions are held all
 * the way (the shield, to walk shield-first without turning).
 */
export function walkTo(
  h: Harness,
  tx: number,
  ty: number,
  budget = 2400,
  extra: readonly Action[] = [],
): Harness {
  for (let spent = 0; spent < budget;) {
    if (h.sim.mode !== 'play') {
      h.idle(1);
      spent++;
      continue;
    }
    const here = heroTile(h.sim);
    if (here[0] === tx && here[1] === ty) {
      const f = tileFeet({ x: tx, y: ty });
      for (let i = 0; i < 40 && !steer(h, f.x, f.y, extra); i++) spent++;
      return h;
    }
    const route = path(h.sim, here, [tx, ty]);
    if (route === null)
      throw new Error(`no path on ${h.sim.screen.id} from ${here.join(',')} to ${String(tx)},${String(ty)}`);
    const next = route[0];
    if (next === undefined) return h;
    const f = tileFeet({ x: next[0], y: next[1] });
    for (let i = 0; i < 24 && !steer(h, f.x, f.y, extra); i++) spent++;
    spent++;
  }
  throw new Error(
    `could not reach ${String(tx)},${String(ty)} on ${h.sim.screen.id} (at ${heroTile(h.sim).join(',')})`,
  );
}

/** Turns to face a direction without moving (a one-tick nudge, then settles). */
export function face(h: Harness, dir: Dir4): Harness {
  h.step(frameOf([KEY[dir]], [KEY[dir]]));
  return h.idle(2);
}

/** Holds a direction until the hero arrives in play on `screen` (edges and doors alike). */
export function crossTo(h: Harness, dir: Dir4, screen: ScreenId, budget = 600): Harness {
  return h.until((s) => s.screen.id === screen && s.mode === 'play', budget, frameOf([KEY[dir]]));
}

/** Presses confirm until the running script ends, taking the first choice at every prompt and leaving shops. */
export function finishStory(h: Harness, budget = 4000): Harness {
  for (let i = 0; i < budget && h.sim.mode !== 'play'; i += 4) {
    const key = h.sim.storyUi()?.k === 'shop' ? 'cancel' : 'confirm';
    h.step(frameOf([], [key])).idle(3);
  }
  if (h.sim.mode !== 'play') throw new Error('the story did not end');
  return h;
}

/** Reads on until a shop opens, buys the row at `row` once, then leaves. */
export function buyInShop(h: Harness, row: number): Harness {
  for (let i = 0; i < 400 && h.sim.storyUi()?.k !== 'shop'; i += 4) h.step(frameOf([], ['confirm'])).idle(3);
  for (let i = 0; i < row; i++) h.press(['down']);
  h.press(['confirm']);
  return finishStory(h);
}

/** Walks up to an NPC (standing below it), talks and reads to the end. */
export function talkTo(h: Harness, npc: NpcId): Harness {
  const who = h.sim.actors.find((a) => a.kind === 'npc' && a.def === npc);
  if (who === undefined) throw new Error(`${npc} is not on ${h.sim.screen.id}`);
  const tx = Math.floor(who.pos.x / TILE);
  const ty = Math.floor((who.pos.y - 1) / TILE);
  walkTo(h, tx, ty + 1);
  face(h, 'n');
  h.step(frameOf([], ['interact']));
  if (h.sim.mode !== 'story') throw new Error(`could not talk to ${npc}`);
  return finishStory(h);
}

/** Interacts with the tile north of the hero. */
export function interactNorth(h: Harness, tx: number, ty: number): Harness {
  walkTo(h, tx, ty + 1);
  face(h, 'n');
  return h.step(frameOf([], ['interact']));
}

/** States in which a foe cannot be hurt (rising, buried, sinking): nothing to fight yet. */
const UNTOUCHABLE = new Set(['rise', 'buried', 'retract', 'circle', 'fade']);

/**
 * The nearest live enemy worth fighting and its distance in px, or null. Raid trolls and whole shells
 * (armoured), the immortal (bulbs, spikes) and bosses (fought by hand) are left alone.
 */
function nearestFoe(sim: Sim): { e: Sim['actors'][number]; d: number } | null {
  let best: { e: Sim['actors'][number]; d: number } | null = null;
  for (const e of sim.actors) {
    if (e.kind !== 'enemy') continue;
    const def = sim.db.enemies[e.def as EnemyId];
    // Water-worms are left in their pools: the walker passes them by. Armour is left alone until a bomb
    // has cracked it (a mud-crab's shell).
    const armoured = def.guard === true && e.mem['cracked'] !== 1;
    if (armoured || def.immortal || def.boss !== undefined || def.swims === true) continue;
    if (UNTOUCHABLE.has(e.fsm.s)) continue;
    const d = Math.sqrt((e.pos.x - sim.hero.pos.x) ** 2 + (e.pos.y - sim.hero.pos.y) ** 2);
    if (best === null || d < best.d) best = { e, d };
  }
  return best;
}

/**
 * Fights whatever comes within `radius` px: turns to it, steps in to sword reach and swings, backing off
 * while it winds up a blow. Returns once nothing is near. Deterministic like everything else.
 */
export function fightNear(h: Harness, radius = 56, budget = 1500): Harness {
  for (let spent = 0; spent < budget; spent++) {
    if (h.sim.mode !== 'play') return h;
    const foe = nearestFoe(h.sim);
    if (foe === null || foe.d > radius) return h;
    const dx = foe.e.pos.x - h.sim.hero.pos.x;
    const dy = foe.e.pos.y - h.sim.hero.pos.y;
    const dir: Action = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
    const away: Action = { right: 'left', left: 'right', down: 'up', up: 'down' }[dir] as Action;
    const s = h.sim.hero.fsm.s;
    if (s !== 'move') {
      h.idle(1);
      continue;
    }
    if (foe.e.anim === 'tell' && foe.d < 40) {
      h.step(frameOf([away]));
      continue;
    }
    const want = Math.abs(dx) > Math.abs(dy) ? Math.abs(dx) : Math.abs(dy);
    const side = Math.abs(dx) > Math.abs(dy) ? Math.abs(dy) : Math.abs(dx);
    if (want > 22 || side > 10) {
      const held: Action[] = [dir];
      if (side > 10)
        held.push(Math.abs(dx) > Math.abs(dy) ? (dy > 0 ? 'down' : 'up') : dx > 0 ? 'right' : 'left');
      h.step(frameOf(held));
      continue;
    }
    h.step(frameOf([dir], [dir]));
    h.step(frameOf([], ['sword']));
  }
  return h;
}

/**
 * Walks to a tile, stopping to fight anything that comes close on the way. `wary` looks around every
 * few steps instead of every few seconds (for foes that rise out of the ground).
 */
export function walkFighting(h: Harness, tx: number, ty: number, budget = 4000, wary = false): Harness {
  const leg = wary ? 16 : 240;
  for (let round = 0; round < (wary ? 400 : 40); round++) {
    fightNear(h);
    try {
      return walkTo(h, tx, ty, Math.min(budget, leg));
    } catch (e) {
      if (!(e instanceof Error) || !e.message.startsWith('could not reach')) throw e;
    }
  }
  return walkTo(h, tx, ty, budget);
}

/** Holds a direction until on `screen`, fighting first if something is close. */
export function crossFighting(h: Harness, dir: Dir4, screen: ScreenId): Harness {
  fightNear(h);
  return crossTo(h, dir, screen);
}

/**
 * Duels a shielded foe (a barrow-wight) as Styrr teaches: close in and wait for its tell, raise the
 * shield just as the blade comes (a parry, with the lesson; a plain block without), then strike while it
 * stands open (stunned, or its blade still out). Returns once it is dead, or after `budget` ticks.
 */
export function duel(h: Harness, foe: Sim['actors'][number], budget = 2400): Harness {
  for (let spent = 0; spent < budget; spent++) {
    if (!h.sim.actors.includes(foe) || h.sim.mode !== 'play') return h;
    const dx = foe.pos.x - h.sim.hero.pos.x;
    const dy = foe.pos.y - h.sim.hero.pos.y;
    const horizontal = Math.abs(dx) > Math.abs(dy);
    const toward: Action = horizontal ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
    const side: Action = horizontal ? (dy > 0 ? 'down' : 'up') : dx > 0 ? 'right' : 'left';
    const along = Math.max(Math.abs(dx), Math.abs(dy));
    const across = Math.min(Math.abs(dx), Math.abs(dy));
    const s = h.sim.hero.fsm.s;
    const open = (foe.mem['stun'] ?? 0) > 0 || foe.mem['open'] === 1;
    if (foe.fsm.s === 'tell' && foe.fsm.t >= 20) {
      // The blade is about to fall: shield up facing it, held through the cut.
      if (s === 'move') h.step(frameOf([toward], [toward]));
      for (let i = 0; i < 14 && h.sim.actors.includes(foe); i++) h.step(frameOf(['shield']));
      h.step(frameOf([], [], ['shield']));
      continue;
    }
    if (s !== 'move') {
      h.step(frameOf([]));
      continue;
    }
    if (open && along <= 22 && across <= 10) {
      h.step(frameOf([toward], [toward]));
      h.step(frameOf([], ['sword']));
      continue;
    }
    if (along > (open ? 20 : 24) || across > 8) {
      const held: Action[] = [];
      if (along > (open ? 20 : 24)) held.push(toward);
      if (across > 8) held.push(side);
      h.step(frameOf(held));
      continue;
    }
    // Close and square on: face it and wait for its move.
    if (h.sim.hero.facing !== ({ right: 'e', left: 'w', down: 's', up: 'n' } as const)[toward])
      h.step(frameOf([toward], [toward]));
    else h.step(frameOf([]));
  }
  return h;
}

/**
 * Herds the tagged sheep not yet penned into a pen around `goal` (px): picks the free sheep nearest the
 * goal, circles round behind it and walks it in. Stops when `done` holds or the budget runs out.
 */
export function herdInto(
  h: Harness,
  goal: { x: number; y: number },
  done: () => boolean,
  budget = 6000,
): Harness {
  type V = { x: number; y: number };
  const unit = (v: V): V => {
    const l = Math.sqrt(v.x * v.x + v.y * v.y);
    return l === 0 ? { x: 0, y: 0 } : { x: v.x / l, y: v.y / l };
  };
  const hold = (d: V): Action[] => {
    const keys: Action[] = [];
    if (d.x < -0.38) keys.push('left');
    if (d.x > 0.38) keys.push('right');
    if (d.y < -0.38) keys.push('up');
    if (d.y > 0.38) keys.push('down');
    return keys;
  };
  for (let tick = 0; tick < budget && !done() && h.sim.mode === 'play'; tick++) {
    const hero = h.sim.hero.pos;
    const d2 = (p: V): number => (p.x - goal.x) ** 2 + (p.y - goal.y) ** 2;
    const sheep = h.sim.actors
      .filter((a) => a.kind === 'critter' && a.mem['tag'] !== undefined && (a.mem['penned'] ?? 0) === 0)
      .sort((a, b) => d2(a.pos) - d2(b.pos))[0];
    if (sheep === undefined) break;
    const s = sheep.pos;
    const dir = unit({ x: goal.x - s.x, y: goal.y - s.y });
    const rel = { x: hero.x - s.x, y: hero.y - s.y };
    const along = rel.x * dir.x + rel.y * dir.y;
    const across = rel.x * -dir.y + rel.y * dir.x;
    let move: V;
    if (along < -10 && Math.abs(across) < 12) move = dir;
    else {
      // Behind the sheep, but never off the screen's edge.
      const staging = {
        x: Math.min((SCREEN_COLS - 1.5) * TILE, Math.max(1.5 * TILE, s.x - dir.x * 48)),
        y: Math.min((SCREEN_ROWS - 1) * TILE, Math.max(2 * TILE, s.y - dir.y * 48)),
      };
      const toStaging = { x: staging.x - hero.x, y: staging.y - hero.y };
      const dist = Math.sqrt(rel.x * rel.x + rel.y * rel.y);
      if (dist < 46 && along > -30) {
        // Too close and not behind: step away sideways before circling round.
        const side = across >= 0 ? 1 : -1;
        move = unit({ x: -dir.y * side + rel.x / dist, y: dir.x * side + rel.y / dist });
      } else move = unit(toStaging);
      if (Math.abs(toStaging.x) < 3 && Math.abs(toStaging.y) < 3) move = dir;
    }
    // Never walk out over an edge mid-herd.
    if (hero.y < 2 * TILE && move.y < 0) move = { x: move.x, y: 0.5 };
    if (hero.y > (SCREEN_ROWS - 1) * TILE && move.y > 0) move = { x: move.x, y: -0.5 };
    if (hero.x < 1.5 * TILE && move.x < 0) move = { x: 0.5, y: move.y };
    if (hero.x > (SCREEN_COLS - 1.5) * TILE && move.x > 0) move = { x: -0.5, y: move.y };
    h.step(frameOf(hold(move)));
  }
  return h;
}
