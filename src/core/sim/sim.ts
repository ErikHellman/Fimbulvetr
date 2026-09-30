import type { EnemyId } from '@content/ids';
import type { ScreenId } from '@content/world/screens';
import { mem, type Entity } from '../actors/entity';
import type { L10n } from '../i18n/t';
import { runFsm } from '../actors/fsm';
import { HERO_MACHINE, createHero, heroPreTick } from '../actors/hero';
import { daylight, setMinute, setSeason } from '../clock/clock';
import type { WeatherKind } from '../clock/types';
import type { InputFrame } from '../input/actions';
import { DIRS, type Dir4 } from '../math/dir';
import { fnv1a } from '../math/hash';
import type { Vec } from '../math/vec';
import type { GameState } from '../state/gameState';
import { canonicalJson, cloneState } from '../state/save';
import { giveItem } from '../story/effects';
import type { StoryRun } from '../story/script';
import { buy } from '../story/shop';
import { buildCollision } from '../world/collision';
import {
  FIRE_RADIUS,
  FOG_RADIUS,
  LANTERN_FOG_RADIUS,
  LANTERN_RADIUS,
  WARP_RADIUS,
  darknessOf,
  fogOf,
  type Light,
} from '../world/light';
import type { CoverGrid } from '../world/cover';
import { GHOST_BRAZIER, GHOST_LANTERN, shownGhosts, type GhostLight } from '../world/ghost';
import { indexLayout, neighbourOf, screenOrigin, type LayoutIndex, type TilePos } from '../world/screen';
import { parseTextMap, type TerrainGrid } from '../world/textmap';
import type { Command } from './commands';
import type { ContentDb } from './db';
import type { SimEvent } from './events';
import type { Entry, LoadedScreen, Mode, SimRt, Transition } from './rt';
import { tickWorldClock } from './systems/clock';
import { killEnemy, resolveAttacks, resolveSword } from './systems/combat';
import { coverFor, cutCover, refreshCover } from './systems/cover';
import { actorCtx, runEnemies } from './systems/enemies';
import { heroCtx, syncHero } from './systems/hero';
import { moveAll } from './systems/movement';
import { runCritters, settleCritters } from './systems/critters';
import { scheduleNpcs, stepNpcs } from './systems/npcs';
import { CONTINUE_HP, checkDeath, stepOver } from './systems/death';
import { bumpLocks, fixtureHazards, refreshFixtures, swordSwitches } from './systems/fixtures';
import { eat, equip, useItems } from './systems/items';
import { castGaldr } from './systems/galdr';
import { collectPickups } from './systems/pickups';
import { stepBombs } from './systems/bombs';
import { loadLevel, refreshWater } from './systems/water';
import { stepProjectiles } from './systems/projectiles';
import { pushBlocks, stepProps, swordProps } from './systems/props';
import { spawnActors } from './systems/spawn';
import { checkInteract, checkTriggers, stepStory, storyUi, type StoryUi } from './systems/story';
import { tickTimers } from './systems/timers';
import { petrifyAtDawn } from './systems/trolls';
import { fireKey, fireLights, stepFire } from './systems/fire';
import { outdoors, skyOf, windOf } from './systems/weather';
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

/** What the boss bar shows. `phase` counts from 0. */
export interface BossView {
  readonly name: L10n;
  readonly hp: number;
  readonly maxHp: number;
  readonly phase: number;
}

export interface SimOptions {
  /** Accessibility "long day": world time runs at half speed. */
  readonly longDay: boolean;
  /**
   * Rolled weather and spawn tables (default on). Off, the world has story weather only and no rolled
   * spawns: the tests and e2e runs written before M2 pin it off.
   */
  readonly rolled?: boolean;
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
  /** Dev switches; undefined when off so they never change the hash. */
  god?: boolean;
  weatherOverride?: WeatherKind;
  tick = 0;
  readonly rolled: boolean;
  private events: SimEvent[] = [];
  private readonly queue: Command[] = [];
  private nextId = 1;
  private readonly layout: LayoutIndex;
  private ticksPerMinute: number;
  private readonly terrainCache = new Map<ScreenId, TerrainGrid>();

