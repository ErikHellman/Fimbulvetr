import * as Phaser from 'phaser';
import { FONT_HEIGHT, LINE_HEIGHT, textWidth } from '@art/font';
import { UI } from '@content/i18n/ui';
import { GAME_TITLE } from '@content/meta';
import { NEW_GAME } from '@content/start';
import { InputLatch, wasPressed } from '@core/input/actions';
import { t } from '@core/i18n/t';
import { newGame, type GameState } from '@core/state/gameState';
import { AudioDirector } from '@shell/audio/sfx';
import { FONT_KEY } from '@shell/gfx/font';
import { connectedPads, readPad } from '@shell/input/gamepad';
import { KeyboardState, attachKeyboard } from '@shell/input/keyboard';
import { InputMapper } from '@shell/input/mapper';
import { bindingsOf } from '@shell/input/remap';
import { importMessageKey, pickSaveFile } from '@shell/platform/exportImport';
import { browserStorage, saveSettings } from '@shell/platform/settings';
import type { SaveSummary, SlotId } from '@shell/platform/saveStore';
import { GAME_H, GAME_W } from '@shell/scale';
import type { PlayData } from '@shell/services';
import { openSettings, stepSettings, type SettingsMenuState } from '@shell/ui/settingsMenu';
import { settingsLines } from '@shell/ui/settingsText';
import { slotName, summaryLine } from '@shell/ui/slotText';
import {
  LOAD_ROWS,
  openTitle,
  stepTitle,
  titleRows,
  type TitleAction,
  type TitleInfo,
  type TitleRow,
  type TitleState,
} from '@shell/ui/titleMenu';

const INK = 0x0b0a14;
const PAPER = 0xf2ead8;
const GOLD = 0xd9b34a;
const DIM = 0x9c9486;
const ROW_LABEL = {
  continue: UI.title_continue,
  new: UI.title_new,
  load: UI.title_load,
  import: UI.title_import,
  export: UI.title_export,
  settings: UI.menu_settings,
} as const satisfies Record<TitleRow, unknown>;

const EMPTY: Record<SlotId, SaveSummary | null> = {
  auto: null,
  auto_prev: null,
  s1: null,
  s2: null,
  s3: null,
};

/**
 * The title screen: "press any key" (which also lets the browser play sound), then Continue, New game,
 * Load (three slots and the backup autosave), Import, Export and Settings. Dev queries that name a screen
 * or preset skip it.
 */
export class TitleScene extends Phaser.Scene {
  private services!: PlayData;
  private state: TitleState = openTitle();
  private settingsMenu: SettingsMenuState | null = null;
  private slots: Record<SlotId, SaveSummary | null> = EMPTY;
  private readonly latch = new InputLatch();
  private readonly keys = new KeyboardState();
  private mapper!: InputMapper;
  private audio!: AudioDirector;
  private lastCodes: ReadonlySet<string> = new Set();
  private title!: Phaser.GameObjects.BitmapText;
  private subtitle!: Phaser.GameObjects.BitmapText;
  private body!: Phaser.GameObjects.BitmapText;
  private values!: Phaser.GameObjects.BitmapText;
  private hint!: Phaser.GameObjects.BitmapText;
  private message = '';
  private busy = false;

  constructor() {
    super('title');
  }

