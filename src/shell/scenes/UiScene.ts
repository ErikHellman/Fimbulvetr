import * as Phaser from 'phaser';
import { FONT_HEIGHT, LINE_HEIGHT, layoutText, textWidth } from '@art/font';
import { UI } from '@content/i18n/ui';
import { ITEM_NAMES } from '@content/items';
import { NPC_NAMES } from '@content/npcs';
import { DUNGEON_NAMES, REGION_COLOURS, REGION_NAMES } from '@content/regions';
import type { DungeonId, ItemId } from '@content/ids';
import { t, type L10n, type Lang } from '@core/i18n/t';
import { CONTINUE_DELAY } from '@core/sim/systems/death';
import { condCtx } from '@core/sim/systems/story';
import { questLog } from '@core/story/quests';
import { peekDungeon } from '@core/state/dungeons';
import { dungeonMap, overworldMap } from '@core/world/mapModel';
import { MENU_TABS, SYSTEM_ROWS, type MenuItem, type MenuState } from '@shell/ui/pauseMenu';
import type { Sim, StoryUi } from '@core/sim/sim';
import type { Speaker } from '@core/story/dialogue';
import { FONT_KEY } from '@shell/gfx/font';
import type { FrameIndex } from '@shell/gfx/frameIndex';
import type { Settings } from '@shell/platform/settings';
import type { SettingsMenuState } from '@shell/ui/settingsMenu';
import { settingsLines } from '@shell/ui/settingsText';
import { GAME_H, GAME_W } from '@shell/scale';

/** What PlayScene shares with the UI scene through the registry. */
export interface UiLink {
  readonly sim: Sim;
  readonly frames: FrameIndex;
  readonly lang: () => Lang;
  /** Plays a sound unless muted. */
  readonly sfx: (id: 'sfx_talk') => void;
  /** The open pause menu and what its items page lists, or null in play. */
  readonly menu: () => {
    readonly state: MenuState;
    readonly items: readonly MenuItem[];
    /** The settings menu, when it is open over the game tab. */
    readonly settings: { readonly state: SettingsMenuState; readonly values: Settings } | null;
  } | null;
}

const TAB_LABEL = {
  items: UI.menu_items,
  map: UI.menu_map,
  quests: UI.menu_quests,
  system: UI.menu_system,
} as const;
const SYSTEM_LABEL = {
  resume: UI.menu_resume,
  settings: UI.menu_settings,
  start_over: UI.menu_start_over,
} as const;
const MENU = { x: 16, y: 14, w: GAME_W - 32, h: GAME_H - 28 };

export const UI_LINK = 'uiLink';

const INK = 0x1b1522;
const GOLD = 0xd9b34a;
const RED = 0xe0433f;
const CAVE = 0x6e6258;
const CAVE_SEEN = 0x9a8a78;
/** Along the bottom edge, clear of the HUD and of whatever the room keeps at its top. */
const BOSS_BAR = { w: 160, h: 6, y: GAME_H - 14 };
const PAPER = 0xf2ead8;
const DIM = 0x9c9486;
const BOX = { x: 20, y: GAME_H - 84, w: GAME_W - 40, h: 76 };
const TEXT_W = BOX.w - 24;
const MAX_HEARTS_PER_ROW = 10;
/** Characters between two talk blips. */
const BLIP_EVERY = 3;

/**
 * Centres the first `count` characters of a block by padding each line with spaces. BitmapText's own
 * centring puts lines on fractional pixels, which garbles pixel glyphs.
 */
function centred(full: string, count: number): string {
  const lines = full.split('\n');
  const widest = Math.max(...lines.map((l) => textWidth(l)));
  const space = textWidth('  ') - textWidth(' ');
  let left = count;
  return lines
    .map((line) => {
      const take = Math.max(0, Math.min(line.length, left));
      left -= line.length + 1;
      return ' '.repeat(Math.round((widest - textWidth(line)) / 2 / space)) + line.slice(0, take);
    })
    .join('\n');
}

