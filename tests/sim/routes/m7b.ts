import type { GameState } from '@core/state/gameState';
import { expect } from 'vitest';
import type { EnemyId, GaldrId } from '@content/ids';
import { TERRAIN } from '@content/terrain';
import { WORLD_LAYOUT } from '@content/world/layout';
import { LEGEND } from '@content/world/legend';
import { SCREENS } from '@content/world/registry';
import { SCREEN_IDS, type ScreenId } from '@content/world/screens';
import type { Entity } from '@core/actors/entity';
import { HRONN } from '@core/actors/enemies/hronn';
import { NYKR } from '@core/actors/enemies/nykr';
import { isNight } from '@core/clock/clock';
import type { Action } from '@core/input/actions';
import type { Dir4 } from '@core/math/dir';
import { dungeonOf } from '@core/state/dungeons';
import { SCREEN_COLS, SCREEN_ROWS, TILE } from '@core/world/dims';
import { indexLayout, neighbourOf } from '@core/world/screen';
import { cellAt, parseTextMap } from '@core/world/textmap';
import { Harness, frameOf } from '../harness';
import { crossTo, face, fightNear, finishStory, heroTile, talkTo, walkFighting, walkTo } from '../walk';

const KEY: Readonly<Record<Dir4, Action>> = { n: 'up', s: 'down', e: 'right', w: 'left' };

function alive(h: Harness): void {
  expect(h.sim.mode, `fell on ${h.sim.screen.id}`).not.toBe('over');
  h.expectAnims();
}

/** Drinks the red mead from the menu's action when health runs low (the walker cannot open menus). */
function drinkIfLow(h: Harness): void {
  if (h.sim.hero.hp <= 12 && (h.sim.state.inv.items.mead_red ?? 0) > 0) {
    h.sim.command({ t: 'eat', item: 'mead_red' });
    h.idle(1);
  }
}

/** Drinks green mead when there is too little seiðr left for a song costing `cost`. */
function topUp(h: Harness, cost: number): void {
  if (h.sim.state.hero.seidr < cost && (h.sim.state.inv.items.mead_green ?? 0) > 0) {
    h.sim.command({ t: 'eat', item: 'mead_green' });
    h.idle(1);
  }
}

/** Picks up the hearts and seiðr jars foes and pots left on the screen. */
function gather(h: Harness): void {
  for (let i = 0; i < 8; i++) {
    const { seidr, maxSeidr } = h.sim.state.hero;
    const want = h.sim.actors.find(
      (a) =>
        a.kind === 'pickup' &&
        ((a.def === 'heart' && h.sim.hero.hp < h.sim.hero.maxHp) || (a.def === 'seidr' && seidr < maxSeidr)),
    );
    if (want === undefined) return;
    try {
      walkTo(h, Math.floor(want.pos.x / 16), Math.floor((want.pos.y - 1) / 16), 600);
    } catch {
      return;
    }
    h.idle(2);
  }
}

function leave(h: Harness, tx: number, ty: number, dir: Dir4, to: ScreenId): void {
  gather(h);
  drinkIfLow(h);
  walkFighting(h, tx, ty);
  fightNear(h);
  walkTo(h, tx, ty);
  crossTo(h, dir, to, 900);
  if (h.sim.mode === 'story') finishStory(h);
  alive(h);
}

/** Walks through the tiles in turn (to keep to dry floor where the shortest way would swim). */
function via(h: Harness, ...tiles: (readonly [number, number])[]): void {
  for (const [x, y] of tiles) walkFighting(h, x, y);
}

/** Stands on (tx, ty), turns to `dir` and interacts (a chest, a rack, a stone), reading to the end. */
function useAt(h: Harness, tx: number, ty: number, dir: Dir4): void {
  walkFighting(h, tx, ty);
  face(h, dir);
  h.step(frameOf([], ['interact']));
  h.idle(2);
  if (h.sim.mode === 'story') finishStory(h);
}

/** Stands on (tx, ty) facing `dir` and swings (a wheel beside Ask). */
function swingAt(h: Harness, tx: number, ty: number, dir: Dir4): void {
  walkFighting(h, tx, ty);
  face(h, dir);
  h.press(['sword']).idle(30);
}

/** Walks into a locked door (standing on (tx, ty)) until it opens and Ask is through to `to`. */
function unlock(h: Harness, tx: number, ty: number, dir: Dir4, to: ScreenId): void {
  walkFighting(h, tx, ty);
  crossTo(h, dir, to, 900);
  if (h.sim.mode === 'story') finishStory(h);
  alive(h);
}

