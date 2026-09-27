import type { ItemId, NpcId, ShopId } from '@content/ids';
import { setAnim, type Entity } from '../../actors/entity';
import { changeState } from '../../actors/fsm';
import { HERO_MACHINE } from '../../actors/hero';
import type { L10n } from '../../i18n/t';
import { EMPTY_FRAME, wasPressed, type InputFrame } from '../../input/actions';
import { at, overlaps, type Box } from '../../math/box';
import { DIR_VEC, dirFromVec } from '../../math/dir';
import { length, sub, type Vec } from '../../math/vec';
import { TILE } from '../../world/dims';
import { tileFeet } from '../../world/screen';
import { evalCond, type CondCtx } from '../../story/cond';
import {
  nodeOf,
  openDialogue,
  revealTicks,
  stepDialogue,
  visibleChoices,
  type DialogueEnv,
  type Speaker,
} from '../../story/dialogue';
import { applyEffect, type Effect } from '../../story/effects';
import { buy, visibleStock, type BuyResult } from '../../story/shop';
import {
  FADE_STEP_TICKS,
  MAX_INSTANT_STEPS,
  newStoryRun,
  type ActorRef,
  type Step,
  type StoryRun,
} from '../../story/script';
import type { SimRt } from '../rt';
import { openChest } from './chests';
import { unlockAt } from './fixtures';
import { heroCtx } from './hero';
import { placeNpcs } from './npcs';
import { tryLift } from './props';
import { enterScreen, markVisited } from './transition';

/** What the UI shows for the running script. */
export type StoryUi =
  | {
      readonly k: 'text' | 'card';
      readonly who: Speaker;
      readonly text: L10n;
      /** Share of the text revealed so far, 0…1. */
      readonly shown: number;
      readonly choices: readonly L10n[];
      readonly cursor: number;
    }
  | {
      readonly k: 'shop';
      readonly shop: ShopId;
      readonly name: L10n;
      readonly rows: readonly { readonly item: ItemId; readonly price: number }[];
      /** Rows, then one more for "leave". */
      readonly cursor: number;
      readonly last: BuyResult | null;
    }
  | null;

const ADVANCE = ['confirm', 'interact', 'sword'] as const;
const advancePressed = (input: InputFrame): boolean => ADVANCE.some((a) => wasPressed(input, a));

export const condCtx = (rt: SimRt): CondCtx => ({ state: rt.state, quests: rt.db.quests });

function dialogueEnv(rt: SimRt, id: keyof SimRt['db']['dialogue']): DialogueEnv {
  const def = rt.db.dialogue[id];
  if (def === undefined) throw new Error(`no dialogue '${id}'`);
  return {
    def,
    ctx: condCtx(rt),
    cps: rt.db.tuning.textCps,
    apply: (effects) => {
      applyAll(rt, effects);
    },
  };
}

export function applyAll(rt: SimRt, effects: readonly Effect[]): void {
  for (const e of effects) applyEffect(e, rt);
}

/** Freezes play and starts running `steps`. */
export function startStory(rt: SimRt, steps: readonly Step[], talker: Entity | null = null): void {
  rt.story = newStoryRun(steps, talker?.id ?? null);
  rt.mode = 'story';
  rt.hero.vel = { x: 0, y: 0 };
  changeState(HERO_MACHINE, rt.hero, 'move', heroCtx(rt, EMPTY_FRAME));
  setAnim(rt.hero, 'idle');
  for (const a of rt.actors) a.vel = { x: 0, y: 0 };
}

export function startScript(rt: SimRt, id: keyof SimRt['db']['scripts']): void {
  const def = rt.db.scripts[id];
  if (def === undefined) throw new Error(`no script '${id}'`);
  startStory(rt, def.steps);
}

function endStory(rt: SimRt): void {
  rt.story = null;
  rt.mode = 'play';
  for (const a of rt.actors) if (a.kind === 'npc') a.mem['talking'] = 0;
  placeNpcs(rt);
  rt.emit({ t: 'autosave' });
}

function actorOf(rt: SimRt, ref: ActorRef): Entity {
  if (ref === 'hero') return rt.hero;
  const npc = rt.actors.find((a) => a.kind === 'npc' && a.def === ref);
  if (npc === undefined) throw new Error(`script: ${ref} is not on ${rt.screen.id}`);
  return npc;
}

