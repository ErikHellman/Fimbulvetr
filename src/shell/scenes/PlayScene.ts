import * as Phaser from 'phaser';
import { grade } from '@art/grading';
import { ANIMS } from '@art/sprites';
import { tileIndices } from '@art/tiles/indices';
import { DEFAULT_BINDINGS } from '@content/bindings';
import type { ScreenId } from '@content/world/screens';
import { daylight } from '@core/clock/clock';
import { InputLatch } from '@core/input/actions';
import { fnv1a } from '@core/math/hash';
import { add, lerp } from '@core/math/vec';
import type { SimEvent } from '@core/sim/events';
import { advance, type Accumulator } from '@core/sim/loop';
import { Sim } from '@core/sim/sim';
import { SCREEN_H, SCREEN_W } from '@core/world/dims';
import type { DevBridge } from '@shell/dev/bridge';
import { FrameStats } from '@shell/dev/stats';
import { readPad } from '@shell/input/gamepad';
import { KeyboardState, attachKeyboard } from '@shell/input/keyboard';
import { InputMapper } from '@shell/input/mapper';
import { LETTERBOX } from '@shell/scale';
import type { PlayData } from '@shell/services';
import { EntityViews } from '@shell/view/entityViews';
import { ScreenView } from '@shell/view/screenView';

/** Owns the Sim: steps it at 60 Hz, feeds it input, and draws its state. */
export class PlayScene extends Phaser.Scene {
  private appliedGrade: readonly number[] = [];
  private services!: PlayData;
  private sim!: Sim;
  private mapper!: InputMapper;
  private views!: EntityViews;
  private colour!: Phaser.Filters.ColorMatrix;
  private readonly latch = new InputLatch();
  private readonly keys = new KeyboardState();
  private readonly acc: Accumulator = { acc: 0 };
  private readonly screens = new Map<ScreenId, ScreenView>();
  private readonly stats = new FrameStats();
  private gradeKey = '';

  constructor() {
    super('play');
  }

  create(data: PlayData): void {
    this.services = data;
    this.acc.acc = 0;
    this.gradeKey = '';
    this.screens.clear();
    this.sim = new Sim(data.db, data.state);
    this.mapper = new InputMapper(DEFAULT_BINDINGS, this.latch, { holdToggleShield: false });
    const detach = attachKeyboard(window, this.keys);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      detach();
      this.keys.clear();
    });
    const cam = this.cameras.main;
    cam.setViewport(0, LETTERBOX, SCREEN_W, SCREEN_H);
    cam.setRoundPixels(true);
    this.colour = cam.filters.internal.addColorMatrix();
    this.views = new EntityViews(this, data.assets.frames, ANIMS);
    this.showScreen(this.sim.screen.id);
    this.draw(0);
    data.dev?.attach(this.bridge());
    document.body.dataset.ready = 'true';
  }

  override update(_time: number, delta: number): void {
    this.mapper.sample(this.keys.codes(), readPad(navigator.getGamepads()));
    const { steps, alpha } = advance(this.acc, delta);
    const started = performance.now();
    for (let i = 0; i < steps; i++) this.sim.step(this.latch.consume());
    this.stats.record(delta, performance.now() - started);
    const events = this.sim.drainEvents();
    for (const ev of events) this.onEvent(ev);
    this.services.dev?.onEvents(events);
    this.draw(alpha);
  }

  private bridge(): DevBridge {
    return {
      sim: this.sim,
      frames: this.services.assets.frames,
      stats: this.stats,
      appliedGrade: () => this.appliedGrade,
      lightLevel: () => daylight(this.sim.state.clock, this.services.db.clock),
    };
  }

  private onEvent(ev: SimEvent): void {
    if (ev.t === 'screenTransition') this.showScreen(ev.to);
    else if (ev.t === 'screenEntered') {
      this.showScreen(ev.screen);
      this.dropScreensExcept(ev.screen);
    }
  }

  private draw(alpha: number): void {
    const tr = this.sim.transition;
    if (tr !== null) {
      const p = Math.min(1, (tr.t + alpha) / tr.dur);
      const from = this.sim.originOf(tr.from);
      const to = this.sim.originOf(tr.to);
      const cam = lerp(from, to, p);
      this.cameras.main.setScroll(Math.round(cam.x), Math.round(cam.y));
      const hero = lerp(add(from, tr.heroFrom), add(to, tr.heroTo), p);
      this.views.sync(this.sim.entities, (e) => (e === this.sim.hero ? hero : add(to, e.pos)));
    } else {
      const origin = this.sim.originOf(this.sim.screen.id);
      this.cameras.main.setScroll(origin.x, origin.y);
      this.views.sync(this.sim.entities, (e) => add(origin, lerp(e.prev, e.pos, alpha)));
    }
    this.applyGrade();
  }

  private applyGrade(): void {
    const clock = this.sim.state.clock;
    const light = daylight(clock, this.services.db.clock);
    const key = `${clock.season}|${Math.round(light * 200)}`;
    if (key === this.gradeKey) return;
    this.gradeKey = key;
    this.appliedGrade = grade(clock.season, light, 'clear');
    this.colour.colorMatrix.set([...this.appliedGrade]);
  }

  private showScreen(id: ScreenId): void {
    if (this.screens.has(id)) return;
    const indices = tileIndices(this.sim.terrainOf(id), this.services.assets.tileset, fnv1a(id));
    this.screens.set(id, new ScreenView(this, this.sim.originOf(id), indices));
  }

  private dropScreensExcept(id: ScreenId): void {
    for (const [key, view] of this.screens) {
      if (key === id) continue;
      view.destroy();
      this.screens.delete(key);
    }
  }
}
