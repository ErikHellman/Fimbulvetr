import { createEntity, mem, setAnim, type Entity } from '../../actors/entity';
import { heroSwordBox } from '../../actors/hero';
import { PIERCE_SHIELD } from '../../combat/hit';
import type { InputFrame } from '../../input/actions';
import { at, overlaps, type Box } from '../../math/box';
import { DIR_VEC } from '../../math/dir';
import { dungeonOf } from '../../state/dungeons';
import { evalCond } from '../../story/cond';
import { DEEP, LOW, SOLID } from '../../world/collision';
import { TILE } from '../../world/dims';
import { tileFeet, type Thing, type TilePos } from '../../world/screen';
import type { SimRt } from '../rt';
import { hurtHero } from './combat';
import { wallTiles } from './props';
import { revealThings, roomSignal } from './rooms';
import { raining } from './weather';
import { sinkTiles, walkTiles } from './cover';
import { condCtx, probeBox, startScript } from './story';
import { footingHolds, levelTiles, waterLevel } from './water';
import { turnPrism } from './beams';

/** A fire tile's burn: half a heart, and no shield keeps it off. */
const FIRE = { amount: 2, knock: 4 } as const;
const TILE_BOX = { x: -8, y: -14, w: 16, h: 16 } as const;
const FLAME_BOX = { x: -6, y: -12, w: 12, h: 12 } as const;

/**
 * Fixture kinds: whether they block the way (while on, or always), whether they give footing over water
 * (while on), and their on/off animations. A chest has none here; it shows open or closed.
 */
const KINDS: Readonly<
  Record<
    string,
    {
      readonly solid: 'never' | 'on' | 'always';
      readonly walk?: 'on';
      readonly anims?: readonly [string, string];
    }
  >
> = {
  bridge: { solid: 'never', walk: 'on', anims: ['down', 'up'] },
  gate: { solid: 'on', anims: ['closed', 'open'] },
  fire: { solid: 'never', anims: ['burn', 'out'] },
  scenery: { solid: 'never' },
  chest: { solid: 'on' },
  crack: { solid: 'on', anims: ['closed', 'open'] },
  lock: { solid: 'on', anims: ['closed', 'open'] },
  shutter: { solid: 'on', anims: ['closed', 'open'] },
  switch: { solid: 'always', anims: ['on', 'off'] },
  wheel: { solid: 'always', anims: ['on', 'off'] },
  warp: { solid: 'always', anims: ['awake', 'dormant'] },
  seal: { solid: 'always', anims: ['lit', 'dark'] },
  post: { solid: 'always' },
  raft: { solid: 'never' },
  ripple: { solid: 'never' },
  brazier: { solid: 'always', anims: ['burn', 'out'] },
  beam: { solid: 'always', anims: ['on', 'off'] },
  prism: { solid: 'always' },
  eye: { solid: 'always', anims: ['lit', 'dark'] },
};

function fixture(id: number, def: string, art: string, tile: TilePos, index: number): Entity {
  const e = createEntity({
    id,
    kind: 'fixture',
    def,
    art,
    pos: tileFeet(tile),
    facing: 's',
    body: TILE_BOX,
    hurt: TILE_BOX,
    faction: 'env',
    hp: 1,
    maxHp: 1,
    state: 'idle',
  });
  e.mem['thing'] = index;
  e.mem['tx'] = tile.x;
  e.mem['ty'] = tile.y;
  return e;
}

/**
 * Spawns fixtures: one per tile of a gate, fire, lock, shutter, bridge or crack (each tile animates on its own), one per
 * chest (open if it was opened before), switch and brazier.
 */
