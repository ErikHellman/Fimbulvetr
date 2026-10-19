import * as Phaser from 'phaser';
import { FONT_HEIGHT, LINE_HEIGHT, textWidth } from '@art/font';
import { UI } from '@content/i18n/ui';
import { GAME_TITLE } from '@content/meta';
import { NEW_GAME } from '@content/start';
import { InputLatch, wasPressed } from '@core/input/actions';
import { t } from '@core/i18n/t';
import { newGame, type GameState } from '@core/state/gameState';
import { MusicPlayer, musicLevel } from '@shell/audio/music';
import { AudioDirector } from '@shell/audio/sfx';
import { FONT_KEY } from '@shell/gfx/font';
import { connectedPads, readPad } from '@shell/input/gamepad';
import { activePadStyle, prompt, promptDevice, type PromptDevice } from '@shell/input/padLabels';
import { TOUCH_TEXT } from '@content/i18n/touch';
import { KeyboardState, attachKeyboard } from '@shell/input/keyboard';
import { InputMapper } from '@shell/input/mapper';
import { bindingsOf } from '@shell/input/remap';
import { importMessageKey, pickSaveFile } from '@shell/platform/exportImport';
import { loadAchievements } from '@shell/platform/achievements';
import { browserStorage, saveSettings } from '@shell/platform/settings';
import type { SaveSummary, SlotId } from '@shell/platform/saveStore';
import { GAME_H, GAME_W } from '@shell/scale';
import type { PlayData } from '@shell/services';
import {
  ACH_ROWS,
  achievementLines,
  openAchievements,
  stepAchievements,
  type AchievementsPage,
} from '@shell/ui/achievementsPage';
import { INTRO_ROWS, openIntro, stepIntro, type IntroState } from '@shell/ui/intro';
import { INTRO_LEFT, introColumn, introLines } from '@shell/ui/introText';
import { currentFullscreen, requestFullscreenToggle } from '@shell/platform/fullscreen';
import { openSettings, stepSettings, type SettingsMenuState } from '@shell/ui/settingsMenu';
import { settingsLines } from '@shell/ui/settingsText';
import { slotName, summaryLine } from '@shell/ui/slotText';
import type { MusicCue } from '@core/audio/music';
import {
  LOAD_ROWS,
  openTitle,
  stepTitle,
  titleRows,
  versionLabel,
  type TitleAction,
  type TitleInfo,
  type TitleRow,
  type TitleState,
} from '@shell/ui/titleMenu';

const INK = 0x0b0a14;
const PAPER = 0xf2ead8;
const TITLE_SHADOW = 0x4a2a2a;
const GOLD = 0xd9b34a;
const DIM = 0x9c9486;
const TITLE_MUSIC: MusicCue = { track: 'music_title', combat: false, night: false };
const ROW_LABEL = {
  continue: UI.title_continue,
  new: UI.title_new,
  load: UI.title_load,
  import: UI.title_import,
  export: UI.title_export,
  settings: UI.menu_settings,
  achievements: UI.title_achievements,
} as const satisfies Record<TitleRow, unknown>;

const NO_BUTTONS: ReadonlySet<never> = new Set();

const EMPTY: Record<SlotId, SaveSummary | null> = {
  auto: null,
  auto_prev: null,
  s1: null,
  s2: null,
  s3: null,
};

/**
 * The title screen: "press any key" (which also lets the browser play sound), then Continue, New game,
 * Load (three slots and the backup autosave), Import, Export, Settings and Achievements. A new game first shows the
 * introduction (the basic controls) until the player ticks "don't show this again". Dev queries that name a
 * screen or preset skip the title screen.
 */
