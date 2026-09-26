import { createEntity, mem, type Entity } from '../../actors/entity';
import { at, overlaps } from '../../math/box';
import type { Vec } from '../../math/vec';
import type { SimRt } from '../rt';

/** Pieces of heart that make one heart container's worth. */
export const PIECES_PER_HEART = 4;
/** Quarter hearts per heart. */
const HEART = 4;
const MAX_HP = 80;

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

/** Walking over a pickup collects it. Every fourth piece of heart adds a heart and refills health. */
export function collectPickups(rt: SimRt): void {
  const heroBox = at(rt.hero.body, rt.hero.pos);
  for (const e of [...rt.actors]) {
    if (e.kind !== 'pickup' || !overlaps(heroBox, at(e.body, e.pos))) continue;
    const thing = rt.db.screens[rt.screen.id].things[mem(e, 'thing')];
    rt.actors = rt.actors.filter((a) => a !== e);
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