/** The untinted overlay: HUD, text boxes, cards and the shop. Reads the Sim; never changes it. */
export class UiScene extends Phaser.Scene {
  private link!: UiLink;
  private hearts: Phaser.GameObjects.Image[] = [];
  private silver!: Phaser.GameObjects.BitmapText;
  private slotIcons: Phaser.GameObjects.Image[] = [];
  private box!: Phaser.GameObjects.Graphics;
  private name!: Phaser.GameObjects.BitmapText;
  private body!: Phaser.GameObjects.BitmapText;
  private choices!: Phaser.GameObjects.BitmapText;
  private card!: Phaser.GameObjects.Rectangle;
  private cardText!: Phaser.GameObjects.BitmapText;
  private shop!: Phaser.GameObjects.BitmapText;
  private lastShown = '';
  private lastBlip = 0;
  private menuBox!: Phaser.GameObjects.Graphics;
  private menuTabs: Phaser.GameObjects.BitmapText[] = [];
  private menuBody!: Phaser.GameObjects.BitmapText;
  private menuHint!: Phaser.GameObjects.BitmapText;
  /** The second column of the settings menu. */
  private menuValues!: Phaser.GameObjects.BitmapText;
  private menuIcons: Phaser.GameObjects.Image[] = [];
  private fallen!: Phaser.GameObjects.Rectangle;
  private fallenTitle!: Phaser.GameObjects.BitmapText;
  private fallenPrompt!: Phaser.GameObjects.BitmapText;
  private keyIcon!: Phaser.GameObjects.Image;
  private keyText!: Phaser.GameObjects.BitmapText;
  private bossBar!: Phaser.GameObjects.Graphics;
  private bossName!: Phaser.GameObjects.BitmapText;

  constructor() {
    super('ui');
  }

  create(): void {
    this.cameras.main.setRoundPixels(true);
    this.hearts = [];
    this.slotIcons = [];
    const hud = this.add.graphics();
    const silverRef = this.frameRef('ui_silver_idle_s_0');
    this.add.image(6, 30, silverRef.key, silverRef.frame).setOrigin(0, 0);
    this.silver = this.text(16, 29, '', PAPER);
    const keyRef = this.frameRef('item_small_key_idle_s_0');
    this.keyIcon = this.add.image(5, 41, keyRef.key, keyRef.frame).setOrigin(0, 0).setVisible(false);
    this.keyText = this.text(16, 41, '', PAPER);
    this.bossBar = this.add.graphics();
    this.bossName = this.text(0, 0, '', PAPER);
    for (let i = 0; i < 2; i++) {
      const x = GAME_W - 56 + i * 26;
      hud
        .fillStyle(INK, 0.75)
        .fillRect(x, 6, 22, 22)
        .lineStyle(1, GOLD, 1)
        .strokeRect(x + 0.5, 6.5, 21, 21);
      this.text(x + 8, 29, i === 0 ? 'K' : 'L', DIM);
      const icon = this.add.image(x + 11, 17, silverRef.key, silverRef.frame).setVisible(false);
      this.slotIcons.push(icon);
    }
    this.box = this.add.graphics();
    this.name = this.text(BOX.x + 12, BOX.y - 14, '', GOLD);
    this.body = this.text(BOX.x + 12, BOX.y + 10, '', PAPER);
    this.choices = this.text(0, 0, '', PAPER);
    this.shop = this.text(0, 0, '', PAPER);
    this.card = this.add.rectangle(0, 0, GAME_W, GAME_H, 0x000000).setOrigin(0, 0).setVisible(false);
    this.cardText = this.text(0, 0, '', PAPER);
    this.fallen = this.add.rectangle(0, 0, GAME_W, GAME_H, 0x000000, 0.6).setOrigin(0, 0).setVisible(false);
    this.fallenTitle = this.text(0, 0, '', PAPER);
    this.fallenPrompt = this.text(0, 0, '', GOLD);
    this.menuBox = this.add.graphics();
    this.menuTabs = MENU_TABS.map(() => this.text(0, 0, '', DIM));
    this.menuBody = this.text(0, 0, '', PAPER);
    this.menuHint = this.text(0, 0, '', DIM);
    this.menuValues = this.text(0, 0, '', GOLD);
    this.menuIcons = [];
  }

  override update(): void {
    const link = this.registry.get(UI_LINK) as UiLink | undefined;
    if (link === undefined) return;
    this.link = link;
    this.drawHud();
    this.drawBoss();
    this.drawStory(link.sim.storyUi());
    this.drawGameOver();
    this.drawMenu();
  }