export function spawnFixtures(rt: SimRt, thing: Thing, index: number, out: Entity[]): void {
  switch (thing.k) {
    case 'chest': {
      const e = fixture(
        rt.newId(),
        'chest',
        thing.sunk === true ? 'fix_ripple' : 'fix_chest',
        thing.at,
        index,
      );
      if (thing.sunk === true) e.mem['sunk'] = 1;
      setAnim(e, rt.state.world.opened.includes(thing.id) ? 'open' : 'closed');
      out.push(e);
      return;
    }
    case 'switch': {
      const art = thing.fan === true ? 'fix_fan' : thing.eye === true ? 'fix_eye' : 'fix_switch';
      const e = fixture(rt.newId(), 'switch', art, thing.at, index);
      if (thing.set !== undefined && rt.state.flags[thing.set] === true) e.mem['lit'] = 1;
      out.push(e);
      return;
    }
    case 'wheel':
      out.push(fixture(rt.newId(), 'wheel', 'fix_wheel', thing.at, index));
      return;
    case 'door': {
      // A dive door lies under a ripple, as a sunk chest does: nothing hooks or strikes it.
      if (thing.dive !== true) return;
      const e = fixture(rt.newId(), 'ripple', 'fix_ripple', thing.at, index);
      e.mem['sunk'] = 1;
      setAnim(e, 'idle');
      out.push(e);
      return;
    }
    case 'warp':
      out.push(fixture(rt.newId(), 'warp', 'fix_warp', thing.at, index));
      return;
    case 'seal':
      out.push(fixture(rt.newId(), 'seal', 'fix_seal', thing.at, index));
      return;
    case 'post': {
      const e = fixture(rt.newId(), 'post', 'fix_post', thing.at, index);
      setAnim(e, 'idle');
      out.push(e);
      return;
    }
    case 'beam':
      out.push(fixture(rt.newId(), 'beam', 'fix_window', thing.at, index));
      return;
    case 'prism': {
      const e = fixture(rt.newId(), 'prism', 'fix_prism', thing.at, index);
      e.mem['turn'] = 0;
      setAnim(e, thing.turn === '/' ? 'slash' : 'back');
      out.push(e);
      return;
    }
    case 'eye':
      out.push(fixture(rt.newId(), 'eye', 'fix_crystal', thing.at, index));
      return;
    case 'brazier': {
      const e = fixture(rt.newId(), 'brazier', 'fix_brazier', thing.at, index);
      e.mem['lit'] = thing.lit === true ? 1 : 0;
      out.push(e);
      return;
    }
    case 'scenery':
      // Spawned only while shown: it changes with the story between visits, never in front of Ask.
      if (!evalCond(thing.shown, condCtx(rt))) return;
      for (let y = 0; y < thing.h; y++)
        for (let x = 0; x < thing.w; x++) {
          const e = fixture(
            rt.newId(),
            'scenery',
            `fix_${thing.art}`,
            { x: thing.at.x + x, y: thing.at.y + y },
            index,
          );
          setAnim(e, 'idle');
          out.push(e);
        }
      return;
    case 'gate':
    case 'fire':
    case 'lock':
    case 'shutter':
    case 'bridge':
    case 'crack': {
      const art =
        thing.k === 'gate'
          ? `fix_${thing.art}`
          : thing.k === 'crack'
            ? `fix_crack_${thing.art}`
            : thing.k === 'lock' && thing.big === true
              ? 'fix_biglock'
              : `fix_${thing.k}`;
      for (let y = 0; y < thing.h; y++)
        for (let x = 0; x < thing.w; x++)
          out.push(fixture(rt.newId(), thing.k, art, { x: thing.at.x + x, y: thing.at.y + y }, index));
      return;
    }
    default:
      return;
  }
}

export const thingOf = (rt: SimRt, e: Entity): Thing | undefined =>
  rt.db.screens[rt.screen.id].things[mem(e, 'thing')];

/** The doors opened for good in the current room's dungeon (none outside dungeons). */
function doorsOf(rt: SimRt): string[] | null {
  const id = rt.db.screens[rt.screen.id].dungeon;
  return id === undefined ? null : dungeonOf(rt.state, id).doors;
}

/**
 * Whether a fixture is "on": a gate or shutter closed, a fire burning, a chest in sight, a lock locked, a
 * switch or brazier lit.
 */