/** Fights until nothing mortal is left on the screen (a `clear` room). */
function clearRoom(h: Harness): void {
  for (let round = 0; round < 40; round++) {
    drinkIfLow(h);
    const foes = h.sim.enemies.filter((e) => !h.sim.db.enemies[e.def as EnemyId].immortal);
    if (foes.length === 0) return;
    fightNear(h, 600, 600);
    const foe = foes[0];
    if (foe !== undefined && h.sim.enemies.includes(foe))
      try {
        walkTo(h, Math.floor(foe.pos.x / 16), Math.floor((foe.pos.y - 1) / 16) + 1, 60);
      } catch {
        h.idle(10);
      }
  }
  throw new Error(
    `${h.sim.screen.id} is not clear: ${JSON.stringify(h.sim.enemies.map((e) => [e.def, e.hp, e.fsm.s, Math.round(e.pos.x), Math.round(e.pos.y)]))} hero ${heroTile(h.sim).join(',')} ${h.sim.hero.fsm.s} tick ${String(h.sim.tick)} hp ${String(h.sim.hero.hp)} weapon ${h.sim.state.inv.weapon} pos ${String(h.sim.hero.pos.x)},${String(h.sim.hero.pos.y)}`,
  );
}

/** Stands on (tx, ty) facing `dir` and sings a galdr. */
function sing(h: Harness, tx: number, ty: number, dir: Dir4, galdr: GaldrId): void {
  walkFighting(h, tx, ty);
  face(h, dir);
  topUp(h, h.sim.db.galdr[galdr].cost);
  h.sim.command({ t: 'ready', galdr });
  h.idle(1);
  h.press(['galdr']).idle(40);
  alive(h);
}

/**
 * Dives at the water ahead: from (tx, ty) Ask (in the seal-skin) swims into (tx, ty) + `dir` and rolls on
 * under, through a dive door or over a sunk thing. In winter a bolt of Eldr first melts the ice there.
 */
function dive(h: Harness, tx: number, ty: number, dir: Dir4, until: () => boolean): void {
  walkFighting(h, tx, ty);
  if (h.sim.state.clock.season === 'winter' && SCREENS[h.sim.screen.id].indoor !== true) {
    face(h, dir);
    topUp(h, h.sim.db.galdr.eldr.cost);
    h.sim.command({ t: 'ready', galdr: 'eldr' });
    h.idle(1);
    h.press(['galdr']).idle(30);
  }
  // Into the water (off the last of the ice, if any), then a roll takes Ask under.
  h.until((s) => s.hero.fsm.s === 'swim', 60, frameOf([KEY[dir]]));
  h.hold([KEY[dir]], 4);
  h.step(frameOf([KEY[dir]], ['roll']));
  try {
    h.until(() => until(), 200, frameOf([KEY[dir]]));
  } catch {
    throw new Error(
      `no dive on ${h.sim.screen.id}: at ${heroTile(h.sim).join(',')} ${h.sim.hero.fsm.s} ${h.sim.state.clock.season} melted ${JSON.stringify(h.sim.state.world.cover[h.sim.screen.id])}`,
    );
  }
  h.until((s) => s.mode === 'play' || s.mode === 'story', 200);
  h.idle(2);
  if (h.sim.mode === 'story') finishStory(h);
  alive(h);
}

/**
 * Dives down through the north water's whirlpool to the Norns' loom: into its east side's southward current
 * from the water (or ice) beside it, carried down onto the dive door at (22, 10), and a roll there.
 */
function whirlpool(h: Harness): void {
  walkFighting(h, 23, 9);
  h.until((s) => heroTile(s)[0] === 22, 60, frameOf(['left']));
  h.until((s) => heroTile(s)[1] >= 10, 80);
  h.step(frameOf(['down'], ['roll']));
  h.until((s) => s.screen.id === 'sae_int_well', 200, frameOf(['down']));
  h.until((s) => s.mode === 'play', 200);
  alive(h);
}

