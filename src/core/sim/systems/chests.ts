import { mem, setAnim } from '../../actors/entity';
import { at, overlaps, type Box } from '../../math/box';
import { applyEffect, giveItem } from '../../story/effects';
import type { SimRt } from '../rt';
import { startStory } from './story';

/**
 * Opens the closed, visible chest under `probe`: saves it as opened, hands over what it holds and shows the
 * found line. Returns whether a chest was opened.
 */
export function openChest(rt: SimRt, probe: Box): boolean {
  for (const e of rt.actors) {
    if (e.kind !== 'fixture' || e.def !== 'chest' || mem(e, 'wait') === 1 || e.anim === 'open') continue;
    if (!overlaps(probe, at(e.body, e.pos))) continue;
    const thing = rt.db.screens[rt.screen.id].things[mem(e, 'thing')];
    if (thing?.k !== 'chest') continue;
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
  return false;
}
