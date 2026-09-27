import { changeState } from '../../actors/fsm';
import { HERO_MACHINE } from '../../actors/hero';
import { EMPTY_FRAME, wasPressed, type InputFrame } from '../../input/actions';
import type { SimRt } from '../rt';
import { heroCtx } from './hero';
import { enterScreen } from './transition';

/** Ticks the game-over panel shows before Continue is accepted (so a held button cannot skip it). */
export const CONTINUE_DELAY = 30;
/** Health after Continue: three hearts (or the maximum, if lower). */
export const CONTINUE_HP = 12;

/** A hero at 0 hp falls, whatever hurt them: the game enters `over` mode. */
export function checkDeath(rt: SimRt): void {
  if (rt.hero.hp > 0 || rt.mode === 'over') return;
  changeState(HERO_MACHINE, rt.hero, 'dying', heroCtx(rt, EMPTY_FRAME));
  rt.mode = 'over';
  rt.emit({ t: 'sfx', id: 'sfx_die' });
}

/** In `over` mode only the fall advances; after it, confirm or interact continues. */
export function stepOver(rt: SimRt, input: InputFrame): void {
  const h = rt.hero;
  h.fsm.t += 1;
  h.animT += 1;
  const fall = rt.db.tuning.hero.dyingTicks;
  if (h.fsm.t === fall) rt.emit({ t: 'gameOver' });
  if (h.fsm.t < fall + CONTINUE_DELAY) return;
  if (wasPressed(input, 'confirm') || wasPressed(input, 'interact')) continueGame(rt);
}

/**
 * Continue: back where the hero entered this screen, with three hearts. Flags, items, keys and chests are
 * kept; the screen's actors respawn.
 */
export function continueGame(rt: SimRt): void {
  rt.hero.hp = Math.min(rt.hero.maxHp, CONTINUE_HP);
  rt.hero.iframes = 0;
  rt.hero.flash = 0;
  rt.mode = 'play';
  const { x, y, facing } = rt.entry;
  enterScreen(rt, rt.screen.id, { x, y }, facing);
  rt.emit({ t: 'screenEntered', screen: rt.screen.id });
  rt.emit({ t: 'autosave' });
}