  create(data: PlayData): void {
    this.services = data;
    this.state = openTitle();
    this.settingsMenu = null;
    this.busy = false;
    this.message = '';
    this.mapper = new InputMapper(bindingsOf(data.settings.keys), this.latch, {
      holdToggleShield: false,
    });
    this.audio = new AudioDirector(this, () => data.settings.volume, data.muted);
    const detach = attachKeyboard(window, this.keys);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      detach();
      this.keys.clear();
    });
    this.add.rectangle(0, 0, GAME_W, GAME_H, INK).setOrigin(0, 0);
    this.snow(data);
    this.title = this.add.bitmapText(0, 58, FONT_KEY, GAME_TITLE.toUpperCase(), FONT_HEIGHT).setScale(3);
    this.title.setTint(PAPER).setX(Math.round((GAME_W - textWidth(GAME_TITLE.toUpperCase()) * 3) / 2));
    this.subtitle = this.text(0, 104, DIM);
    this.body = this.text(0, 150, PAPER);
    this.values = this.text(0, 150, GOLD);
    this.hint = this.text(0, GAME_H - 30, DIM);
    void this.refreshSlots();
    document.body.dataset.title = 'press';
  }

  /** Flakes drift over the dark: the great winter, before the game begins. */
  private snow(data: PlayData): void {
    const a = data.assets.frames.get('fx_snow_idle_s_0');
    const b = data.assets.frames.get('fx_snow_idle_s_1');
    this.add
      .particles(0, 0, a.key, {
        frame: a.key === b.key ? [a.frame, b.frame] : [a.frame],
        x: { min: -40, max: GAME_W + 40 },
        y: { min: -10, max: -2 },
        speedX: { min: -14, max: 6 },
        speedY: { min: 16, max: 34 },
        lifespan: 14_000,
        frequency: 90,
        quantity: 1,
        alpha: { start: 0.8, end: 0.3 },
        maxAliveParticles: 160,
      })
      .fastForward(8000);
  }

  private async refreshSlots(): Promise<void> {
    this.slots = await this.services.saves.slots();
  }

  private info(): TitleInfo {
    const s = this.slots;
    return {
      filled: {
        auto: s.auto !== null,
        auto_prev: s.auto_prev !== null,
        s1: s.s1 !== null,
        s2: s.s2 !== null,
        s3: s.s3 !== null,
      },
    };
  }

  override update(): void {
    const codes = this.keys.takeCodes();
    const fresh = [...codes].find((c) => !this.lastCodes.has(c)) ?? null;
    this.lastCodes = new Set(codes);
    const pad = readPad(connectedPads(navigator));
    this.mapper.sample(codes, pad);
    const frame = this.latch.consume();
    if (!this.busy) {
      if (this.settingsMenu !== null) this.stepSettings(frame, fresh);
      else {
        const anyKey = fresh !== null || (pad?.buttons.size ?? 0) > 0 || frame.pressed !== 0;
        const r = stepTitle(this.state, frame, this.info(), anyKey);
        if (r.moved) {
          this.message = '';
          this.audio.play(r.action === null ? 'sfx_menu_move' : 'sfx_menu_ok');
        }
        this.state = r.state;
        if (r.action !== null) void this.act(r.action);
        if (wasPressed(frame, 'cancel') && this.state.page === 'main') this.message = '';
      }
    }
    this.draw();
  }

  private stepSettings(frame: ReturnType<InputLatch['consume']>, code: string | null): void {
    const menu = this.settingsMenu;
    if (menu === null) return;
    const r = stepSettings(menu, frame, this.services.settings, code);
    this.settingsMenu = r.state;
    if (r.changed) {
      const scaling = this.services.settings.scaling;
      Object.assign(this.services.settings, r.settings);
      saveSettings(browserStorage(), this.services.settings);
      this.mapper.configure(bindingsOf(this.services.settings.keys), { holdToggleShield: false });
      document.documentElement.lang = this.services.settings.lang;
      if (scaling !== this.services.settings.scaling) window.dispatchEvent(new Event('resize'));
    }
    if (r.moved) this.audio.play(r.changed ? 'sfx_menu_ok' : 'sfx_menu_move');
  }

  private async act(action: TitleAction): Promise<void> {
    const lang = this.services.settings.lang;
    this.busy = true;
    try {
      switch (action.k) {
        case 'continue': {
          const state = await this.services.saves.loadAuto();
          if (state !== null) this.play(state);
          break;
        }
        case 'new':
          this.play(newGame(crypto.getRandomValues(new Uint32Array(1))[0] ?? 1, NEW_GAME));
          break;
        case 'load': {
          const state = await this.services.saves.loadSlot(action.slot);
          if (state !== null) this.play(state);
          break;
        }
        case 'import': {
          const text = await pickSaveFile();
          if (text === null) break;
          const result = this.services.saves.importText(text);
          this.message = t(UI[importMessageKey(result)], lang, {
            detail: result.ok ? '' : result.error.detail,
          });
          if (result.ok) this.play(result.state);
          break;
        }
        case 'export': {
          const state = await this.services.saves.loadAuto();
          if (state !== null) this.services.saves.download(state);
          break;
        }
        case 'settings':
          this.settingsMenu = openSettings();
          break;
      }
    } finally {
      this.busy = false;
    }
  }

  private play(state: GameState): void {
    delete document.body.dataset.title;
    this.scene.start('play', { ...this.services, state });
  }

  private draw(): void {
    const lang = this.services.settings.lang;
    this.subtitle.setText(t(UI.title_subtitle, lang)).setX(this.centre(t(UI.title_subtitle, lang)));
    this.values.setText('');
    if (this.settingsMenu !== null) {
      document.body.dataset.title = 'settings';
      const { labels, values, hint } = settingsLines(this.settingsMenu, this.services.settings, lang);
      const left = 120;
      this.body.setText(labels.join('\n')).setPosition(left, 130);
      const column = Math.max(...labels.map((l) => textWidth(l))) + 24;
      this.values.setText(values.join('\n')).setPosition(left + column, 130);
      this.hint.setText(hint).setX(this.centre(hint));
      return;
    }
    document.body.dataset.title = this.state.page;
    const mark = (i: number): string => (i === this.state.cursor ? '> ' : '  ');
    let lines: string[];
    let hint: string;
    switch (this.state.page) {
      case 'press':
        lines = [t(UI.title_press, lang)];
        hint = '';
        break;
      case 'main':
        lines = titleRows(this.info()).map((r, i) => mark(i) + t(ROW_LABEL[r], lang));
        hint = t(UI.title_hint, lang);
        break;
      case 'confirmNew':
        lines = [t(UI.title_new, lang)];
        hint = t(UI.title_confirm_new, lang);
        break;
      case 'load':
        lines = LOAD_ROWS.map((r, i) =>
          r === 'back'
            ? mark(i) + t(UI.set_back, lang)
            : `${mark(i)}${slotName(r, lang)}: ${summaryLine(this.slots[r], this.services.db, lang)}`,
        );
        hint = t(UI.title_load_hint, lang);
        break;
    }
    const widest = Math.max(...lines.map((l) => textWidth(l)));
    this.body.setText(lines.join('\n')).setPosition(Math.round((GAME_W - widest) / 2), 150);
    const bottom = this.message === '' ? hint : this.message;
    this.hint.setText(bottom).setX(this.centre(bottom));
    this.body.setY(this.state.page === 'load' ? 140 : 150 + (this.state.page === 'press' ? LINE_HEIGHT : 0));
  }

  private centre(text: string): number {
    return Math.round((GAME_W - textWidth(text)) / 2);
  }

  private text(x: number, y: number, colour: number): Phaser.GameObjects.BitmapText {
    return this.add.bitmapText(x, y, FONT_KEY, '', FONT_HEIGHT).setTint(colour);
  }
}
