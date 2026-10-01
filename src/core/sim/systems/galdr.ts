import type { GaldrId } from '@content/ids';
import { changeState } from '../../actors/fsm';
import { HERO_MACHINE } from '../../actors/hero';
import { wasPressed, type InputFrame } from '../../input/actions';
import type { SimRt } from '../rt';
import { castEldr } from './eldr';
import { heroCtx } from './hero';
import { startStory } from './story';

/**
 * What each galdr does when sung. A song returns `pay` to have its seiðr taken now and the cast pose
 * struck, `later` when it takes the seiðr itself (Farvegr, once a stone is chosen), or `fizzle`.
 */
type Song = (rt: SimRt, input: InputFrame) => 'pay' | 'later' | 'fizzle';

/** Farvegr is sung under the open sky of the overworld: then it opens the picker of woken stones. */
function farvegr(rt: SimRt): 'later' | 'fizzle' {
  const def = rt.db.screens[rt.screen.id];
  if (def.indoor === true || def.dungeon !== undefined || rt.db.layout.at[rt.screen.id] === undefined)
    return 'fizzle';
  startStory(rt, [{ k: 'farvegr' }]);
  return 'later';
}

const SONGS: Partial<Record<GaldrId, Song>> = {
  eldr: (rt, input) => {
    castEldr(rt, input);
    return 'pay';
  },
  farvegr,
};

/**
 * The galdr button in play: Ask sings the readied galdr (the first in `inv.galdr`), paying its seiðr; with
 * too little seiðr the song fizzles. Only a hero standing free can sing.
 */
export function castGaldr(rt: SimRt, input: InputFrame): void {
  if (!wasPressed(input, 'galdr')) return;
  const s = rt.hero.fsm.s;
  if (s !== 'move' && s !== 'shield') return;
  const id = rt.state.inv.galdr[0];
  if (id === undefined) return;
  const song = SONGS[id];
  const cost = rt.db.galdr[id].cost;
  const hero = rt.state.hero;
  if (song === undefined || hero.seidr < cost) {
    rt.emit({ t: 'sfx', id: 'sfx_fizzle' });
    return;
  }
  const paid = song(rt, input);
  if (paid === 'fizzle') {
    rt.emit({ t: 'sfx', id: 'sfx_fizzle' });
    return;
  }
  if (paid === 'later') return;
  hero.seidr -= cost;
  changeState(HERO_MACHINE, rt.hero, 'cast', heroCtx(rt, input));
}