/** One tick of the running script. */
export function stepStory(rt: SimRt, input: InputFrame): void {
  const run = rt.story;
  if (run === null) return;
  for (let i = 0; i < MAX_INSTANT_STEPS; i++) {
    if (run.cur === null) {
      const next = run.queue.shift();
      if (next === undefined) {
        endStory(rt);
        return;
      }
      run.cur = next;
      run.t = 0;
      if (!begin(rt, run, next)) {
        run.cur = null;
        continue;
      }
    }
    if (tick(rt, run, run.cur, input)) {
      run.t += 1;
      return;
    }
    run.cur = null;
  }
}

/** Starts a step. Returns false for instant steps, which are done once begun. */
function begin(rt: SimRt, run: StoryRun, step: Step): boolean {
  switch (step.k) {
    case 'talk': {
      if (step.with !== undefined) faceEachOther(rt, actorOf(rt, step.with));
      run.dlg = openDialogue(step.dialogue, dialogueEnv(rt, step.dialogue));
      return run.dlg !== null;
    }
    case 'do':
      applyAll(rt, step.effects);
      return false;
    case 'face':
      actorOf(rt, step.actor).facing = step.dir;
      return false;
    case 'warp':
      enterScreen(rt, step.screen, tileFeet(step.at), step.facing);
      markVisited(rt, step.screen);
      rt.emit({ t: 'screenEntered', screen: step.screen });
      return false;
    case 'if':
      run.queue.unshift(...(evalCond(step.when, condCtx(rt)) ? step.then : (step.else ?? [])));
      return false;
    case 'run': {
      const def = rt.db.scripts[step.script];
      if (def === undefined) throw new Error(`no script '${step.script}'`);
      run.queue.unshift(...def.steps);
      return false;
    }
    case 'shop':
      run.shop = { cursor: 0, last: null };
      return true;
    case 'say':
    case 'card':
    case 'move':
    case 'wait':
    case 'fade':
      return true;
  }
}

/** Advances a blocking step by a tick. Returns true while it is still running. */
function tick(rt: SimRt, run: StoryRun, step: Step, input: InputFrame): boolean {
  switch (step.k) {
    case 'talk': {
      if (run.dlg === null) return false;
      const open = stepDialogue(run.dlg, input, dialogueEnv(rt, step.dialogue));
      if (!open) run.dlg = null;
      return open;
    }
    case 'say':
    case 'card': {
      const full = revealTicks(step.text, rt.db.tuning.textCps);
      if (run.t < full) {
        if (advancePressed(input)) run.t = full - 1;
        return true;
      }
      return !advancePressed(input);
    }
    case 'move':
      return walk(actorOf(rt, step.actor), tileFeet(step.to), step.speed ?? 1);
    case 'wait':
      return run.t + 1 < step.ticks;
    case 'fade': {
      const target = step.out ? 1 : 0;
      const d = 1 / FADE_STEP_TICKS;
      run.fade = step.out ? Math.min(1, run.fade + d) : Math.max(0, run.fade - d);
      return run.fade !== target;
    }
    case 'shop':
      return stepShop(rt, run, step.id, input);
    case 'do':
    case 'face':
    case 'warp':
    case 'if':
    case 'run':
      return false;
  }
}

function stepShop(rt: SimRt, run: StoryRun, id: ShopId, input: InputFrame): boolean {
  const shop = rt.db.shops[id];
  const ui = run.shop;
  if (shop === undefined || ui === null) return false;
  const rows = visibleStock(shop, condCtx(rt));
  const n = rows.length + 1;
  if (wasPressed(input, 'up')) ui.cursor = (ui.cursor + n - 1) % n;
  if (wasPressed(input, 'down')) ui.cursor = (ui.cursor + 1) % n;
  if (wasPressed(input, 'cancel')) {
    run.shop = null;
    return false;
  }
  if (!wasPressed(input, 'confirm') && !wasPressed(input, 'interact')) return true;
  const row = rows[ui.cursor];
  if (row === undefined) {
    run.shop = null;
    return false;
  }
  ui.last = buy(rt, id, row.item);
  return true;
}

/** Moves toward `to` at `speed` px per tick. Returns true until arrived. */
function walk(e: Entity, to: Vec, speed: number): boolean {
  const d = sub(to, e.pos);
  const dist = length(d);
  if (dist <= speed) {
    e.pos = { ...to };
    setAnim(e, 'idle');
    return false;
  }
  e.pos = { x: e.pos.x + (d.x / dist) * speed, y: e.pos.y + (d.y / dist) * speed };
  e.facing = dirFromVec(d, e.facing);
  setAnim(e, 'walk');
  return true;
}

