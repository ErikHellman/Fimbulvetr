import type { EnemyId } from '@content/ids';
import { setAnim, type Entity } from '../../actors/entity';
import { createEnemy } from '../../actors/enemies';
import { createCritter } from '../../actors/critters';
import { createProp } from '../../actors/prop';
import { dungeonOf } from '../../state/dungeons';
import { evalCond } from '../../story/cond';
import { isNight, seasonAt } from '../../clock/clock';
import { fnv1a, hashInts } from '../../math/hash';
import type { Vec } from '../../math/vec';
import { SOLID } from '../../world/collision';
import { TILE } from '../../world/dims';
import { tileFeet, type TilePos } from '../../world/screen';
import { owns } from '../../items/defs';
import { rollSpawns, type SpawnEntry, type SpawnTable } from '../../world/spawns';
import type { SimRt } from '../rt';
import { penOf } from './critters';
import { holdFloodOff } from './cover';
import { refreshFixtures, spawnFixtures, stampCollision } from './fixtures';
import { createHeart, createPiece, herbGrows } from './pickups';
import { placeNpcs } from './npcs';
import { holdBack } from './rooms';
import { condCtx } from './story';

/** Whether the current room's dungeon has lost its boss (who then never comes back). */
function bossDown(rt: SimRt): boolean {
  const dungeon = rt.db.screens[rt.screen.id].dungeon;
  return dungeon !== undefined && dungeonOf(rt.state, dungeon).bossDead;
}

/**
 * Builds the live actors of the current screen from its things, then the region's rolled enemies (kept
 * away from `heroAt`, where Ask is about to stand).
 */
export function spawnActors(rt: SimRt, heroAt: Vec = rt.hero.pos): Entity[] {
  rt.actors = spawnThings(rt);
  for (const e of rt.actors) holdBack(rt, e);
  placeNpcs(rt);
  refreshFixtures(rt, false);
  holdFloodOff(rt, rt.screen.cover, heroAt);
  stampCollision(rt);
  spawnRolled(rt, heroAt);
  return rt.actors;
}

/**
 * Runestone scaling: a mortal, non-boss foe on a lowland screen outside the dungeons grows with the stones
 * lit (`Tuning.stones`). Below the first step nothing is touched, so older states hash as before.
 */
export function scaleFoe(rt: SimRt, e: Entity): void {
  const def = rt.db.enemies[e.def as EnemyId];
  const screen = rt.db.screens[rt.screen.id];
  if (def.boss !== undefined || def.immortal || screen.dungeon !== undefined) return;
  if (!rt.db.lowlands.includes(screen.region)) return;
  const s = rt.db.tuning.stones;
  const tier = s.flags.filter((f) => rt.state.flags[f] === true).length;
  const pct = s.hpPct[tier] ?? 100;
  const blow = s.blow[tier] ?? 0;
  if (pct === 100 && blow === 0) return;
  e.maxHp = Math.ceil((def.hp * pct) / 100);
  e.hp = e.maxHp;
  e.mem['tier'] = tier;
}

/** Tiles of clear ground a rolled enemy keeps between itself and Ask's arrival. */
const SPAWN_CLEARANCE = 4;

/**
 * The region's spawn table on this screen's spawn points: rolled from (seed, day, screen, night) so the
 * same visit brings the same foes, and never from the combat RNG.
 */