const INDEX = indexLayout(WORLD_LAYOUT, SCREEN_IDS);
const DIRS: readonly Dir4[] = ['n', 's', 'w', 'e'];
const passable = (id: ScreenId, x: number, y: number): boolean => {
  const t = cellAt(parseTextMap(SCREENS[id].map, LEGEND), x, y);
  return t !== undefined && (!TERRAIN[t].solid || t === 'water');
};
/** The tiles along a screen's edge on side `dir` that line up with open tiles on the far side. */
function seam(from: ScreenId, dir: Dir4, to: ScreenId): [number, number][] {
  const out: [number, number][] = [];
  const along = dir === 'n' || dir === 's' ? SCREEN_COLS : SCREEN_ROWS;
  for (let i = 0; i < along; i++) {
    const here: [number, number] =
      dir === 'n' ? [i, 0] : dir === 's' ? [i, SCREEN_ROWS - 1] : dir === 'w' ? [0, i] : [SCREEN_COLS - 1, i];
    const there: [number, number] =
      dir === 'n' ? [i, SCREEN_ROWS - 1] : dir === 's' ? [i, 0] : dir === 'w' ? [SCREEN_COLS - 1, i] : [0, i];
    if (passable(from, ...here) && passable(to, ...there)) out.push(here);
  }
  return out;
}

/** The overworld screens from here to `to`, by open seams. */
function plan(from: ScreenId, to: ScreenId): [Dir4, ScreenId][] {
  const prev = new Map<ScreenId, [ScreenId, Dir4] | null>([[from, null]]);
  const queue: ScreenId[] = [from];
  while (queue.length > 0) {
    const cur = queue.shift() as ScreenId;
    if (cur === to) break;
    for (const d of DIRS) {
      const next = neighbourOf(INDEX, cur, d);
      if (next === null || prev.has(next) || seam(cur, d, next).length === 0) continue;
      prev.set(next, [cur, d]);
      queue.push(next);
    }
  }
  const out: [Dir4, ScreenId][] = [];
  for (let at: ScreenId = to; at !== from;) {
    const p = prev.get(at);
    if (p === undefined || p === null) throw new Error(`no way from ${from} to ${to}`);
    out.unshift([p[1], at]);
    at = p[0];
  }
  return out;
}

/** Walks the overworld screen by screen to `to`, trying the seam tiles nearest first. */
function travel(h: Harness, to: ScreenId): void {
  for (const [dir, next] of plan(h.sim.screen.id, to)) {
    const [hx, hy] = heroTile(h.sim);
    const tiles = seam(h.sim.screen.id, dir, next).sort(
      (a, b) => Math.abs(a[0] - hx) + Math.abs(a[1] - hy) - (Math.abs(b[0] - hx) + Math.abs(b[1] - hy)),
    );
    let crossed = false;
    for (const [x, y] of tiles.slice(0, 8)) {
      try {
        gather(h);
        drinkIfLow(h);
        walkFighting(h, x, y);
        crossTo(h, dir, next, 300);
        crossed = true;
        break;
      } catch (e) {
        if (h.sim.screen.id === next) {
          crossed = true;
          break;
        }
        if (!(e instanceof Error)) throw e;
      }
    }
    if (!crossed) throw new Error(`could not cross ${dir} from ${h.sim.screen.id} to ${next}`);
    if (h.sim.mode === 'story') finishStory(h);
    alive(h);
  }
}

/** Walks toward a tile for at most `ticks` ticks. */
function toward(h: Harness, tx: number, ty: number, ticks: number): void {
  try {
    walkTo(h, tx, ty, ticks);
  } catch (e) {
    if (!(e instanceof Error) || !e.message.startsWith('could not reach')) throw e;
  }
}

/**
 * The walk round Hrönn's hall, clockwise, kept off the pool: by each grate (where Ask sets a bomb from, facing
 * it) and the corners between. Each leg is a straight line.
 */
const RING: readonly (readonly [number, number])[] = [
  [20, 4],
  [28, 4],
  [28, 10],
  [28, 16],
  [20, 16],
  [12, 16],
  [12, 10],
  [12, 4],
];
/** Each grate's place on the ring, the way Ask faces it from there, and where on the ring to stand clear. */
const GRATES: readonly { ring: number; dir: Dir4; clear: readonly [number, number] }[] = [
  { ring: 0, dir: 's', clear: [25, 4] },
  { ring: 2, dir: 'w', clear: [28, 15] },
  { ring: 4, dir: 'n', clear: [25, 16] },
  { ring: 6, dir: 'e', clear: [12, 15] },
];

/** The ring stop nearest to Ask. */
function onRing(h: Harness): number {
  const [hx, hy] = heroTile(h.sim);
  let best = 0;
  RING.forEach(([x, y], i) => {
    const [bx = 0, by = 0] = RING[best] ?? [];
    if (Math.abs(x - hx) + Math.abs(y - hy) < Math.abs(bx - hx) + Math.abs(by - hy)) best = i;
  });
  return best;
}

