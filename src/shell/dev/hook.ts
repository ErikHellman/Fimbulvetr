import type { UiKey } from '@content/i18n/ui';
import { SCREEN_IDS, isScreenId } from '@content/world/screens';
import { mem } from '@core/actors/entity';
import { isSeason, type ClockState } from '@core/clock/types';
import { parseClockTime } from '@core/dev/query';
import { cloneState } from '@core/state/save';
import { tileFeet } from '@core/world/screen';
import { importMessageKey } from '@shell/platform/exportImport';
import type { DevBridge, ViewStats } from './bridge';
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
  actors(): { kind: string; def: string; x: number; y: number; fsm: string }[];
  /** Every screen id, for smoke tests. */
  screens(): string[];
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
      if (ui.k === 'shop')
        return {
          k: 'shop',
          who: null,
          text: ui.name.en,
          shown: 1,
          choices: ui.rows.map((r) => r.item),
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
    screens: () => [...SCREEN_IDS],
    actors: () =>
      bridge().sim.actors.map((a) => ({ kind: a.kind, def: a.def, x: a.pos.x, y: a.pos.y, fsm: a.fsm.s })),
  };
}
