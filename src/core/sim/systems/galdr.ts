import type { GaldrId } from '@content/ids';
import { changeState } from '../../actors/fsm';
import { HERO_MACHINE } from '../../actors/hero';
import { wasPressed, type InputFrame } from '../../input/actions';
import type { SimRt } from '../rt';
import { castEldr } from './eldr';
import { heroCtx } from './hero';

/** What each galdr does when sung; M2 knows Eldr only. */
const SONGS: Partial<Record<GaldrId, (rt: SimRt, input: InputFrame) => void>> = {
  eldr: castEldr,
};

/**
 * The galdr button in play: Ask sings the first galdr known (the only one in M2), paying its seiðr; with
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
  hero.seidr -= cost;
  song(rt, input);
  changeState(HERO_MACHINE, rt.hero, 'cast', heroCtx(rt, input));
}
