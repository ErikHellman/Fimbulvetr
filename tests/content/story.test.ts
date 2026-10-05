import { describe, expect, it } from 'vitest';
import { textWidth, unknownChars, layoutText } from '@art/font';
import { DB } from '@content/index';
import { DEV_PRESETS } from '@content/dev/presets';
import { FLAGS, type FlagId } from '@content/flags';
import { NPCS } from '@content/ids';
import { NEW_GAME } from '@content/start';
import { SCREEN_IDS } from '@content/world/screens';
import type { L10n } from '@core/i18n/t';
import { cellAt, parseTextMap } from '@core/world/textmap';

/** Every plain object reachable from `root` (content is plain data). */
function* walk(root: unknown): Generator<Record<string, unknown>> {
  const seen = new Set<unknown>();
  const stack: unknown[] = [root];
  while (stack.length > 0) {
    const v = stack.pop();
    if (typeof v !== 'object' || v === null || seen.has(v)) continue;
    seen.add(v);
    if (Array.isArray(v)) stack.push(...(v as unknown[]));
    else {
      const o = v as Record<string, unknown>;
      yield o;
      stack.push(...Object.values(o));
    }
  }
}

const isL10n = (o: Record<string, unknown>): o is L10n & Record<string, unknown> =>
  typeof o['en'] === 'string' && typeof o['sv'] === 'string' && Object.keys(o).length === 2;

const CONTENT = {
  dialogue: DB.dialogue,
  scripts: DB.scripts,
  npcs: DB.npcs,
  quests: DB.quests,
  shops: DB.shops,
  screens: DB.screens,
  weather: DB.weather,
  freezeClock: DB.freezeClock,
  fish: DB.fish,
};

/**
 * Flags read now and set by a later milestone's content: the rime beyond the pass melts in M6; Sökkva Hof
 * is entered and Nykr killed in M7b (`q_holmr` names both).
 */
const SET_LATER = new Set(['st_rime_open', 'st_d5_entered', 'st_thane_nykr']);

describe('story content', () => {
  it('never reads a flag that nothing sets', () => {
    const read = new Set<string>();
    const set = new Set<string>([...Object.keys(NEW_GAME.flags ?? {}), ...SET_LATER]);
    for (const o of walk(CONTENT)) {
      if (o['k'] === 'flag' && typeof o['id'] === 'string') read.add(o['id']);
      if ((o['k'] === 'set' || o['k'] === 'add') && typeof o['flag'] === 'string') set.add(o['flag']);
      if (o['k'] === 'pen' && typeof o['flag'] === 'string') set.add(o['flag']);
      // A latch sets its flag when struck.
      if (o['k'] === 'switch' && typeof o['set'] === 'string') set.add(o['set']);
      // Gates that fire melts or wind tears set their flag when it happens.
      if (o['k'] === 'gate') for (const k of ['melts', 'blows']) if (typeof o[k] === 'string') set.add(o[k]);
    }
    const unset = [...read].filter((f) => !set.has(f));
    expect(unset).toEqual([]);
    for (const f of [...read, ...set]) expect(Object.keys(FLAGS)).toContain(f as FlagId);
  });

  it('links every dialogue node, entry and choice to a real node', () => {
    for (const [id, def] of Object.entries(DB.dialogue)) {
      const nodes = Object.keys(def.nodes);
      for (const e of def.entry) expect(nodes, `${id} entry`).toContain(e.node);
      for (const [key, node] of Object.entries(def.nodes)) {
        if (node.next !== undefined) expect(nodes, `${id}.${key}.next`).toContain(node.next);
        for (const c of node.choices ?? [])
          if (c.next !== undefined) expect(nodes, `${id}.${key}`).toContain(c.next);
      }
    }
  });

  it('gives every NPC a conversation, and every place a walkable tile on a real screen', () => {
    for (const id of NPCS) {
      const def = DB.npcs[id];
      expect(def, id).toBeDefined();
      expect(DB.dialogue[def?.talk ?? id], `${id} dialogue`).toBeDefined();
      for (const p of def?.places ?? []) {
        expect(SCREEN_IDS).toContain(p.screen);
        const grid = parseTextMap(DB.screens[p.screen].map, DB.legend);
        const t = cellAt(grid, p.at.x, p.at.y);
        expect(
          t !== undefined && !DB.terrain[t].solid,
          `${id} at ${p.screen} ${String(p.at.x)},${String(p.at.y)}`,
        ).toBe(true);
      }
    }
  });

  it('refers only to scripts, dialogue, shops and NPCs that exist', () => {
    for (const o of walk(CONTENT)) {
      if ((o['k'] === 'use' || o['k'] === 'trigger') && typeof o['script'] === 'string')
        expect(DB.scripts, `script ${o['script']}`).toHaveProperty(o['script']);
      if (o['k'] === 'run' && typeof o['script'] === 'string') expect(DB.scripts).toHaveProperty(o['script']);
      if (o['k'] === 'talk' && typeof o['dialogue'] === 'string')
        expect(DB.dialogue).toHaveProperty(o['dialogue']);
      if (o['k'] === 'talk' && typeof o['with'] === 'string') expect(DB.npcs).toHaveProperty(o['with']);
      if (o['k'] === 'shop' && typeof o['id'] === 'string') expect(DB.shops).toHaveProperty(o['id']);
    }
  });

  it('writes every line in both languages, in the font, short enough for the text box', () => {
    const BOX_W = 576;
    const MAX_LINES = 3;
    for (const o of walk(CONTENT)) {
      if (!isL10n(o)) continue;
      for (const lang of ['en', 'sv'] as const) {
        const text = o[lang];
        expect(text.trim(), JSON.stringify(o)).not.toBe('');
        expect(unknownChars(text), text).toEqual([]);
        expect(layoutText(text, BOX_W).length, text).toBeLessThanOrEqual(MAX_LINES);
        expect(
          textWidth(text.split(' ').reduce((a, b) => (a.length > b.length ? a : b), '')),
          text,
        ).toBeLessThan(BOX_W);
      }
    }
  });

  it('starts every dev preset on a walkable tile', () => {
    for (const [name, p] of Object.entries(DEV_PRESETS)) {
      const grid = parseTextMap(DB.screens[p.screen].map, DB.legend);
      const t = cellAt(grid, p.tile[0], p.tile[1]);
      expect(t !== undefined && !DB.terrain[t].solid, name).toBe(true);
    }
  });
});