  /** The pause menu over everything: tab labels, then the page for the open tab. */
  private drawMenu(): void {
    const view = this.link.menu();
    this.menuBox.clear();
    for (const icon of this.menuIcons) icon.setVisible(false);
    this.menuValues.setText('');
    if (view === null) {
      for (const tab of this.menuTabs) tab.setText('');
      this.menuBody.setText('');
      this.menuHint.setText('');
      return;
    }
    const lang = this.link.lang();
    const { state } = view;
    this.menuBox
      .fillStyle(INK, 0.95)
      .fillRect(MENU.x, MENU.y, MENU.w, MENU.h)
      .lineStyle(1, GOLD, 1)
      .strokeRect(MENU.x + 0.5, MENU.y + 0.5, MENU.w - 1, MENU.h - 1)
      .lineBetween(MENU.x + 8, MENU.y + 24.5, MENU.x + MENU.w - 8, MENU.y + 24.5);
    let x = MENU.x + 14;
    MENU_TABS.forEach((tab, i) => {
      const label = t(TAB_LABEL[tab], lang);
      this.menuTabs[i]
        ?.setText(label)
        .setPosition(x, MENU.y + 8)
        .setTint(tab === state.tab ? GOLD : DIM);
      x += textWidth(label) + 24;
    });
    this.menuHint
      .setText(t(state.tab === 'items' ? UI.menu_items_hint : UI.menu_tabs_hint, lang))
      .setPosition(MENU.x + 14, MENU.y + MENU.h - 18);
    const top = MENU.y + 36;
    if (view.settings !== null) {
      const { labels, values, hint } = settingsLines(view.settings.state, view.settings.values, lang);
      this.menuBody.setText(labels.join('\n')).setPosition(MENU.x + 24, top);
      const column = Math.max(...labels.map((l) => textWidth(l))) + 24;
      this.menuValues.setText(values.join('\n')).setPosition(MENU.x + 24 + column, top);
      this.menuHint.setText(hint);
      return;
    }
    if (state.tab === 'items') this.menuItems(view.items, state, top, lang);
    else if (state.tab === 'map') this.menuMap(top, lang);
    else if (state.tab === 'quests') this.menuQuests(top, lang);
    else {
      const lines = SYSTEM_ROWS.map(
        (r, i) => `${i === state.cursor ? '>' : ' '} ${t(SYSTEM_LABEL[r], lang)}`,
      );
      if (state.confirm) lines.push('', t(UI.menu_start_over_confirm, lang));
      this.menuBody.setText(lines.join('\n')).setPosition(MENU.x + 24, top);
    }
  }

  private menuItems(items: readonly MenuItem[], state: MenuState, top: number, lang: Lang): void {
    if (items.length === 0) {
      this.menuBody.setText(t(UI.menu_no_items, lang)).setPosition(MENU.x + 24, top);
      return;
    }
    const lines = items.map((item, i) => {
      const slot = item.slot === 0 ? '  [K]' : item.slot === 1 ? '  [L]' : '';
      const count = item.kind === 'food' ? `  x${String(item.count)}` : '';
      return `${i === state.cursor ? '>' : ' '}     ${this.itemName(item.id, lang)}${count}${slot}`;
    });
    this.menuBody.setText(lines.join('\n')).setPosition(MENU.x + 24, top);
    items.forEach((item, i) => {
      let icon = this.menuIcons[i];
      if (icon === undefined) {
        icon = this.add.image(0, 0, '__MISSING').setOrigin(0.5, 0.5);
        this.menuIcons.push(icon);
      }
      const ref = this.link.frames.get(`item_${item.id}_idle_s_0`);
      icon
        .setTexture(ref.key, ref.frame)
        .setPosition(MENU.x + 48, Math.round(top + i * LINE_HEIGHT + LINE_HEIGHT / 2))
        .setVisible(true)
        .setScale(0.5);
    });
  }

