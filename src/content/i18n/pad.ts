import type { L10n } from '@core/i18n/t';

/** Controller families whose face buttons the menus name differently. */
export const PAD_STYLES = ['xbox', 'playstation', 'nintendo'] as const;
export type PadStyle = (typeof PAD_STYLES)[number];

const same = (s: string): L10n => ({ en: s, sv: s });

const DPAD = {
  12: { en: 'D-pad ↑', sv: 'Styrkors ↑' },
  13: { en: 'D-pad ↓', sv: 'Styrkors ↓' },
  14: { en: 'D-pad ←', sv: 'Styrkors ←' },
  15: { en: 'D-pad →', sv: 'Styrkors →' },
} as const satisfies Readonly<Record<number, L10n>>;

/** Names of the standard-mapping buttons (0 bottom face, 1 right, 2 left, 3 top, 4–7 shoulders, 8 back, 9 start). */
export const PAD_BUTTONS: Readonly<Record<PadStyle, Readonly<Record<number, L10n>>>> = {
  xbox: {
    0: same('A'),
    1: same('B'),
    2: same('X'),
    3: same('Y'),
    4: same('LB'),
    5: same('RB'),
    6: same('LT'),
    7: same('RT'),
    8: same('View'),
    9: same('Menu'),
    ...DPAD,
  },
  playstation: {
    0: same('✕'),
    1: same('○'),
    2: same('□'),
    3: same('△'),
    4: same('L1'),
    5: same('R1'),
    6: same('L2'),
    7: same('R2'),
    8: same('Share'),
    9: same('Options'),
    ...DPAD,
  },
  nintendo: {
    0: same('B'),
    1: same('A'),
    2: same('Y'),
    3: same('X'),
    4: same('L'),
    5: same('R'),
    6: same('ZL'),
    7: same('ZR'),
    8: same('-'),
    9: same('+'),
    ...DPAD,
  },
};

export const PAD_TEXT = {
  dpad: { en: 'D-pad', sv: 'Styrkors' },
  stick: { en: 'left stick', sv: 'vänster spak' },
  button: { en: 'Button {detail}', sv: 'Knapp {detail}' },
} as const satisfies Readonly<Record<string, L10n>>;
