import { GALDR_DEFS } from '@content/galdr';
import { ARMOR_NAMES, WEAPON_NAMES } from '@content/gear';
import { UI } from '@content/i18n/ui';
import { ITEM_NAMES } from '@content/items';
import { t, type Lang } from '@core/i18n/t';
import type { GameState } from '@core/state/gameState';
import { PURSE_CAP } from '@core/story/effects';

/** One line of the Gear page: its icon frame (without the frame suffix) and its text. */
export interface GearLine {
  readonly icon: string | null;
  readonly text: string;
}

/** What Ask carries and wears, for the pause menu's Gear page. */
export function gearLines(s: GameState, lang: Lang): GearLine[] {
  const inv = s.inv;
  const galdr = inv.galdr[0];
  const horns = inv.items.horn ?? 0;
  const full = (inv.items.mead_red ?? 0) + (inv.items.mead_green ?? 0) + (inv.items.mead_blue ?? 0);
  const lines: GearLine[] = [
    {
      icon: `gear_${inv.weapon}`,
      text: t(UI.gear_weapon, lang, { detail: t(WEAPON_NAMES[inv.weapon], lang) }),
    },
    { icon: `gear_${inv.armor}`, text: t(UI.gear_armor, lang, { detail: t(ARMOR_NAMES[inv.armor], lang) }) },
    galdr === undefined
      ? { icon: null, text: t(UI.gear_no_galdr, lang) }
      : {
          icon: `galdr_${galdr}`,
          text: t(UI.gear_galdr, lang, {
            detail: t(GALDR_DEFS[galdr].name, lang),
            n: GALDR_DEFS[galdr].cost,
          }),
        },
  ];
  if (galdr !== undefined)
    lines.push({ icon: null, text: t(UI.gear_seidr, lang, { n: s.hero.seidr, max: s.hero.maxSeidr }) });
  if (horns > 0) lines.push({ icon: 'item_horn', text: t(UI.gear_horns, lang, { n: horns, full }) });
  if ((inv.items.winter_cloak ?? 0) > 0)
    lines.push({ icon: 'item_winter_cloak', text: t(ITEM_NAMES.winter_cloak, lang) });
  lines.push({ icon: null, text: t(UI.gear_purse, lang, { n: PURSE_CAP[s.hero.purse] }) });
  return lines;
}