/** Whether Ask can walk straight from (ax, ay) to (bx, by) along one of the ring's sides. */
const inLine = (ax: number, ay: number, bx: number, by: number): boolean =>
  (ay === by && (ay === 4 || ay === 16)) || (ax === bx && (ax === 12 || ax === 28));

/**
 * Walks along the ring toward stop `to` (the shorter way round) for at most `ticks` ticks: straight to the
 * furthest stop on the way that lies along the same side as Ask.
 */
function ringToward(h: Harness, to: number, ticks: number): void {
  const n = RING.length;
  const [hx, hy] = heroTile(h.sim);
  const from = onRing(h);
  const step = (to - from + n) % n <= n / 2 ? 1 : n - 1;
  const stops = [from];
  for (let i = from; i !== to;) {
    i = (i + step) % n;
    stops.push(i);
  }
  let goal = from;
  for (const i of stops) {
    const [x = 0, y = 0] = RING[i] ?? [];
    if (inLine(hx, hy, x, y)) goal = i;
  }
  const [gx = 0, gy = 0] = RING[goal] ?? [];
  if (gx === hx && gy === hy) h.idle(1);
  else toward(h, gx, gy, ticks);
}

/** Steps square onto a foe within reach and swings. */
function strikeAt(h: Harness, foe: Entity): void {
  const dx = foe.pos.x - h.sim.hero.pos.x;
  const dy = foe.pos.y - h.sim.hero.pos.y;
  const dir: Dir4 = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'e' : 'w') : dy > 0 ? 's' : 'n';
  if (h.sim.hero.facing !== dir) h.step(frameOf([KEY[dir]], [KEY[dir]]));
  h.step(frameOf([], ['sword']));
  h.idle(8);
}

/**
 * Fights Hrönn: waits on the ring by the grate it will come to next, sets a bomb there as soon as it lies
 * under it, stands clear of the blast, and cuts at it while it lies stunned in the broken grate.
 */
function hronn(h: Harness): void {
  const until = h.sim.tick + 40_000;
  const log: string[] = [];
  let was = '';
  while (h.sim.tick < until) {
    {
      const e = h.sim.enemies.find((a) => a.def === 'hronn');
      const key = `${e?.fsm.s ?? '-'} in${String(e?.mem['in'])}`;
      if (key !== was)
        log.push(
          `${String(h.sim.tick)} ${key} hp${String(e?.hp)} ask ${heroTile(h.sim).join(',')} ${h.sim.hero.fsm.s} bombs ${String(h.sim.state.inv.items.bombs)} grates ${h.sim.enemies
            .filter((a) => a.def === 'hronn_grate')
            .map((a) => String(a.mem['spot']))
            .join('')}`,
        );
      was = key;
    }
    drinkIfLow(h);
    const eel = h.sim.enemies.find((e) => e.def === 'hronn');
    if (eel === undefined) return;
    if (h.sim.hero.fsm.s !== 'move' || h.sim.mode !== 'play') {
      h.idle(1);
      continue;
    }
    const s = eel.fsm.s;
    const lies = eel.mem['in'] ?? 0;
    const here = GRATES[lies];
    if (here === undefined) throw new Error('no grate');
    const [hx, hy] = heroTile(h.sim);
    const [gx, gy] = RING[here.ring] ?? [0, 0];
    if (s === 'stunned') {
      if (hx === gx && hy === gy) strikeAt(h, eel);
      else ringToward(h, here.ring, 8);
      continue;
    }
    const bombs = h.sim.actors.some((a) => a.kind === 'prop' && a.def === 'bomb');
    if (bombs) {
      h.idle(1);
      continue;
    }
    if (s === 'under' && eel.fsm.t < 40 && hx === gx && hy === gy) {
      face(h, here.dir);
      h.press(['item2']);
      h.idle(4);
      toward(h, here.clear[0], here.clear[1], 300);
      continue;
    }
    // Wait by the grate it comes to next (it sinks there with 'in' already moved on), or the one it has
    // just sunk under if Ask is close enough to set a bomb in time.
    const near = Math.abs(hx - gx) + Math.abs(hy - gy) <= 3 && eel.fsm.t < 30;
    const next = s === 'sink' || (s === 'under' && near) ? lies : (lies + 1) % HRONN.grates.length;
    ringToward(h, GRATES[next]?.ring ?? 0, 8);
    alive(h);
  }
  throw new Error(`Hrönn still lives\n${log.slice(0, 30).join('\n')}`);
}

