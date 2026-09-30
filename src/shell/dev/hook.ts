import type { UiKey } from '@content/i18n/ui';
import { itemMax, owns } from '@core/items/defs';
import { SCREEN_IDS, isScreenId } from '@content/world/screens';
import { mem } from '@core/actors/entity';
import { isSeason, type ClockState } from '@core/clock/types';
import { parseClockTime } from '@core/dev/query';
import { peekDungeon } from '@core/state/dungeons';
import { cloneState } from '@core/state/save';
import { tileFeet } from '@core/world/screen';
import { importMessageKey } from '@shell/platform/exportImport';
import type { DevBridge, ViewStats } from './bridge';
import { wareId } from '@shell/ui/wareText';
import type { FrameSummary } from './stats';

export interface HeroView {
  readonly x: number;
  readonly y: number;
  readonly facing: string;
  readonly fsm: string;
  readonly anim: string;
  readonly hp: number;
  readonly iframes: number;
  readonly shielding: boolean;
}

/** `window.__fimbul` — how Playwright and humans inspect and steer a dev/test build. */
export interface FimbulHook {
  readonly ready: boolean;
  screenId(): string;
  mode(): string;
  hero(): HeroView;
  enemies(): { def: string; hp: number; flash: number }[];
  clock(): ClockState;
  light(): number;
  appliedGrade(): number[];
  readonly eventCounts: Readonly<Record<string, number>>;
  warp(screen: string, tx: number, ty: number): void;
  setTime(text: string): boolean;
  setSeason(season: string): boolean;
  missingFrames(): string[];
  stats(): FrameSummary;
  /** Decor, animated tiles, smoke and fish on stage. */
  view(): ViewStats;
  jumpFish(): void;
  tileAt(x: number, y: number): number;
  exportSaveJson(): string;
  importSaveJson(json: string): UiKey;
  flushSave(): Promise<void>;
  downloadSave(): void;
  /** What the running script shows ('text', 'card', 'shop'), with its text in English, or null. */
  story(): {
    k: string;
    who: string | null;
    text: string;
    shown: number;
    choices: string[];
    cursor: number;
  } | null;
  flags(): Readonly<Record<string, boolean | number>>;
  silver(): number;
  items(): Readonly<Record<string, number>>;
  /** What Ask wields and knows: weapon, armour, galdr and the seiðr bar. */
  gear(): { weapon: string; armor: string; galdr: string[]; seidr: number; maxSeidr: number };
  actors(): { kind: string; def: string; x: number; y: number; fsm: string }[];
  /** Every screen id, for smoke tests. */
  screens(): string[];
  /** Dev: sets the hero's health (0 makes them fall next tick). */
  setHp(hp: number): void;
  /** The open pause menu's page and cursor, or null in play. */
  menu(): { tab: string; cursor: number; confirm: boolean } | null;
  /** The save-slot picker (armed once it takes input), or null when none is open. */
  picker(): { cursor: number; phase: string; armed: boolean } | null;
  /** What sits in item slots K and L. */
  slots(): (string | null)[];
  /** The boss bar: its name in English, health and phase; null when no boss is on screen. */
  boss(): { name: string; hp: number; maxHp: number; phase: number } | null;
  /** While Ask fishes: the phase, the line's tension, how far out the fish is, and how it ended. */
  fish(): {
    phase: string;
    tension: number;
    dist: number;
    fish: string | null;
    result: string | null;
    surging: boolean;
  } | null;
  /** The water level of the screen Ask is on, or null on screens without water. */
  water(): { level: number; flag: string } | null;
  /** Bombs in the bag, and how many it holds. */
  ammo(): { bombs: number; max: number; owned: boolean };
  /** The saved state of the dungeon Ask is in, or null outside dungeons. */
  dungeon(): {
    id: string;
    keys: number;
    bigKey: boolean;
    map: boolean;
    compass: boolean;
    bossDead: boolean;
  } | null;
}

declare global {
  interface Window {
    __fimbul?: FimbulHook;
  }
}

