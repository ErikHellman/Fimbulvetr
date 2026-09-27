import { createEntity, mem, type Entity } from '../../actors/entity';
import type { DropKind } from '../../combat/drops';
import { at, overlaps } from '../../math/box';
import type { Vec } from '../../math/vec';
import { PURSE_CAP } from '../../story/effects';
import type { SimRt } from '../rt';

/** Pieces of heart that make one heart container's worth. */
export const PIECES_PER_HEART = 4;
/** Quarter hearts per heart. */
const HEART = 4;
const MAX_HP = 80;
/** Dropped hearts and silver vanish after this many ticks (10 s); the view blinks them near the end. */
export const DROP_TICKS = 600;

export function createPiece(id: number, pos: Vec, thingIndex: number): Entity {
  const e = createEntity({
    id,
    kind: 'pickup',
    def: 'heart_piece',
    art: 'pickup_heart_piece',
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

/**
 * Walking over a pickup collects it: a dropped heart heals a heart, silver adds one, and every fourth piece
 * of heart adds a heart and refills health. Drops that are left lying run out.
 */
export function collectPickups(rt: SimRt): void {
  const heroBox = at(rt.hero.body, rt.hero.pos);
  for (const e of [...rt.actors]) {
    if (e.kind !== 'pickup') continue;
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
      rt.emit({ t: 'sfx', id: 'sfx_itemget' });
      continue;
    }
    if (e.def === 'silver') {
      const hero = rt.state.hero;
      hero.silver = Math.min(PURSE_CAP[hero.purse], hero.silver + 1);
      rt.emit({ t: 'sfx', id: 'sfx_buy' });
      continue;
    }
    const thing = rt.db.screens[rt.screen.id].things[mem(e, 'thing')];
    if (thing?.k !== 'piece') continue;
    const w = rt.state.world;
    if (!w.pieces.includes(thing.id)) w.pieces.push(thing.id);
    rt.state.inv.items.heart_piece = w.pieces.length % PIECES_PER_HEART;
    if (w.pieces.length % PIECES_PER_HEART === 0) {
      rt.hero.maxHp = Math.min(MAX_HP, rt.hero.maxHp + HEART);
      rt.hero.hp = rt.hero.maxHp;
    }
    rt.emit({ t: 'itemGet', item: 'heart_piece' });
    rt.emit({ t: 'sfx', id: 'sfx_itemget' });
  }
}