/** Where Nykr's body is, in tiles. */
const tileOf = (e: Entity): [number, number] => [
  Math.floor(e.pos.x / TILE),
  Math.floor((e.pos.y - 1) / TILE),
];

/**
 * The island tile (one in from its shore, so turning never steps Ask into the water) nearest to Ask from
 * which something sent the way Ask faces, `reach` px on, meets Nykr's body; and that way.
 */
function lineUp(
  h: Harness,
  n: { pos: { x: number; y: number } },
  reach: number,
): { at: [number, number]; dir: Dir4 } | null {
  const [hx, hy] = heroTile(h.sim);
  let best: { at: [number, number]; dir: Dir4; d: number } | null = null;
  for (let y = 9; y <= 12; y++)
    for (let x = 16; x <= 23; x++) {
      const px = x * TILE + 8;
      const py = y * TILE + 14;
      const dx = n.pos.x - px;
      const dy = n.pos.y - py;
      let dir: Dir4 | null = null;
      // A gust (or the grapple's head) runs `reach` px on from 8 px ahead of Ask; Nykr's body stands 36 px
      // wide and 40 tall above its feet.
      if (Math.abs(dx) <= 18 && dy < -8 && -dy <= reach + 10) dir = 'n';
      else if (Math.abs(dx) <= 18 && dy > 8 && dy <= reach + 30) dir = 's';
      else if (dy >= 2 && dy <= 36 && Math.abs(dx) > 12 && Math.abs(dx) <= reach + 20)
        dir = dx > 0 ? 'e' : 'w';
      if (dir === null) continue;
      const d = Math.abs(x - hx) + Math.abs(y - hy);
      if (best === null || d < best.d) best = { at: [x, y], dir, d };
    }
  return best;
}

/**
 * Fights Nykr from its island: stands lined up with it, blows it onto the stone with a gust while it rears,
 * rolls out of a charge's line (waiting in the island's middle while it may charge), hooks its bridle with
 * the grapple while it whirls, and cuts at it while it flounders.
 */