function isOn(rt: SimRt, e: Entity): boolean {
  const thing = thingOf(rt, e);
  switch (thing?.k) {
    case 'gate':
      return evalCond(thing.closed, condCtx(rt));
    case 'bridge':
      return evalCond(thing.down, condCtx(rt));
    case 'fire':
      return evalCond(thing.when, condCtx(rt));
    case 'chest':
      // A sunk chest lies on the bottom under a ripple: a swimmer passes over it.
      return mem(e, 'wait') !== 1 && mem(e, 'sunk') !== 1;
    case 'lock':
      return !(doorsOf(rt)?.includes(thing.id) ?? false);
    case 'crack':
      return !rt.state.world.opened.includes(thing.id);
    case 'wheel':
      return waterLevel(rt) === thing.level;
    case 'warp':
      return rt.state.world.warps.includes(thing.region);
    case 'seal':
      return evalCond(thing.lit, condCtx(rt));
    case 'beam':
      return evalCond(thing.when, condCtx(rt));
    case 'eye':
      return rt.state.flags[thing.flag] === true;
    case 'shutter':
      return evalCond(thing.when, condCtx(rt)) && mem(e, 'armed') === 1 && mem(e, 'done') !== 1;
    case 'switch':
    case 'brazier':
      return mem(e, 'lit') === 1;
    default:
      return false;
  }
}

const tileRect = (t: { at: TilePos; w: number; h: number }): Box => ({
  x: t.at.x * TILE,
  y: t.at.y * TILE,
  w: t.w * TILE,
  h: t.h * TILE,
});

/**
 * Shutters arm once Ask's body is clear of them (so they never shut on Ask) and open for good when their
 * signal first holds; one with an id stays open on later visits. Nothing arms while a room is being
 * spawned, before Ask has been placed in it.
 */
function stepShutters(rt: SimRt, arm: boolean): void {
  const hero = at(rt.hero.body, rt.hero.pos);
  const doors = doorsOf(rt);
  for (const e of rt.actors) {
    if (e.kind !== 'fixture' || e.def !== 'shutter' || mem(e, 'done') === 1) continue;
    const thing = thingOf(rt, e);
    if (thing?.k !== 'shutter') continue;
    const saved = thing.id !== undefined && doors !== null;
    if ((saved && doors.includes(thing.id)) || (thing.opens !== undefined && roomSignal(rt, thing.opens))) {
      e.mem['done'] = 1;
      if (saved && !doors.includes(thing.id)) doors.push(thing.id);
      continue;
    }
    // The far side of another room's shutter is simply shut; nobody comes through it until it opens.
    if (thing.opens === undefined) e.mem['armed'] = 1;
    else if (arm && mem(e, 'armed') !== 1 && !overlaps(hero, tileRect(thing))) e.mem['armed'] = 1;
  }
}

/**
 * Shows chests and hearts whose moment has come, moves shutters on, re-evaluates every fixture (a gate
 * opens the tick its flag flips) and restamps collision when a solid one changed. Runs in play and in story
 * mode, so a cutscene can open a gate on screen.
 */
export function refreshFixtures(rt: SimRt, arm = true): void {
  revealThings(rt);
  douseBraziers(rt);
  stepShutters(rt, arm);
  let changed = false;
  const sounds = new Set<'sfx_gate' | 'sfx_shutter'>();
  for (const e of rt.actors) {
    if (e.kind !== 'fixture') continue;
    const on = isOn(rt, e) ? 1 : 0;
    const was = e.mem['on'];
    if (was === on) continue;
    e.mem['on'] = on;
    if (was === 1 && e.def === 'gate') sounds.add('sfx_gate');
    if (was !== undefined && e.def === 'shutter') sounds.add('sfx_shutter');
    const kind = KINDS[e.def];
    if (kind?.anims !== undefined) setAnim(e, on === 1 ? kind.anims[0] : kind.anims[1]);
    if (kind?.solid === 'on' || kind?.walk === 'on') changed = true;
  }
  for (const id of sounds) rt.emit({ t: 'sfx', id });
  if (changed) stampCollision(rt);
}

/** The tiles of the resting rafts: footing over the water (see `stampCollision`). */
export function raftTiles(rt: SimRt): number[] {
  const out: number[] = [];
  const cols = rt.screen.collision.cols;
  for (const e of rt.actors) {
    if (e.kind !== 'fixture' || e.def !== 'raft' || mem(e, 'moving') === 1) continue;
    const x = mem(e, 'tx');
    const y = mem(e, 'ty');
    out.push(y * cols + x, y * cols + x + 1, (y + 1) * cols + x, (y + 1) * cols + x + 1);
  }
  return out;
}

/**
 * collision = base terrain + the tiles of solid fixtures (closed gates, locks and shutters, chests in
 * sight, switches, braziers) + wall props (root blocks, vines).
 */
