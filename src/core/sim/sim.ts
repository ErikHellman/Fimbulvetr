import type { EnemyId } from '@content/ids';
import type { ScreenId } from '@content/world/screens';
import { BEHAVIOURS, createEnemy } from '../actors/enemies';
import type { EnemyCtx, EnemyDef } from '../actors/enemies/defs';
import { mem, setAnim, type Entity } from '../actors/entity';
import { changeState, runFsm } from '../actors/fsm';
import {
  HERO_MACHINE,
  createHero,
  heroPreTick,
  heroSwordBox,
  heroSwordDamage,
  type HeroCtx,
} from '../actors/hero';
import { setMinute, setSeason, tickClock } from '../clock/clock';
import { resolveHit } from '../combat/hit';
import { EMPTY_FRAME, type InputFrame } from '../input/actions';
import { at, overlaps, type Box } from '../math/box';
import { DIR_VEC, DIRS, type Dir4 } from '../math/dir';
import { fnv1a } from '../math/hash';
import { length, normalize, scale, sub, type Vec } from '../math/vec';
import type { GameState } from '../state/gameState';
import { canonicalJson, cloneState } from '../state/save';
import { buildCollision, gridSolidAt, moveBox, type CollisionGrid, type SolidAt } from '../world/collision';
import { SCREEN_H, SCREEN_W } from '../world/dims';
import { indexLayout, neighbourOf, screenOrigin, tileFeet, type LayoutIndex } from '../world/screen';
import { parseTextMap, type TerrainGrid } from '../world/textmap';
import type { Command } from './commands';
import type { ContentDb } from './db';
import type { SimEvent } from './events';

export type Mode = 'play' | 'transition';

export interface Transition {
  readonly from: ScreenId;
  readonly to: ScreenId;
  readonly dir: Dir4;
  t: number;
  readonly dur: number;
  readonly heroFrom: Vec;
  readonly heroTo: Vec;
}

export interface LoadedScreen {
  readonly id: ScreenId;
  readonly terrain: TerrainGrid;
  readonly collision: CollisionGrid;
  readonly neighbours: Readonly<Record<Dir4, ScreenId | null>>;
}

export interface SimOptions {
  /** Accessibility "long day": world time runs at half speed. */
  readonly longDay: boolean;
}

export const TRANSITION_TICKS = 30;
const EDGE_INSET = 4;
const KNOCK_EPSILON = 0.1;

/** Where the hero stands on the new screen after crossing an edge in direction `dir`. */
export function entryPoint(dir: Dir4, from: Vec, body: Box): Vec {
  switch (dir) {
    case 'e':
      return { x: EDGE_INSET - body.x, y: from.y };
    case 'w':
      return { x: SCREEN_W - EDGE_INSET - (body.x + body.w), y: from.y };
    case 's':
      return { x: from.x, y: EDGE_INSET - body.y };
    case 'n':
      return { x: from.x, y: SCREEN_H - EDGE_INSET - (body.y + body.h) };
  }
}

/** The whole game rules engine. Deterministic: same state + same inputs ⇒ same result. */
export class Sim {
  readonly state: GameState;
  mode: Mode = 'play';
  screen: LoadedScreen;
  readonly hero: Entity;
  enemies: Entity[];
  transition: Transition | null = null;
  tick = 0;
  private events: SimEvent[] = [];
  private readonly queue: Command[] = [];
  private nextId = 1;
  private readonly layout: LayoutIndex;
  private readonly ticksPerMinute: number;
  private readonly terrainCache = new Map<ScreenId, TerrainGrid>();

  constructor(
    private readonly db: ContentDb,
    state: GameState,
    options: SimOptions = { longDay: false },
  ) {
    this.state = state;
    this.layout = indexLayout(db.layout);
    this.ticksPerMinute = db.clock.ticksPerMinute * (options.longDay ? 2 : 1);
    this.screen = this.load(state.hero.screen);
    this.hero = createHero(this.newId(), state.hero, db.tuning);
    this.enemies = this.spawn();
    this.markVisited(this.screen.id);
  }