function nykr(h: Harness): void {
  const until = h.sim.tick + 60_000;
  let last = -1;
  let gusted = -1;
  const log: string[] = [];
  let was = '';
  while (h.sim.tick < until) {
    {
      const e = h.sim.enemies.find((a) => a.def === 'nykr');
      const key = `${e?.fsm.s ?? '-'} hp${String(e?.hp)} ask hp${String(h.sim.hero.hp)}`;
      if (key !== was)
        log.push(
          `${String(h.sim.tick)} ${key} at ${e === undefined ? '' : tileOf(e).join(',')} ask ${heroTile(h.sim).join(',')} ${h.sim.hero.fsm.s} seidr ${String(h.sim.state.hero.seidr)}`,
        );
      was = key;
    }
    drinkIfLow(h);
    const n = h.sim.enemies.find((e) => e.def === 'nykr');
    if (n === undefined) return;
    if (h.sim.tick === last) h.idle(1);
    last = h.sim.tick;
    if (h.sim.hero.fsm.s === 'swim' && h.sim.mode === 'play') {
      // Knocked or rolled into the water: back onto the island.
      toward(h, 20, 10, 8);
      continue;
    }
    if (h.sim.hero.fsm.s !== 'move' || h.sim.mode !== 'play') {
      h.idle(1);
      continue;
    }
    const s = n.fsm.s;
    const phase = n.mem['phase'] ?? 0;
    const [nx, ny] = tileOf(n);
    const [hx, hy] = heroTile(h.sim);
    if (s === 'beached') {
      const dx = n.pos.x - h.sim.hero.pos.x;
      const dy = n.pos.y - h.sim.hero.pos.y;
      if (Math.abs(dx) + Math.abs(dy) > 28) {
        const sx = Math.max(16, Math.min(23, nx));
        const sy = Math.max(9, Math.min(12, ny + 1));
        toward(h, sx, sy, 10);
      } else strikeAt(h, n);
      continue;
    }
    if (s === 'charge') {
      const ax = n.mem['aimX'] ?? 0;
      const ay = n.mem['aimY'] ?? 0;
      const p = h.sim.hero.pos;
      if (n.fsm.t < 3) {
        // Out of the locked line, toward the island's middle.
        const side = (p.x - 20 * TILE) * -ay + (p.y - 10 * TILE - 14) * ax > 0 ? -1 : 1;
        const px = -ay * side;
        const py = ax * side;
        const key: Action =
          Math.abs(px) > Math.abs(py) ? (px > 0 ? 'right' : 'left') : py > 0 ? 'down' : 'up';
        h.step(frameOf([key], ['roll']));
        h.hold([key], 8);
        continue;
      }
      // Once it is past, on to where it will rear: at the end of its line.
      const past = (p.x - n.pos.x) * ax + (p.y - n.pos.y) * ay < -24;
      const left = NYKR.chargeTicks - n.fsm.t;
      const end = {
        pos: { x: n.pos.x + ax * NYKR.chargeSpeed * left, y: n.pos.y + ay * NYKR.chargeSpeed * left },
      };
      const spot = past ? lineUp(h, end, 76) : null;
      if (spot !== null && (hx !== spot.at[0] || hy !== spot.at[1])) toward(h, spot.at[0], spot.at[1], 4);
      else h.idle(1);
      continue;
    }
    if (s === 'rear' || s === 'whirl') {
      const spot = lineUp(h, n, s === 'rear' ? 76 : 88);
      if (spot === null) {
        h.idle(1);
        continue;
      }
      if (hx !== spot.at[0] || hy !== spot.at[1]) {
        toward(h, spot.at[0], spot.at[1], 6);
        continue;
      }
      face(h, spot.dir);
      if (s === 'rear') {
        // One gust a rearing: a second could only miss.
        if (gusted === h.sim.tick - n.fsm.t) {
          h.idle(1);
          continue;
        }
        // Too late for a gust to reach it before the wave: keep the seiðr.
        const py = h.sim.hero.pos.y;
        const gap =
          spot.dir === 'n'
            ? py - 8 - (n.pos.y + 14)
            : spot.dir === 's'
              ? n.pos.y - 42 - (py + 8)
              : Math.abs(n.pos.x - h.sim.hero.pos.x) - 34;
        if (Math.max(0, gap) / 4 + 3 > NYKR.rearTell - n.fsm.t) {
          h.idle(1);
          continue;
        }
        gusted = h.sim.tick - n.fsm.t;
        topUp(h, h.sim.db.galdr.vindr.cost);
        h.sim.command({ t: 'ready', galdr: 'vindr' });
        h.press(['galdr']);
        h.idle(12);
      } else {
        h.press(['item1']);
        h.until((sim) => sim.hero.fsm.s !== 'chain', 120);
      }
      continue;
    }
    // Circling (or roaring, or surging): wait lined up with it while it only rears; in the middle once it
    // charges.
    if (phase >= 1) {
      if (hx !== 20 || hy !== 10) toward(h, 20, 10, 6);
      else h.idle(1);
    } else {
      const spot = lineUp(h, n, 76);
      if (spot !== null && (hx !== spot.at[0] || hy !== spot.at[1])) toward(h, spot.at[0], spot.at[1], 6);
      else h.idle(1);
    }
    alive(h);
  }
  throw new Error(`Nykr still stands\n${log.slice(0, 40).join('\n')}`);
}

const d5 = (h: Harness) => dungeonOf(h.sim.state, 'd5');

/** Prays at the Refuge's hof stone, reading to the end (the save offered, and once woven, a season). */
function pray(h: Harness): void {
  walkFighting(h, 24, 7);
  face(h, 'n');
  h.step(frameOf([], ['interact']));
  for (let i = 0; i < 300 && h.sim.mode !== 'play'; i++) {
    if (h.sim.storyUi()?.k === 'save') h.sim.command({ t: 'saved' });
    h.step(frameOf([], ['confirm'])).idle(2);
  }
  alive(h);
}

/** Waits out in the open until night falls. */
function waitForNight(h: Harness): void {
  h.until((s) => isNight(s.state.clock, s.db.clock), 40 * 3600);
}

/** Out of the Refuge's hall onto Holmr. */
function outOfHall(h: Harness): void {
  walkTo(h, 18, 15);
  h.until((s) => s.screen.id === 'sae_holmr' && s.mode === 'play', 120, frameOf(['down']));
}

/** Into the Refuge's hall from Holmr. */
function intoHall(h: Harness): void {
  travel(h, 'sae_holmr');
  walkFighting(h, 18, 12);
  h.until((s) => s.screen.id === 'ref_int_hall' && s.mode === 'play', 120, frameOf(['up']));
  h.idle(30);
}

