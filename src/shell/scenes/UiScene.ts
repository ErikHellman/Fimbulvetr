import * as Phaser from 'phaser';
import { FONT_HEIGHT, LINE_HEIGHT, layoutText, textWidth } from '@art/font';
import { UI } from '@content/i18n/ui';
import { ITEM_NAMES } from '@content/items';
import { NPC_NAMES } from '@content/npcs';
import type { ItemId } from '@content/ids';
import { t, type L10n, type Lang } from '@core/i18n/t';
import { CONTINUE_DELAY } from '@core/sim/systems/death';
import type { Sim, StoryUi } from '@core/sim/sim';
import type { Speaker } from '@core/story/dialogue';
import { FONT_KEY } from '@shell/gfx/font';
import type { FrameIndex } from '@shell/gfx/frameIndex';
import { GAME_H, GAME_W } from '@shell/scale';

/** What PlayScene shares with the UI scene through the registry. */
export interface UiLink {
  readonly sim: Sim;
  readonly frames: FrameIndex;
  readonly lang: () => Lang;
  /** Plays a sound unless muted. */
  readonly sfx: (id: 'sfx_talk') => void;
}

export const UI_LINK = 'uiLink';

const INK = 0x1b1522;
const GOLD = 0xd9b34a;
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
  private fallen!: Phaser.GameObjects.Rectangle;
  private fallenTitle!: Phaser.GameObjects.BitmapText;
  private fallenPrompt!: Phaser.GameObjects.BitmapText;

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
  }

  override update(): void {
    const link = this.registry.get(UI_LINK) as UiLink | undefined;
    if (link === undefined) return;
    this.link = link;
    this.drawHud();
    this.drawStory(link.sim.storyUi());
    this.drawGameOver();
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

  private drawHud(): void {
    const { sim, frames } = this.link;
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