export class TitleScene extends Phaser.Scene {
  private services!: PlayData;
  private state: TitleState = openTitle();
  private settingsMenu: SettingsMenuState | null = null;
  private achievements: AchievementsPage | null = null;
  /** The achievements page's columns: locked ones dim and earned ones gold, left then right. */
  private achText: Phaser.GameObjects.BitmapText[] = [];
  /** The introduction, open between New game and the longhouse. */
  private intro: IntroState | null = null;
  /**
   * What the prompts name: the on-screen controls while they show, else the kind of controller connected,
   * or null for the keyboard.
   */
  private padStyle: PromptDevice | null = null;
  private slots: Record<SlotId, SaveSummary | null> = EMPTY;
  private readonly latch = new InputLatch();
  private readonly keys = new KeyboardState();
  private mapper!: InputMapper;
  private audio!: AudioDirector;
  private music: MusicPlayer | null = null;
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
    this.achievements = null;
    this.intro = null;
    this.busy = false;
    this.message = '';
    this.mapper = new InputMapper(bindingsOf(data.settings.keys), this.latch, {
      holdToggleShield: false,
    });
    this.audio = new AudioDirector(this, () => data.settings.volume, data.muted);
    this.music = MusicPlayer.of(this);
    const detach = attachKeyboard(window, this.keys);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      detach();
      this.keys.clear();
    });
    this.add.rectangle(0, 0, GAME_W, GAME_H, INK).setOrigin(0, 0);
    this.snow(data);
    const titleX = Math.round((GAME_W - textWidth(GAME_TITLE.toUpperCase()) * 3) / 2);
    // The runic cap: a dark offset copy under the title, the title in gold, and a rule with knotted ends.
    this.add
      .bitmapText(titleX + 3, 61, FONT_KEY, GAME_TITLE.toUpperCase(), FONT_HEIGHT)
      .setScale(3)
      .setTint(TITLE_SHADOW);
    this.title = this.add.bitmapText(0, 58, FONT_KEY, GAME_TITLE.toUpperCase(), FONT_HEIGHT).setScale(3);
    this.title.setTint(GOLD).setX(titleX);
    const ruleY = 58 + FONT_HEIGHT * 3 + 6;
    this.add
      .graphics()
      .lineStyle(1, GOLD, 1)
      .lineBetween(titleX + 6, ruleY + 0.5, titleX + textWidth(GAME_TITLE.toUpperCase()) * 3 - 6, ruleY + 0.5)
      .fillStyle(GOLD, 1)
      .fillTriangle(titleX, ruleY + 0.5, titleX + 3, ruleY - 2.5, titleX + 6, ruleY + 0.5)
      .fillTriangle(titleX, ruleY + 0.5, titleX + 6, ruleY + 0.5, titleX + 3, ruleY + 3.5)
      .fillTriangle(
        GAME_W - titleX - 6,
        ruleY + 0.5,
        GAME_W - titleX - 3,
        ruleY - 2.5,
        GAME_W - titleX,
        ruleY + 0.5,
      )
      .fillTriangle(
        GAME_W - titleX - 6,
        ruleY + 0.5,
        GAME_W - titleX,
        ruleY + 0.5,
        GAME_W - titleX - 3,
        ruleY + 3.5,
      );
    const version = versionLabel(__APP_VERSION__, __BUILD_ID__);
    this.text(GAME_W - textWidth(version) - 4, GAME_H - 14, DIM).setText(version);
    this.subtitle = this.text(0, 104, DIM);
    this.body = this.text(0, 150, PAPER);
    this.values = this.text(0, 150, GOLD);
    this.hint = this.text(0, GAME_H - 30, DIM);
    this.achText = [DIM, GOLD, DIM, GOLD].map((c) => this.text(0, 130, c));
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
    this.music?.set(TITLE_MUSIC, musicLevel(this.services.settings, this.services.muted));
    const codes = this.keys.takeCodes();
    const fresh = [...codes].find((c) => !this.lastCodes.has(c)) ?? null;
    this.lastCodes = new Set(codes);
    const pads = connectedPads(navigator);
    const pad = readPad(pads);
    const touch = this.services.touch;
    if (codes.size > 0 || (pad?.buttons.size ?? 0) > 0) touch.otherInput();
    touch.frame('menu', NO_BUTTONS, this.services.settings.lang);
    this.padStyle = promptDevice(touch.shown(), activePadStyle(pads));
    this.mapper.sample(codes, pad, touch.snapshot());
    const frame = this.latch.consume();
    touch.advance();
    if (!this.busy && !touch.arranging()) {
      if (this.settingsMenu !== null) this.stepSettings(frame, fresh);
      else if (this.achievements !== null) {
        const r = stepAchievements(this.achievements, frame);
        this.achievements = r.state;
        if (r.moved) this.audio.play('sfx_menu_move');
      } else if (this.intro !== null) this.stepIntro(frame);
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
    if (r.fullscreen) requestFullscreenToggle(this.services.settings.lang);
    if (r.arrange) this.services.touch.arrange();
    if (r.moved) this.audio.play(r.changed ? 'sfx_menu_ok' : 'sfx_menu_move');
  }

  private stepIntro(frame: ReturnType<InputLatch['consume']>): void {
    const intro = this.intro;
    if (intro === null) return;
    const r = stepIntro(intro, frame);
    this.intro = r.state;
    if (r.moved) this.audio.play(r.action === null ? 'sfx_menu_move' : 'sfx_menu_ok');
    if (r.action?.k === 'back') this.intro = null;
    else if (r.action?.k === 'begin') {
      if (r.action.dontShow) {
        this.services.settings.showIntro = false;
        saveSettings(browserStorage(), this.services.settings);
      }
      this.startNew();
    }
  }

  private startNew(): void {
    this.play(newGame(crypto.getRandomValues(new Uint32Array(1))[0] ?? 1, NEW_GAME));
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
          if (this.services.settings.showIntro) this.intro = openIntro();
          else this.startNew();
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
        case 'achievements':
          this.achievements = openAchievements();
          break;
      }
    } finally {
      this.busy = false;
    }
  }

  private play(state: GameState): void {
    delete document.body.dataset.title;
    delete document.body.dataset.titleRows;
    this.scene.start('play', { ...this.services, state });
  }

  private draw(): void {
    const lang = this.services.settings.lang;
    this.subtitle.setText(t(UI.title_subtitle, lang)).setX(this.centre(t(UI.title_subtitle, lang)));
    this.values.setText('');
    for (const a of this.achText) a.setText('');
    if (this.achievements !== null) {
      document.body.dataset.title = 'achievements';
      this.drawAchievements(this.achievements);
      return;
    }
    if (this.settingsMenu !== null) {
      document.body.dataset.title = 'settings';
      const { labels, values, hint } = settingsLines(
        this.settingsMenu,
        this.services.settings,
        lang,
        currentFullscreen(),
        this.padStyle,
      );
      const left = 120;
      this.body.setText(labels.join('\n')).setPosition(left, 130);
      const column = Math.max(...labels.map((l) => textWidth(l))) + 24;
      this.values.setText(values.join('\n')).setPosition(left + column, 130);
      this.hint.setText(hint).setX(this.centre(hint));
      const valueW = Math.max(40, ...values.map((v) => textWidth(v)));
      this.services.touch.targets.rows(
        left - 8,
        130,
        GAME_W - 2 * (left - 8),
        LINE_HEIGHT,
        labels.length,
        this.settingsMenu.cursor,
        {
          value: { x: left + column - 4, w: valueW + 8 },
        },
      );
      return;
    }
    if (this.intro !== null) {
      document.body.dataset.title = 'intro';
      const { heading, labels, values, hint } = introLines(
        this.intro,
        this.services.settings,
        lang,
        this.padStyle,
      );
      this.subtitle.setText(heading).setX(this.centre(heading));
      this.body.setText(labels.join('\n')).setPosition(INTRO_LEFT, 130);
      this.values.setText(values.join('\n')).setPosition(INTRO_LEFT + introColumn(labels, values), 130);
      this.hint.setText(hint).setX(this.centre(hint));
      // Only the last two lines (the box and Begin) are choices.
      const first = labels.length - INTRO_ROWS.length;
      this.services.touch.targets.rows(
        INTRO_LEFT - 8,
        130 + first * LINE_HEIGHT,
        GAME_W - 2 * (INTRO_LEFT - 8),
        LINE_HEIGHT,
        INTRO_ROWS.length,
        this.intro.cursor,
      );
      return;
    }
    document.body.dataset.title = this.state.page;
    document.body.dataset.titleRows = titleRows(this.info()).join(',');
    const mark = (i: number): string => (i === this.state.cursor ? '> ' : '  ');
    let lines: string[];
    let hint: string;
    switch (this.state.page) {
      case 'press':
        lines = [
          t(
            this.padStyle === 'touch'
              ? TOUCH_TEXT.press
              : this.padStyle === null
                ? UI.title_press
                : UI.title_press_pad,
            lang,
          ),
        ];
        hint = '';
        break;
      case 'main':
        lines = titleRows(this.info()).map((r, i) => mark(i) + t(ROW_LABEL[r], lang));
        hint = prompt(UI.title_hint, UI.title_hint_pad, this.padStyle, lang);
        break;
      case 'confirmNew':
        lines = [t(UI.title_new, lang)];
        hint = prompt(UI.title_confirm_new, UI.title_confirm_new_pad, this.padStyle, lang);
        break;
      case 'load':
        lines = LOAD_ROWS.map((r, i) =>
          r === 'back'
            ? mark(i) + t(UI.set_back, lang)
            : `${mark(i)}${slotName(r, lang)}: ${summaryLine(this.slots[r], this.services.db, lang)}`,
        );
        hint = prompt(UI.title_load_hint, UI.title_load_hint_pad, this.padStyle, lang);
        break;
    }
    const widest = Math.max(...lines.map((l) => textWidth(l)));
    this.body.setText(lines.join('\n')).setPosition(Math.round((GAME_W - widest) / 2), 150);
    const bottom = this.message === '' ? hint : this.message;
    this.hint.setText(bottom).setX(this.centre(bottom));
    this.body.setY(this.state.page === 'load' ? 140 : 150 + (this.state.page === 'press' ? LINE_HEIGHT : 0));
    const targets = this.services.touch.targets;
    if (this.state.page === 'press')
      targets.add({ k: 'press', x: 0, y: 0, w: GAME_W, h: GAME_H, action: 'confirm' });
    else if (this.state.page === 'confirmNew')
      targets.add({
        k: 'press',
        x: 160,
        y: this.body.y - 4,
        w: GAME_W - 320,
        h: LINE_HEIGHT + 8,
        action: 'confirm',
      });
    else
      targets.rows(
        Math.min(this.body.x, 160) - 8,
        this.body.y,
        GAME_W - 2 * (Math.min(this.body.x, 160) - 8),
        LINE_HEIGHT,
        lines.length,
        this.state.cursor,
      );
  }

  /** Two columns of twelve, the earned ones in gold, and the chosen one's hint underneath. */
  private drawAchievements(page: AchievementsPage): void {
    const lang = this.services.settings.lang;
    const lines = achievementLines(page, loadAchievements(browserStorage()), lang);
    this.subtitle.setText(lines.heading).setX(this.centre(lines.heading));
    const columns = [lines.left, lines.right];
    columns.forEach((rows, c) => {
      const x = c === 0 ? 96 : 336;
      const pick = (gold: boolean): string =>
        rows.map((r, i) => ((lines.earned[c * ACH_ROWS + i] ?? false) === gold ? r : '')).join('\n');
      this.achText[c * 2]?.setText(pick(false)).setPosition(x, 130);
      this.achText[c * 2 + 1]?.setText(pick(true)).setPosition(x, 130);
    });
    this.body.setText(lines.hint).setPosition(this.centre(lines.hint), 130 + (ACH_ROWS + 1) * LINE_HEIGHT);
    // Tapping one shows its hint; Back (or OK) leaves the page.
    columns.forEach((rows, c) => {
      for (let i = 0; i < rows.length; i++)
        this.services.touch.targets.add({
          k: 'row',
          x: c === 0 ? 88 : 328,
          y: 130 + i * LINE_HEIGHT,
          w: 232,
          h: LINE_HEIGHT,
          row: c * ACH_ROWS + i,
          cursor: page.cursor,
          take: false,
        });
    });
    const keys = prompt(UI.ach_hint, UI.ach_hint_pad, this.padStyle, lang);
    this.hint.setText(keys).setX(this.centre(keys));
  }

  private centre(text: string): number {
    return Math.round((GAME_W - textWidth(text)) / 2);
  }

  private text(x: number, y: number, colour: number): Phaser.GameObjects.BitmapText {
    return this.add.bitmapText(x, y, FONT_KEY, '', FONT_HEIGHT).setTint(colour);
  }
}