  get entities(): readonly Entity[] {
    return [this.hero, ...this.enemies];
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
    if (this.mode === 'transition') this.stepTransition();
    else this.stepPlay(input);
    this.syncHero();
    this.state.playTicks += 1;
    this.tick += 1;
  }

  private stepPlay(input: InputFrame): void {
    for (const e of tickClock(this.state.clock, this.db.clock, this.ticksPerMinute))
      this.emit({ t: 'clock', e });
    heroPreTick(this.hero);
    runFsm(HERO_MACHINE, this.hero, this.heroCtx(input));
    const enemyCtx: EnemyCtx = {
      tuning: this.db.tuning,
      emit: (ev) => {
        this.emit(ev);
      },
    };
    for (const e of this.enemies) runFsm(BEHAVIOURS[this.enemyDef(e).behaviour], e, enemyCtx);
    this.moveAll();
    this.resolveSword();
    this.tickTimers();
    this.checkEdges();
  }

  private stepTransition(): void {
    const tr = this.transition;
    if (tr === null) {
      this.mode = 'play';
      return;
    }
    tr.t += 1;
    this.hero.animT += 1;
    if (tr.t < tr.dur) return;
    this.transition = null;
    this.mode = 'play';
    this.markVisited(tr.to);
    this.emit({ t: 'screenEntered', screen: tr.to });
  }

  private heroCtx(input: InputFrame): HeroCtx {
    return {
      input,
      tuning: this.db.tuning,
      hasShield: this.state.inv.shield,
      emit: (ev) => {
        this.emit(ev);
      },
    };
  }

  private enemyDef(e: Entity): EnemyDef {
    return this.db.enemies[e.def as EnemyId];
  }

  private moveAll(): void {
    const obstacles = this.enemies.filter((e) => this.enemyDef(e).solid).map((e) => at(e.body, e.pos));
    this.moveEntity(this.hero, this.heroSolidAt(), obstacles);
    const walls = gridSolidAt(this.screen.collision, () => true);
    for (const e of this.enemies) this.moveEntity(e, walls, []);
  }

  private moveEntity(e: Entity, solidAt: SolidAt, obstacles: readonly Box[]): void {
    const dx = e.vel.x + e.knock.x;
    const dy = e.vel.y + e.knock.y;
    if (dx !== 0 || dy !== 0) {
      const box = at(e.body, e.pos);
      const r = moveBox(box, dx, dy, solidAt, obstacles);
      e.pos = { x: e.pos.x + (r.x - box.x), y: e.pos.y + (r.y - box.y) };
    }
    e.knock = scale(e.knock, this.db.tuning.knockDecay);
    if (length(e.knock) < KNOCK_EPSILON) e.knock = { x: 0, y: 0 };
  }

  /** Off-screen tiles are open where a neighbouring screen exists, solid elsewhere. */
  private heroSolidAt(): SolidAt {
    const { collision, neighbours } = this.screen;
    return gridSolidAt(collision, (tx, ty) => {
      const outX: Dir4 | null = tx < 0 ? 'w' : tx >= collision.cols ? 'e' : null;
      const outY: Dir4 | null = ty < 0 ? 'n' : ty >= collision.rows ? 's' : null;
      if (outX !== null && outY !== null) return true;
      const dir = outX ?? outY;
      return dir === null ? false : neighbours[dir] === null;
    });
  }