export function installHook(current: () => DevBridge | null, counts: Record<string, number>): void {
  const bridge = (): DevBridge => {
    const b = current();
    if (b === null) throw new Error('the game is not running yet');
    return b;
  };
  window.__fimbul = {
    get ready() {
      return current() !== null;
    },
    screenId: () => bridge().sim.screen.id,
    mode: () => bridge().sim.mode,
    hero: () => {
      const h = bridge().sim.hero;
      return {
        x: h.pos.x,
        y: h.pos.y,
        facing: h.facing,
        fsm: h.fsm.s,
        anim: h.anim,
        hp: h.hp,
        iframes: h.iframes,
        shielding: mem(h, 'shielding') === 1,
      };
    },
    enemies: () => bridge().sim.enemies.map((e) => ({ def: e.def, hp: e.hp, flash: e.flash })),
    menu: () => bridge().menu(),
    picker: () => bridge().picker(),
    slots: () => [...bridge().sim.state.inv.slots],
    fish: () => {
      const ui = bridge().sim.storyUi();
      if (ui?.k !== 'fish') return null;
      return {
        phase: ui.phase,
        tension: ui.tension,
        dist: ui.dist,
        fish: ui.fish,
        result: ui.result,
        surging: ui.surging,
      };
    },
    boss: () => {
      const b = bridge().sim.boss();
      return b === null ? null : { name: b.name.en, hp: b.hp, maxHp: b.maxHp, phase: b.phase };
    },
    water: () => {
      const sim = bridge().sim;
      const flag = sim.db.screens[sim.screen.id].water;
      if (flag === undefined) return null;
      const v = sim.state.flags[flag];
      return { level: typeof v === 'number' ? v : 0, flag };
    },
    ammo: () => {
      const sim = bridge().sim;
      const have = sim.state.inv.items;
      return {
        bombs: have.bombs ?? 0,
        max: itemMax(sim.db.items, have, 'bombs'),
        owned: owns(have, 'bombs'),
      };
    },
    dungeon: () => {
      const sim = bridge().sim;
      const id = sim.db.screens[sim.screen.id].dungeon;
      if (id === undefined) return null;
      const d = peekDungeon(sim.state, id);
      return { id, keys: d.keys, bigKey: d.bigKey, map: d.map, compass: d.compass, bossDead: d.bossDead };
    },
    setHp: (hp) => {
      bridge().sim.hero.hp = Math.max(0, Math.min(bridge().sim.hero.maxHp, Math.floor(hp)));
    },
    clock: () => ({ ...bridge().sim.state.clock }),
    light: () => bridge().lightLevel(),
    appliedGrade: () => [...bridge().appliedGrade()],
    eventCounts: counts,
    warp: (screen, tx, ty) => {
      if (!isScreenId(screen)) throw new Error(`unknown screen '${screen}'`);
      if (!Number.isInteger(tx) || !Number.isInteger(ty)) throw new Error('bad tile');
      const p = tileFeet({ x: tx, y: ty });
      bridge().sim.command({ t: 'warp', screen, x: p.x, y: p.y });
    },
    setTime: (text) => {
      const minute = parseClockTime(text);
      if (minute === null) return false;
      bridge().sim.command({ t: 'setMinute', minute });
      return true;
    },
    setSeason: (season) => {
      if (!isSeason(season)) return false;
      bridge().sim.command({ t: 'setSeason', season });
      return true;
    },
    missingFrames: () => bridge().frames.missingNames(),
    stats: () => bridge().stats.summary(),
    view: () => bridge().viewStats(),
    jumpFish: () => {
      bridge().jumpFish();
    },
    tileAt: (x, y) => bridge().tileAt(x, y),
    exportSaveJson: () => {
      const b = bridge();
      return b.saves.exportJson(b.sim.snapshot());
    },
    importSaveJson: (json) => {
      const b = bridge();
      const result = b.saves.importText(json);
      if (result.ok) {
        b.saves.autosaver.request(cloneState(result.state));
        b.restart(result.state);
      }
      return importMessageKey(result);
    },
    flushSave: async () => {
      const b = bridge();
      b.saves.autosaver.request(b.sim.snapshot());
      await b.saves.autosaver.flush();
    },
    downloadSave: () => {
      const b = bridge();
      b.saves.download(b.sim.snapshot());
    },
    story: () => {
      const ui = bridge().sim.storyUi();
      if (ui === null) return null;
      if (ui.k === 'save') return { k: 'save', who: null, text: '', shown: 1, choices: [], cursor: 0 };
      if (ui.k === 'fish') return { k: 'fish', who: null, text: ui.phase, shown: 1, choices: [], cursor: 0 };
      if (ui.k === 'shop')
        return {
          k: 'shop',
          who: null,
          text: ui.name.en,
          shown: 1,
          choices: ui.rows.map((r) => wareId(r.ware)),
          cursor: ui.cursor,
        };
      return {
        k: ui.k,
        who: ui.who,
        text: ui.text.en,
        shown: ui.shown,
        choices: ui.choices.map((c) => c.en),
        cursor: ui.cursor,
      };
    },
    flags: () => ({ ...bridge().sim.state.flags }),
    silver: () => bridge().sim.state.hero.silver,
    items: () => ({ ...bridge().sim.state.inv.items }),
    gear: () => {
      const { inv, hero } = bridge().sim.state;
      return {
        weapon: inv.weapon,
        armor: inv.armor,
        galdr: [...inv.galdr],
        seidr: hero.seidr,
        maxSeidr: hero.maxSeidr,
      };
    },
    screens: () => [...SCREEN_IDS],
    actors: () =>
      bridge().sim.actors.map((a) => ({ kind: a.kind, def: a.def, x: a.pos.x, y: a.pos.y, fsm: a.fsm.s })),
  };
}