function spawnRolled(rt: SimRt, heroAt: Vec): void {
  const def = rt.db.screens[rt.screen.id];
  if (!rt.rolled || def.spawns === undefined || def.dungeon !== undefined) return;
  const table = rt.db.spawns[def.region];
  if (table === undefined) return;
  const c = rt.state.clock;
  const night = isNight(c, rt.db.clock);
  const seed = hashInts(rt.state.seed, c.day, fnv1a(rt.screen.id), night ? 1 : 0);
  const g = rt.screen.collision;
  const hx = Math.floor(heroAt.x / TILE);
  const hy = Math.floor((heroAt.y - 1) / TILE);
  const free = (p: TilePos): boolean =>
    ((g.flags[p.y * g.cols + p.x] ?? SOLID) & SOLID) === 0 &&
    Math.max(Math.abs(p.x - hx), Math.abs(p.y - hy)) > SPAWN_CLEARANCE;
  const season = seasonAt(c, def.region, rt.db.clock);
  // Foes Ask has no way to beat yet (a mud-crab before bombs) are left out of the draw.
  const beatable = (e: SpawnEntry): boolean =>
    (rt.db.enemies[e.id].needs ?? []).every((item) => owns(rt.state.inv.items, item));
  const entries = Object.fromEntries(
    Object.entries(table.entries).map(([s, list]) => [s, list.filter(beatable)]),
  ) as SpawnTable['entries'];
  for (const r of rollSpawns({ ...table, entries }, season, night, def.spawns, seed, free)) {
    const e = createEnemy(rt.newId(), rt.db.enemies[r.id], tileFeet(r.at));
    e.mem['rolled'] = 1;
    scaleFoe(rt, e);
    rt.actors.push(e);
  }
}

function spawnThings(rt: SimRt): Entity[] {
  const out: Entity[] = [];
  const ctx = condCtx(rt);
  rt.db.screens[rt.screen.id].things.forEach((thing, index) => {
    switch (thing.k) {
      case 'enemy': {
        const def = rt.db.enemies[thing.id];
        if (!evalCond(thing.when, ctx) || (def.boss !== undefined && bossDown(rt))) break;
        const e = createEnemy(rt.newId(), def, tileFeet(thing.at));
        // The thing index is only kept for enemies that do something when they die.
        if (thing.onDeath !== undefined) e.mem['thing'] = index;
        if (thing.asleep === true) {
          e.mem['asleep'] = 1;
          e.iframes = 2;
          setAnim(e, 'sleep');
        }
        scaleFoe(rt, e);
        out.push(e);
        break;
      }
      case 'prop':
        if (evalCond(thing.when, ctx))
          out.push(createProp(rt.newId(), rt.db.props[thing.id], tileFeet(thing.at), index));
        break;
      case 'critter': {
        if (!evalCond(thing.when, ctx)) break;
        const pen = penOf(rt);
        const tag = thing.tag;
        let at = thing.at;
        let penned = false;
        if (pen !== null && tag !== undefined && ((rt.state.world.vars[pen.v] ?? 0) & (1 << tag)) !== 0) {
          penned = true;
          at = { x: pen.at.x + (tag % pen.w), y: pen.at.y + (Math.floor(tag / pen.w) % pen.h) };
        }
        const e = createCritter(rt.newId(), rt.db.critters[thing.id], tileFeet(at), index);
        if (tag !== undefined) e.mem['tag'] = tag;
        if (penned) e.mem['penned'] = 1;
        out.push(e);
        break;
      }
      case 'piece':
        if (!rt.state.world.pieces.includes(thing.id))
          out.push(createPiece(rt.newId(), tileFeet(thing.at), index));
        break;
      case 'heart':
        if (!rt.state.world.opened.includes(thing.id))
          out.push(createHeart(rt.newId(), tileFeet(thing.at), index));
        break;
      case 'herb':
        if (herbGrows(rt, thing))
          out.push(createPiece(rt.newId(), tileFeet(thing.at), index, `herb_${thing.item}`));
        break;
      case 'fire':
      case 'gate':
      case 'chest':
      case 'lock':
      case 'shutter':
      case 'switch':
      case 'brazier':
      case 'bridge':
      case 'crack':
      case 'wheel':
      case 'warp':
      case 'seal':
        spawnFixtures(rt, thing, index, out);
        break;
      case 'door':
      case 'sign':
      case 'use':
      case 'trigger':
      case 'drop':
      case 'pen':
        break;
      default: {
        const never: never = thing;
        throw new Error(`unknown thing ${JSON.stringify(never)}`);
      }
    }
  });
  return out;
}