  /** The overworld as coloured cells: visited screens by region, the hero's cell framed in gold. */
  private menuMap(top: number, lang: Lang): void {
    const { sim } = this.link;
    const dungeon = sim.db.screens[sim.screen.id].dungeon;
    if (dungeon !== undefined) {
      this.menuDungeonMap(dungeon, top, lang);
      return;
    }
    const m = overworldMap(sim.db.layout, sim.db.screens, sim.state.world.visited, sim.screen.id);
    const cw = 22;
    const ch = 13;
    const cols = m.x1 - m.x0 + 3;
    const rows = m.y1 - m.y0 + 3;
    const ox = Math.round(MENU.x + (MENU.w - cols * cw) / 2);
    const oy = top + 18;
    for (const c of m.cells) {
      if (!c.visited && !c.here) continue;
      const cx = ox + (c.gx - m.x0 + 1) * cw;
      const cy = oy + (c.gy - m.y0 + 1) * ch;
      if (cx < MENU.x || cy + ch > MENU.y + MENU.h - 24) continue;
      this.menuBox.fillStyle(REGION_COLOURS[c.region], 1).fillRect(cx + 1, cy + 1, cw - 2, ch - 2);
      if (c.here) this.menuBox.lineStyle(2, GOLD, 1).strokeRect(cx + 1, cy + 1, cw - 2, ch - 2);
    }
    this.menuBox.lineStyle(1, DIM, 1).strokeRect(ox + 0.5, oy + 0.5, cols * cw - 1, rows * ch - 1);
    const here = m.cells.find((c) => c.here);
    const label =
      here === undefined ? '' : `${t(REGION_NAMES[here.region], lang)} — ${t(UI.menu_here, lang)}`;
    this.menuBody.setText(label).setPosition(MENU.x + 24, top);
  }

  /**
   * A dungeon floor: rooms walked through (every room with the map), the room Ask is in framed in gold, and
   * with the compass a red mark on the lair and a gold one on each room with a shut chest.
   */
  private menuDungeonMap(dungeon: DungeonId, top: number, lang: Lang): void {
    const { sim } = this.link;
    const m = dungeonMap(sim.db.layout, sim.db.screens, sim.db.enemies, sim.state, dungeon, sim.screen.id);
    if (m === null) return;
    const cw = 30;
    const ch = 18;
    const ox = Math.round(MENU.x + (MENU.w - m.cols * cw) / 2);
    const oy = top + 22;
    for (const c of m.cells) {
      if (!c.shown) continue;
      const cx = ox + c.gx * cw;
      const cy = oy + c.gy * ch;
      this.menuBox.fillStyle(c.visited ? CAVE_SEEN : CAVE, 1).fillRect(cx + 1, cy + 1, cw - 2, ch - 2);
      if (c.boss) this.menuBox.fillStyle(RED, 1).fillRect(cx + cw / 2 - 3, cy + ch / 2 - 3, 6, 6);
      if (c.chest) this.menuBox.fillStyle(GOLD, 1).fillRect(cx + 4, cy + 4, 4, 4);
      if (c.here) this.menuBox.lineStyle(2, GOLD, 1).strokeRect(cx + 1, cy + 1, cw - 2, ch - 2);
    }
    this.menuBox.lineStyle(1, DIM, 1).strokeRect(ox - 3.5, oy - 3.5, m.cols * cw + 7, m.rows * ch + 7);
    const lines = [`${t(DUNGEON_NAMES[dungeon], lang)} — ${t(UI.menu_keys, lang, { detail: m.keys })}`];
    while (top + lines.length * LINE_HEIGHT < oy + m.rows * ch + 8) lines.push('');
    if (m.compass) {
      // The legend: a red mark for the lair, a gold one for chests, each before its word.
      const y = top + lines.length * LINE_HEIGHT;
      const lair = `   ${t(UI.menu_lair, lang)}`;
      const space = textWidth('  ') - textWidth(' ');
      const gap = Math.max(2, Math.round((96 - textWidth(lair)) / space));
      this.menuBox.fillStyle(RED, 1).fillRect(MENU.x + 24, y + 2, 6, 6);
      this.menuBox.fillStyle(GOLD, 1).fillRect(MENU.x + 24 + textWidth(lair) + gap * space, y + 3, 4, 4);
      lines.push(`${lair}${' '.repeat(gap)}   ${t(UI.menu_chest, lang)}`);
    }
    if (!m.map) lines.push(t(UI.menu_no_map, lang));
    this.menuBody.setText(lines.join('\n')).setPosition(MENU.x + 24, top);
  }

