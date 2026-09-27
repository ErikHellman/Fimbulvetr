import { describe, expect, it } from 'vitest';
import { textWidth, unknownChars } from '@art/font';
import type { L10n } from '@core/i18n/t';
import { GALDR_DEFS } from '@content/galdr';
import { ARMOR_NAMES, RING_NAMES, WEAPON_NAMES } from '@content/gear';
import { UI } from '@content/i18n/ui';
import { ITEM_NAMES } from '@content/items';
import { NPC_NAMES } from '@content/npcs';

const tables: Record<string, Readonly<Record<string, L10n>>> = {
  ITEM_NAMES,
  WEAPON_NAMES,
  ARMOR_NAMES,
  RING_NAMES,
  UI,
  NPC_NAMES,
  GALDR: Object.fromEntries(Object.entries(GALDR_DEFS).map(([id, def]) => [id, def.name])),
};

describe('player-facing text', () => {
  for (const [table, entries] of Object.entries(tables)) {
    it(`${table} has English and Swedish for every entry`, () => {
      for (const [id, text] of Object.entries(entries)) {
        expect(text.en.trim(), `${table}.${id}.en`).not.toBe('');
        expect(text.sv.trim(), `${table}.${id}.sv`).not.toBe('');
      }
    });

    it(`${table} uses only characters the game font can draw`, () => {
      for (const [id, text] of Object.entries(entries)) {
        expect(unknownChars(text.en), `${table}.${id}.en`).toEqual([]);
        expect(unknownChars(text.sv), `${table}.${id}.sv`).toEqual([]);
      }
    });
  }
});

describe('speaker nameplates', () => {
  it('fit in the tab above the dialogue box, clear of the choices panel', () => {
    const names = [...Object.values(NPC_NAMES), UI.speaker_ask];
    for (const name of names)
      for (const lang of ['en', 'sv'] as const)
        expect(textWidth(name[lang]) + 16, name[lang]).toBeLessThan(400);
  });
});