/**
 * M7b: from the Refuge's hall (the M7a save, a winter night): a prayer and Vala's mead, then over the ice to
 * the spire and down through it into Sökkva Hof: the first key among the drowned, the map, the first sluice
 * and the compass; lock A, the board gallery and the third key; lock B and Hrönn, blown out of its grates;
 * Vindr's stave; the fan bridge; the second key under the arches; the fan hall's shutter and the great key
 * at the top level; the great door and Nykr; Kolbeinn, and the rune-stone up to the spire. Then a prayer at
 * the Refuge again, the three Norn-threads (the ferry channel, the web on Myrkviðr's road, the barrows by
 * night), the dive to the Norns' loom under the whirlpool, and back at the Refuge's hof the year turned to
 * spring.
 */
export function playM7b(from: GameState): Harness {
  const h = new Harness({ state: from });
  h.idle(2);

  // A prayer at the Refuge's hof (health and seiðr back), Vala's mead for the horns, and out of the hall.
  pray(h);
  for (const row of [1, 0, 0]) {
    walkTo(h, 13, 13);
    face(h, 'n');
    h.step(frameOf([], ['interact']));
    for (let t = 0; t < 200 && h.sim.storyUi()?.k !== 'shop'; t++)
      h.step(frameOf([], h.sim.storyUi()?.k === 'text' ? ['confirm'] : []));
    h.idle(2);
    for (let i = 0; i < row; i++) h.press(['down']).idle(2);
    h.press(['confirm']).idle(2);
    finishStory(h);
  }
  expect(h.sim.state.inv.items.mead_green ?? 0).toBeGreaterThan(0);
  outOfHall(h);

  // Over the lake to the spire, and down through the water at its foot.
  travel(h, 'sae_drowned');
  dive(h, 18, 9, 'e', () => h.sim.screen.id === 'd5_r01');
  expect(h.sim.state.flags.st_d5_entered).toBe(true);

  // West among the drowned: key 1. East: the map, the first sluice up to the lower floors, the compass.
  leave(h, 2, 10, 'w', 'd5_r02');
  clearRoom(h);
  useAt(h, 4, 5, 'n');
  expect(d5(h).keys).toBe(1);
  leave(h, 37, 10, 'e', 'd5_r01');
  leave(h, 37, 10, 'e', 'd5_r03');
  useAt(h, 34, 4, 'n');
  expect(d5(h).map).toBe(true);
  leave(h, 37, 10, 'e', 'd5_r04');
  swingAt(h, 25, 6, 'n');
  expect(h.sim.state.flags.w_d5_level).toBe(1);
  leave(h, 37, 10, 'e', 'd5_r24');
  useAt(h, 20, 11, 'n');
  expect(d5(h).compass).toBe(true);
  leave(h, 2, 10, 'w', 'd5_r04');
  leave(h, 2, 10, 'w', 'd5_r03');
  leave(h, 2, 10, 'w', 'd5_r01');

  // Lock A north; round the flooded hall's dry edge, over the floated boards, and key 3.
  unlock(h, 19, 2, 'n', 'd5_r07');
  via(h, [19, 18], [33, 18], [36, 17], [36, 10]);
  leave(h, 37, 10, 'e', 'd5_r08');
  leave(h, 37, 10, 'e', 'd5_r09');
  useAt(h, 34, 4, 'n');
  expect(d5(h).keys).toBe(1);

  // Lock B: Hrönn's hall. Then Vindr's stave east.
  unlock(h, 19, 2, 'n', 'd5_r15');
  hronn(h);
  expect(h.sim.state.flags.st_d5_hronn).toBe(true);
  leave(h, 37, 10, 'e', 'd5_r16');
  useAt(h, 20, 7, 'n');
  expect(h.sim.state.inv.galdr).toContain('vindr');

  // West: a gust spins the fan and the bridge comes down to the hub; south and west to the arch hall.
  leave(h, 2, 10, 'w', 'd5_r15');
  leave(h, 2, 10, 'w', 'd5_r14');
  sing(h, 30, 7, 'n', 'vindr');
  expect(h.sim.state.flags.w_d5_r14).toBe(true);
  leave(h, 2, 10, 'w', 'd5_r13');
  leave(h, 19, 19, 's', 'd5_r07');
  via(h, [19, 2], [5, 2], [3, 5]);
  leave(h, 2, 10, 'w', 'd5_r06');

  // Under the arches by a dive, key 2, and west and north to the fan hall.
  walkTo(h, 21, 10);
  dive(h, 21, 10, 'w', () => h.sim.hero.pos.x < 18 * 16);
  useAt(h, 6, 5, 'n');
  expect(d5(h).keys).toBe(1);
  leave(h, 2, 10, 'w', 'd5_r05');
  via(h, [35, 3]);
  useAt(h, 4, 5, 'n');
  via(h, [4, 3], [19, 3]);
  leave(h, 19, 2, 'n', 'd5_r11');

  // Both fans, the shutter north, the high wheel, and over the floated boards to the great key.
  via(h, [9, 18], [8, 5]);
  sing(h, 8, 5, 'n', 'vindr');
  sing(h, 31, 5, 'n', 'vindr');
  leave(h, 19, 2, 'n', 'd5_r22');
  swingAt(h, 6, 5, 'n');
  expect(h.sim.state.flags.w_d5_level).toBe(2);
  useAt(h, 20, 11, 'n');
  expect(d5(h).bigKey).toBe(true);

  // Back the way Ask came, under the arches again, to the hub and the great door.
  leave(h, 19, 19, 's', 'd5_r11');
  via(h, [10, 3], [10, 18]);
  leave(h, 19, 19, 's', 'd5_r05');
  via(h, [33, 3]);
  leave(h, 37, 10, 'e', 'd5_r06');
  dive(h, 18, 10, 'e', () => h.sim.hero.pos.x > 21 * 16);
  leave(h, 37, 10, 'e', 'd5_r07');
  via(h, [3, 5], [5, 2], [19, 2]);
  leave(h, 19, 2, 'n', 'd5_r13');
  unlock(h, 19, 2, 'n', 'd5_r19');

  // Nykr: out to the island, and the fight.
  walkTo(h, 19, 13);
  nykr(h);
  expect(h.sim.state.flags.st_thane_nykr).toBe(true);
  for (let i = 0; i < 600 && h.sim.mode !== 'play'; i++) {
    if (h.sim.mode === 'story') finishStory(h);
    else h.idle(1);
  }
  if (h.sim.mode !== 'play') throw new Error(`after Nykr: ${h.sim.mode}`);
  via(h, [22, 12], [20, 12]);
  h.until((sim) => sim.mode === 'story', 120, frameOf(['up']));
  finishStory(h);
  expect(h.sim.state.world.opened).toContain('d5_hc');

  // East: Kolbeinn's word, and the rune-stone up to the spire.
  leave(h, 37, 10, 'e', 'd5_r20');
  if (h.sim.state.flags.st_d5_kolbeinn !== true) {
    h.until((sim) => sim.mode === 'story', 120, frameOf(['right']));
    finishStory(h);
  }
  expect(h.sim.state.flags.st_d5_kolbeinn).toBe(true);
  useAt(h, 20, 7, 'n');
  expect(h.sim.screen.id).toBe('sae_drowned');
  alive(h);

  // A prayer at the Refuge; then the Norns' threads: the ferry channel's bottom, the web on Myrkviðr's
  // road, the barrows by night.
  intoHall(h);
  pray(h);
  outOfHall(h);
  travel(h, 'myl_ferry');
  dive(h, 8, 4, 'n', () => (h.sim.state.inv.items.norn_thread ?? 0) === 1);
  travel(h, 'myr_road');
  sing(h, 6, 7, 'n', 'vindr');
  expect(h.sim.state.flags.w_myr_web).toBe(true);
  useAt(h, 6, 4, 'n');
  expect(h.sim.state.inv.items.norn_thread).toBe(2);
  travel(h, 'hau_barrows');
  walkFighting(h, 4, 7);
  if (!isNight(h.sim.state.clock, h.sim.db.clock)) waitForNight(h);
  useAt(h, 4, 7, 'n');
  expect(h.sim.state.inv.items.norn_thread).toBe(3);

  // Down through the whirlpool to the loom: Urðr weaves them.
  travel(h, 'sae_well');
  whirlpool(h);
  talkTo(h, 'urdr');
  expect(h.sim.state.flags.st_loom_woven).toBe(true);

  // Up again, to the Refuge's hof, and the year turned to spring.
  dive(h, 20, 17, 's', () => h.sim.screen.id === 'sae_well');
  intoHall(h);
  pray(h);
  expect(h.sim.state.clock.season).toBe('spring');
  return h;
}
