import * as Phaser from 'phaser';
import { grade } from '@art/grading';
import { ANIMS } from '@art/sprites';
import { heroArtFor } from '@art/sprites/hero';
import { coverIndices } from '@art/tiles/coverIndices';
import { waterIndices } from '@art/tiles/waterIndices';
import { fringeIndices } from '@art/tiles/fringeIndices';
import { tileFlips, tileIndices } from '@art/tiles/indices';
import { tileAnimations, type TileAnim } from '@art/tiles/tileset';
import type { ScreenId } from '@content/world/screens';
import { daylight, seasonAt } from '@core/clock/clock';
import { overworldMap } from '@core/world/mapModel';
import { stepMapLook } from '@shell/ui/mapLook';
import type { Entity } from '@core/actors/entity';
import { InputLatch, wasPressed, type InputFrame } from '@core/input/actions';
import { fnv1a } from '@core/math/hash';
import { add, lerp, type Vec } from '@core/math/vec';
import type { SimEvent } from '@core/sim/events';
import { advance, type Accumulator } from '@core/sim/loop';
import { Sim } from '@core/sim/sim';
import { newGame, type GameState } from '@core/state/gameState';
import { NEW_GAME } from '@content/start';
import { decorArt, decorPlacements } from '@core/world/decor';
import { shadeMasks } from '@core/world/shade';
import { FRINGE_SPILL } from '@content/terrain';
import { SCREEN_H, SCREEN_W, TILE } from '@core/world/dims';
import { MusicPlayer, musicLevel } from '@shell/audio/music';
import { AudioDirector } from '@shell/audio/sfx';
import { MUSIC_RULES } from '@content/music';
import { musicOf } from '@core/audio/music';
import type { DevBridge, ViewStats } from '@shell/dev/bridge';
import { FrameStats } from '@shell/dev/stats';
import { connectedPads, readPad } from '@shell/input/gamepad';
import { activePadStyle, padLabel, type PadStyle } from '@shell/input/padLabels';
import { withHostPad } from '@shell/platform/host';
import { KeyboardState, attachKeyboard } from '@shell/input/keyboard';
import { InputMapper } from '@shell/input/mapper';
import { LETTERBOX } from '@shell/scale';
import type { PlayData } from '@shell/services';
import { UI_LINK, type UiLink } from '@shell/scenes/UiScene';
import { AmbientView } from '@shell/view/ambientView';
import { menuItems, openMenu, ownedRings, stepMenu, type MenuState } from '@shell/ui/pauseMenu';
import { questPage, type QuestFilter } from '@shell/ui/questPage';
import { EntityViews } from '@shell/view/entityViews';
import { CloudView } from '@shell/view/cloudView';
import { DarknessView, FOG } from '@shell/view/darknessView';
import { GlowView } from '@shell/view/glowView';
import { FxView } from '@shell/view/fxView';
import { WeatherView } from '@shell/view/weatherView';
import { bindingsOf, keyLabel } from '@shell/input/remap';
import { requestFullscreenToggle } from '@shell/platform/fullscreen';
import { openSettings, stepSettings, type SettingsMenuState } from '@shell/ui/settingsMenu';
import { browserStorage, saveSettings } from '@shell/platform/settings';
import { ACHIEVEMENT_DEFS } from '@content/achievements';
import type { AchievementId } from '@content/ids';
import { fresh as freshAchievements } from '@core/progress/achievements';
import { condCtx } from '@core/sim/systems/story';
import { questLog, type QuestLine } from '@core/story/quests';
import { loadAchievements, saveAchievements } from '@shell/platform/achievements';
import { noToasts, pushToasts, tickToasts, type Toasts } from '@shell/ui/toast';
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
/** The camera vignette: a wide, faint darkening of the playfield's corners. */
const VIGNETTE_RADIUS = 0.7;
const VIGNETTE_STRENGTH = 0.18;
/** A lit window at night: a small warm glow and a little cut out of the dark. */
const WINDOW_RADIUS = 14;
/** Frames between achievement checks. */
const ACH_CHECK_FRAMES = 30;

/** Everything drawn for one screen: its tiles and decor, and its ambient smoke and fish. */
interface Stage {
  readonly view: ScreenView;
  readonly ambient: AmbientView;
  /** Window cells, in screen pixels: they glow at night. */
  readonly windows: readonly Vec[];
}