  private menuQuests(top: number, lang: Lang): void {
    const { sim } = this.link;
    const log = questLog(sim.db.quests, condCtx(sim));
    if (log.length === 0) {
      this.menuBody.setText(t(UI.menu_no_quests, lang)).setPosition(MENU.x + 24, top);
      return;
    }
    const lines = log.flatMap((q) => [
      `${t(q.name, lang)}${q.done ? ` (${t(UI.menu_quest_done, lang)})` : ''}`,
      ...layoutText(t(q.text, lang), MENU.w - 64).map((l) => `   ${l}`),
      '',
    ]);
    this.menuBody.setText(lines.slice(0, 22).join('\n')).setPosition(MENU.x + 24, top);
  }

  /** After the fall: the screen dims and, a moment later, the way to rise again. */
  private drawGameOver(): void {
    const { sim } = this.link;
    const t0 = sim.db.tuning.hero.dyingTicks;
    const age = sim.mode === 'over' ? sim.hero.fsm.t - t0 : -1;
    this.fallen.setVisible(age >= 0);
    if (age < 0) {
      this.fallenTitle.setText('');
      this.fallenPrompt.setText('');
      return;
    }
    const lang = this.link.lang();
    const title = t(UI.game_over, lang);
    const prompt = t(UI.game_over_continue, lang);
    const w = Math.max(textWidth(title), textWidth(prompt)) + 32;
    const x = Math.round((GAME_W - w) / 2);
    const y = 60;
    this.panel(x, y, w, 44);
    this.fallenTitle.setText(title).setPosition(Math.round((GAME_W - textWidth(title)) / 2), y + 8);
    const show = age >= CONTINUE_DELAY && Math.floor(age / 30) % 2 === 0;
    this.fallenPrompt
      .setText(show ? prompt : '')
      .setPosition(Math.round((GAME_W - textWidth(prompt)) / 2), y + 24);
  }

  private text(x: number, y: number, value: string, colour: number): Phaser.GameObjects.BitmapText {
    return this.add.bitmapText(x, y, FONT_KEY, value, FONT_HEIGHT).setTint(colour);
  }

  private frameRef(name: string): { key: string; frame: string } {
    const ref = (this.registry.get(UI_LINK) as UiLink | undefined)?.frames.get(name);
    return ref ?? { key: '__MISSING', frame: '' };
  }

  /** A boss's name and health along the bottom while one is on screen. */
  private drawBoss(): void {
    const b = this.link.sim.boss();
    this.bossBar.clear();
    if (b === null) {
      this.bossName.setText('');
      return;
    }
    const x = Math.round((GAME_W - BOSS_BAR.w) / 2);
    const fill = Math.round(((BOSS_BAR.w - 2) * Math.max(0, b.hp)) / b.maxHp);
    this.bossBar
      .fillStyle(INK, 0.85)
      .fillRect(x - 1, BOSS_BAR.y - 1, BOSS_BAR.w + 2, BOSS_BAR.h + 2)
      .fillStyle(RED, 1)
      .fillRect(x, BOSS_BAR.y, fill, BOSS_BAR.h)
      .lineStyle(1, GOLD, 1)
      .strokeRect(x - 0.5, BOSS_BAR.y - 0.5, BOSS_BAR.w + 1, BOSS_BAR.h + 1);
    const name = t(b.name, this.link.lang());
    this.bossName
      .setText(name)
      .setPosition(Math.round((GAME_W - textWidth(name)) / 2), BOSS_BAR.y - LINE_HEIGHT - 1);
  }

  private drawHud(): void {
    const { sim, frames } = this.link;
    const dungeon = sim.db.screens[sim.screen.id].dungeon;
    this.keyIcon.setVisible(dungeon !== undefined);
    this.keyText.setText(dungeon === undefined ? '' : String(peekDungeon(sim.state, dungeon).keys));
    const hp = sim.hero.hp;
    const hearts = Math.ceil(sim.hero.maxHp / 4);
    while (this.hearts.length < hearts) {
      const i = this.hearts.length;
      const ref = frames.get('ui_heart_idle_s_4');
      const x = 6 + (i % MAX_HEARTS_PER_ROW) * 10;
      const y = 6 + Math.floor(i / MAX_HEARTS_PER_ROW) * 10;
      this.hearts.push(this.add.image(x, y, ref.key, ref.frame).setOrigin(0, 0));
    }
    this.hearts.forEach((img, i) => {
      const q = Math.max(0, Math.min(4, hp - i * 4));
      const ref = frames.get(`ui_heart_idle_s_${String(q)}`);
      img.setVisible(i < hearts).setTexture(ref.key, ref.frame);
    });
    this.silver.setText(String(sim.state.hero.silver));
    sim.state.inv.slots.forEach((item, i) => {
      const icon = this.slotIcons[i];
      if (icon === undefined) return;
      if (item === null) {
        icon.setVisible(false);
        return;
      }
      const ref = frames.get(`item_${item}_idle_s_0`);
      icon.setTexture(ref.key, ref.frame).setVisible(true);
    });
  }

