import { mem, setAnim, type Entity } from '../../actors/entity';
import { at, overlaps, type Box } from '../../math/box';
import { applyEffect, giveItem } from '../../story/effects';
import { TILE } from '../../world/dims';
import type { SimRt } from '../rt';
import { startStory } from './story';

/**
 * Opens the closed, visible chest under `probe`: saves it as opened, hands over what it holds and shows the
 * found line. Returns whether a chest was opened.
 */
export function openChest(rt: SimRt, probe: Box): boolean {
  for (const e of rt.actors) {
    if (e.kind !== 'fixture' || e.def !== 'chest' || mem(e, 'wait') === 1 || e.anim === 'open') continue;
    if (mem(e, 'sunk') === 1 || !overlaps(probe, at(e.body, e.pos))) continue;
    if (takeChest(rt, e)) return true;
  }
  return false;
}

/** Takes the sunk chest under a diving Ask's feet. Returns whether one was taken. */
export function takeSunkChest(rt: SimRt): boolean {
  if (rt.hero.fsm.s !== 'dive') return false;
  const tx = Math.floor(rt.hero.pos.x / TILE);
  const ty = Math.floor((rt.hero.pos.y - 1) / TILE);
  for (const e of rt.actors) {
    if (e.kind !== 'fixture' || e.def !== 'chest' || mem(e, 'sunk') !== 1 || e.anim === 'open') continue;
    if (mem(e, 'wait') === 1 || mem(e, 'tx') !== tx || mem(e, 'ty') !== ty) continue;
    if (takeChest(rt, e)) return true;
  }
  return false;
}

/** Saves the chest as opened, hands over what it holds and shows the found line. */
function takeChest(rt: SimRt, e: Entity): boolean {
  const thing = rt.db.screens[rt.screen.id].things[mem(e, 'thing')];
  if (thing?.k !== 'chest') return false;
  rt.state.world.opened.push(thing.id);
  setAnim(e, 'open');
  rt.emit({ t: 'sfx', id: 'sfx_chest' });
  const gift = thing.gives;
  if ('item' in gift) giveItem(rt, gift.item, gift.n ?? 1);
  else applyEffect({ k: 'silver', n: gift.silver }, rt);
  if (thing.learn !== undefined) applyEffect({ k: 'learn', galdr: thing.learn }, rt);
  rt.emit({ t: 'sfx', id: 'sfx_itemget' });
  const text = thing.text ?? ('item' in gift ? rt.db.items[gift.item].found : gift.text);
  startStory(rt, [{ k: 'say', who: null, text }]);
  return true;
}
