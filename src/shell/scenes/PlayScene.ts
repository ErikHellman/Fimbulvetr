import * as Phaser from 'phaser';
import { grade } from '@art/grading';
import { ANIMS } from '@art/sprites';
import { heroArtFor } from '@art/sprites/hero';
import { coverIndices } from '@art/tiles/coverIndices';
import { waterIndices } from '@art/tiles/waterIndices';
import { tileIndices } from '@art/tiles/indices';
import { tileAnimations, type TileAnim } from '@art/tiles/tileset';
import type { ScreenId } from '@content/world/screens';
import { daylight, seasonAt } from '@core/clock/clock';
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
import { menuItems, openMenu, ownedRings, stepMenu, type MenuState } from '@shell/ui/pauseMenu';
import { EntityViews } from '@shell/view/entityViews';
import { DarknessView, FOG } from '@shell/view/darknessView';
import { FxView } from '@shell/view/fxView';
import { WeatherView } from '@shell/view/weatherView';
import { bindingsOf, keyLabel } from '@shell/input/remap';
import { openSettings, stepSettings, type SettingsMenuState } from '@shell/ui/settingsMenu';
import { browserStorage, saveSettings } from '@shell/platform/settings';
import type { SaveSummary } from '@shell/platform/saveStore';
import { ARM_FRAMES, openPicker, pickerDone, stepPicker, type PickerState } from '@shell/ui/slotPicker';
import { FireView } from '@shell/view/fireView';
import { GhostView } from '@shell/view/ghostView';
import { WardView } from '@shell/view/wardView';
import { ChainView } from '@shell/view/chainView';
import { BeamView } from '@shell/view/beamView';
import { FishView } from '@shell/view/fishView';
import { ScreenView } from '@shell/view/screenView';