  private speaker(who: Speaker): string {
    const lang = this.link.lang();
    if (who === null) return '';
    if (who === 'ask') return t(UI.speaker_ask, lang);
    return t(NPC_NAMES[who], lang);
  }

  private drawStory(ui: StoryUi): void {
    const lang = this.link.lang();
    this.box.clear();
    this.name.setText('');
    this.body.setText('');
    this.choices.setText('');
    this.shop.setText('');
    this.card.setVisible(false);
    this.cardText.setText('');
    if (ui === null) {
      this.lastShown = '';
      return;
    }
    if (ui.k === 'shop') {
      this.drawShop(ui, lang);
      return;
    }
    if (ui.k === 'save') {
      this.lastShown = '';
      return;
    }
    const full = layoutText(t(ui.text, lang), ui.k === 'card' ? 360 : TEXT_W).join('\n');
    const count = Math.floor(ui.shown * full.length);
    const shown = full.slice(0, count);
    this.blip(full, count);
    if (ui.k === 'card') {
      this.card.setVisible(true);
      this.cardText.setText(centred(full, count));
      const lines = full.split('\n');
      const w = Math.max(...lines.map((l) => textWidth(l)));
      this.cardText.setPosition(
        Math.round((GAME_W - w) / 2),
        Math.round((GAME_H - lines.length * LINE_HEIGHT) / 2),
      );
      return;
    }
    const who = this.speaker(ui.who);
    // The speaker sits in a tab on the box's top edge, so the name reads on any background. The tab is
    // drawn first so the box's top stroke lands on the tab's bottom stroke and the two read as one outline.
    if (who !== '') {
      this.panel(BOX.x + 4, BOX.y - 17, textWidth(who) + 16, 18);
      this.name.setText(who);
    }
    this.panel(BOX.x, BOX.y, BOX.w, BOX.h);
    this.body.setText(shown);
    if (ui.choices.length > 0) {
      const lines = ui.choices.map((c, i) => `${i === ui.cursor ? '>' : ' '} ${t(c, lang)}`);
      const h = lines.length * LINE_HEIGHT + 12;
      const w = 180;
      const x = BOX.x + BOX.w - w - 8;
      const y = BOX.y - h - 4;
      this.panel(x, y, w, h);
      this.choices.setPosition(x + 8, y + 6).setText(lines.join('\n'));
    }
  }

  private drawShop(ui: Extract<StoryUi, { k: 'shop' }>, lang: Lang): void {
    const rows = ui.rows.map(
      (r, i) => `${i === ui.cursor ? '>' : ' '} ${this.itemName(r.item, lang)} — ${String(r.price)}`,
    );
    rows.push(`${ui.cursor === ui.rows.length ? '>' : ' '} ${t(UI.shop_leave, lang)}`);
    const note = ui.last === null ? '' : t(UI[`shop_${ui.last}`], lang);
    const lines = [t(ui.name, lang), '', ...rows, '', note];
    const w = 300;
    const h = lines.length * LINE_HEIGHT + 14;
    const x = (GAME_W - w) / 2;
    const y = 40;
    this.panel(x, y, w, h);
    this.shop.setPosition(x + 12, y + 8).setText(lines.join('\n'));
  }

  private itemName(item: ItemId, lang: Lang): string {
    const name: L10n = ITEM_NAMES[item];
    return t(name, lang);
  }

  private panel(x: number, y: number, w: number, h: number): void {
    this.box
      .fillStyle(INK, 0.92)
      .fillRect(x, y, w, h)
      .lineStyle(1, GOLD, 1)
      .strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  }

  /** A short blip every few revealed characters while text types out. */
  private blip(full: string, count: number): void {
    if (full !== this.lastShown) {
      this.lastShown = full;
      this.lastBlip = 0;
    }
    if (count >= full.length) return;
    if (count - this.lastBlip >= BLIP_EVERY) {
      this.lastBlip = count;
      this.link.sfx('sfx_talk');
    }
  }
}
