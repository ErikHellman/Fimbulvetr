import { describe, expect, it } from 'vitest';
import type { L10n } from '@core/i18n/t';
import { GALDR_DEFS } from '@content/galdr';
import { ARMOR_NAMES, RING_NAMES, WEAPON_NAMES } from '@content/gear';
import { UI } from '@content/i18n/ui';
import { ITEM_NAMES } from '@content/items';

const tables: Record<string, Readonly<Record<string, L10n>>> = {
  ITEM_NAMES,
  WEAPON_NAMES,
  ARMOR_NAMES,
  RING_NAMES,
  UI,
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
  }
});
