import * as Phaser from 'phaser';
import { grade } from '@art/grading';
import { ANIMS } from '@art/sprites';
import { heroArtFor } from '@art/sprites/hero';
import { coverIndices } from '@art/tiles/coverIndices';
import { tileIndices } from '@art/tiles/indices';
import { tileAnimations, type TileAnim } from '@art/tiles/tileset';
import { DEFAULT_BINDINGS } from '@content/bindings';
import type { ScreenId } from '@content/world/screens';
import { daylight } from '@core/clock/clock';
import type { Entity } from '@core/actors/entity';
import { InputLatch, wasPressed, type InputFrame } from '@core/input/actions';
import { fnv1a } from '@core/math/hash';
import { add, lerp } from '@core/math/vec';
import type { SimEvent } from '@core/sim/events';
import { advance, type Accumulator } from '@core/sim/loop';
import { Sim } from '@core/sim/sim';
import { newGame, type GameState } from '@core/state/gameState';
import { NEW_GAME } from '@content/start';
import { decorArt, decorPlacements } from '@core/world/decor';
import { SCREEN_H, SCREEN_W } from '@core/world/dims';
import { AudioDirector } from '@shell/audio/sfx';
import type { DevBridge, ViewStats } from '@shell/dev/bridge';
import { FrameStats } from '@shell/dev/stats';
import { connectedPads, readPad } from '@shell/input/gamepad';
import { KeyboardState, attachKeyboard } from '@shell/input/keyboard';
import { InputMapper } from '@shell/input/mapper';
import { LETTERBOX } from '@shell/scale';
import type { PlayData } from '@shell/services';
import { UI_LINK, type UiLink } from '@shell/scenes/UiScene';
import { AmbientView } from '@shell/view/ambientView';
import { menuItems, openMenu, stepMenu, type MenuState } from '@shell/ui/pauseMenu';
import { EntityViews } from '@shell/view/entityViews';
import { DarknessView } from '@shell/view/darknessView';
import { FxView } from '@shell/view/fxView';
import { WeatherView } from '@shell/view/weatherView';
import { ScreenView } from '@shell/view/screenView';

/** Interiors are lit by the hearth: a fixed warm grade whatever the hour. */
const INDOOR_LIGHT = 0.85;

/** Everything drawn for one screen: its tiles and decor, and its ambient smoke and fish. */
interface Stage {
  readonly view: ScreenView;
  readonly ambient: AmbientView;
}

/** Owns the Sim: steps it at 60 Hz, feeds it input, draws its state, plays its sounds, autosaves. */
export class PlayScene extends Phaser.Scene {
  private appliedGrade: readonly number[] = [];
  private services!: PlayData;
  private sim!: Sim;
  private mapper!: InputMapper;
  private audio!: AudioDirector;
  private views!: EntityViews;
  private weather!: WeatherView;
  private darkness!: DarknessView;
  private fx!: FxView;
  private colour!: Phaser.Filters.ColorMatrix;
  private fadeRect!: Phaser.GameObjects.Rectangle;
  private readonly latch = new InputLatch();
  private readonly keys = new KeyboardState();
  private readonly acc: Accumulator = { acc: 0 };
  private readonly screens = new Map<ScreenId, Stage>();
  private readonly stats = new FrameStats();
  private gradeKey = '';
  private menu: MenuState | null = null;
  private tileAnims: readonly TileAnim[] = [];

  constructor() {
    super('play');
  }

  create(data: PlayData): void {
    this.services = data;
    this.acc.acc = 0;
    this.gradeKey = '';
    this.menu = null;
    this.screens.clear();
    this.sim = new Sim(data.db, data.state, { longDay: data.settings.longDay });
    this.tileAnims = tileAnimations(data.assets.tileset);
    this.mapper = new InputMapper(DEFAULT_BINDINGS, this.latch, {
      holdToggleShield: data.settings.holdShield,
    });
    this.audio = new AudioDirector(this, () => data.settings.volume, data.muted);

    const detachKeys = attachKeyboard(window, this.keys);
    const flush = (): void => {
      void data.saves.autosaver.flush();
    };
    const onVisibility = (): void => {
      if (document.visibilityState === 'hidden') flush();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', flush);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      detachKeys();
      this.keys.clear();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', flush);
    });

