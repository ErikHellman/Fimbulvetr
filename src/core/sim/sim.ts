import type { ScreenId } from '@content/world/screens';
import type { Entity } from '../actors/entity';
import { runFsm } from '../actors/fsm';
import { BEHAVIOURS } from '../actors/enemies';
import type { ActorCtx } from '../actors/enemies/defs';
import { HERO_MACHINE, createHero, heroPreTick } from '../actors/hero';
import { setMinute, setSeason } from '../clock/clock';
import type { InputFrame } from '../input/actions';
import { DIRS, type Dir4 } from '../math/dir';
import { fnv1a } from '../math/hash';
import type { Vec } from '../math/vec';
import type { GameState } from '../state/gameState';
import { canonicalJson, cloneState } from '../state/save';
import { giveItem } from '../story/effects';
import type { StoryRun } from '../story/script';
import { buy } from '../story/shop';
import { buildCollision, gridSolidAt } from '../world/collision';
import type { CoverGrid } from '../world/cover';
import { indexLayout, neighbourOf, screenOrigin, type LayoutIndex } from '../world/screen';
import { parseTextMap, type TerrainGrid } from '../world/textmap';
import type { Command } from './commands';
import type { ContentDb } from './db';
import type { SimEvent } from './events';
import type { Entry, LoadedScreen, Mode, SimRt, Transition } from './rt';
import { tickWorldClock } from './systems/clock';
import { resolveContact, resolveSword } from './systems/combat';
import { coverFor, cutCover, refreshCover } from './systems/cover';
import { heroCtx, syncHero } from './systems/hero';
import { enemyDef, moveAll } from './systems/movement';
import { runCritters, settleCritters } from './systems/critters';
import { stepNpcs } from './systems/npcs';
import { CONTINUE_HP, checkDeath, stepOver } from './systems/death';
import { collectPickups } from './systems/pickups';
import { stepProps, swordProps } from './systems/props';
import { spawnActors } from './systems/spawn';
import { checkInteract, checkTriggers, stepStory, storyUi, type StoryUi } from './systems/story';
import { tickTimers } from './systems/timers';
import {
  checkDoors,
  checkEdges,
  enterScreen,
  fadeLevel,
  markVisited,
  stepTransition,
} from './systems/transition';

export type { Entry, LoadedScreen, Mode, Transition } from './rt';
export type { StoryUi } from './systems/story';
export { FADE_TICKS, TRANSITION_TICKS, entryPoint } from './systems/transition';

export interface SimOptions {
  /** Accessibility "long day": world time runs at half speed. */
  readonly longDay: boolean;
}

/** The whole game rules engine. Deterministic: same state + same inputs ⇒ same result. */
export class Sim implements SimRt {
  readonly state: GameState;
  mode: Mode = 'play';
  screen: LoadedScreen;
  readonly hero: Entity;
  actors: Entity[];
  transition: Transition | null = null;
  story: StoryRun | null = null;
  /** Where the hero entered the current screen (Continue returns here). */
  entry: Entry;
  tick = 0;
  private events: SimEvent[] = [];
  private readonly queue: Command[] = [];
  private nextId = 1;
  private readonly layout: LayoutIndex;
  private readonly ticksPerMinute: number;
  private readonly terrainCache = new Map<ScreenId, TerrainGrid>();

  constructor(
    readonly db: ContentDb,
    state: GameState,
    options: SimOptions = { longDay: false },
  ) {
    this.state = state;
    // A save taken at 0 hp (it should not happen, but) loads alive, as after a Continue.
    if (state.hero.hp <= 0) state.hero.hp = Math.min(state.hero.maxHp, CONTINUE_HP);
    this.layout = indexLayout(db.layout, Object.keys(db.screens) as ScreenId[]);
    this.ticksPerMinute = db.clock.ticksPerMinute * (options.longDay ? 2 : 1);
    this.screen = this.load(state.hero.screen);
    this.hero = createHero(this.newId(), state.hero, db.tuning);
    this.entry = { x: state.hero.x, y: state.hero.y, facing: state.hero.facing };
    this.actors = spawnActors(this);
    markVisited(this, this.screen.id);
  }

  get entities(): readonly Entity[] {
    return [this.hero, ...this.actors];
  }

  get enemies(): readonly Entity[] {
    return this.actors.filter((e) => e.kind === 'enemy');
  }

  command(c: Command): void {
    this.queue.push(c);
  }

  drainEvents(): SimEvent[] {
    const out = this.events;
    this.events = [];
    return out;
  }