export function stampCollision(rt: SimRt): void {
  const { base, collision } = rt.screen;
  collision.flags.set(base.flags);
  // The water level: flooded sluices and sunken planks are water; dry sluices and floated planks are not.
  for (const [i, footing] of levelTiles(rt))
    collision.flags[i] = footing
      ? (collision.flags[i] ?? 0) & ~(SOLID | LOW)
      : (collision.flags[i] ?? 0) | SOLID | LOW;
  // Ice lets Ask walk on water (and blocks nothing in flight).
  for (const i of walkTiles(rt)) collision.flags[i] = (collision.flags[i] ?? 0) & ~(SOLID | LOW);
  // A spring flood over a shoal: as open water.
  for (const i of sinkTiles(rt)) collision.flags[i] = (collision.flags[i] ?? 0) | SOLID | LOW;
  // A lowered drawbridge: footing over the water.
  for (const e of rt.actors) {
    if (e.kind !== 'fixture' || KINDS[e.def]?.walk !== 'on' || mem(e, 'on') !== 1) continue;
    const i = mem(e, 'ty') * collision.cols + mem(e, 'tx');
    collision.flags[i] = (collision.flags[i] ?? 0) & ~(SOLID | LOW);
  }
  // A raft resting at its stop: footing over the water.
  for (const i of raftTiles(rt)) collision.flags[i] = (collision.flags[i] ?? 0) & ~(SOLID | LOW);
  // Walls and solid fixtures stand on the water as on land: nobody swims through them (`DEEP` off).
  for (const t of wallTiles(rt)) {
    const i = t.y * collision.cols + t.x;
    collision.flags[i] = ((collision.flags[i] ?? 0) | SOLID) & ~DEEP;
  }
  for (const e of rt.actors) {
    if (e.kind !== 'fixture') continue;
    const solid = KINDS[e.def]?.solid;
    if (solid === 'never' || (solid === 'on' && mem(e, 'on') !== 1)) continue;
    const i = mem(e, 'ty') * collision.cols + mem(e, 'tx');
    collision.flags[i] = ((collision.flags[i] ?? 0) | SOLID) & ~DEEP;
  }
}

/** The first fixture of `def` under `box` that passes `pick`. */
function fixtureAt(rt: SimRt, def: string, box: Box, pick: (e: Entity) => boolean): Entity | null {
  return (
    rt.actors.find(
      (e) => e.kind === 'fixture' && e.def === def && pick(e) && overlaps(box, at(e.hurt, e.pos)),
    ) ?? null
  );
}

/**
 * Opens the locked door under `box` for good: a small key is spent, the big key only shown. Returns whether
 * one was opened.
 */
export function unlockAt(rt: SimRt, box: Box): boolean {
  const doors = doorsOf(rt);
  const id = rt.db.screens[rt.screen.id].dungeon;
  if (doors === null || id === undefined) return false;
  const e = fixtureAt(rt, 'lock', box, (f) => mem(f, 'on') === 1);
  const thing = e === null ? undefined : thingOf(rt, e);
  const d = dungeonOf(rt.state, id);
  if (thing?.k !== 'lock') return false;
  if (thing.big === true) {
    if (!d.bigKey) return false;
  } else if (d.keys < 1) return false;
  else d.keys -= 1;
  doors.push(thing.id);
  rt.emit({ t: 'sfx', id: 'sfx_unlock' });
  refreshFixtures(rt);
  return true;
}

/** Walking into a locked door with a key opens it. */
export function bumpLocks(rt: SimRt, input: InputFrame): void {
  if (rt.hero.fsm.s !== 'move') return;
  const d = DIR_VEC[rt.hero.facing];
  if ((d.x === 0 || input.mx !== d.x) && (d.y === 0 || input.my !== d.y)) return;
  unlockAt(rt, probeBox(rt));
}

/** The sword lights the switches it strikes (a spin can light several); an eye only clinks. */
export function swordSwitches(rt: SimRt): void {
  const box = heroSwordBox(rt.hero, rt.db.tuning, rt.state.inv.weapon);
  if (box === null) return;
  for (let lit = strikeSwitch(rt, box); lit; lit = strikeSwitch(rt, box));
  strikeWheel(rt, box);
  const swing = mem(rt.hero, 'swing');
  const eye = fixtureAt(
    rt,
    'switch',
    box,
    (f) => isEye(rt, f) && mem(f, 'lit') !== 1 && mem(f, 'hitSwing') !== swing,
  );
  if (eye !== null) {
    eye.mem['hitSwing'] = swing;
    rt.emit({ t: 'sfx', id: 'sfx_block' });
  }
  // A turning prism (M9b) turns a quarter at each swing that strikes it.
  const prism = fixtureAt(rt, 'prism', box, (f) => mem(f, 'hitSwing') !== swing);
  if (prism !== null) {
    prism.mem['hitSwing'] = swing;
    if (!turnPrism(rt, prism)) rt.emit({ t: 'sfx', id: 'sfx_block' });
  }
}