/** Owns the Sim: steps it at 60 Hz, feeds it input, draws its state, plays its sounds, autosaves. */
export class PlayScene extends Phaser.Scene {
  private appliedGrade: readonly number[] = [];
  private services!: PlayData;
  private sim!: Sim;
  private mapper!: InputMapper;
  private audio!: AudioDirector;
  private music: MusicPlayer | null = null;
  private views!: EntityViews;
  private weather!: WeatherView;
  private darkness!: DarknessView;
  private fog!: DarknessView;
  private glow!: GlowView;
  private clouds!: CloudView;
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
  /** The kind of controller connected now, or null: prompts name its buttons while there is one. */
  private pad: PadStyle | null = null;
  private pickerSlots: Record<'s1' | 's2' | 's3', SaveSummary | null> = { s1: null, s2: null, s3: null };
  private pickerResult: 'saved' | 'failed' | null = null;
  /** Keys held last frame, to find the one freshly pressed (for rebinding). */
  private lastCodes: ReadonlySet<string> = new Set();
  /** Achievements this browser holds, the toasts of new ones, and frames until the next check. */
  private held = new Set<AchievementId>();
  private toasts: Toasts = noToasts();
  private achCheck = 0;
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
    this.music = MusicPlayer.of(this);

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
    cam.filters.external.addVignette(0.5, 0.5, VIGNETTE_RADIUS, VIGNETTE_STRENGTH);
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
    this.glow = new GlowView(this, data.assets.frames);
    this.clouds = new CloudView(this);
    this.fadeRect = this.add
      .rectangle(0, 0, SCREEN_W, SCREEN_H, 0x000000)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(1e6)
      .setAlpha(0);
    this.showScreen(this.sim.screen.id);
    this.draw(0);
    this.held = loadAchievements(browserStorage());
    this.toasts = noToasts();
    this.achCheck = 0;
    const link: UiLink = {
      achievements: () => this.held,
      textSize: () => this.services.settings.textSize,
      toast: () => this.toasts.shown,
      sim: this.sim,
      frames: data.assets.frames,
      lang: () => data.settings.lang,
      pad: () => this.pad,
      keyLabel: (action) => {
        const button = bindingsOf(data.settings.keys).pad[action][0];
        return this.pad !== null && button !== undefined
          ? padLabel(button, this.pad, data.settings.lang)
          : keyLabel(bindingsOf(data.settings.keys).kb[action][0] ?? '');
      },
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
              quests: this.menuQuests(this.menu.filter),
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
    this.music?.set(musicOf(this.sim, MUSIC_RULES), musicLevel(this.services.settings, this.services.muted));
    const codes = this.keys.takeCodes();
    const fresh = [...codes].find((c) => !this.lastCodes.has(c)) ?? null;
    this.lastCodes = new Set(codes);
    const pads = withHostPad(this.services.host, connectedPads(navigator));
    this.pad = activePadStyle(pads);
    this.mapper.sample(codes, readPad(pads));
    if (this.picker === null && this.sim.storyUi()?.k === 'save') this.openPicker();
    if (this.picker !== null) {
      this.updatePicker(this.latch.consume());
      this.acc.acc = 0;
      this.draw(0);
      return;
    }
    if (this.menu !== null) {
      if (this.settingsMenu !== null) this.updateSettings(this.latch.consume(), fresh);
      else {
        const frame = this.latch.consume();
        if (!this.updateMapLook(frame)) this.updateMenu(frame);
      }
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
      this.stepAchievements();
    }
    this.stats.record(delta, performance.now() - started);
    const events = this.sim.drainEvents();
    for (const ev of events) this.onEvent(ev);
    this.audio.handle(events);
    this.services.dev?.onEvents(events);
    this.draw(alpha);
  }

