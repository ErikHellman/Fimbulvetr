import type { DialogueId, NpcId } from '@content/ids';
import type { L10n } from '../i18n/t';
import { wasPressed, type InputFrame } from '../input/actions';
import { evalCond, type Cond, type CondCtx } from './cond';
import type { Effect } from './effects';

/** Who a line is from: an NPC, Ask himself, or nobody (signs, narration). */
export type Speaker = NpcId | 'ask' | null;

/** A conversation: the first entry whose `when` holds picks the opening node. */
export interface DialogueDef {
  readonly entry: readonly { readonly when?: Cond; readonly node: string }[];
  readonly nodes: Readonly<Record<string, DNode>>;
}

export interface DNode {
  /** Defaults to the NPC being talked to. */
  readonly who?: Speaker;
  readonly text: L10n;
  /** Applied when the node is shown. */
  readonly do?: readonly Effect[];
  /** The node after this one; none ends the conversation. Ignored when there are choices. */
  readonly next?: string;
  readonly choices?: readonly DChoice[];
}

export interface DChoice {
  readonly text: L10n;
  readonly when?: Cond;
  readonly do?: readonly Effect[];
  readonly next?: string;
}

/** A conversation in progress. Plain JSON; `t` counts ticks since the node was shown. */
export interface DialogueRun {
  readonly id: DialogueId;
  node: string;
  t: number;
  cursor: number;
}

export interface DialogueEnv {
  readonly def: DialogueDef;
  readonly ctx: CondCtx;
  /** Typewriter speed in characters per second. */
  readonly cps: number;
  apply(effects: readonly Effect[]): void;
}

export function nodeOf(run: DialogueRun, def: DialogueDef): DNode {
  const node = def.nodes[run.node];
  if (node === undefined) throw new Error(`dialogue ${run.id}: no node '${run.node}'`);
  return node;
}

/**
 * Ticks until a node's text is fully shown. Measured on the longest language, so the simulation (and
 * every replay) is the same whichever language the player reads.
 */
export function revealTicks(text: L10n, cps: number): number {
  return Math.ceil((Math.max(text.en.length, text.sv.length) * 60) / cps);
}

export function visibleChoices(node: DNode, ctx: CondCtx): readonly DChoice[] {
  return (node.choices ?? []).filter((c) => evalCond(c.when, ctx));
}

/** Starts a conversation, or returns null when no entry applies. */
export function openDialogue(id: DialogueId, env: DialogueEnv): DialogueRun | null {
  const entry = env.def.entry.find((e) => evalCond(e.when, env.ctx));
  if (entry === undefined) return null;
  const run: DialogueRun = { id, node: entry.node, t: 0, cursor: 0 };
  env.apply(nodeOf(run, env.def).do ?? []);
  return run;
}

const ADVANCE = ['confirm', 'interact', 'sword'] as const;

/** One tick of a conversation. Returns false once it has ended. */
export function stepDialogue(run: DialogueRun, input: InputFrame, env: DialogueEnv): boolean {
  const node = nodeOf(run, env.def);
  const full = revealTicks(node.text, env.cps);
  const advance = ADVANCE.some((a) => wasPressed(input, a));
  if (run.t < full) {
    run.t = advance ? full : run.t + 1;
    return true;
  }
  const choices = visibleChoices(node, env.ctx);
  if (choices.length > 0) {
    if (wasPressed(input, 'up')) run.cursor = (run.cursor + choices.length - 1) % choices.length;
    if (wasPressed(input, 'down')) run.cursor = (run.cursor + 1) % choices.length;
  }
  if (!advance) return true;
  const choice = choices[run.cursor];
  if (choice !== undefined) env.apply(choice.do ?? []);
  const next = choice !== undefined ? choice.next : node.next;
  if (next === undefined) return false;
  run.node = next;
  run.t = 0;
  run.cursor = 0;
  env.apply(nodeOf(run, env.def).do ?? []);
  return true;
}