/** Whether a switch fixture is an eye carved in stone (only an arrow opens it). */
const isEye = (rt: SimRt, f: Entity): boolean => {
  const t = thingOf(rt, f);
  return t?.k === 'switch' && t.eye === true;
};

/** Whether a switch fixture is a wind fan (only a gust spins it). */
const isFan = (rt: SimRt, f: Entity): boolean => {
  const t = thingOf(rt, f);
  return t?.k === 'switch' && t.fan === true;
};

/** Spins the still wind fan under `box` (a Vindr gust): it sets its flag. Returns whether one spun. */
export function spinFan(rt: SimRt, box: Box): boolean {
  const e = fixtureAt(rt, 'switch', box, (f) => mem(f, 'lit') !== 1 && isFan(rt, f));
  if (e === null) return false;
  e.mem['lit'] = 1;
  const thing = thingOf(rt, e);
  if (thing?.k === 'switch' && thing.set !== undefined) rt.state.flags[thing.set] = true;
  rt.emit({ t: 'sfx', id: 'sfx_switch' });
  return true;
}

/** An unlit eye under `box` (what a boomerang clinks off). */
export function eyeAt(rt: SimRt, box: Box): boolean {
  return fixtureAt(rt, 'switch', box, (f) => isEye(rt, f) && mem(f, 'lit') !== 1) !== null;
}

/**
 * Lights the unlit switch under `box`: a sword, boomerang or blast strike lights plain ones, and only an
 * arrow lights an eye. Returns whether one was lit.
 */
export function strikeSwitch(rt: SimRt, box: Box, arrow = false): boolean {
  const e = fixtureAt(
    rt,
    'switch',
    box,
    (f) => mem(f, 'lit') !== 1 && !isFan(rt, f) && (arrow || !isEye(rt, f)),
  );
  if (e === null) return false;
  e.mem['lit'] = 1;
  const thing = thingOf(rt, e);
  if (thing?.k === 'switch' && thing.set !== undefined) rt.state.flags[thing.set] = true;
  rt.emit({ t: 'sfx', id: 'sfx_switch' });
  return true;
}

/** What can break a crack open: a blast (bombs), the hammer's blow or Skjálfti's quake (M8b). */
export type CrackBreaker = 'blast' | 'hammer' | 'quake';

/** Walls and rocks open to a blast; a weak floor to the hammer or a quake; a stake to the hammer only. */
export function breaks(by: CrackBreaker, art: 'wall' | 'rock' | 'floor' | 'stake'): boolean {
  if (art === 'wall' || art === 'rock') return by === 'blast';
  if (art === 'floor') return by !== 'blast';
  return by === 'hammer';
}

/** Opens every crack under `box` that `by` breaks, for good. Returns whether one was opened. */
export function openCracks(rt: SimRt, box: Box, by: CrackBreaker = 'blast'): boolean {
  const opened = rt.state.world.opened;
  let any = false;
  for (const e of rt.actors) {
    if (e.kind !== 'fixture' || e.def !== 'crack' || mem(e, 'on') !== 1) continue;
    if (!overlaps(box, at(e.hurt, e.pos))) continue;
    const thing = thingOf(rt, e);
    if (thing?.k !== 'crack' || opened.includes(thing.id) || !breaks(by, thing.art)) continue;
    opened.push(thing.id);
    any = true;
  }
  if (!any) return false;
  rt.emit({ t: 'sfx', id: 'sfx_secret' });
  refreshFixtures(rt);
  return true;
}

/**
 * Turns the wheel under `box` that stands at another level than the water: the level follows it, unless
 * that would change the footing under Ask (then it only clanks). Returns whether a wheel was struck.
 */