  /** Every half second of play, newly earned achievements are stored and queued as toasts. */
  private stepAchievements(): void {
    this.toasts = tickToasts(this.toasts);
    if (this.sim.mode !== 'play' || ++this.achCheck < ACH_CHECK_FRAMES) return;
    this.achCheck = 0;
    const ids = freshAchievements(ACHIEVEMENT_DEFS, condCtx(this.sim), this.held);
    if (ids.length === 0) return;
    for (const id of ids) this.held.add(id);
    saveAchievements(browserStorage(), this.held);
    this.toasts = pushToasts(this.toasts, ids);
    document.body.dataset.achievements = [...this.held].join(',');
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
      overrides: this.services.assets.overrides,
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

  /** The hero's animation last frame: a roll beginning kicks up dust. */
  private lastHeroAnim = '';

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
    } else if (ev.t === 'hit' && !ev.blocked && ev.dealt > 0) {
      const target = this.sim.entities.find((e) => e.id === ev.target);
      if (target !== undefined) {
        const origin = this.sim.originOf(this.sim.screen.id);
        this.fx.hit({ x: origin.x + target.pos.x, y: origin.y + target.pos.y - 10 }, this.sim.tick);
      }
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

  /** The map tab's look-around frame; false when the press is left to the pause menu. */
  private updateMapLook(frame: InputFrame): boolean {
    const menu = this.menu;
    if (menu === null) return false;
    const { db, state } = this.sim;
    const map =
      db.screens[this.sim.screen.id].dungeon === undefined
        ? overworldMap(db.layout, db.screens, state.world.visited, this.sim.screen.id)
        : null;
    const r = stepMapLook(menu, frame, map);
    if (r === null) return false;
    if (r.moved) this.audio.play('sfx_menu_move');
    this.setMenu(r.state);
    return true;
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
      this.menuQuests(menu.filter).length,
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
    if (
      r.state !== menu &&
      r.state !== null &&
      (r.state.cursor !== menu.cursor || r.state.tab !== menu.tab || r.state.filter !== menu.filter)
    )
      this.audio.play('sfx_talk');
    this.setMenu(r.state);
  }

  /** What the quest tab lists under `filter`. */
  private menuQuests(filter: QuestFilter): QuestLine[] {
    return questPage(questLog(this.sim.db.quests, condCtx(this.sim)), filter);
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
    if (r.fullscreen) requestFullscreenToggle(this.services.settings.lang);
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
    const heroAnim = this.sim.hero.anim;
    if (heroAnim === 'roll' && this.lastHeroAnim !== 'roll') {
      const origin = this.sim.originOf(this.sim.screen.id);
      this.fx.dust(add(origin, this.sim.hero.pos), this.sim.tick);
    }
    this.lastHeroAnim = heroAnim;
    this.fx.tick(this.sim.tick);
    this.flames.draw(this.sim.screen.cover, this.sim.originOf(this.sim.screen.id), this.sim.tick);
    this.ghostFloor.draw(this.sim.ghosts(), this.sim.originOf(this.sim.screen.id));
    this.chain.draw(this.sim.grapple(), this.sim.originOf(this.sim.screen.id));
    this.beamView.draw(
      this.sim.beams(),
      this.sim.originOf(this.sim.screen.id),
      this.sim.tick,
      this.sim.rimeFloor(),
      this.sim.ring(),
    );
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
    const lights = this.sim.lights().map((l) =>
      l.hero === true && hero !== null
        ? {
            x: hero.x + hero.w / 2 - cam.scrollX,
            y: hero.y + hero.h - 12 - cam.scrollY,
            r: l.r,
            hero: true,
          }
        : { x: origin.x + l.x - cam.scrollX, y: origin.y + l.y - cam.scrollY, r: l.r },
    );
    const darkness = this.sim.darkness();
    if (darkness > 0)
      for (const w of this.screens.get(this.sim.screen.id)?.windows ?? [])
        lights.push({ x: origin.x + w.x - cam.scrollX, y: origin.y + w.y - cam.scrollY, r: WINDOW_RADIUS });
    this.darkness.draw(darkness, lights);
    this.glow.draw(darkness, lights, this.time.now);
    const fog = this.sim.fog();
    const clear =
      hero === null
        ? []
        : [{ x: hero.x + hero.w / 2 - cam.scrollX, y: hero.y + hero.h - 12 - cam.scrollY, r: fog.r }];
    this.fog.draw(fog.amount, [...clear, ...lights.filter((l) => l.r !== fog.r)]);
    const def = this.services.db.screens[this.sim.screen.id];
    const wind = this.sim.wind();
    this.weather.update(
      {
        kind: this.sim.weather(),
        season: seasonAt(this.sim.state.clock, def.region, this.services.db.clock, this.sim.state.flags),
        wind,
      },
      this.time.now,
    );
    this.clouds.update(
      {
        daylight: daylight(this.sim.state.clock, this.services.db.clock),
        weather: this.sim.weather(),
        outdoors: def.indoor !== true && def.dungeon === undefined,
        wind,
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
      shade: shadeMasks(grid, terrain).map((m) => (m === 0 ? -1 : tileset.shade.start + m)),
      fringe: fringeIndices(grid, tileset, FRINGE_SPILL),
      flips: tileFlips(grid, tileset, salt),
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
    const windows: Vec[] = [];
    grid.cells.forEach((t, i) => {
      if (t === 'window')
        windows.push({ x: ((i % grid.cols) + 0.5) * TILE, y: (Math.floor(i / grid.cols) + 0.5) * TILE });
    });
    this.screens.set(id, { view, ambient, windows });
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