function faceEachOther(rt: SimRt, npc: Entity): void {
  npc.facing = dirFromVec(sub(rt.hero.pos, npc.pos), npc.facing);
  npc.mem['talking'] = 1;
  setAnim(npc, 'idle');
}

export function storyUi(rt: SimRt): StoryUi {
  const run = rt.story;
  const step = run?.cur;
  if (run === null || step === null || step === undefined) return null;
  const cps = rt.db.tuning.textCps;
  if (step.k === 'say' || step.k === 'card') {
    return {
      k: step.k === 'card' ? 'card' : 'text',
      who: step.k === 'say' ? step.who : null,
      text: step.text,
      shown: Math.min(1, (run.t + 1) / revealTicks(step.text, cps)),
      choices: [],
      cursor: 0,
    };
  }
  if (step.k === 'shop' && run.shop !== null) {
    const shop = rt.db.shops[step.id];
    if (shop === undefined) return null;
    return {
      k: 'shop',
      shop: step.id,
      name: shop.name,
      rows: visibleStock(shop, condCtx(rt)).map((s) => ({ item: s.item, price: s.price })),
      cursor: run.shop.cursor,
      last: run.shop.last,
    };
  }
  if (step.k === 'talk' && run.dlg !== null) {
    const def = rt.db.dialogue[step.dialogue];
    if (def === undefined) return null;
    const node = nodeOf(run.dlg, def);
    const full = revealTicks(node.text, cps);
    const talker = step.with ?? null;
    return {
      k: 'text',
      who: node.who === undefined ? talker : node.who,
      text: node.text,
      shown: Math.min(1, run.dlg.t / full),
      choices: run.dlg.t >= full ? visibleChoices(node, condCtx(rt)).map((c) => c.text) : [],
      cursor: run.dlg.cursor,
    };
  }
  return null;
}

/** The box just in front of the hero's feet, where interact looks. */
export function probeBox(rt: SimRt): Box {
  const d = DIR_VEC[rt.hero.facing];
  const feet = at(rt.hero.body, rt.hero.pos);
  return { x: feet.x + d.x * 10, y: feet.y + d.y * 10, w: feet.w, h: feet.h };
}

const tileBox = (x: number, y: number, w = 1, h = 1): Box => ({
  x: x * TILE,
  y: y * TILE,
  w: w * TILE,
  h: h * TILE,
});

/** Interact pressed while walking: talk to an NPC, read a sign or use something in front of the hero. */
export function checkInteract(rt: SimRt, input: InputFrame): boolean {
  if (!wasPressed(input, 'interact') || rt.hero.fsm.s !== 'move') return false;
  const probe = probeBox(rt);
  for (const a of rt.actors) {
    if (a.kind !== 'npc' || !overlaps(probe, at(a.hurt, a.pos))) continue;
    const id = a.def as NpcId;
    startStory(rt, [{ k: 'talk', dialogue: rt.db.npcs[id]?.talk ?? id, with: id }], a);
    return true;
  }
  if (openChest(rt, probe) || unlockAt(rt, probe)) return true;
  if (tryLift(rt)) return true;
  for (const thing of rt.db.screens[rt.screen.id].things) {
    if (thing.k === 'sign' && overlaps(probe, tileBox(thing.at.x, thing.at.y, thing.w, thing.h))) {
      startStory(rt, [{ k: 'say', who: null, text: thing.text }]);
      return true;
    }
    if (
      thing.k === 'use' &&
      overlaps(probe, tileBox(thing.at.x, thing.at.y, thing.w, thing.h)) &&
      evalCond(thing.when, condCtx(rt))
    ) {
      startScript(rt, thing.script);
      return true;
    }
  }
  return false;
}

/** Starts the first trigger whose rectangle holds the hero's feet and whose condition holds. */
export function checkTriggers(rt: SimRt): void {
  const tx = Math.floor(rt.hero.pos.x / TILE);
  const ty = Math.floor((rt.hero.pos.y - 1) / TILE);
  for (const thing of rt.db.screens[rt.screen.id].things) {
    if (thing.k !== 'trigger') continue;
    const inside =
      tx >= thing.at.x && tx < thing.at.x + thing.w && ty >= thing.at.y && ty < thing.at.y + thing.h;
    if (inside && evalCond(thing.when, condCtx(rt))) {
      startScript(rt, thing.script);
      return;
    }
  }
}