export function strikeWheel(rt: SimRt, box: Box): boolean {
  const flag = rt.db.screens[rt.screen.id].water;
  if (flag === undefined) return false;
  const now = waterLevel(rt);
  const e = fixtureAt(rt, 'wheel', box, (f) => {
    const t = thingOf(rt, f);
    return t?.k === 'wheel' && t.level !== now;
  });
  const thing = e === null ? undefined : thingOf(rt, e);
  if (thing?.k !== 'wheel') return false;
  if (!footingHolds(rt, thing.level)) {
    rt.emit({ t: 'sfx', id: 'sfx_block' });
    return true;
  }
  rt.state.flags[flag] = thing.level;
  rt.emit({ t: 'sfx', id: 'sfx_wheel' });
  return true;
}

/** The script a warp stone runs when touched (its line about Farvegr). */
const WARP_SCRIPT = 'warp_stone' as const;

/**
 * Wakes the warp stone under `probe` (interact): its region is woken for good, once. Either way the stone
 * speaks. Returns whether there was a stone.
 */
export function touchWarp(rt: SimRt, probe: Box): boolean {
  const e = fixtureAt(rt, 'warp', probe, () => true);
  const thing = e === null ? undefined : thingOf(rt, e);
  if (thing?.k !== 'warp') return false;
  if (!rt.state.world.warps.includes(thing.region)) {
    rt.state.world.warps.push(thing.region);
    rt.emit({ t: 'sfx', id: 'sfx_warp' });
    refreshFixtures(rt);
  }
  startScript(rt, WARP_SCRIPT);
  return true;
}

/** Rain puts out every burning brazier in the open (they stay out until lit again). */
function douseBraziers(rt: SimRt): void {
  const lit = rt.actors.filter((e) => e.kind === 'fixture' && e.def === 'brazier' && mem(e, 'lit') === 1);
  if (lit.length === 0 || !raining(rt)) return;
  for (const e of lit) e.mem['lit'] = 0;
}

/** Lights the cold brazier under `box` (from the lantern). Returns whether one was lit; never in the rain. */
/**
 * Melts the closed melting gate under `box` (the rime across the gorge): its flag is set, the screen shakes,
 * and the whole gate opens with the next fixture refresh. Returns whether one melted.
 */
export function meltGate(rt: SimRt, box: Box): boolean {
  const e = fixtureAt(rt, 'gate', box, (f) => mem(f, 'on') === 1);
  if (e === null) return false;
  const thing = thingOf(rt, e);
  if (thing?.k !== 'gate' || thing.melts === undefined) return false;
  rt.state.flags[thing.melts] = true;
  rt.emit({ t: 'sfx', id: 'sfx_melt' });
  rt.emit({ t: 'shake', amount: 3 });
  return true;
}

/**
 * Tears away the closed web under `box` (Vindr's gust): its flag is set, and it opens with the next fixture
 * refresh. Returns whether one blew away.
 */
export function blowGate(rt: SimRt, box: Box): boolean {
  const e = fixtureAt(rt, 'gate', box, (f) => mem(f, 'on') === 1);
  if (e === null) return false;
  const thing = thingOf(rt, e);
  if (thing?.k !== 'gate' || thing.blows === undefined) return false;
  rt.state.flags[thing.blows] = true;
  rt.emit({ t: 'sfx', id: 'sfx_gust' });
  return true;
}

export function lightBrazier(rt: SimRt, box: Box): boolean {
  if (raining(rt)) return false;
  const e = fixtureAt(rt, 'brazier', box, (f) => mem(f, 'lit') !== 1);
  if (e === null) return false;
  e.mem['lit'] = 1;
  rt.emit({ t: 'sfx', id: 'sfx_fire' });
  return true;
}

/** Burning tiles hurt the hero on touch; the shield does not help. */
export function fixtureHazards(rt: SimRt): void {
  const heroBox = at(rt.hero.hurt, rt.hero.pos);
  for (const e of rt.actors) {
    if (e.kind !== 'fixture' || e.def !== 'fire' || mem(e, 'on') !== 1) continue;
    if (!overlaps(heroBox, at(FLAME_BOX, e.pos))) continue;
    if (hurtHero(rt, e, FIRE.amount, FIRE.knock, PIERCE_SHIELD)) {
      rt.emit({ t: 'sfx', id: 'sfx_fire' });
      return;
    }
  }
}
