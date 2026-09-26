import { changeState } from '../../actors/fsm';
import { HERO_MACHINE, type HeroCtx } from '../../actors/hero';
import { EMPTY_FRAME, type InputFrame } from '../../input/actions';
import { at } from '../../math/box';
import type { Vec } from '../../math/vec';
import { ledgeHop } from '../../world/collision';
import type { SimRt } from '../rt';
import { heroSolidAt } from './movement';

export function heroCtx(rt: SimRt, input: InputFrame): HeroCtx {
  return {
    input,
    tuning: rt.db.tuning,
    hasShield: rt.state.inv.shield,
    armed: rt.state.inv.weapon !== 'none',
    ledgeHop: (dir) => ledgeHop(rt.screen.collision, at(rt.hero.body, rt.hero.pos), dir, heroSolidAt(rt)),
    emit: (ev) => {
      rt.emit(ev);
    },
  };
}

/** Puts the hero at `p`, still and in the `move` state. */
export function placeHero(rt: SimRt, p: Vec): void {
  const h = rt.hero;
  h.pos = { ...p };
  h.prev = { ...p };
  h.vel = { x: 0, y: 0 };
  h.knock = { x: 0, y: 0 };
  changeState(HERO_MACHINE, h, 'move', heroCtx(rt, EMPTY_FRAME));
}

/** Copies the live hero back into the saved state. */
export function syncHero(rt: SimRt): void {
  const h = rt.state.hero;
  h.screen = rt.screen.id;
  h.x = rt.hero.pos.x;
  h.y = rt.hero.pos.y;
  h.facing = rt.hero.facing;
  h.hp = rt.hero.hp;
  h.maxHp = rt.hero.maxHp;
}
