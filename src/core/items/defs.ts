import type { L10n } from '../i18n/t';

export interface GaldrDef {
  readonly name: L10n;
  readonly cost: number;
}

export interface ItemDef {
  readonly name: L10n;
  /** Usable from an item slot (sub-items). */
  readonly slot: boolean;
  /** How many can be carried. */
  readonly max: number;
  /** Food and mead: quarter hearts healed when eaten from the menu. */
  readonly heal?: number;
}