  constructor(
    readonly db: ContentDb,
    state: GameState,
    options: SimOptions = { longDay: false },
  ) {
    this.state = state;
    this.rolled = options.rolled ?? true;
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

  /** The "long day" setting, changed from the settings menu: world time runs at half speed. */
  setLongDay(on: boolean): void {
    this.ticksPerMinute = this.db.clock.ticksPerMinute * (on ? 2 : 1);
  }

  command(c: Command): void {
    this.queue.push(c);
  }

  /** Applies queued commands now (the pause menu equips while the sim is not stepping). */
  flushCommands(): void {
    for (const c of this.queue.splice(0)) this.apply(c);
    syncHero(this);
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

  /** The weather on the current screen: the region's sky outdoors, always clear indoors and underground. */
  weather(): WeatherKind {
    return outdoors(this) ? skyOf(this) : 'clear';
  }

  /** The sky over the current region, indoors too (what conditions and NPC places read). */
  sky(): WeatherKind {
    return skyOf(this);
  }

  /** The wind on the current screen, in px per tick; still indoors and underground. */
  wind(): Vec {
    return windOf(this);
  }

  /** How much of the picture the dark hides (0 … 1): night outdoors, storms, dark rooms. */
  darkness(): number {
    const def = this.db.screens[this.screen.id];
    return darknessOf(daylight(this.state.clock, this.db.clock), {
      indoor: def.indoor === true || def.dungeon !== undefined,
      dark: def.dark === true,
      weather: this.weather(),
    });
  }

  /**
   * The fog over the current screen: how thick (0 = none) and the radius of clear air around the hero
   * (wider with the lantern).
   */
  fog(): { readonly amount: number; readonly r: number } {
    const def = this.db.screens[this.screen.id];
    const amount = fogOf({ indoor: !outdoors(this), dark: def.dark === true, weather: this.weather() });
    if (amount === 0) return { amount: 0, r: 0 };
    return { amount, r: (this.state.inv.items.lantern ?? 0) > 0 ? LANTERN_FOG_RADIUS : FOG_RADIUS };
  }

  /** The boss on this screen, for its health bar: the first live enemy whose def names it; else null. */
  boss(): BossView | null {
    for (const e of this.actors) {
      if (e.kind !== 'enemy') continue;
      const def = this.db.enemies[e.def as EnemyId];
      if (def.boss !== undefined)
        return { name: def.boss.name, hp: e.hp, maxHp: e.maxHp, phase: mem(e, 'phase') };
    }
    return null;
  }

  /**
   * What carves the dark (and the fog), in screen pixels: the lantern (once owned) around the hero, fires and
   * braziers.
   */
  lights(): Light[] {
    if (this.darkness() === 0 && this.fog().amount === 0) return [];
    const out: Light[] = [];
    if ((this.state.inv.items.lantern ?? 0) > 0)
      out.push({ x: this.hero.pos.x, y: this.hero.pos.y - 12, r: LANTERN_RADIUS, hero: true });
    // Burning tiles and walls of fire (a gate drawn as fire) glow.
    for (const e of this.actors)
      if (e.kind === 'fixture' && (e.art === 'fix_fire' || e.def === 'brazier') && e.mem['on'] === 1)
        out.push({ x: e.pos.x, y: e.pos.y - 6, r: FIRE_RADIUS });
    out.push(...fireLights(this, FIRE_RADIUS));
    // Awake warp stones glow faintly.
    for (const e of this.actors)
      if (e.kind === 'fixture' && e.def === 'warp' && e.mem['on'] === 1)
        out.push({ x: e.pos.x, y: e.pos.y - 16, r: WARP_RADIUS });
    // Bog-lights shine.
    for (const e of this.actors) {
      const glow = e.kind === 'enemy' ? this.db.enemies[e.def as EnemyId].glow : undefined;
      if (glow !== undefined) out.push({ x: e.pos.x, y: e.pos.y - 12, r: glow });
    }
    return out;
  }

  /**
   * The hidden-floor tiles that show now: those inside the lantern's glow round Ask (once owned) or a
   * burning brazier's. Only the picture uses it.
   */
  ghosts(): TilePos[] {
    const lights: GhostLight[] = [];
    if ((this.state.inv.items.lantern ?? 0) > 0)
      lights.push({ x: this.hero.pos.x, y: this.hero.pos.y - 8, r: GHOST_LANTERN });
    for (const e of this.actors)
      if (e.kind === 'fixture' && e.def === 'brazier' && e.mem['on'] === 1)
        lights.push({ x: e.pos.x, y: e.pos.y - 8, r: GHOST_BRAZIER });
    return shownGhosts(this.screen.terrain, this.db.terrain, lights);
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
        god: this.god,
        weatherOverride: this.weatherOverride,
        fire: fireKey(this),
        nextId: this.nextId,
        entities: this.entities,
      }),
    );
  }

  step(input: InputFrame): void {
    for (const c of this.queue.splice(0)) this.apply(c);
    for (const e of this.entities) e.prev = { ...e.pos };
    if (this.mode === 'transition') stepTransition(this);
    else if (this.mode === 'story') {
      stepStory(this, input);
      refreshWater(this);
      refreshFixtures(this);
    } else if (this.mode === 'over') stepOver(this, input);
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
    const base = buildCollision(terrain, this.db.terrain);
    const level = loadLevel(this, id);
    return {
      id,
      terrain,
      base,
      collision: { ...base, flags: base.flags.slice() },
      neighbours,
      cover: coverFor(this, id),
      ...(level === undefined ? {} : { level }),
    };
  }

  private stepPlay(input: InputFrame): void {
    tickWorldClock(this, this.ticksPerMinute);
    petrifyAtDawn(this);
    refreshCover(this);
    refreshWater(this);
    refreshFixtures(this);
    if (checkInteract(this, input)) return;
    heroPreTick(this.hero);
    useItems(this, input);
    castGaldr(this, input);
    runFsm(HERO_MACHINE, this.hero, heroCtx(this, input));
    const ctx = actorCtx(this);
    runEnemies(this, ctx);
    runCritters(this, ctx);
    scheduleNpcs(this);
    stepNpcs(this);
    moveAll(this);
    bumpLocks(this, input);
    pushBlocks(this, input);
    stepProjectiles(this);
    collectPickups(this);
    settleCritters(this);
    stepProps(this, input);
    stepBombs(this);
    resolveSword(this);
    swordProps(this);
    swordSwitches(this);
    cutCover(this);
    resolveAttacks(this);
    fixtureHazards(this);
    stepFire(this);
    checkDeath(this);
    if (this.mode === 'over') return;
    tickTimers(this);
    if (this.mode === 'play') checkEdges(this);
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
      case 'equip':
        equip(this, c.slot, c.item);
        break;
      case 'eat':
        eat(this, c.item);
        break;
      case 'ready': {
        const known = this.state.inv.galdr;
        if (known.includes(c.galdr)) this.state.inv.galdr = [c.galdr, ...known.filter((g) => g !== c.galdr)];
        break;
      }
      case 'setHp':
        this.hero.hp = Math.max(0, Math.min(this.hero.maxHp, Math.floor(c.hp)));
        break;
      case 'god':
        if (c.on) this.god = true;
        else delete this.god;
        break;
      case 'weather':
        if (c.kind === null) delete this.weatherOverride;
        else this.weatherOverride = c.kind;
        break;
      case 'saved':
        if (this.story?.cur?.k === 'save') this.story.saved = true;
        break;
      case 'killAll':
        for (const e of [...this.actors]) {
          if (e.kind !== 'enemy') continue;
          const def = this.db.enemies[e.def as EnemyId];
          if (!def.immortal) killEnemy(this, e, def);
        }
        break;
    }
  }
}
