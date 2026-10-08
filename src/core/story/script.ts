import type { DialogueId, NpcId, ScriptId, ShopId } from '@content/ids';
import type { ScreenId } from '@content/world/screens';
import type { L10n } from '../i18n/t';
import type { Dir4 } from '../math/dir';
import type { TilePos } from '../world/screen';
import type { Cond } from './cond';
import type { DialogueRun, Speaker } from './dialogue';
import type { Effect } from './effects';
import type { FishRun } from './fishing';
import type { BuyResult } from './shop';

/** An actor a script can move or turn: the hero or an NPC on the current screen. */
export type ActorRef = 'hero' | NpcId;

/** One instruction of a cutscene or interaction script. Plain data. */
export type Step =
  /** Runs a dialogue graph to its end; `with` is the default speaker and turns to face the hero. */
  | { readonly k: 'talk'; readonly dialogue: DialogueId; readonly with?: NpcId }
  /** A single text box. */
  | { readonly k: 'say'; readonly who: Speaker; readonly text: L10n }
  /** A full-screen card ("Day 2", "To be continued…"), dismissed with confirm. */
  | { readonly k: 'card'; readonly text: L10n }
  /** Walks an actor in a straight line to a tile (no collision: the script owns the stage). */
  | { readonly k: 'move'; readonly actor: ActorRef; readonly to: TilePos; readonly speed?: number }
  | { readonly k: 'face'; readonly actor: ActorRef; readonly dir: Dir4 }
  | { readonly k: 'wait'; readonly ticks: number }
  /** Fades the picture to black (`out`) or back. */
  | { readonly k: 'fade'; readonly out: boolean }
  | { readonly k: 'do'; readonly effects: readonly Effect[] }
  | { readonly k: 'warp'; readonly screen: ScreenId; readonly at: TilePos; readonly facing: Dir4 }
  | { readonly k: 'shop'; readonly id: ShopId }
  | {
      readonly k: 'if';
      readonly when: Cond;
      readonly then: readonly Step[];
      readonly else?: readonly Step[];
    }
  /** Runs another script, then carries on. */
  | { readonly k: 'run'; readonly script: ScriptId }
  /**
   * Offers the save slots (at mead halls and hofs): the shell shows its slot picker and answers with the
   * `saved` command, whether a slot was written or the player backed out.
   */
  | { readonly k: 'save' }
  /**
   * Fishing from where Ask stands, the float at `float`, until they put the rod down (cancel). `each` is
   * applied for every fish landed (after its silver and its own `onLand`).
   */
  | { readonly k: 'fish'; readonly float: TilePos; readonly each?: readonly Effect[] }
  /**
   * Farvegr's picker: the woken warp stones and "stay". Choosing a stone pays the galdr's seiðr and
   * carries Ask there through a fade; cancelling costs nothing.
   */
  | { readonly k: 'farvegr' }
  /**
   * The Rime King's breath pours out over the land: a shake, a long wind and a white wave rolling over
   * the screen (StoryUi `breath`); it holds the stage for `BREATH_TICKS`.
   */
  | { readonly k: 'breath' }
  /**
   * Starts a trial against the sand: `done` must hold within `ticks` of play on this screen, or `fail`
   * runs (also on leaving the screen); once it holds, `win` runs. Instant; the trial is never saved.
   */
  | {
      readonly k: 'trial';
      readonly ticks: number;
      readonly done: Cond;
      readonly win: ScriptId;
      readonly fail: ScriptId;
    }
  /**
   * The credits roll: `CREDITS_TICKS`, or until confirm once `CREDITS_SKIP` ticks have passed. `roll` picks
   * the demo's credits (the default, after the pass) or the game's last ones (M10b).
   */
  | { readonly k: 'credits'; readonly roll?: CreditsRoll };

/** Which credits roll: the demo's, at the end of Act I, or the game's own at the very end. */
export type CreditsRoll = 'demo' | 'end';

export interface ScriptDef {
  readonly steps: readonly Step[];
}

/** A running script. Plain JSON: the remaining steps are copied in, so it hashes and replays exactly. */
export interface StoryRun {
  queue: Step[];
  cur: Step | null;
  /** Ticks spent in the current step. */
  t: number;
  dlg: DialogueRun | null;
  /** Current black overlay, 0…1. */
  fade: number;
  /** Entity id of the NPC being talked to, if any. */
  talker: number | null;
  /** The shop screen, while a `shop` step runs. */
  shop: { cursor: number; last: BuyResult | null } | null;
  /** Set by the `saved` command while a `save` step waits; absent otherwise (so it never changes the hash). */
  saved?: true;
  /** The fishing session, while a `fish` step runs; absent otherwise (so it never changes the hash). */
  fish?: FishRun;
  /** Farvegr's picker cursor, while a `farvegr` step runs; absent otherwise. */
  warps?: { cursor: number };
}

export const FADE_STEP_TICKS = 18;
/** Instant steps (do, face, if…) run back to back; this bounds a runaway loop within one tick. */
export const MAX_INSTANT_STEPS = 64;

export function newStoryRun(steps: readonly Step[], talker: number | null = null): StoryRun {
  return { queue: [...steps], cur: null, t: 0, dlg: null, fade: 0, talker, shop: null };
}
