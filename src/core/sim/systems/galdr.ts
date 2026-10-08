import type { GaldrId } from '@content/ids';
import { changeState } from '../../actors/fsm';
import { HERO_MACHINE } from '../../actors/hero';
import { wasPressed, type InputFrame } from '../../input/actions';
import type { SimRt } from '../rt';
import { castBragd } from './bragd';
import { castEldr } from './eldr';
import { castIs } from './is';
import { castLjos } from './ljos';
import { castSkjalfti } from './skjalfti';
import { castVindr } from './vindr';
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

/** Hlíf's ward: the hits it absorbs, and how long it holds (20 s). */
export const HLIF = { hits: 3, ticks: 1200 } as const;

const SONGS: Partial<Record<GaldrId, Song>> = {
  hlif: (rt) => {
    rt.hero.mem['ward'] = HLIF.hits;
    rt.hero.mem['wardT'] = HLIF.ticks;
    rt.emit({ t: 'sfx', id: 'sfx_ward' });
    return 'pay';
  },
  eldr: (rt, input) => {
    castEldr(rt, input);
    return 'pay';
  },
  is: (rt, input) => {
    castIs(rt, input);
    return 'pay';
  },
  ljos: (rt) => {
    castLjos(rt);
    return 'pay';
  },
  farvegr,
  bragd: (rt) => {
    castBragd(rt);
    return 'pay';
  },
  vindr: (rt) => {
    castVindr(rt);
    return 'pay';
  },
  skjalfti: (rt) => {
    castSkjalfti(rt);
    return 'pay';
  },
};

/**
 * A rune-stave from an item slot: sings its galdr for no seiðr, strikes the cast pose and uses up one
 * stave. A song that fizzles, or only opens a picker (Farvegr), keeps the stave.
 */
export function singStave(rt: SimRt, input: InputFrame, id: GaldrId): boolean {
  const sung = SONGS[id]?.(rt, input) ?? 'fizzle';
  if (sung === 'fizzle') rt.emit({ t: 'sfx', id: 'sfx_fizzle' });
  if (sung !== 'pay') return false;
  changeState(HERO_MACHINE, rt.hero, 'cast', heroCtx(rt, input));
  return true;
}

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