  terrainOf(id: ScreenId): TerrainGrid {
    let grid = this.terrainCache.get(id);
    if (grid === undefined) {
      grid = parseTextMap(this.db.screens[id].map, this.db.legend);
      this.terrainCache.set(id, grid);
    }
    return grid;
  }

  originOf(id: ScreenId): Vec {
    return screenOrigin(this.layout, id);
  }

  /** How black the picture is (door fades and script fades): 0 clear … 1 black. */
  fade(): number {
    return Math.max(fadeLevel(this.transition), this.story?.fade ?? 0);
  }

  /** A screen's ground cover as it stands now (the live grid for the current screen). */
  coverOf(id: ScreenId): CoverGrid {
    return id === this.screen.id ? this.screen.cover : coverFor(this, id);
  }

  /** The text box or card the running script shows, if any. */
  storyUi(): StoryUi {
    return storyUi(this);
  }

  snapshot(): GameState {
    return cloneState(this.state);
  }

  /** Hash of everything that changes during play; equal hashes mean identical simulations. */
  hash(): number {
    return fnv1a(
      canonicalJson({
        state: this.state,
        mode: this.mode,
        tick: this.tick,
        transition: this.transition,
        story: this.story,
        entry: this.entry,
        nextId: this.nextId,
        entities: this.entities,
      }),
    );
  }

  step(input: InputFrame): void {
    for (const c of this.queue.splice(0)) this.apply(c);
    for (const e of this.entities) e.prev = { ...e.pos };
    if (this.mode === 'transition') stepTransition(this);
    else if (this.mode === 'story') stepStory(this, input);
    else if (this.mode === 'over') stepOver(this, input);
    else this.stepPlay(input);
    syncHero(this);
    this.state.playTicks += 1;
    this.tick += 1;
  }

  emit(ev: SimEvent): void {
    this.events.push(ev);
  }

  newId(): number {
    const id = this.nextId;
    this.nextId += 1;
    return id;
  }

  load(id: ScreenId): LoadedScreen {
    const terrain = this.terrainOf(id);
    const neighbours = Object.fromEntries(DIRS.map((d) => [d, neighbourOf(this.layout, id, d)])) as Record<
      Dir4,
      ScreenId | null
    >;
    return {
      id,
      terrain,
      collision: buildCollision(terrain, this.db.terrain),
      neighbours,
      cover: coverFor(this, id),
    };
  }

  private stepPlay(input: InputFrame): void {
    tickWorldClock(this, this.ticksPerMinute);
    refreshCover(this);
    if (checkInteract(this, input)) return;
    heroPreTick(this.hero);
    runFsm(HERO_MACHINE, this.hero, heroCtx(this, input));
    const ctx: ActorCtx = {
      tuning: this.db.tuning,
      rng: this.state.rng,
      hero: this.hero.pos,
      heroVel: this.hero.vel,
      solidAt: gridSolidAt(this.screen.collision, () => true),
      emit: (ev) => {
        this.emit(ev);
      },
    };
    for (const e of this.actors)
      if (e.kind === 'enemy') runFsm(BEHAVIOURS[enemyDef(this, e).behaviour], e, ctx);
    runCritters(this, ctx);
    stepNpcs(this);
    moveAll(this);
    collectPickups(this);
    settleCritters(this);
    stepProps(this, input);
    resolveSword(this);
    swordProps(this);
    cutCover(this);
    resolveContact(this);
    checkDeath(this);
    if (this.mode === 'over') return;
    tickTimers(this);
    checkEdges(this);
    if (this.mode === 'play') checkDoors(this);
    if (this.mode === 'play') checkTriggers(this);
  }

  private apply(c: Command): void {
    switch (c.t) {
      case 'warp':
        this.transition = null;
        this.mode = 'play';
        enterScreen(this, c.screen, { x: c.x, y: c.y });
        markVisited(this, c.screen);
        this.emit({ t: 'screenEntered', screen: c.screen });
        if (this.story === null) this.emit({ t: 'autosave' });
        break;
      case 'setMinute':
        setMinute(this.state.clock, c.minute);
        break;
      case 'setSeason':
        for (const e of setSeason(this.state.clock, c.season)) this.emit({ t: 'clock', e });
        break;
      case 'setFlag':
        this.state.flags[c.flag] = c.value;
        break;
      case 'buy':
        buy(this, c.shop, c.item);
        break;
      case 'give':
        giveItem(this, c.item, c.n);
        break;
    }
  }
}
