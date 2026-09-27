import { createEntity, mem, setAnim, type Entity } from '../../actors/entity';
import { heroSwordBox } from '../../actors/hero';
import { PIERCE_SHIELD } from '../../combat/hit';
import type { InputFrame } from '../../input/actions';
import { at, overlaps, type Box } from '../../math/box';
import { DIR_VEC } from '../../math/dir';
import { dungeonOf } from '../../state/dungeons';
import { evalCond } from '../../story/cond';
import { LOW, SOLID } from '../../world/collision';
import { TILE } from '../../world/dims';
import { tileFeet, type Thing, type TilePos } from '../../world/screen';
import type { SimRt } from '../rt';
import { hurtHero } from './combat';
import { wallTiles } from './props';
import { revealThings, roomSignal } from './rooms';
import { raining } from './weather';
import { walkTiles } from './cover';
import { condCtx, probeBox } from './story';

/** A fire tile's burn: half a heart, and no shield keeps it off. */
const FIRE = { amount: 2, knock: 4 } as const;
const TILE_BOX = { x: -8, y: -14, w: 16, h: 16 } as const;
const FLAME_BOX = { x: -6, y: -12, w: 12, h: 12 } as const;

/**
 * Fixture kinds: whether they block the way (while on, or always) and their on/off animations. A chest
 * has none here; it shows open or closed.
 */
const KINDS: Readonly<
  Record<string, { readonly solid: 'never' | 'on' | 'always'; readonly anims?: readonly [string, string] }>
> = {
  gate: { solid: 'on', anims: ['closed', 'open'] },
  fire: { solid: 'never', anims: ['burn', 'out'] },
  chest: { solid: 'on' },
  lock: { solid: 'on', anims: ['closed', 'open'] },
  shutter: { solid: 'on', anims: ['closed', 'open'] },
  switch: { solid: 'always', anims: ['on', 'off'] },
  brazier: { solid: 'always', anims: ['burn', 'out'] },
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
 * Spawns fixtures: one per tile of a gate, fire, lock or shutter (each tile animates on its own), one per
 * chest (open if it was opened before), switch and brazier.
 */
export function spawnFixtures(rt: SimRt, thing: Thing, index: number, out: Entity[]): void {
  switch (thing.k) {
    case 'chest': {
      const e = fixture(rt.newId(), 'chest', 'fix_chest', thing.at, index);
      setAnim(e, rt.state.world.opened.includes(thing.id) ? 'open' : 'closed');
      out.push(e);
      return;
    }
    case 'switch':
      out.push(fixture(rt.newId(), 'switch', 'fix_switch', thing.at, index));
      return;
    case 'brazier': {
      const e = fixture(rt.newId(), 'brazier', 'fix_brazier', thing.at, index);
      e.mem['lit'] = thing.lit === true ? 1 : 0;
      out.push(e);
      return;
    }
    case 'gate':
    case 'fire':
    case 'lock':
    case 'shutter': {
      const art = thing.k === 'gate' ? `fix_${thing.art}` : `fix_${thing.k}`;
      for (let y = 0; y < thing.h; y++)
        for (let x = 0; x < thing.w; x++)
          out.push(fixture(rt.newId(), thing.k, art, { x: thing.at.x + x, y: thing.at.y + y }, index));
      return;
    }
    default:
      return;
  }
}

const thingOf = (rt: SimRt, e: Entity): Thing | undefined =>
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
    case 'fire':
      return evalCond(thing.when, condCtx(rt));
    case 'chest':
      return mem(e, 'wait') !== 1;
    case 'lock':
      return !(doorsOf(rt)?.includes(thing.id) ?? false);
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
    if (kind?.solid === 'on') changed = true;
  }
  for (const id of sounds) rt.emit({ t: 'sfx', id });
  if (changed) stampCollision(rt);
}

/**
 * collision = base terrain + the tiles of solid fixtures (closed gates, locks and shutters, chests in
 * sight, switches, braziers) + wall props (root blocks, vines).
 */
export function stampCollision(rt: SimRt): void {
  const { base, collision } = rt.screen;
  collision.flags.set(base.flags);
  // Ice lets Ask walk on water (and blocks nothing in flight).
  for (const i of walkTiles(rt)) collision.flags[i] = (collision.flags[i] ?? 0) & ~(SOLID | LOW);
  for (const t of wallTiles(rt)) {
    const i = t.y * collision.cols + t.x;
    collision.flags[i] = (collision.flags[i] ?? 0) | SOLID;
  }
  for (const e of rt.actors) {
    if (e.kind !== 'fixture') continue;
    const solid = KINDS[e.def]?.solid;
    if (solid === 'never' || (solid === 'on' && mem(e, 'on') !== 1)) continue;
    const i = mem(e, 'ty') * collision.cols + mem(e, 'tx');
    collision.flags[i] = (collision.flags[i] ?? 0) | SOLID;
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

/** Opens the locked door under `box` with a small key, for good. Returns whether one was opened. */
export function unlockAt(rt: SimRt, box: Box): boolean {
  const doors = doorsOf(rt);
  const id = rt.db.screens[rt.screen.id].dungeon;
  if (doors === null || id === undefined) return false;
  const e = fixtureAt(rt, 'lock', box, (f) => mem(f, 'on') === 1);
  const thing = e === null ? undefined : thingOf(rt, e);
  const d = dungeonOf(rt.state, id);
  if (thing?.k !== 'lock' || d.keys < 1) return false;
  d.keys -= 1;
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

/** The sword lights the switches it strikes (a spin can light several). */
export function swordSwitches(rt: SimRt): void {
  const box = heroSwordBox(rt.hero, rt.db.tuning, rt.state.inv.weapon);
  if (box === null) return;
  for (let lit = strikeSwitch(rt, box); lit; lit = strikeSwitch(rt, box));
}

/** Lights the unlit switch under `box` (a sword or boomerang strike). Returns whether one was lit. */
export function strikeSwitch(rt: SimRt, box: Box): boolean {
  const e = fixtureAt(rt, 'switch', box, (f) => mem(f, 'lit') !== 1);
  if (e === null) return false;
  e.mem['lit'] = 1;
  rt.emit({ t: 'sfx', id: 'sfx_switch' });
  return true;
}

/** Rain puts out every burning brazier in the open (they stay out until lit again). */
function douseBraziers(rt: SimRt): void {
  const lit = rt.actors.filter((e) => e.kind === 'fixture' && e.def === 'brazier' && mem(e, 'lit') === 1);
  if (lit.length === 0 || !raining(rt)) return;
  for (const e of lit) e.mem['lit'] = 0;
}

/** Lights the cold brazier under `box` (from the lantern). Returns whether one was lit; never in the rain. */
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
