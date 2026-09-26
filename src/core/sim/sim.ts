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
import { buildCollision, gridSolidAt } from '../world/collision';
import { indexLayout, neighbourOf, screenOrigin, type LayoutIndex } from '../world/screen';
import { parseTextMap, type TerrainGrid } from '../world/textmap';
import type { Command } from './commands';
import type { ContentDb } from './db';
import type { SimEvent } from './events';
import type { LoadedScreen, Mode, SimRt, Transition } from './rt';
import { tickWorldClock } from './systems/clock';
import { resolveContact, resolveSword } from './systems/combat';
import { heroCtx, syncHero } from './systems/hero';
import { enemyDef, moveAll } from './systems/movement';
import { spawnActors } from './systems/spawn';
import { tickTimers } from './systems/timers';
import {
  checkDoors,
  checkEdges,
  enterScreen,
  fadeLevel,
  markVisited,
  stepTransition,
} from './systems/transition';

export type { LoadedScreen, Mode, Transition } from './rt';
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
    this.layout = indexLayout(db.layout, Object.keys(db.screens) as ScreenId[]);
    this.ticksPerMinute = db.clock.ticksPerMinute * (options.longDay ? 2 : 1);
    this.screen = this.load(state.hero.screen);
    this.hero = createHero(this.newId(), state.hero, db.tuning);
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

  /** How black the picture is during a door fade: 0 clear … 1 black. */
  fade(): number {
    return fadeLevel(this.transition);
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
        entities: this.entities,
      }),
    );
  }

  step(input: InputFrame): void {
    for (const c of this.queue.splice(0)) this.apply(c);
    for (const e of this.entities) e.prev = { ...e.pos };
    if (this.mode === 'transition') stepTransition(this);
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
    return { id, terrain, collision: buildCollision(terrain, this.db.terrain), neighbours };
  }

  private stepPlay(input: InputFrame): void {
    tickWorldClock(this, this.ticksPerMinute);
    heroPreTick(this.hero);
    runFsm(HERO_MACHINE, this.hero, heroCtx(this, input));
    const ctx: ActorCtx = {
      tuning: this.db.tuning,
      rng: this.state.rng,
      hero: this.hero.pos,
      solidAt: gridSolidAt(this.screen.collision, () => true),
      emit: (ev) => {
        this.emit(ev);
      },
    };
    for (const e of this.actors) runFsm(BEHAVIOURS[enemyDef(this, e).behaviour], e, ctx);
    moveAll(this);
    resolveSword(this);
    resolveContact(this);
    tickTimers(this);
    checkEdges(this);
    if (this.mode === 'play') checkDoors(this);
  }

  private apply(c: Command): void {
    switch (c.t) {
      case 'warp':
        this.transition = null;
        this.mode = 'play';
        enterScreen(this, c.screen, { x: c.x, y: c.y });
        markVisited(this, c.screen);
        this.emit({ t: 'screenEntered', screen: c.screen });
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
    }
  }
}
