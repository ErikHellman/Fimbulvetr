import { createEntity, mem, type Entity } from '../../actors/entity';
import type { DropKind } from '../../combat/drops';
import { at, overlaps } from '../../math/box';
import type { Vec } from '../../math/vec';
import { HEART, PURSE_CAP, giveItem, grantPiece } from '../../story/effects';
import { coverAt } from '../../world/cover';
import { TILE } from '../../world/dims';
import { seasonAt } from '../../clock/clock';
import type { Thing } from '../../world/screen';
import type { SimRt } from '../rt';
import { startStory } from './story';
import { itemMax, owns } from '../../items/defs';

export { PIECES_PER_HEART } from '../../story/effects';
/** Dropped hearts and silver vanish after this many ticks (10 s); the view blinks them near the end. */
export const DROP_TICKS = 600;

export function createPiece(id: number, pos: Vec, thingIndex: number, def = 'heart_piece'): Entity {
  const e = createEntity({
    id,
    kind: 'pickup',
    def,
    art: `pickup_${def}`,
    pos,
    facing: 's',
    body: { x: -6, y: -10, w: 12, h: 10 },
    hurt: { x: -6, y: -12, w: 12, h: 12 },
    faction: 'env',
    hp: 1,
    maxHp: 1,
    state: 'idle',
  });
  e.mem['thing'] = thingIndex;
  return e;
}

/** Whether a herb stands this season on the current screen (it is in season and not yet picked). */
export function herbGrows(rt: SimRt, herb: Extract<Thing, { k: 'herb' }>): boolean {
  const c = rt.state.clock;
  const region = rt.db.screens[rt.screen.id].region;
  return seasonAt(c, region, rt.db.clock) === herb.season && rt.state.world.vars[herb.id] !== c.epoch + 1;
}

/** A heart container lying in a room, waiting to be taken. */
export const createHeart = (id: number, pos: Vec, thingIndex: number): Entity =>
  createPiece(id, pos, thingIndex, 'heart_container');

/** Whether standing cover that hides things (leaf piles) covers the pickup's tile. */
function hiddenByCover(rt: SimRt, e: Entity): boolean {
  const id = coverAt(
    rt.screen.cover,
    rt.db.coverOrder,
    Math.floor(e.pos.x / TILE),
    Math.floor((e.pos.y - 1) / TILE),
  );
  return id !== null && rt.db.cover[id].hides === true;
}

/** A heart or silver dropped by an enemy. It lasts `DROP_TICKS`. */
export function createDrop(id: number, kind: DropKind, pos: Vec): Entity {
  const e = createEntity({
    id,
    kind: 'pickup',
    def: kind,
    art: `pickup_${kind}`,
    pos,
    facing: 's',
    body: { x: -5, y: -8, w: 10, h: 8 },
    hurt: { x: -5, y: -10, w: 10, h: 10 },
    faction: 'env',
    hp: 1,
    maxHp: 1,
    state: 'idle',
  });
  e.mem['ttl'] = DROP_TICKS;
  return e;
}

/** Seiðr in a dropped jar. */
export const SEIDR_JAR = 2;
/** Bombs in a dropped bundle. */
export const BOMB_BUNDLE = 4;
/** Arrows in a dropped bundle. */
export const ARROW_BUNDLE = 5;

/**
 * Leaves a drop at `pos`, unless it is bombs and Ask has none to refill (nothing drops then; the roll
 * that chose it is already spent, so replays stay exact).
 */
export function spillDrop(rt: SimRt, kind: DropKind, pos: Vec): void {
  if (kind === 'bombs' && !owns(rt.state.inv.items, 'bombs')) return;
  if (kind === 'arrows' && !owns(rt.state.inv.items, 'bow')) return;
  rt.actors.push(createDrop(rt.newId(), kind, pos));
}

/**
 * Walking over a pickup collects it: a dropped heart heals a heart, silver adds one, and every fourth piece
 * of heart adds a heart and refills health. Drops that are left lying run out.
 */
export function collectPickups(rt: SimRt): void {
  const heroBox = at(rt.hero.body, rt.hero.pos);
  for (const e of [...rt.actors]) {
    if (e.kind !== 'pickup') continue;
    const hidden = mem(e, 'wait') === 1 || hiddenByCover(rt, e) ? 1 : 0;
    if (mem(e, 'hidden') !== hidden) e.mem['hidden'] = hidden;
    if (hidden === 1) continue;
    if (!overlaps(heroBox, at(e.body, e.pos))) {
      if (mem(e, 'ttl') > 0) {
        e.mem['ttl'] = mem(e, 'ttl') - 1;
        if (mem(e, 'ttl') === 0) rt.actors = rt.actors.filter((a) => a !== e);
      }
      continue;
    }
    rt.actors = rt.actors.filter((a) => a !== e);
    if (e.def === 'heart') {
      rt.hero.hp = Math.min(rt.hero.maxHp, rt.hero.hp + HEART);
      rt.emit({ t: 'sfx', id: 'sfx_pickup' });
      continue;
    }
    if (e.def === 'silver') {
      const hero = rt.state.hero;
      hero.silver = Math.min(PURSE_CAP[hero.purse], hero.silver + 1);
      rt.emit({ t: 'sfx', id: 'sfx_pickup' });
      continue;
    }
    if (e.def === 'bombs') {
      const inv = rt.state.inv;
      inv.items.bombs = Math.min(
        itemMax(rt.db.items, inv.items, 'bombs'),
        (inv.items.bombs ?? 0) + BOMB_BUNDLE,
      );
      rt.emit({ t: 'sfx', id: 'sfx_pickup' });
      continue;
    }
    if (e.def === 'arrows') {
      const inv = rt.state.inv;
      inv.items.arrows = Math.min(
        itemMax(rt.db.items, inv.items, 'arrows'),
        (inv.items.arrows ?? 0) + ARROW_BUNDLE,
      );
      rt.emit({ t: 'sfx', id: 'sfx_pickup' });
      continue;
    }
    if (e.def === 'seidr') {
      const hero = rt.state.hero;
      hero.seidr = Math.min(hero.maxSeidr, hero.seidr + SEIDR_JAR);
      rt.emit({ t: 'sfx', id: 'sfx_pickup' });
      continue;
    }
    const thing = rt.db.screens[rt.screen.id].things[mem(e, 'thing')];
    if (thing?.k === 'heart') {
      rt.state.world.opened.push(thing.id);
      giveItem(rt, 'heart_container', 1);
      rt.emit({ t: 'sfx', id: 'sfx_itemget' });
      startStory(rt, [{ k: 'say', who: null, text: rt.db.items.heart_container.found }]);
      return;
    }
    if (thing?.k === 'herb') {
      rt.state.world.vars[thing.id] = rt.state.clock.epoch + 1;
      giveItem(rt, thing.item, 1);
      rt.emit({ t: 'sfx', id: 'sfx_pickup' });
      continue;
    }
    if (thing?.k !== 'piece') continue;
    grantPiece(rt, thing.id);
  }
}