  private resolveSword(): void {
    const box = heroSwordBox(this.hero, this.db.tuning);
    if (box === null) return;
    const swing = mem(this.hero, 'swing');
    const spinning = mem(this.hero, 'spinOn') === 1;
    for (const e of [...this.enemies]) {
      if (mem(e, 'hitSwing') === swing || !overlaps(box, at(e.hurt, e.pos))) continue;
      e.mem['hitSwing'] = swing;
      const def = this.enemyDef(e);
      const away = normalize(sub(e.pos, this.hero.pos));
      const dir = spinning && (away.x !== 0 || away.y !== 0) ? away : DIR_VEC[this.hero.facing];
      const result = resolveHit(
        e,
        {
          amount: heroSwordDamage(this.hero, this.db.tuning),
          element: 'none',
          knock: this.db.tuning.sword.knock,
          dir,
          faction: 'hero',
          tags: 0,
        },
        { shielding: false, iframes: this.db.tuning.enemyIframes, knockResist: def.knockResist },
      );
      if (result.outcome === 'ignored') continue;
      this.emit({ t: 'hit', target: e.id, blocked: result.outcome === 'blocked', dealt: result.dealt });
      this.emit({ t: 'sfx', id: result.outcome === 'blocked' ? 'sfx_block' : 'sfx_hit' });
      if (result.outcome === 'killed') {
        if (def.immortal) e.hp = e.maxHp;
        else this.enemies = this.enemies.filter((x) => x !== e);
      }
    }
  }

  private tickTimers(): void {
    for (const e of this.entities) {
      if (e.iframes > 0) e.iframes -= 1;
      if (e.flash > 0) e.flash -= 1;
      e.animT += 1;
    }
  }

  private checkEdges(): void {
    const b = at(this.hero.body, this.hero.pos);
    let dir: Dir4 | null = null;
    if (b.x < 0) dir = 'w';
    else if (b.x + b.w > SCREEN_W) dir = 'e';
    else if (b.y < 0) dir = 'n';
    else if (b.y + b.h > SCREEN_H) dir = 's';
    if (dir === null) return;
    const to = this.screen.neighbours[dir];
    if (to !== null) this.beginTransition(dir, to);
  }

  private beginTransition(dir: Dir4, to: ScreenId): void {
    const from = this.screen.id;
    const heroFrom = { ...this.hero.pos };
    const heroTo = entryPoint(dir, heroFrom, this.db.tuning.hero.body);
    this.screen = this.load(to);
    this.enemies = this.spawn();
    this.placeHero(heroTo);
    setAnim(this.hero, 'walk');
    this.transition = { from, to, dir, t: 0, dur: TRANSITION_TICKS, heroFrom, heroTo };
    this.mode = 'transition';
    this.emit({ t: 'screenTransition', from, to, dir });
  }

  private apply(c: Command): void {
    switch (c.t) {
      case 'warp':
        this.transition = null;
        this.mode = 'play';
        this.screen = this.load(c.screen);
        this.enemies = this.spawn();
        this.placeHero({ x: c.x, y: c.y });
        this.markVisited(c.screen);
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

  private placeHero(p: Vec): void {
    this.hero.pos = { ...p };
    this.hero.prev = { ...p };
    this.hero.vel = { x: 0, y: 0 };
    this.hero.knock = { x: 0, y: 0 };
    changeState(HERO_MACHINE, this.hero, 'move', this.heroCtx(EMPTY_FRAME));
  }

  private load(id: ScreenId): LoadedScreen {
    const terrain = this.terrainOf(id);
    const neighbours = Object.fromEntries(DIRS.map((d) => [d, neighbourOf(this.layout, id, d)])) as Record<
      Dir4,
      ScreenId | null
    >;
    return { id, terrain, collision: buildCollision(terrain, this.db.terrain), neighbours };
  }

  /** `Thing` currently has only the `enemy` variant; a real switch returns once the union grows. */
  private spawn(): Entity[] {
    return this.db.screens[this.screen.id].things.map((thing) =>
      createEnemy(this.newId(), this.db.enemies[thing.id], tileFeet(thing.at)),
    );
  }

  private syncHero(): void {
    const h = this.state.hero;
    h.screen = this.screen.id;
    h.x = this.hero.pos.x;
    h.y = this.hero.pos.y;
    h.facing = this.hero.facing;
    h.hp = this.hero.hp;
  }

  private markVisited(id: ScreenId): void {
    if (!this.state.world.visited.includes(id)) this.state.world.visited.push(id);
  }

  private emit(ev: SimEvent): void {
    this.events.push(ev);
  }

  private newId(): number {
    const id = this.nextId;
    this.nextId += 1;
    return id;
  }
}
