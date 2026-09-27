import { createEntity, mem, setAnim, type Entity } from '../../actors/entity';
import { PIERCE_SHIELD } from '../../combat/hit';
import { at, overlaps } from '../../math/box';
import { evalCond } from '../../story/cond';
import { SOLID } from '../../world/collision';
import { tileFeet, type Thing, type TilePos } from '../../world/screen';
import type { SimRt } from '../rt';
import { hurtHero } from './combat';
import { condCtx } from './story';

/** A fire tile's burn: half a heart, and no shield keeps it off. */
const FIRE = { amount: 2, knock: 4 } as const;
const TILE_BOX = { x: -8, y: -14, w: 16, h: 16 } as const;
const FLAME_BOX = { x: -6, y: -12, w: 12, h: 12 } as const;

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

/** One fixture per tile of a gate or fire thing (each tile animates and burns on its own). */
export function spawnFixtures(rt: SimRt, thing: Thing, index: number, out: Entity[]): void {
  if (thing.k !== 'gate' && thing.k !== 'fire') return;
  const art = thing.k === 'gate' ? `fix_${thing.art}` : 'fix_fire';
  for (let y = 0; y < thing.h; y++)
    for (let x = 0; x < thing.w; x++)
      out.push(fixture(rt.newId(), thing.k, art, { x: thing.at.x + x, y: thing.at.y + y }, index));
}

/** Whether a fixture is "on": a gate closed, a fire burning. */
function isOn(rt: SimRt, e: Entity): boolean {
  const thing = rt.db.screens[rt.screen.id].things[mem(e, 'thing')];
  const ctx = condCtx(rt);
  if (thing?.k === 'gate') return evalCond(thing.closed, ctx);
  if (thing?.k === 'fire') return evalCond(thing.when, ctx);
  return false;
}

const ANIMS: Readonly<Record<string, readonly [string, string]>> = {
  gate: ['closed', 'open'],
  fire: ['burn', 'out'],
};

/**
 * Re-evaluates every fixture's condition (a gate opens the tick its flag flips) and restamps collision
 * when a solid one changed. Runs in play and in story mode, so a cutscene can open a gate on screen.
 */
export function refreshFixtures(rt: SimRt): void {
  let changed = false;
  let opened = false;
  for (const e of rt.actors) {
    if (e.kind !== 'fixture') continue;
    const on = isOn(rt, e) ? 1 : 0;
    const was = e.mem['on'];
    if (was === on) continue;
    e.mem['on'] = on;
    if (was === 1 && e.def === 'gate' && !opened) {
      opened = true;
      rt.emit({ t: 'sfx', id: 'sfx_gate' });
    }
    const names = ANIMS[e.def];
    if (names !== undefined) setAnim(e, on === 1 ? names[0] : names[1]);
    if (e.def === 'gate') changed = true;
  }
  if (changed) stampCollision(rt);
}

/** collision = base terrain + the tiles of closed gates. */
export function stampCollision(rt: SimRt): void {
  const { base, collision } = rt.screen;
  collision.flags.set(base.flags);
  for (const e of rt.actors) {
    if (e.kind !== 'fixture' || e.def !== 'gate' || mem(e, 'on') !== 1) continue;
    const i = mem(e, 'ty') * collision.cols + mem(e, 'tx');
    collision.flags[i] = (collision.flags[i] ?? 0) | SOLID;
  }
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
