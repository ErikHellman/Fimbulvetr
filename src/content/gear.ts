import type { L10n } from '@core/i18n/t';
import type { ArmorId, RingId, WeaponId } from './ids';

export const WEAPON_NAMES = {
  none: { en: 'Bare hands', sv: 'Tomma händer' },
  pitchfork: { en: 'Pitchfork', sv: 'Högaffel' },
  seax: { en: "Halvar's seax", sv: 'Halvars sax' },
  uppvik_sword: { en: 'Uppvík sword', sv: 'Uppvíksvärd' },
  dwarf_blade: { en: 'Dwarf-forged blade', sv: 'Dvärgsmitt svärd' },
  handaxe: { en: "Halvar's hand-axe", sv: 'Halvars handyxa' },
} as const satisfies Record<WeaponId, L10n>;

export const ARMOR_NAMES = {
  wool_tunic: { en: 'Wool tunic', sv: 'Ylletunika' },
  byrnie: { en: 'Byrnie', sv: 'Brynja' },
  ember_byrnie: { en: 'Ember byrnie', sv: 'Glödbrynja' },
  runeplate: { en: 'Runeplate', sv: 'Runpansar' },
} as const satisfies Record<ArmorId, L10n>;

export const RING_NAMES = {
  ring_stamina: { en: 'Arm-ring of stamina', sv: 'Armring av uthållighet' },
  ring_thrift: { en: 'Arm-ring of thrift', sv: 'Armring av sparsamhet' },
  ring_beacon: { en: 'Beacon arm-ring', sv: 'Fyrarmring' },
  ring_berserker: { en: "Berserker's arm-ring", sv: 'Bärsärkarmring' },
} as const satisfies Record<RingId, L10n>;