    const cam = this.cameras.main;
    cam.setViewport(0, LETTERBOX, SCREEN_W, SCREEN_H);
    cam.setRoundPixels(true);
    this.colour = cam.filters.internal.addColorMatrix();
    this.views = new EntityViews(this, data.assets.frames, ANIMS);
    this.fx = new FxView(this, data.assets.frames, ANIMS);
    this.weather = new WeatherView(this, data.assets.frames, {
      sfx: (id) => {
        this.audio.play(id);
      },
      flashes: () => data.settings.flash,
    });
    this.darkness = new DarknessView(this, data.assets.frames);
    this.fadeRect = this.add
      .rectangle(0, 0, SCREEN_W, SCREEN_H, 0x000000)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(1e6)
      .setAlpha(0);
    this.showScreen(this.sim.screen.id);
    this.draw(0);
    const link: UiLink = {
      sim: this.sim,
      frames: data.assets.frames,
      lang: () => data.settings.lang,
      sfx: (id) => {
        this.audio.play(id);
      },
      menu: () =>
        this.menu === null
          ? null
          : { state: this.menu, items: menuItems(this.sim.state.inv, this.services.db.items) },
    };
    this.registry.set(UI_LINK, link);
    if (!this.scene.isActive('ui')) this.scene.launch('ui');
    data.dev?.attach(this.bridge());
    document.body.dataset.ready = 'true';
  }

  override update(_time: number, delta: number): void {
    this.mapper.sample(this.keys.takeCodes(), readPad(connectedPads(navigator)));
    if (this.menu !== null) {
      this.updateMenu(this.latch.consume());
      this.acc.acc = 0;
      this.draw(0);
      return;
    }
    const { steps, alpha } = advance(this.acc, delta);
    const started = performance.now();
    for (let i = 0; i < steps; i++) {
      const frame = this.latch.consume();
      if (this.sim.mode === 'play' && (wasPressed(frame, 'menu') || wasPressed(frame, 'map'))) {
        this.setMenu(openMenu(wasPressed(frame, 'map') ? 'map' : 'items'));
        break;
      }
      this.sim.step(frame);
    }
    this.stats.record(delta, performance.now() - started);
    const events = this.sim.drainEvents();
    for (const ev of events) this.onEvent(ev);
    this.audio.handle(events);
    this.services.dev?.onEvents(events);
    this.draw(alpha);
  }

  private bridge(): DevBridge {
    return {
      sim: this.sim,
      frames: this.services.assets.frames,
      stats: this.stats,
      settings: this.services.settings,
      saves: this.services.saves,
      appliedGrade: () => this.appliedGrade,
      lightLevel: () => daylight(this.sim.state.clock, this.services.db.clock),
      viewStats: () => this.viewStats(),
      jumpFish: () => this.screens.get(this.sim.screen.id)?.ambient.jump(),
      tileAt: (x, y) => this.screens.get(this.sim.screen.id)?.view.displayedTile(x, y) ?? -1,
      restart: (state: GameState) => {
        this.scene.restart({ ...this.services, state });
      },
      menu: () => (this.menu === null ? null : { ...this.menu }),
    };
  }

  private onEvent(ev: SimEvent): void {
    if (ev.t === 'killed') {
      const origin = this.sim.originOf(this.sim.screen.id);
      this.fx.poof({ x: origin.x + ev.x, y: origin.y + ev.y - 6 }, this.sim.tick);
    } else if (ev.t === 'hit' && ev.target === this.sim.hero.id && !ev.blocked && ev.dealt > 0) {
      if (this.services.settings.shake) this.cameras.main.shake(120, 0.004);
    } else if (ev.t === 'screenTransition') this.showScreen(ev.to);
    else if (ev.t === 'coverChanged') this.screens.get(ev.screen)?.view.setCover(this.coverTiles(ev.screen));
    else if (ev.t === 'screenEntered') {
      this.showScreen(ev.screen);
      this.dropScreensExcept(ev.screen);
    } else if (ev.t === 'autosave') this.services.saves.autosaver.request(this.sim.snapshot());
  }

  /** Opens or closes the pause menu; everything that moves on its own clock stops while it is open. */
  private setMenu(next: MenuState | null): void {
    const was = this.menu !== null;
    this.menu = next;
    const paused = next !== null;
    if (paused === was) return;
    for (const stage of this.screens.values()) {
      stage.view.setPaused(paused);
      stage.ambient.setPaused(paused);
    }
    this.weather.setPaused(paused);
    this.audio.play('sfx_talk');
  }

  private updateMenu(frame: InputFrame): void {
    const menu = this.menu;
    if (menu === null) return;
    const r = stepMenu(menu, frame, menuItems(this.sim.state.inv, this.services.db.items));
    for (const a of r.actions) {
      if (a.k === 'equip') this.sim.command({ t: 'equip', slot: a.slot, item: a.item });
      else if (a.k === 'eat') this.sim.command({ t: 'eat', item: a.item });
      else if (a.k === 'startOver') {
        const state = newGame(crypto.getRandomValues(new Uint32Array(1))[0] ?? 1, NEW_GAME);
        this.services.saves.autosaver.request(state);
        this.scene.restart({ ...this.services, state });
        return;
      }
    }
    if (r.actions.length > 0) this.sim.flushCommands();
    if (r.state !== menu && r.state !== null && (r.state.cursor !== menu.cursor || r.state.tab !== menu.tab))
      this.audio.play('sfx_talk');
    this.setMenu(r.state);
  }

  /** The hero's sprite follows the weapon in hand; everything else draws its own art. */
  private readonly artOf = (e: Entity): string =>
    e.kind === 'hero' ? heroArtFor(this.sim.state.inv.weapon) : e.art;

  private draw(alpha: number): void {
    const tr = this.sim.transition;
    this.fadeRect.setAlpha(this.sim.fade());
    if (tr !== null && tr.kind === 'slide') {
      const p = Math.min(1, (tr.t + alpha) / tr.dur);
      const from = this.sim.originOf(tr.from);
      const to = this.sim.originOf(tr.to);
      const cam = lerp(from, to, p);
      this.cameras.main.setScroll(Math.round(cam.x), Math.round(cam.y));
      const hero = lerp(add(from, tr.heroFrom), add(to, tr.heroTo), p);
      this.views.sync(this.sim.entities, (e) => (e === this.sim.hero ? hero : add(to, e.pos)), this.artOf);
    } else {
      const origin = this.sim.originOf(this.sim.screen.id);
      this.cameras.main.setScroll(origin.x, origin.y);
      this.views.sync(this.sim.entities, (e) => add(origin, lerp(e.prev, e.pos, alpha)), this.artOf);
    }
    this.fx.tick(this.sim.tick);
    const hero = this.views.bounds(this.sim.hero);
    for (const stage of this.screens.values()) {
      stage.view.tick(this.sim.tick);
      stage.view.fadeBehind(hero);
      stage.ambient.tick(this.sim.tick);
    }
    this.drawSky(hero);
    this.applyGrade();
  }

  /** Weather over the playfield and the dark with its lights cut out, in camera pixels. */
  private drawSky(hero: { x: number; y: number; w: number; h: number } | null): void {
    const cam = this.cameras.main;
    const origin = this.sim.originOf(this.sim.screen.id);
    const lights = this.sim
      .lights()
      .map((l) =>
        l.hero === true && hero !== null
          ? { x: hero.x + hero.w / 2 - cam.scrollX, y: hero.y + hero.h - 12 - cam.scrollY, r: l.r }
          : { x: origin.x + l.x - cam.scrollX, y: origin.y + l.y - cam.scrollY, r: l.r },
      );
    this.darkness.draw(this.sim.darkness(), lights);
    this.weather.update(this.sim.weather(), this.time.now);
  }

  private applyGrade(): void {
    const clock = this.sim.state.clock;
    const indoor = this.services.db.screens[this.sim.screen.id].indoor === true;
    const light = indoor ? INDOOR_LIGHT : daylight(clock, this.services.db.clock);
    const season = indoor ? 'autumn' : clock.season;
    const weather = this.sim.weather();
    const key = `${season}|${Math.round(light * 200)}|${weather}`;
    if (key === this.gradeKey) return;
    this.gradeKey = key;
    this.appliedGrade = grade(season, light, weather);
    this.colour.colorMatrix.set([...this.appliedGrade]);
  }

  private showScreen(id: ScreenId): void {
    if (this.screens.has(id)) return;
    const grid = this.sim.terrainOf(id);
    const salt = fnv1a(id);
    const terrain = this.services.db.terrain;
    const decor = decorPlacements(grid, terrain).map((p) => ({ ...p, art: decorArt(p, terrain, salt) }));
    const { tileset, frames } = this.services.assets;
    const origin = this.sim.originOf(id);
    const view = new ScreenView(this, {
      origin,
      indices: tileIndices(grid, tileset, salt),
      cover: this.coverTiles(id),
      tileAnims: this.tileAnims,
      decor,
      frames,
      anims: ANIMS,
    });
    const ambient = new AmbientView(this, {
      origin,
      grid,
      salt,
      frames,
      anims: ANIMS,
      isWater: (t) => tileset.entries[t].group === 'water',
    });
    this.screens.set(id, { view, ambient });
  }

  private viewStats(): ViewStats {
    const sum: ViewStats = {
      screens: this.screens.size,
      decor: 0,
      animatedDecor: 0,
      animatedTiles: 0,
      emitters: 0,
      openWater: 0,
      fishAlive: 0,
      fishJumps: 0,
      rain: this.weather.drops,
      bolts: this.weather.bolts,
      dark: this.darkness.shown.dark,
      lights: this.darkness.shown.lights,
    };
    const out = { ...sum };
    for (const { view, ambient } of this.screens.values()) {
      const v = view.stats();
      const a = ambient.stats();
      out.decor += v.decor;
      out.animatedDecor += v.animatedDecor;
      out.animatedTiles += v.animatedTiles;
      out.emitters += a.emitters;
      out.openWater += a.openWater;
      out.fishAlive += a.fishAlive;
      out.fishJumps += a.fishJumps;
    }
    return out;
  }

  private coverTiles(id: ScreenId): number[] {
    return coverIndices(this.sim.coverOf(id), this.services.db.coverOrder, this.services.assets.tileset);
  }

  private dropScreensExcept(id: ScreenId): void {
    for (const [key, stage] of this.screens) {
      if (key === id) continue;
      stage.view.destroy();
      stage.ambient.destroy();
      this.screens.delete(key);
    }
  }
}
