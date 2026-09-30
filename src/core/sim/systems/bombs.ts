import { createProp } from '../../actors/prop';
import { changeState } from '../../actors/fsm';
import { HERO_MACHINE } from '../../actors/hero';
import { mem, setAnim, type Entity } from '../../actors/entity';
import { HEAVY, PIERCE_SHIELD } from '../../combat/hit';
import { EMPTY_FRAME } from '../../input/actions';
import { at, overlaps, type Box } from '../../math/box';
import { DIR_VEC } from '../../math/dir';
import { normalize, sub, type Vec } from '../../math/vec';
import { applyEffect } from '../../story/effects';
import { gridSolidAt } from '../../world/collision';
import type { SimRt } from '../rt';
import { damageActor, hurtHero } from './combat';
import { blastCover } from './cover';
import { openCracks, strikeSwitch, strikeWheel } from './fixtures';
import { heroCtx } from './hero';
import { blastProp, isResting, propDef } from './props';

/** Bomb numbers: px, ticks and quarter hearts. */
export const BOMB = {
  /** Live bombs at once. */
  most: 2,
  /** The last ticks of the fuse blink. */
  blinkAt: 32,
  /** The blast: a square this wide round the bomb's feet. */
  reach: 40,
  toFoes: 8,
  toAsk: 4,
  knock: 6,
} as const;

const isBomb = (rt: SimRt, e: Entity): boolean => e.kind === 'prop' && propDef(rt, e).fuse !== undefined;

/**
 * The bombs' item key: sets a lit bomb down just ahead of Ask (at their feet if a wall is in the way), at
 * most two at once. It can then be lifted and thrown like any prop until it goes off.
 */
export function placeBomb(rt: SimRt): boolean {
  if ((rt.state.inv.items.bombs ?? 0) < 1) {
    rt.emit({ t: 'sfx', id: 'sfx_fizzle' });
    return false;
  }
  if (rt.actors.filter((a) => isBomb(rt, a)).length >= BOMB.most) return false;
  const def = rt.db.props.bomb;
  const d = DIR_VEC[rt.hero.facing];
  const ahead = { x: rt.hero.pos.x + d.x * 12, y: rt.hero.pos.y + d.y * 12 };
  const walls = gridSolidAt(rt.screen.collision, () => true);
  const box = at(def.body, ahead);
  const blocked =
    walls(Math.floor(box.x / 16), Math.floor(box.y / 16)) ||
    walls(Math.floor((box.x + box.w - 1) / 16), Math.floor((box.y + box.h - 1) / 16));
  const e = createProp(rt.newId(), def, blocked ? { ...rt.hero.pos } : ahead, -1);
  e.mem['fuse'] = def.fuse ?? 0;
  setAnim(e, 'fuse');
  rt.actors.push(e);
  applyEffect({ k: 'take', item: 'bombs' }, rt);
  changeState(HERO_MACHINE, rt.hero, 'toss', heroCtx(rt, EMPTY_FRAME));
  rt.emit({ t: 'sfx', id: 'sfx_fuse' });
  return true;
}

/** Burns down every lit fuse (on the ground, overhead or in flight); at zero the bomb goes off. */
export function stepBombs(rt: SimRt): void {
  if (!rt.actors.some((a) => isBomb(rt, a))) return;
  for (const e of [...rt.actors]) {
    if (!isBomb(rt, e) || !rt.actors.includes(e)) continue;
    const left = mem(e, 'fuse') - 1;
    e.mem['fuse'] = left;
    if (left === BOMB.blinkAt) setAnim(e, 'blink');
    if (left > 0) continue;
    rt.actors = rt.actors.filter((a) => a !== e);
    if (rt.hero.mem['carrying'] === e.id) rt.hero.mem['carrying'] = 0;
    blast(rt, { ...e.pos });
  }
}

/**
 * A blast round `pos` (a bomb's feet): foes take a heavy force blow (a shell that `cracks` to force
 * breaks), Ask is hurt through the shield, props that break in a blast break and other bombs go off next,
 * switches are struck, cracked walls and rocks open, and cover is torn up (drifts too).
 */
export function blast(rt: SimRt, pos: Vec): void {
  const half = BOMB.reach / 2;
  const box: Box = { x: pos.x - half, y: pos.y - half - 6, w: BOMB.reach, h: BOMB.reach };
  const away = (p: Vec): Vec => {
    const d = sub(p, pos);
    return d.x === 0 && d.y === 0 ? { x: 0, y: 1 } : normalize(d);
  };
  for (const a of [...rt.actors]) {
    if (!rt.actors.includes(a) || !overlaps(box, at(a.hurt, a.pos))) continue;
    if (a.kind === 'enemy')
      damageActor(rt, a, {
        amount: BOMB.toFoes,
        element: 'force',
        knock: BOMB.knock,
        dir: away(a.pos),
        faction: 'hero',
        tags: HEAVY,
      });
    else if (a.kind === 'prop' && isBomb(rt, a)) a.mem['fuse'] = Math.min(mem(a, 'fuse'), 2);
    else if (a.kind === 'prop' && isResting(a)) blastProp(rt, a);
  }
  if (overlaps(box, at(rt.hero.hurt, rt.hero.pos)))
    hurtHero(rt, { pos, faction: 'env' }, BOMB.toAsk, BOMB.knock, PIERCE_SHIELD);
  for (let lit = strikeSwitch(rt, box); lit; lit = strikeSwitch(rt, box));
  strikeWheel(rt, box);
  openCracks(rt, box);
  blastCover(rt, box);
  rt.emit({ t: 'blast', x: pos.x, y: pos.y });
  rt.emit({ t: 'shake', amount: 3 });
  rt.emit({ t: 'sfx', id: 'sfx_bomb' });
}