/** Interiors are lit by the hearth: a fixed warm grade whatever the hour. */
const INDOOR_LIGHT = 0.85;
/** Dungeons: a fixed, cool cave light. */
const CAVE_LIGHT = 0.8;

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
  private fog!: DarknessView;
  private fx!: FxView;
  private flames!: FireView;
  private ghostFloor!: GhostView;
  private ward!: WardView;
  private chain!: ChainView;
  private beamView!: BeamView;
  private fishing!: FishView;
  private colour!: Phaser.Filters.ColorMatrix;
  private fadeRect!: Phaser.GameObjects.Rectangle;
  private readonly latch = new InputLatch();
  private readonly keys = new KeyboardState();
  private readonly acc: Accumulator = { acc: 0 };
  private readonly screens = new Map<ScreenId, Stage>();
  private readonly stats = new FrameStats();
  private gradeKey = '';
  private menu: MenuState | null = null;
  /** The settings menu, open over the pause menu's game tab. */
  private settingsMenu: SettingsMenuState | null = null;
  /** The save-slot picker, while the sim's `save` step waits. */
  private picker: PickerState | null = null;
  private pickerSlots: Record<'s1' | 's2' | 's3', SaveSummary | null> = { s1: null, s2: null, s3: null };
  private pickerResult: 'saved' | 'failed' | null = null;
  /** Keys held last frame, to find the one freshly pressed (for rebinding). */
  private lastCodes: ReadonlySet<string> = new Set();
  private tileAnims: readonly TileAnim[] = [];

  constructor() {
    super('play');
  }

  create(data: PlayData): void {
    this.services = data;
    this.acc.acc = 0;
    this.gradeKey = '';
    this.menu = null;
    this.settingsMenu = null;
    this.picker = null;
    this.screens.clear();
    this.sim = new Sim(data.db, data.state, { longDay: data.settings.longDay, rolled: data.rolled });
    if (data.weather !== undefined) this.sim.weatherOverride = data.weather;
    this.tileAnims = tileAnimations(data.assets.tileset);
    this.mapper = new InputMapper(bindingsOf(data.settings.keys), this.latch, {
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
    this.flames = new FireView(this, data.assets.frames, ANIMS);
    this.ghostFloor = new GhostView(this, data.assets.frames);
    this.ward = new WardView(this);
    this.chain = new ChainView(this, data.assets.frames);
    this.beamView = new BeamView(this);
    this.fishing = new FishView(this, data.assets.frames, ANIMS);
    this.weather = new WeatherView(this, data.assets.frames, {
      sfx: (id) => {
        this.audio.play(id);
      },
      flashes: () => data.settings.flash,
    });
    this.darkness = new DarknessView(this, data.assets.frames);
    this.fog = new DarknessView(this, data.assets.frames, FOG);
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
      keyLabel: (action) => keyLabel(bindingsOf(data.settings.keys).kb[action][0] ?? ''),
      sfx: (id) => {
        this.audio.play(id);
      },
      picker: () =>
        this.picker === null
          ? null
          : { state: this.picker, slots: this.pickerSlots, result: this.pickerResult },
      menu: () =>
        this.menu === null
          ? null
          : {
              state: this.menu,
              items: menuItems(this.sim.state.inv, this.services.db.items, ownedRings(this.sim.state)),
              settings:
                this.settingsMenu === null
                  ? null
                  : { state: this.settingsMenu, values: this.services.settings },
            },
    };
    this.registry.set(UI_LINK, link);
    if (!this.scene.isActive('ui')) this.scene.launch('ui');
    data.dev?.attach(this.bridge());
    document.body.dataset.ready = 'true';
  }

  override update(_time: number, delta: number): void {
    const codes = this.keys.takeCodes();
    const fresh = [...codes].find((c) => !this.lastCodes.has(c)) ?? null;
    this.lastCodes = new Set(codes);
    this.mapper.sample(codes, readPad(connectedPads(navigator)));
    if (this.picker === null && this.sim.storyUi()?.k === 'save') this.openPicker();
    if (this.picker !== null) {
      this.updatePicker(this.latch.consume());
      this.acc.acc = 0;
      this.draw(0);
      return;
    }
    if (this.menu !== null) {
      if (this.settingsMenu !== null) this.updateSettings(this.latch.consume(), fresh);
      else this.updateMenu(this.latch.consume());
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

  /** Settings changed in a menu: keys, the shield toggle, the long day and colours take effect at once. */
  applySettings(): void {
    const s = this.services.settings;
    this.mapper.configure(bindingsOf(s.keys), { holdToggleShield: s.holdShield });
    this.sim.setLongDay(s.longDay);
    this.gradeKey = '';
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
      coverAt: (x, y) => this.screens.get(this.sim.screen.id)?.view.coverTile(x, y) ?? -1,
      restart: (state: GameState) => {
        this.scene.restart({ ...this.services, state });
      },
      menu: () => (this.menu === null ? null : { ...this.menu }),
      picker: () =>
        this.picker === null
          ? null
          : {
              cursor: this.picker.cursor,
              phase: this.picker.phase,
              armed: this.picker.phase !== 'pick' || this.picker.t >= ARM_FRAMES,
            },
    };
  }

  private onEvent(ev: SimEvent): void {
    if (ev.t === 'killed') {
      const origin = this.sim.originOf(this.sim.screen.id);
      this.fx.poof({ x: origin.x + ev.x, y: origin.y + ev.y - 6 }, this.sim.tick);
    } else if (ev.t === 'blast') {
      const origin = this.sim.originOf(this.sim.screen.id);
      this.fx.blast({ x: origin.x + ev.x, y: origin.y + ev.y }, this.sim.tick);
    } else if (ev.t === 'parry') {
      const origin = this.sim.originOf(this.sim.screen.id);
      this.fx.spark({ x: origin.x + ev.x, y: origin.y + ev.y }, this.sim.tick);
    } else if (ev.t === 'hit' && ev.target === this.sim.hero.id && !ev.blocked && ev.dealt > 0) {
      if (this.services.settings.shake) this.cameras.main.shake(120, 0.004);
    } else if (ev.t === 'shake') {
      // `amount` is in pixels; Phaser's intensity is a share of the view.
      if (this.services.settings.shake) this.cameras.main.shake(240, ev.amount / this.scale.width);
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
    const r = stepMenu(
      menu,
      frame,
      menuItems(this.sim.state.inv, this.services.db.items, ownedRings(this.sim.state)),
    );
    for (const a of r.actions) {
      if (a.k === 'settings') {
        this.settingsMenu = openSettings();
        this.audio.play('sfx_menu_ok');
      } else if (a.k === 'equip') this.sim.command({ t: 'equip', slot: a.slot, item: a.item });
      else if (a.k === 'eat') this.sim.command({ t: 'eat', item: a.item });
      else if (a.k === 'ready') this.sim.command({ t: 'ready', galdr: a.galdr });
      else if (a.k === 'ring') this.sim.command({ t: 'ring', id: a.id });
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

  private openPicker(): void {
    this.picker = openPicker();
    this.pickerResult = null;
    void this.services.saves.slots().then((s) => {
      this.pickerSlots = { s1: s.s1, s2: s.s2, s3: s.s3 };
    });
  }

  /** A frame of the save-slot picker; writing goes to IndexedDB, then the sim carries on (`saved`). */
  private updatePicker(frame: InputFrame): void {
    const picker = this.picker;
    if (picker === null) return;
    const r = stepPicker(picker, frame);
    this.picker = r.state;
    if (r.moved) this.audio.play('sfx_menu_move');
    if (r.action?.k === 'close') {
      this.picker = null;
      this.sim.command({ t: 'saved' });
      this.sim.flushCommands();
    } else if (r.action?.k === 'write') {
      const slot = r.action.slot;
      void this.services.saves.writeSlot(slot, this.sim.snapshot()).then(async (ok) => {
        this.pickerResult = ok ? 'saved' : 'failed';
        if (ok) this.audio.play('sfx_save');
        const s = await this.services.saves.slots();
        this.pickerSlots = { s1: s.s1, s2: s.s2, s3: s.s3 };
        if (this.picker !== null) this.picker = pickerDone(this.picker);
      });
    }
  }

  /** A frame of the settings menu: changes are stored and applied at once. */
  private updateSettings(frame: InputFrame, code: string | null): void {
    const menu = this.settingsMenu;
    if (menu === null) return;
    const r = stepSettings(menu, frame, this.services.settings, code);
    this.settingsMenu = r.state;
    if (r.changed) {
      const scaling = this.services.settings.scaling;
      Object.assign(this.services.settings, r.settings);
      saveSettings(browserStorage(), this.services.settings);
      this.applySettings();
      document.documentElement.lang = this.services.settings.lang;
      // attachZoom re-reads the scaling setting on resize.
      if (scaling !== this.services.settings.scaling) window.dispatchEvent(new Event('resize'));
    }
    if (r.moved) this.audio.play(r.changed ? 'sfx_menu_ok' : 'sfx_menu_move');
    if (r.state === null) this.audio.play('sfx_talk');
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
    this.flames.draw(this.sim.screen.cover, this.sim.originOf(this.sim.screen.id), this.sim.tick);
    this.ghostFloor.draw(this.sim.ghosts(), this.sim.originOf(this.sim.screen.id));
    this.chain.draw(this.sim.grapple(), this.sim.originOf(this.sim.screen.id));
    this.beamView.draw(this.sim.beams(), this.sim.originOf(this.sim.screen.id), this.sim.tick);
    {
      const hero = this.sim.hero;
      const origin = this.sim.originOf(this.sim.screen.id);
      this.ward.draw(this.sim.ward(), add(origin, lerp(hero.prev, hero.pos, alpha)), this.sim.tick);
    }
    {
      const ui = this.sim.storyUi();
      const origin = this.sim.originOf(this.sim.screen.id);
      this.fishing.draw(
        ui?.k === 'fish' ? ui : null,
        add(origin, this.sim.hero.pos),
        this.sim.hero.facing,
        origin,
        this.sim.tick,
      );
    }
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
    const fog = this.sim.fog();
    const clear =
      hero === null
        ? []
        : [{ x: hero.x + hero.w / 2 - cam.scrollX, y: hero.y + hero.h - 12 - cam.scrollY, r: fog.r }];
    this.fog.draw(fog.amount, [...clear, ...lights.filter((l) => l.r !== fog.r)]);
    const def = this.services.db.screens[this.sim.screen.id];
    this.weather.update(
      {
        kind: this.sim.weather(),
        season: seasonAt(this.sim.state.clock, def.region, this.services.db.clock),
        wind: this.sim.wind(),
      },
      this.time.now,
    );
  }

  private applyGrade(): void {
    const clock = this.sim.state.clock;
    const def = this.services.db.screens[this.sim.screen.id];
    const indoor = def.indoor === true;
    const cave = def.dungeon !== undefined;
    const light = indoor ? INDOOR_LIGHT : cave ? CAVE_LIGHT : daylight(clock, this.services.db.clock);
    const season = indoor ? 'autumn' : cave ? 'spring' : clock.season;
    const weather = this.sim.weather();
    const cb = this.services.settings.colourBlind;
    const key = `${season}|${Math.round(light * 200)}|${weather}|${cb ? 'cb' : ''}`;
    if (key === this.gradeKey) return;
    this.gradeKey = key;
    this.appliedGrade = grade(season, light, weather, cb);
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
      snow: this.weather.flakes,
      leaves: this.weather.blown,
      bolts: this.weather.bolts,
      dark: this.darkness.shown.dark,
      fog: this.fog.shown.dark,
      flames: this.flames.shown,
      ghosts: this.ghostFloor.shown,
      chain: this.chain.shown,
      ward: this.ward.shown,
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

  /** The cover layer: ground cover, and over it the water level on screens with water. */
  private coverTiles(id: ScreenId): number[] {
    const { db } = this.services;
    const { tileset } = this.services.assets;
    const cover = coverIndices(this.sim.coverOf(id), db.coverOrder, tileset);
    const flag = db.screens[id].water;
    if (flag === undefined) return cover;
    const v = this.sim.state.flags[flag];
    const water = waterIndices(this.sim.terrainOf(id), db.terrain, typeof v === 'number' ? v : 0, tileset);
    return cover.map((c, i) => ((water[i] ?? -1) >= 0 ? (water[i] ?? c) : c));
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
